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
  }
  //createRStream()
  //createWStream()
  start(){
    if(this.uri === undefined || this.fpath === undefined){
      console.log("uri and fpath cannot be empty")
    }
    else{
      this.readStream.pipe(this.writeStream)
      this.readStream.on("data", this.handleData)
      this.readStream.on("end", this.handleEnd)
      this.readStream.on("error", this.handleEnd)
    }
  }
}
