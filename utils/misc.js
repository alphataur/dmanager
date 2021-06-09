function timeout(interval){
  //awaits for interval; async version of thread.sleep
  return new Promise(resolve => setTimeout(interval * 1000, resolve)
}

module.exports = {
  timeout: timeout
}
