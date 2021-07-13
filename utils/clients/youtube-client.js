require("dotenv").config()
const ytdl = require("ytdl-core")
const {Entry} = require("../store")
const cp = require("child_process")
const ofs = require("fs")
const fs = require("fs").promises
const events = require("events")
const crypto = require("crypto")
const path = require("path")
const speedometer = require("speedometer")
//const {ParallelClient} = require("./parallel-client")
//
//class YoutubeClient{
//  constructor({uri, quality}){
//    this.uri = uri
//    this.quality = quality || "1080p"
//    if(this.uri === undefined)
//      throw new Error("invalid uri")
//  }
//
//
//
//
//
//
//
//
//  selectAudio(formats){
//    let selections = formats.filter(e => {return e.hasAudio && !e.hasVideo})
//    let best = 0
//    for(let i = 1; i < selections.length; i++){
//      if(selections[i] > selections[best])
//        best = i
//    }
//    return formats[best]
//  }
//  selectVideo(formats){
//    let selections = formats.filter(e => {return e.qualityLabel === this.quality})
//    let best = 0
//    for(let i = 1; i < selections.length; i++){
//      if((selections[i].bitrate < selections[best].bitrate) && (!selections[i].hasAudio))
//        best = i
//    }
//    return selections[best]
//  }
//  async extractLinks(){
//    let {formats} = await ytdl.getInfo(this.uri)
//    let videoLink = this.selectVideo(formats)
//    let audioLink = this.selectAudio(formats)
//    return [videoLink, audioLink]
//  }
//  async init(){
//    const [videoLink, audioLink] = await this.extractLinks()
//    let 
//  }
//}
//
//
//let handle = new YoutubeClient({uri: "https://www.youtube.com/watch?v=vw3Jg5WdMbY"})
//handle.init()

if(Array.prototype.last === undefined)
  Array.prototype.last = function(){
    return this[this.length - 1]
  }

class YoutubeClient extends events{
  constructor({uri, audioQuality, videoQuality}){
    super()
    this.tempName = uri.split("=").last()
    this.uri = uri
    this.hash = this.getHash()
    this.state = new Entry(this.hash)
    if(!this.state.readSync()){
      this.offset = 0
      this.length = 0
      this.offsetAudio = 0
      this.offsetVideo = 0
    }
    else
      this.setState(this.state.meta)
    this.audioQuality = audioQuality || "highestaudio"
    this.videoQuality = videoQuality || "highestvideo"
    this.videoStream = ytdl(uri, {quality: this.videoQuality})//, range: {start: this.offsetVideo, end: INT}})
    this.audioStream = ytdl(uri, {quality: this.audioQuality})//, range: {start: this.offsetAudio}})
    debugger;
    this.audioWritePath = path.join(process.env.DPATH, this.hash+"_audio.mkv")
    this.videoWritePath = path.join(process.env.DPATH, this.hash+"_video.mkv")
    this.audioWriteStream = ofs.createWriteStream(this.audioWritePath)//, {start: this.offsetAudio, flags: "r+"})
    this.videoWriteStream = ofs.createWriteStream(this.videoWritePath)//, {start: this.offsetVideo, flags: "r+"})
    this.completed = false

    //this.model = this.collection.getDownloadEntryModel()
  }
  setState(meta){
    for(let m in meta){
      this[m] = meta[m]
    }
  }
  pause(){
    this.audioStream.destroy()
    this.videoStream.destroy()
  }
  metaCompact(){
    return {
      length: this.length,
      offset: this.offset,
      hash: this.hash,
      uri: this.uri,
      fpath: this.fpath,
      speed: this.speed || 0,
      completed: this.completed,
      offsetAudio: this.offsetAudio,
      offsetVideo: this.offsetVideo
    }
  }
  getHash(){
    if(this.hasher === undefined){
      this.hasher = crypto.createHash("md5")
      this.hasher.update(this.uri)
    }
    return this.hasher.digest("hex")
  }
  handleUpdate(chunk){

    this.offset += chunk.byteLength
    if(this.speedometer === undefined)
      this.speedometer = speedometer()
    this.speed = this.speedometer(chunk.byteLength)

    this.emit("progress", this.metaCompact())
    this.dbSave()
  }
  handleEnd(){
    console.log("merging files")
    this.completed = true
    this.dbSave()
    let handle = cp.spawn("ffmpeg", ["-i", this.videoWritePath, "-i", this.audioWritePath, "-c", "copy", this.fpath+".mkv"])
    handle.on("close", async (code) =>{
      console.log("removing files")
      await fs.unlink(this.videoWritePath).catch(console.log)
      await fs.unlink(this.audioWritePath).catch(console.log)

      this.emit("end", {success: true, error: false, meta: this.metaCompact()})
      //setTimeout(()=>this.collection.close(), 1000)
      this.resolve()
    })
  }
  handleError(err){
    this.emit("error", {success: false, error: err, meta: this.metaCompact()})
    //setTimeout(()=>this.model.close(), 1000)
    this.reject(err)
  }
  init(){
    return new Promise((resolve, reject)=>{
      try{
        this.resolve = resolve
        this.reject = reject
        this.videoStream.on("info", (a, b)=>{
          console.log("video stream info received")
          this.length += Number(b.contentLength)
          this.fpath = path.join(process.env.DPATH, a.videoDetails.title+".mkv")
        })
        this.audioStream.on("info", (a, b)=>{
          console.log("audio stream info received")
          this.length += Number(b.contentLength)
        })
        console.log("starting YT download")
        this.audioStream.pipe(this.audioWriteStream)
        this.videoStream.pipe(this.videoWriteStream)


        this.audioStream.on("data", (chunk) =>{
                                                this.handleUpdate(chunk)
                                                this.offsetAudio += chunk.byteLength
                                              })
                        .on("error", (e)=>{this.handleError(e)})
        this.videoStream.on("data", (chunk) => {
                                                this.handleUpdate(chunk)
                                                this.offsetVideo += chunk.byteLength
                                                })
                        .on("end", (e)=>{this.handleEnd(e)})
                        .on("error", (e)=>{this.handleError(e)})

      }
      catch(e){
        this.emit("error", this.metaCompact())
        this.reject(e)
      }
    })
  }
  async dbSave(){
    let data = this.metaCompact()
    if(!await this.state.write(data))
      console.log("failed to write to store")
  }
}

module.exports = {
  YoutubeClient
}

//
//let handle = new YoutubeClient({uri: "https://www.youtube.com/watch?v=QSDOTqtZaF4"})
//handle.on("progress", console.log)
//handle.init().then(console.log).catch(console.log)
