class Speedomter{
  constructor(){
    this.tick = 0
    this.tock = 0
  }
  start(){
    this.timer = setInterval(()=>{
      this.tick++
    }, 1000)
  }
  update(){
    this.tock += chunk.byteLength
  }
  pause(){
    clearInterval(this.timer)
  }
}

module.exports = {
  Speedomter
}
