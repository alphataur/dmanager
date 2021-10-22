const fs = require("fs")
const axios = require("axios")
const path = require("path")
const crypto = require("crypto")
const qs = require("querystring")
const { Store } = require("../utils/state/store")

if(Array.prototype.last === undefined){
  Array.prototype.last = function(){
    return this[this.length - 1]
  }
}
function hashString(str){
  let hasher = crypto.createHash("md5")
  hasher.update(str)
  return hasher.digest("hex")
}

function hashFile(fpath){
  return new Promise((resolve, reject) => {
    let rStream = fs.createReadStream(fpath)
    let hasher = crypto.createHash("md5") //should we move to sha1
    rStream
      .on("end", () => resolve({ success: true, error: false, hash: hasher.digest("hex")}))
      .on("error", (err) => reject({ success: false, error: err }))
      .pipe(hasher)
  })
}

class Speedometer{
  constructor(){
    this.tick = 0
    this.tock = 0
  }
  resume(){
    this.timer = setInterval(() => {
      this.tick++
    }, 1000)
  }
  pause(){
    clearInterval(this.timer)
  }
  consume(chunk){
    this.tock += chunk.byteLength
  }
  speed(){
    //returns the speed of a stream in bytes/second ~DO YOUR OWN MATH (DYOM)
    return this.tock / this.tick
  }
}

class Client{
  constructor({url, fpath}){
    this.url = url
    this.fpath = fpath || this.setPath()
    this.hash = hashString(this.url)
    this.length = 0
    this.offset =-0
    this.smeter = new Speedometer()
    this.store = new Store()
  }
  setPath(){
    let target = "downloads"
    let fname = qs.unescape(this.url)
    fname = fname.split("/").last()
    return path.join(target, fname)
  }
  getWriteStream(mode){
    const options = { flags: "a" }
    if(mode === undefined)
      return fs.createWriteStream(this.fpath)
    else
      return fs.createWriteStream(this.fpath, options)
  }
  meta(){
    return {
      url: this.url,
      hash: this.hash,
      length: this.length,
      offset: this.offset,
      speed: this.smeter.speed(),
      fpath: this.fpath
    }
  }
  sendSuccess(){
    return { success: true, error: false }
  }
  sendError(err){
    return { success: false, error: err }
  }
  async saveState(){
    let meta = this.meta()
    let hash = meta.hash
    await this.store.insert(hash, meta)
  }
  download(){
    return new Promise(async (resolve, reject) => {

      let res = await axios({
        url: this.url,
        method: "get",
        responseType: "stream"
      })
      this.smeter.resume()
      this.length = Number(res.headers["content-length"])

      res.data
          .on("end", () => {
            this.smeter.pause()
            resolve(this.sendSuccess())
          })
          .on("error", (err) => {
            this.smeter.pause()
            resolve(this.sendError(err))
          })
          .on("data", async (chunk) => {
            this.smeter.consume(chunk)
            this.offset += chunk.byteLength
            await this.saveState()
          })
          .pipe(this.getWriteStream())
    })
  }
}


async function main(){
  let handle = new Client({
    url: "http://kelseymcnair.com/Kel's%20Music/iTunes/iTunes%20Music/Podcasts/Naruto%20Soundtrack/21%20Naruto%20Main%20Theme.mp3"
  })
  console.log(handle.url, handle.fpath)
  console.log(await handle.download())
}


//main()

module.exports = {
  Client,
  Speedometer,
  hashString,
  hashFile
}


