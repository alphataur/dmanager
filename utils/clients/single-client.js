require("dotenv").config()

const http = require("http")
const https = require("https")
const ofs = require("fs")
const util = require("util")
const fs = require("fs").promises
const path = require("path")
const url = require("url")
const speedometer = require("speedometer")
const crypto = require("crypto")
const events = require("events")
const {Entry} = require("../store")

//do something about this patch(centralized loc)
if(Array.prototype.last === undefined){
    Array.prototype.last = function(){
      return this[this.length - 1]
    }
}
  
  
class Errors{
    static URI_UNDEF = "URL not defined"
    static FPATH_UNDEF = "file path not defined"
    static DPROT_UNSUP = "download protocol not supported"
}

class SingleClient extends events{
    constructor({uri, fpath, offset, length}){
      super()
      this.uri = uri
      this.fpath = fpath
      this.offset = offset
      this.length = length
      this.setHash()
      this.completed = false
      this.defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
      }
    }
    pause(){
      this.reader.destroy()
    }
    setHash(){
      if(this.hasher === undefined){
        this.hasher = crypto.createHash("md5")
        this.hasher.update(this.uri)
      }
      this.hash = this.hasher.digest("hex")
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
    connect(start){
      if(start !== undefined){
        this.defaultHeaders['Range'] = `bytes=${start}-`
      }
      this.adapter = this.getAdapter()
      return new Promise((resolve, reject)=>{
        if(!this.adapter)
          return reject(Errors.DPROT_UNSUP)
        else{
          this.adapter.get(this.uri, {headers: this.defaultHeaders}, (res)=>{
            return resolve(res)
          })
        }
      })
    }
    metaCompact(){
      return {
        uri: this.uri,
        fpath: this.fpath,
        offset: this.offset,
        length: this.length,
        speed: this.speed,
        hash: this.hash,
        completed: this.completed,
        type: "single"
      }
    }
    handleError(err){
      debugger;
      this.emit("error", {meta: this.metaCompact(), error: err, hash: this.hash})
      return this.reject(err)
    }
    setProgress(){
      this.length = Number(this.reader.headers["content-length"])
    }
    getStatePath(){
      return path.join(process.env.STATE_PATH, this.hash)
    }
    async dbSave(){
      let data = this.metaCompact()
      if(!await this.state.write(data))
        console.log("failed to write state")
      //await fs.writeFile(this.getStatePath(), JSON.stringify(data, null, 4)).catch((err)=>{this.handleError(err)})
    }
    async init(){
      return new Promise(async (resolve, reject)=>{

        this.resolve = resolve
        this.reject = reject
        if(this.uri === undefined)
          return reject(Errors.URI_UNDEF)
        if(this.fpath === undefined)
          return reject(Errors.FPATH_UNDEF)

        this.fpath = path.join(process.env.DPATH, this.fpath)
        console.log(`downloading content to ${this.fpath}`)
        this.reader = await this.connect(this.offset)
        this.state = new Entry(this.hash)
        if(!await this.state.isNew()){
          //loading state
          await this.state.read()
          //load data from here
          this.uri = this.state.meta.uri
          this.fpath = this.state.meta.fpath
          this.offset = this.state.meta.offset
          this.length = this.state.meta.length
          this.speed = this.state.meta.speed
          this.hash = this.state.meta.hash
          this.completed = this.state.meta.completed
          this.mode = "old"
          this.setProgress(this.offset)
          console.log("old mode")
        }
        else{
          console.log("new mode")
          this.setProgress()
          this.offset = 0
        }
        if(this.mode === undefined || this.mode === "new")
          this.writer = ofs.createWriteStream(this.fpath)
        else
          this.writer = ofs.createWriteStream(this.fpath, {start: this.offset, flags: "r+"})
        
        //TODO: shift logic to download method for simplicity
        //this.collection = new collections.uniEntryCollection({})
        //this.model = this.collection.getDownloadEntryModel()
        this.reader.pipe(this.writer)
        this.reader.on("error", this.handleError)
        let count = 0
        this.reader.on("data", async (chunk)=>{
          this.emit("progress", this.metaCompact())
          if(this.speedometer === undefined)
            this.speedometer = speedometer()
          this.speed = this.speedometer(chunk.length)
          this.offset += chunk.byteLength
          count += 1
          if(count % 10 === 0)
            this.dbSave()
        })
        this.reader.on("end", ()=>{
          //wait for a moment then cleanup
          this.completed = true
          //setTimeout(()=>this.collection.close(), 1000)
          this.emit("end", this.metaCompact())
          return this.resolve(this.metaCompact())
        })
      })
    }
}
module.exports = {
  SingleClient
}
//a = new base({uri: "https://box5.highschooldxd.xyz/Naruto%5B1-220%5D/Naruto%20009%20-%20Kakashi%20the%20Sharingan%20User.mkv", fpath: "nonne.mkv"})
//a.on("progress", console.log)
//a.init().then(console.log)
