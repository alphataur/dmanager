const crypto = require("crypto")
const url = require("url")
const http = require("http")
const https = require("https")
const collections = require("../collections")
const misc = require("../misc")

class baseClient{
  constructor(options){
    this.uri = uri
    this._hash()
    this.adapter = getAdapter()
    this.loadState()
  }
  async loadState(){
    this.model = collections.singleTargetDownloadModel()
    let temp = await this.model.find({hash: this.hash}).catch(handleError)
    switch(temp.length){
      case 0:
        //new download
      case 1:
        //single target download
      default:
        //multi target download
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
  ensureBasePath()
  _hash(){
    if(this.hasher === undefined){
      this.hasher = crypto.createHash()
      this.hasher.update(this.uri)
    }
    this.hash = this.hasher.digest("hext")
  }
  handleChunk(chunk)
  handleError(err)
  handleEnd()
  saveState()
  progress(){
    return (this.offset === 0 || this.length === 0) ? 0 : (this.offset/this.length) * 100
  }
  dbSave()
  unwrap(){
    return new Promise((resolve, reject)=>{
      if(this.completed)
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
