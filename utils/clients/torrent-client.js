require("dotenv").config()
const webtorrent = require("webtorrent")
const fs = require("fs")
const path = require("path")
//FIXME: uncomment following when store issue is fixed
//const {Entry} = require("../store")

class TorrentClient{

  constructor({torrent}){
    this.client = new webtorrent({maxConns: 20})
    this.torrentIn = torrent
  }
  metaCompact(){
    return this.torrent.files.map(file => {
      return {
        name: file.name,
        path: file.path,
        length: file.length,
        offset: file.downloaded
      }
    })
  }
  metaSummary(){
    return {
      files: this.metaCompact(),
      length: this.torrent.length,
      offset: this.torrent.downloaded,
      hash: this.hash,
      speed: this.torrent.downloadSpeed,
      peers: this.torrent.numPeers,
      torrent: this.torrentIn,
      ETA: this.torrent.timeRemaining / (1000*60),
      mode: "torrent"
    }
  }
  close(){
    this.torrent.pause()
    console.log("torrent paused")
    this.client.destroy()
    console.log("client closed")
    clearInterval(this.tick)
    process.exit(0)
  }
  init(){
    return new Promise((resolve, reject)=>{
      this.client.add(this.torrentIn, {path: process.env.DPATH}, (torrent)=>{
        this.torrent = torrent
        this.hash = this.torrent.infoHash
        console.log(this.hash)

        this.torrent.on("download", (bytes)=>{
          let meta = this.metaSummary()
          let confPath = path.join(process.env.SPATH, this.hash)
          //for some unknown reasons cant use Entry from store
          fs.writeFileSync(confPath, JSON.stringify(meta, null, 4))
        })

        this.tick = setInterval(()=>{
          let temp = this.metaSummary()
          delete temp["files"]
          console.log(temp)
        }, 1000)

        this.torrent.on("done", () => {
          this.close()
          return resolve({success: true})
        })

        this.torrent.on("error", (err) => {
          this.close()
          return reject({success: false, error: err})
        })
      })
    })
  }
  pause(){
    this.torrent.pause()
  }
  resume(){
    this.torrent.resume()
  }
}

module.exports = {
  TorrentClient
}
//let magnet = "cbffe1efd7de9beec9c5f2ba7d4a18e5738d6987"
let magnet = process.argv[2] || "0A9AC7CAFFE91E86105A83484D1B1269E0D1DD6B" //"cbffe1efd7de9beec9c5f2ba7d4a18e5738d6987"
console.log(magnet)
//let magnet = "magnet:?xt=urn:btih:EB2202C50FA8476E00BC8CDB891F26B9A170F9F0&dn=DMX+-+Exodus+%28Explicit%29+%282021%29+Mp3+320kbps+%5BPMEDIA%5D+%E2%AD%90%EF%B8%8F&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2F47.ip-51-68-199.eu%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2920%2Fannounce&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce"
//
let handle = new TorrentClient({torrent: magnet})
handle.init().then(console.log).catch(console.log)

