const webtorrent = require("webtorrent")

class Client{
  constructor({ iHash }){
    this.iHash = iHash
    if(this.iHash === undefined)
      throw new Error("NO infohash to download")
    this.client = new webtorrent({ maxConns: 20 })
  }
  init(){
    return new Promise((resolve, reject)=>{
      this.client.add(this.iHash, { path: "downloads" }, (torrent) => {
        this._torrent = torrent
        this._torrent.on("done", () => resolve({ success: true, error: false, hash: this.iHash}))
        this._torrent.on("error", (err) => reject({success: false, error: err, hash: this.iHash}))
        this._torrent.on("download", (bytes) => console.log(this.metaSummary()))
      })
    })
  }
  metaCompact(){
    return this._torrent.files.map(file => {
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
      length: this._torrent.length,
      offset: this._torrent.downloaded,
      hash: this.iHash,
      speed: this._torrent.downloadSpeed,
      peers: this._torrent.numPeers,
      torrent: this._torrentIn,
      ETA: this._torrent.timeRemaining / (1000*60),
      mode: "torrent"
    }
  }
  close(){
    this.client.destroy()
  }
}

async function main(){
  let hash = "C5738F2A9E8568C637B76D65ED2999F38F490D08" // info hash of the file
  let handle = new Client({ iHash: hash })
  console.log(await handle.init())
  handle.close()
}


module.exports = {
  Client
}

