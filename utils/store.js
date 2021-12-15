const fs = require("fs")
const path = require("path")
const { Messages } = require("./server-utils")



if(Object.prototype.isSame === undefined){
  Object.prototype.equivalent = function(b){
    // this can go very wrong something other than primitive values are applied
    return JSON.stringify(this) === JSON.stringify(b)
  }
}


class Store{
  constructor(hash){
    if(hash === undefined) throw new Error("argument hash unspecified")
    this.hash = hash
    this.fpath = path.join(processe.env.SPATH, this.hash)
    this.catacomb = {}
  }
  async read(){
    try{
      let data = await fs.promises.readFile(this.fpath).then(e => e.toString()).then(e => JSON.parse(e))
      this.catacomb = data //is this extra step required?
      return Messages.successify({ message: "meta ready", hash: this.hash})
    }
    catch(e){
      return Messages.errorify({ message: "failed to read meta", error: e, hash: this.hash})
    }
  }
  write(payload){
    if(this.catacomb.isSame(payload)){
      return Messages.successify({ message: "meta already in sync", hash: this.hash})
    }
    else{
      await fs.promises.writeFile()
    }
  }
}

module.exports = {
  Store
}
