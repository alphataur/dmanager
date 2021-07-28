require("dotenv").config()
const https = require("https") //FIXME: use  base client
const ytdl = require("ytdl-core")
const {Entry} = require("../store")
const cp = require("child_process")
const ofs = require("fs")
const fs = require("fs").promises
const events = require("events")
const crypto = require("crypto")
const path = require("path")
const speedometer = require("speedometer")

if(Array.prototype.last === undefined)
  Array.prototype.last = function(){
    return this[this.length - 1]
  }

class YoutubeClient extends events{
  constructor({uri, audioQuality, videoQuality}){
    super()
    console.log(uri)
    this.tempName = uri.split("=").last()
    this.uri = uri
    this.hash = this.getHash()
    this.state = new Entry(this.hash)
    this.completed = false
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
    this.prepRStreams()
    this.prepWStreams()

  }
  prepRStreams(){
    this.videoStream = ytdl(this.uri, {quality: this.videoQuality})//, range: {start: this.offsetVideo, end: INT}})
    this.audioStream = ytdl(this.uri, {quality: this.audioQuality})//, range: {start: this.offsetAudio}})
  }
  prepWStreams(){
    this.audioWritePath = path.join(process.env.DPATH, this.hash+"_audio.mkv")
    this.videoWritePath = path.join(process.env.DPATH, this.hash+"_video.mkv")
    this.audioWriteStream = ofs.createWriteStream(this.audioWritePath)//, {start: this.offsetAudio, flags: "r+"})
    this.videoWriteStream = ofs.createWriteStream(this.videoWritePath)//, {start: this.offsetVideo, flags: "r+"})
  }
  setState(meta){
    for(let m in meta){
      this[m] = meta[m]
    }
    //remove this logic as this disables resumability
    this.offset = 0
    this.length = 0
    this.offsetAudio = 0
    this.offsetVideo = 0
    console.log("completed state", this.completed)
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
      offsetVideo: this.offsetVideo,
      mode: "youtube"
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
  handleEnd(e){
    console.log(e)
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
    return new Promise(async (resolve, reject)=>{
      let [audioStream, videoStream] = this.prepLinks() //await ytdl.getBasicInfo(this.uri)
      this.audioStream = audioStream
      this.videoStream = videoStream
      debugger;
      if(this.completed){
        debugger;
        return resolve({})
      }
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

async function main(){
  let links = [
    "https://www.youtube.com/watch?v=TbJE-KVZvTA",
    "https://www.youtube.com/watch?v=xDdQL2JIxp8",
    "https://www.youtube.com/watch?v=HxRnuK5Xmv0",
    "https://www.youtube.com/watch?v=qtrHH1BDlzk",
    "https://www.youtube.com/watch?v=MvZ_OIFTAWM",
    "https://www.youtube.com/watch?v=xcb2R-WpxVg",
    "https://www.youtube.com/watch?v=Dj20gT5ovxE",
    "https://www.youtube.com/watch?v=A3jmwNA2JXQ",
    "https://www.youtube.com/watch?v=ibrC5cAPZT4",
    "https://www.youtube.com/watch?v=stq9HSEfJ74",
    "https://www.youtube.com/watch?v=zDo0H8Fm7d0",
    "https://www.youtube.com/watch?v=ft4jcPSLJfY",
    "https://www.youtube.com/watch?v=RnBT9uUYb1w",
    "https://www.youtube.com/watch?v=LdH7aFjDzjI",
    "https://www.youtube.com/watch?v=uEJuoEs1UxY",
    "https://www.youtube.com/watch?v=XoiEkEuCWog"
  ]
  links = links.reverse()
  for(link of links){
    let handle = new YoutubeClient({uri: link})
    handle.on("progress", console.log)
    await handle.init()
  }
}

main()
