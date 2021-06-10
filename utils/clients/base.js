const crypto = require("crypto")
const url = require("url")
const http = require("http")
const https = require("https")
const fs = require("fs")
const path = require("path")
const events = require("events")

const collections = require("../collections")

const speedometer = require("speedometer")

const dmanagerCollections = new collections.dmanagerCollections()

const misc = require("../misc")

class baseClient extends events{
  constructor(options){
    super()
    this.options = options
    this._hash()
    this.loadState()
  }
  saveState(){
    return {
      hash: this.hash,
      fpaths: this.fpaths,
      offsets: this.offsets,
      lengths: this.lengths,
      speeds: this.speeds,
      uris: this.uris,
      completed: this.completed
    }
  }
  async loadState(){
    this.model = dmanagerCollections.getDownloadEntryModel()
    let temp = await this.model.find({hash: this.hash}).catch(this.handleError)
    if(temp.length === 0){
      console.log("this is a new download")
      this.uris = [this.options.uri]
      this.fpaths = [this.options.fpath]
      this.offsets = [0]
      this.lengths = [0]
      this.speeds = [0]
      this.completed = [false]
      await this.dbSave(true)
    }
    else{
      console.log("this is a past download entry")
      let {hash, uris, fpaths, offsets, lengths, speeds, completed} = temp
      this.uris = uris
      this.fpaths = fpaths
      this.offsets = offsets
      this.lengths = lengths
      this.speeds = speeds
      this.completed = completed
    }
    this.adapters = this.uris.map(e=>this.getAdapter(e))
    this.writers = new Array(this.adapters.length)
  }
  getAdapter(uri){
    switch(url.parse(uri).protocol){
      case "https:":
        return https
      case "http:":
        return http
      default:
        return false
    }
  }
  async ensurePath(fpath){
    let basePath = path.dirname(fpath)
    await fs.promises.mkdir(basePath, {recursive: true})
  }
  _hash(){
    if(this.hasher === undefined){
      this.hasher = crypto.createHash("md5")
      this.hasher.update(this.options.uri)
    }
    this.hash = this.hasher.digest("hex")
  }
  async dbSave(init){
    if(init){
      let temp = new this.model(this.saveState())
      await temp.save().catch(this.handleError)
    }
    else{
      await this.model.findOneAndUpdate({hash: this.hash}, {$set: this.saveState}).catch(this.handleError)
    }
  }
  async unwrap(){
    return new Promise(async resolve =>{
      if(this.completed.every((e)=>e))
        return resolve({})
      else{
        await misc.timeout(1)
      }
    })
  }
  pause(){
    this.resp.forEach(e => e.destroy())
  }
}

class Errors{
  static UNSUPP_PROT = "protocol not supported"
  static DB_WRIT_FAIL = "failed to write to db"
  static DB_READ_FAIL = "failed to read to db"
  static FS_WRITE_ERR = "failed to write to disk"
  static RES_READ_ERR = "failed to read response"
}

class httpClient extends baseClient{
  constructor(options){
    super(options)
  }
  handleEnd(index){
    this.emit("end", {success: true, meta: super.saveState(), index: index})
    process.exit(0)
  }
  handleChunk(chunk, index){
    this.offsets[index] += chunk.byteLength
    this.dbSave()
    this.emit("progress", {meta: super.saveState(), index: index})
  }
  handleError(err, index){
    this.emit("error", {meta: super.saveState(), index: index})
  }
  async download(){
    if(this.fpaths === undefined){
      await misc.timeout(1)
      this.download()
    }
    if(this.completed.every(e => e))
      this.emit("end", {success: true, meta: this.saveState()})
    this.adapters.forEach((adapter, index)=>{
      adapter.get(this.uris[index], (resp)=>{
        this.lengths[index] = Number(resp.headers["content-length"])
        this.ensurePath(this.fpaths[index])
        if(this.offsets[index] > 0)
          this.writers[index] = fs.createWriteStream(this.fpaths[index], {start: this.offsets[index], flags: "r+"})
        else
          this.writers[index] = fs.createWriteStream(this.fpaths[index])
        resp.pipe(this.writers[index])
        resp.on("data", (chunk)=>{
          this.handleChunk(chunk, index)
        })
        resp.on("end", ()=>{
          this.handleEnd(index)
        })
        resp.on("error", (err)=>{
          this.handleError(err, index)
        })
        this.writers[index].on("error", (err)=>{
          this.emit("error", {success: false, meta: this.saveState(), index: index})
        })
      })
    })
  }
}
let a = new httpClient({uri: "https://i.ibb.co/0nKj99L/Rhea-C-WM.jpg", fpath: path.join("/home/iamfiasco/dark/dmanager/downloads", "rhea.jpeg")})
a.download()
