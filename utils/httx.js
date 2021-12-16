require("dotenv").config()
const axios = require("axios")
const fs = require("fs")
const path = require("path")

class Speedometer {
  constructor(){
    this.tick = 0
    this.tock = 0
  }
  update(chunkLen){
    this.tock += chunkLen
  }
  resume(){
    this.timer = setInterval(() => this.tick++, 1000)
  }
  pause(){
    clearInterval(this.timer)
  }
}

class HTTX {
  constructor({url, fpath}){
    this.url = url
    this.fpath = fpath
    this.init()
  }
  readState(){
    
  }
  saveState(){

  }
  packMeta(){
    return {
      url: this.url,
      fpath: this.fpath,
      hash: this.hash
    }
  }
  init(){
    this.offset = 0
    this.length = 0
    this.headers = { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36" }
    this.speed = 0
    this.speedometer = new Speedometer()
    this.hash = hash(this.url)
  }
  resume(){

  }
  pause(){

  }
  prepareWriter(){

  }
  prepareReader(){

  }
}
