const crypto = require("crypto")
const url = require("url")
const http = require("http")
const https = require("https")
const fs = require("fs")

const collections = require("../collections")

const speedometer = require("speedometer")

const dmanagerCollections = new collections.dmanagerCollections()

const misc = require("../misc")

class baseClient{
  constructor(options){
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
      uris: this.uris
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
      debugger;
    }
    else{
      let {hash, uris, fpaths, offsets, lengths, speeds, completed} = temp
      this.uris = uris
      this.fpaths = fpaths
      this.offsets = offsets
      this.lengths = lengths
      this.speeds = speeds
      this.completed = completed
    }
  }
  getAdapter(){
    switch(url.parse(this.uri).protocol){
      case "https:":
        return https
      case "http:":
        return http
      default:
        return false
    }
  }
  async ensureBasePath(){
    await fs.promises.mkdir(path.join(_dirname, "downloads"), {recursive: true})
  }
  _hash(){
    if(this.hasher === undefined){
      this.hasher = crypto.createHash("md5")
      this.hasher.update(this.options.uri)
    }
    this.hash = this.hasher.digest("hex")
  }
  progress(){
    return (this.offset === 0 || this.length === 0) ? 0 : (this.offset/this.length) * 100
  }
  async dbSave(){
    let temp = new this.model(this.saveState())
    await temp.save().catch(this.handleError)
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

class httpClient extends baseClient{
  constructor(options){
    super(options)
  }
  async download(){
    if(this.completed.every(e => e))
      this.emit("end")
  }
}


let a = new httpClient({uri: "https://i.ibb.co/0nKj99L/Rhea-C-WM.jpg", fpath: "rhea.jpeg"})
