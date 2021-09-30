const axios = require("axios")
const fs = require("fs")
const crypto = require("crypto")
const events = require("events")

class Speedometer{
  constructor(){
    this.tick = 0 // seconds counter
    this.tock = 0 // byte counter
  }
  start(){
    this.timer = setInterval(() => {
      this.tick++
    }, 1000)
  }
  update(chunk){
    this.tock += chunk.byteLength
  }
  pause(){
    clearInterval(this.timer)
  }
  speed(power){
    if(power === undefined) power = 0
    let bps = this.tock / this.tick
    return bps / Math.pow(1000, power)
  }
}

class SingleClient extends events{
  constructor({uri, fpath}){
    super()
    this.uri = uri
    this.fpath = fpath
    this.speedometer = new Speedometer()
    this.offset = 0
    this.length = undefined
    this.setHash()
  }
  setHash(){
    let hasher = crypto.createHash("md5")
    hasher.update(this.uri)
    this.hash = hasher.digest("hex")
  }
  makeHeaders(ua, range){
    //ua UserAgent
    //range byteRange
    if(ua === undefined) ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36"
    if(range === undefined) range = "bytes=0-"
    else range = `bytes=${range.start}-${range.end}`
    return {
      "User-Agent": ua,
      "Range": range
    }
  }
  successify(){
    return {
      uri: this.uri,
      fpath: this.fpath,
      success: true,
      error: false
    }
  }
  errorify(err){
    return {
      uri: this.uri,
      fpath: this.fpath,
      success: false,
      error: err
    }
  }
  async getReadStream(headers){
    return await axios({
      method: "GET",
      responseType: "stream",
      url: this.uri,
      headers: headers || this.makeHeaders()
    })
  }
  metaCompact(){
    return {
      uri: this.uri,
      fpath: this.fpath,
      offset: this.offset,
      length: this.length,
      speed: this.speedometer.speed(),
      hash: this.hash
    }
  }
  setLength(stream){
    this.length = Number(stream.headers["content-length"])
  }
  download(){
    return new Promise(async (resolve, reject) => {
      this.speedometer.start()
      let rStream = await this.getReadStream()
      this.setLength(rStream)

      let wStream = fs.createWriteStream(this.fpath) //{flags: "a"}) //check append mode


      rStream.data
        .on("data", chunk => {
          this.offset += chunk.byteLength
          this.speedometer.update(chunk)
          this.emit("progress", this.metaCompact())
          //console.log(this.metaCompact())
        })
        .on("end", () => {
          this.speedometer.pause()
          this.emit("end", this.successify())
          return resolve(this.successify())
        })
        .on("error", (err) => {
          this.speedometer.pause()
          this.emit("error", err)
          return reject(this.errorify(err))
        })
        .pipe(wStream)
    })
  }
}


//let handle = new SingleClient({uri: "https://www.google.com/search?q=http+header+manager+nodejs&oq=http+header+manager+nodejs&aqs=chrome..69i57j0i512l3j0i22i30l6.4784j0j7&sourceid=chrome&ie=UTF-8", fpath: "something"})
//console.log(handle.makeHeaders(undefined, {start: 100, end: 500}))


let config = {
  uri: "http://kelseymcnair.com/Kel's%20Music/iTunes/iTunes%20Music/Podcasts/Naruto%20Soundtrack/21%20Naruto%20Main%20Theme.mp3",
  fpath: "naruto_main.mp3"
}

let handle = new SingleClient(config)
handle.download().then(console.log).catch(console.log)

handle.on("progress", (p) => {
  console.log(p)
})
