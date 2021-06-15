require("dotenv").config()

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
const cp = require("child_process")
const ytdl = require("ytdl-core")
const webtorrent = require("webtorrent")

//do something about this patch(centralized loc)
if(Array.prototype.last === undefined){
  Array.prototype.last = function(){
    return this[this.length - 1]
  }
}


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
    this.setHash()
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
  connect(){
    this.adapter = this.getAdapter()
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
      hash: this.hash,
      completed: this.completed
    }
  }
  handleError(err){
    this.emit("error", {meta: this.metaCompact(), error: err, hash: this.hash})
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
      this.resolve = resolve
      this.reject = reject
      if(this.uri === undefined)
        return reject(Errors.URI_UNDEF)
      if(this.fpath === undefined)
        return reject(Errors.FPATH_UNDEF)
      this.fpath = path.join(process.env.BASE, this.fpath)
      this.reader = await this.connect()
      if(this.length === undefined || this.offset === undefined)
        this.setProgress()
      if(this.mode === undefined || this.mode === "new")
        this.writer = ofs.createWriteStream(this.fpath)
      else
        this.writer = ofs.createWriteStream(this.fpath, {start: this.offset, flags: "r+"})
      
      //TODO: shift logic to download method for simplicity
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
        this.completed = true
        setTimeout(()=>this.collection.close(), 1000)
        this.emit("end", this.metaCompact())
        return this.resolve(this.metaCompact())
      })
    })
  }
}
class youtube extends events{
  constructor({uri, audioQuality, videoQuality}){
    super()
    this.tempName = uri.split("=").last()
    this.uri = uri
    this.hash = this.getHash()
    this.audioQuality = audioQuality || "highestaudio"
    this.videoQuality = videoQuality || "highestvideo"
    this.videoStream = ytdl(uri, {quality: this.videoQuality})
    this.audioStream = ytdl(uri, {quality: this.audioQuality})
    this.offset = 0
    this.length = 0
    this.audioWritePath = path.join(process.env.BASE, this.hash+"_audio.mkv")
    this.videoWritePath = path.join(process.env.BASE, this.hash+"_video.mkv")

    this.audioWriteStream = ofs.createWriteStream(this.audioWritePath)

    this.videoWriteStream = ofs.createWriteStream(this.videoWritePath)
    
    this.completed = false
    this.collection = new collections.uniEntryCollection({})
    this.model = this.collection.getDownloadEntryModel()
  }
  metaCompact(){
    return {
      length: this.length,
      offset: this.offset,
      hash: this.hash,
      uri: this.uri,
      fpath: this.fpath,
      speed: this.speed || 0,
      completed: this.completed
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
    debugger;
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
      setTimeout(()=>this.collection.close(), 1000)
      this.resolve()
    })
  }
  handleError(err){
    this.emit("error", {success: false, error: err, meta: this.metaCompact()})
    setTimeout(()=>this.model.close(), 1000)
    this.reject(err)
  }
  init(){
    return new Promise(async (resolve, reject)=>{
      this.resolve = resolve
      this.reject = reject
      this.videoStream.on("info", (a, b)=>{
        this.length += Number(b.contentLength)
        this.fpath = path.join(process.env.BASE, a.videoDetails.title+".mkv")
      })
      this.audioStream.on("info", (a, b)=>{
        this.length += Number(b.contentLength)
      })
      this.audioStream.pipe(this.audioWriteStream)
      this.videoStream.pipe(this.videoWriteStream)
      this.audioStream.on("data", (chunk) => this.handleUpdate(chunk)).on("error", (e)=>this.handleError(e))
      this.videoStream.on("data", (chunk) => this.handleUpdate(chunk)).on("end", (e)=>this.handleEnd(e)).on("error", (e)=>this.handleError(e))
    })
  }
  async dbSave(){
    debugger;
    let data = await this.model.findOne({hash: this.hash}).catch(this.handleError)
    if(data === null){
      let temp = new this.model(this.metaCompact())
      await temp.save().catch(this.handleError)
    }
    else{
      let done = await this.model.findOneAndUpdate({hash: this.hash}, {$set: this.metaCompact()}).catch(this.handleError)
    }
  }
}

class torrent extends events{
  constructor({torrent, maxConnections, fpath}){
    this.torrent = torrent
    this.options = {}
    this.fpath = fpath
    this.options.path = this.fpath
    this.maxConnections = maxConnections || 4
    this.options.maxConns = this.maxConnections
    this.client = new webtorrent({maxConns: this.maxConnetions})
    this.files = []
    this.completed = false
  }
  fileState(){
    return this.files.map((file)=>{
      return {
        name: file.name,
        path: file.path,
        length: file.length,
        offset: file.downloaded
      }
    })
  }
  metaCompact(){
    return {
      length: this.torrent.length,
      offset: this.torrent.verified,
      hash: this.torrent.infoHash,
      files: this.fileState(),
      speed: this.torrent.downloadSpeed,
      peer: this.torrent.numPeers,
      pieces: this.torrent.pieces,
      upSpeed: this.torrent.uploadSpeed
    }
  }
  dbInit()
  dbSave()
  rescan(){
    this.torrent.rescanFiles()
  }
  resume(){
    this.torrent.resume()
  }
  pause(){
    this.torrent.pause()
  }
  select(start, end, priority){
    this.torrent.select(start, end, priority)
  }
  init(){
    return new Promise((resolve , reject)=>{
      this.client.add(this.torrent, this.options, (torrent)=>{
        this.torrent = torrent
        this.files = this.torrent.files
        this.torrent.on("download", (bytes)=>{
          this.emit("progress", this.metaCompact())
        })

        this.torrent.on("done", ()=>{
          this.emit("end", {meta: this.metaCompact(), success: true})
          return resolve(this.metaCompact())
        })

        this.torrent.on("error", ()=>{
          this.emit("error", {meta: this.metaCompact, error: err, success: false})
        })
        //torrent.pieces
        //torrent.pieceLength
        //torrent.lastPieceLength
        //torrent.timeRemaining => milliseconds
        //torrent.received => bytes (all pieces)
        //torrent.verified => bytes (verified pieces ok)
        //torrent.uploaded => bytes
        //torrent.downloadSpeed
        //torrent.uploadSpeed
        //torrent.numPeers
        //torrent.path
        //torrent.done
        //torrent.length

        ////mods
        //torrent.select(start, end, priority)
        //torrent.deselect
        //torrent.critical(start,end)
        //torrent.pause()
        //torrent.resume()
        //torrent.rescanFiles(err=>{})
        //torrent.on("meta")
        //torrent.on("download", (bytes)) //=>

      })
    })
  }
}


async function main(){
  let a = new youtube({uri: "https://www.youtube.com/watch?v=eTVsMA48gtM"})
  await a.init()
}


module.exports = {
  base: base,
  youtube: youtube
}
