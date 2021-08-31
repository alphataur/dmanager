const {Base} = require("./base")
const fs = require("fs")

class HTTP extends Base{
  constructor(uri, fpath){
    super({uri, fpath})
  }
  async createRStream(){
    this.readStream = await this.fetch()
  }
  async createWStream(){
    this.wStream = fs.createWriteStream(this.fpath)
  }
  handleEnd(){
    this.timer.pause()
    console.log("downloaded finished downloading")
  }
  handleData(chunk){
    this.timer.update(chunk)
    console.log(this.timer.speed())
  }
  handleError(err){
    console.log("error while downloading", err)
  }
}

async function main(){
  let handle = new HTTP({uri: "http://kelseymcnair.com/Kel's%20Music/iTunes/iTunes%20Music/Podcasts/Naruto%20Soundtrack/05%20Hokage's%20Monument.mp3", fpath: "hokage.mp3"})
  await handle.start()
}

main()
