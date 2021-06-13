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
const collections = require("../collections")

class Errors{
  static URI_UNDEF = "URL not defined"
  static FPATH_UNDEF = "file path not defined"
  static DPROT_UNSUP = "download protocol not supported"
}
class base extends events{
  constructor({uri, fpath, offset, length}){
    super()
    this.uri = uri
    this.fpath = fpath
    this.offset = offset
    this.length = length
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
  http(){
    this.adapter = this.getAdapter()
    this.setHash()
    return new Promise((resolve, reject)=>{
      if(!this.adapter)
        return reject(Errors.DPROT_UNSUP)
      else{
        this.adapter.get(this.uri, (res)=>{
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
      hash: this.hash
    }
  }
  handleError(err){
    debugger;
    return this.reject(err)
  }
  setProgress(){
    this.offset = 0
    this.length = Number(this.reader.headers["content-length"])
  }
  async dbSave(){
    let data = await this.model.findOne({hash: this.hash}).catch(this.handleError)
    if(data === null){
      let temp = new this.model(this.metaCompact())
      await temp.save().catch(this.handleError)
    }
    else{
      let done = await this.model.findOneAndUpdate({hash: this.hash}, {$set: this.metaCompact()}).catch(this.handleError)
    }

  }
  async init(){
    return new Promise(async (resolve, reject)=>{
      debugger;
      this.resolve = resolve
      this.reject = reject
      if(this.uri === undefined)
        return reject(Errors.URI_UNDEF)
      if(this.fpath === undefined)
        return reject(Errors.FPATH_UNDEF)
      this.reader = await this.http(this.uri)
      if(this.length === undefined || this.offset === undefined)
        this.setProgress()
      if(this.mode === undefined || this.mode === "new")
        this.writer = ofs.createWriteStream(this.fpath)
      else
        this.writer = ofs.createWriteStream(this.fpath, {start: this.offset, flags: "r+"})
      this.collection = new collections.uniEntryCollection({})
      this.model = this.collection.getDownloadEntryModel()
      this.reader.pipe(this.writer)
      this.reader.on("error", this.handleError)
      this.reader.on("data", async (chunk)=>{
        this.emit("progress", this.metaCompact())
        if(this.speedometer === undefined)
          this.speedometer = speedometer()
        this.speed = this.speedometer(chunk.length)
        this.offset += chunk.byteLength
        this.dbSave()
      })
      this.reader.on("end", ()=>{
        //wait for a moment then cleanup
        setTimeout(()=>this.collection.close(), 1000)
        this.emit("end", this.metaCompact())
        return this.resolve(this.metaCompact())
      })
    })
  }
}

module.exports = {
  base: base
}
async function main(){
  let uri = "https://i.redd.it/d1aehdnbq0h21.jpg"
  let a = new base({uri: uri, fpath: path.join("/home/iamfiasco/dark/dmanager", "downloads", "rhea.jpeg")})
  let result = await a.init()
  console.log(result)
}
