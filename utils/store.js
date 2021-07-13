require("dotenv").config()
const fs = require("fs")
const fsp = fs.promises
const path = require("path")

if(Object.prototype.keys === undefined){
  Object.prototype.keys  = function(){
    return Object.keys(this)
  }
}
class Entry{
  constructor(hash){
    this.hash = hash
    this.fpath = path.join(process.env.SPATH, this.hash)
    this.meta = {}
  }
  async isNew(){
    try{
      console.log(this.fpath, "is the state")
      await fsp.access(this.fpath, fs.constants.F_OK | fs.constants.F_OK | fs.constants.R_OK)
      return false
    }
    catch(e){
      console.log("error as", e)
      return true
    }
  }
  readSync(){
    try{
      let data = fs.readFileSync(this.fpath)
      this.meta = JSON.parse(data)
      return true
    }
    catch(e){
      console.log("failed to read from store")
      return false
    }
  }
  async read(){
    try{
      let data = await fsp.readFile(this.fpath)
      this.meta = JSON.parse(data)
      return true
    }
    catch(e){
      console.log("error received at", this.fpath, e)
      return false
    }
  }
  async write(payload){
    try{
      fsp.writeFile(this.fpath, JSON.stringify(payload))
      return true
    }
    catch(e){
      console.log("error received at", this.fpath, e)
      return false
    }
  }
}



class Store{
  constructor(){
    this.entries = {}
    this.loaded = false
    this.start()
  }
  async start(){
    this.loadAll()
  }
  async loadAll(){
    let entries = await fsp.readdir(process.env.SPATH)
    for(let entry of entries){
      this.entries[entry] = new Entry(entry)
      await this.entries[entry].read()
    }
  }
}


module.exports = {
  Store,
  Entry
}
