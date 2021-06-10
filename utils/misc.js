function timeout(interval){
  //awaits for interval; async version of thread.sleep
  return new Promise(resolve => setTimeout(resolve, interval * 1000))
}

module.exports = {
  timeout: timeout
}
