if(Array.prototype.last === undefined){
  Array.prototype.last = function(){
    return this[this.length - 1]
  }
}
function timeout(interval){
  //awaits for interval; async version of thread.sleep
  return new Promise(resolve => setTimeout(resolve, interval * 1000))
}

module.exports = {
  timeout: timeout
}
