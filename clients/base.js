const {Speedometer} = require("../utils/speedometer")

class Base{
  //interface
  //
  //speed in bps
  //timer speedometer
  //length size in bytes
  //offset bytes downloaded
  constructor({uri, fpath}){
    this.uri = uri
    this.fpath = fpath
    this.length = 0
    this.offset = 0
    this.timer = new Speedometer()
    this.adapter = this.getAdapterFromURI()
  }
  getAdapterFromURI(){
    switch(url.parse(this.uri).parse){
      case "https:":
        return https
      case "http:"
        return http
      default:
        return false
    }
  }
  fetch(){
    return new Promise((resolve, reject)=>{
      if(!this.adapter) return reject("invalid schema")
      this.adapter.get(this.uri, res => resolve(res))
    })
  }
  //createRStream()
  //createWStream()
  async start(){
    if(this.uri === undefined || this.fpath === undefined){
      console.log("uri and fpath cannot be empty")
    }
    else{
      await this.createRStream()
      await this.createWStream()
      this.readStream.pipe(this.writeStream)
      this.readStream.on("data", this.handleData)
      this.readStream.on("end", this.handleEnd)
      this.readStream.on("error", this.handleEnd)
    }
  }
}

module.exports = {
  Base,
}
