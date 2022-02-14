const axios = require("axios")
const fs = require("fs")
const path = require("path")
const hashers = require("./hashers")
const events = require("events")

process.env.DPATH = "/home/iamfiasco/Desktop/dmanager/"

if(!!!Array.prototype.last){
  Array.prototype.last = function(){
    return this[this.length - 1]
  }
}

if(!!!Array.prototype.every){
  Array.prototype.every = function(){
    for(let i of this){
      if(!i) return false
    }
    return true
  }
}

class HTTX extends events{
  constructor({ url, dpath, headers, nParts}){
    super()
    this.processArgs(url, dpath, headers, nParts)
  }

  processArgs(uri, dpath, headers, nParts){
    //setting url
    if(!!!uri) throw new Error("url cannot be undefined")
    else this.uri = decodeURI(uri)

    //setting hash for ID
    this.hash = hashers.hashString(uri)

    //setting file name
    this.fname = uri.split("/").last()

    //setting download directory
    if(!!!dpath){
      this.dpath = process.env.DPATH
    }
    else{
      this.dpath = fpath
    }

    //setting absolute filepath
    this.fpath = path.join(this.dpath, this.fname)

    //setting default headers
    if(!!!headers){
      this.headers = {
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36"
      }
    }
    else{
      this.headers = headers
    }

    //setting number of partions
    if(!!!nParts) this.nParts = 4
    else this.nParts = nParts
  }

  processInitResponse(res){
    this.length = Number(res.headers["content-length"])
  }

  async getMeta(){
    let res = await axios.head(this.uri)
    this.processInitResponse(res)
  }
  async getPartionResponses(){
    let responses = []
    let jump = Math.floor(this.length/this.nParts)
    for(let i = 0; i < this.length; i += jump){
      let start = i
      let end = start + jump
      if(start !== 0) start++
      if((start + jump) === this.length) end = this.length
      else end = start + jump
      let tempHeaders = this.headers
      tempHeaders["range"] = `bytes=${start}-${end}`
      let response = await axios({
        url: this.uri,
        responseType: "stream",
        headers: tempHeaders,
        method: "get"
      })
      responses.push(response)
    }
    return responses
  }

  makeWriteStreams(){
    let streams = []
    for(let i = 0; i < this.nParts; i++){
      streams.push(fs.createWriteStream(path.join(this.dpath, `${this.hash}.part${i}`)))
    }
    return streams
  }
  initPipeLines(){
    for(let i = 0; i < this.nParts; i++){
      this.partitions[i].data.on("data", (chunk) => {
        console.log("received chunk from", i)
        this.offset += chunk.byteLength
      })
      this.partitions[i].data.on("end", () => {
        this.isCompleted[i] = true
      })
      this.partitions[i].data.on("error", (err) => {
        this.isCompleted[i] = true
      })
      this.partitions[i].data.pipe(this.wstreams[i])
    }
  }
  waitCompletion(){
    return new Promise((resolve, reject) => {
      setInterval(() => {
        for(let i of this.isCompleted){
          if(!i) return
        }
        return resolve(true)
      }, 1000)

    })
  }
  async start(){
    this.offset = 0
    this.isCompleted = Array.from(Array(this.nParts).keys()).map((elem) => false)
    await this.getMeta()
    this.partitions = await this.getPartionResponses()
    this.wstreams = this.makeWriteStreams()
    this.initPipeLines()
    //console.log(this.partitions.map(e => e.headers["content-length"]))
    await this.waitCompletion()
  }
}

async function main(){
  let handle = new HTTX({ url: "http://51.77.66.14/Naruto.Shippuden.S01-S22.1080p.CR.WEB-DL.AAC.2.0.x264-KAN3D2M/Naruto%20Shippuden.S05.1080p.CR.WEB-DL.AAC.2.0.x264-KAN3D2M/Naruto%20Shippuden.S05E93.1080p.CR.WEB-DL.AAC.2.0.x264-KAN3D2M.mkv" })
  await handle.start()
}

main()
