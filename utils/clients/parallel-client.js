const {SingleClient} = require("./single-client")
const {createHash} = require("crypto")
const {Entry} = require("../store")

class AdvancedClient extends SingleClient{
  constructor({uri, fpath}){
    super({uri, fpath})
  }
  dbSave(){
    let data = this.metaCompact()
    console.log("inside advanced", data)
  }
}

class ParallelClient{
  constructor({uris, fpaths, maxConns}){
    this.uris = uris
    this.fpaths = fpaths
    this.maxConns = maxConns || 4
    if(this.uris.length === this.fpaths.length){
      this.states = new Array(this.uris.length)
      this.hash = this.getHash()
      this.state = new Entry(this.hash)
      this.handles = this.uris.map((item, idx, arr) => {
        return new AdvancedClient({uri: item, fpath: this.fpaths[idx]})
      })
    }
    else{
      throw new Error("invalid URIs/Fpaths")
    }
  }
  init(){
    return new Promise((resolve, reject) => {

      Promise.all(this.handles.splice(0, this.maxConns).map((handle, idx, arr) => {
        handle.on("progress", (data)=>{
          this.states[idx] = data
          this.dbSave()
        })
        return handle.init()
      })).then(resolve).catch(reject)

    })
  }
  metaCompact(){
    return {files: this.states, mode: "parallel"}
  }
  getHash(){
    if(this._hasher === undefined){
      this._hasher = createHash("md5")
      this.uris.forEach(uri => this._hasher.update(uri))
      return this._hasher.digest("hex")
    }
    return this._hasher.digest("hex")
  }
  async dbSave(){
    let data = this.metaCompact()
    if(!await this.state.write(data))
      console.log("failed to write to store")
  }
}


module.exports = {
  ParallelClient
}

//let handle = new ParallelClient({uris: ["https://box5.highschooldxd.xyz/Naruto%5B1-220%5D/Naruto%20001%20-%20%20Enter,%20Naruto%20Uzamaki.mkv", "https://box5.highschooldxd.xyz/Naruto%5B1-220%5D/Naruto%20002%20-%20%20I%20Am%20Konohamaru!.mkv"], fpaths: ["nu_uno.mkv", "nu_dos.mkv"]})
//
//handle.init().then(console.log).catch(console.log)
//
//let handle = new AdvancedClient({uri: "https://box5.highschooldxd.xyz/Naruto%5B1-220%5D/Naruto%20007%20-%20%20The%20Assassin%20of%20the%20Mist!.mkv", fpath: "dos.mkv"})
//handle.init().then(console.log)
