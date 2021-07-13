require("dotenv").config()
const https = require("https")
const http = require("http")
const fs = require("fs")
const fsp = require("fs").promises
const path = require("path")
const url = require("url") //TODO: this API is deprecated please replace later
const crypto = require("crypto")
const {Entry} = require("../store")

class ParallelClient{
  constructor({uris, fpaths, maxConns}){
    this.uris = uris
    this.fpaths = fpaths
    this.maxConns = maxConns || 4
    this.n = this.uris.length
    // Sanity checks
    if(this.uri.length !== this.fpath.length)
      throw new Error("fpaths not properly specified")
    else{
      this.fpaths = this.fpaths.map(fpath => path.join(process.env.SPATH, fpath))
      this.lengths = new Array(this.n)
      this.offsets = new Array(this.n).fill(0)
      this.speeds = new Array(this.n).fill(0)
      this.completed = new Array(this.n).fill(false)
      this.setHash() //=> sets this.hashes
      this.state = new Entry(this._hash)
    }
    this.adapters = this.uris.map(uri => {
      this.getAdapter(uri)
    })
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
  setHash(){
    //sets hash by exploring this.uris
    this._hasher = crypto.createHash("md5")
    this.hashes = this.uri.map(uri => {
      let hasher = crypto.createHash("md5")
      hasher.update(uri)
      this._hasher.update(uri)
      return hasher.digest("hex")
    })
    this._hash = this._hasher.digest("hex")
  }
  connect(){
    return new Promise((resolve, reject)=>{
      Promise.all(this.uris.map((uri, idx, arr) => {
        return new Promise((resolve, reject) => {
          this.adapters[idx].get(uri, (res) => {
            return resolve(res)
          })
        })
      })).then(resolve).catch(reject)
    })
  }
  async init(){
    let readers = await this.connect()
    debugger;
  }
  metaCompact(){
    return {
      uris: this.uris,
      fpaths: this.fpaths,
      offsets: this.offsets,
      lengths: this.lengths,
      completed: this.completed,
      speeds: this.speeds,
      hashes: this.hashes
    }
  }
  async dbSave(){
    let data = this.metaCompact()
    if(!await this.state.write(JSON.stringify(data, null, 4)))
      console.log("failed to write to store")
  }
}

