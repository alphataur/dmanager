if(Array.prototype.last === undefined){
  Array.prototype.last = function(){
    return this[this.length - 1]
  }
}
function timeout(interval){
  //awaits for interval; async version of thread.sleep
  return new Promise(resolve => setTimeout(resolve, interval * 1000))
}


function jsonContent(req, res, payload){
  res.setHeader("content-type", "application/json")
  res.end(payload)
}


function sanitize(object){
  let keys = Object.keys(object)
  let res = {}
  keys.forEach((e)=>{
    let n = e.length
    if(object[e][0] === "'" && object[e][n-1] === "'")
      res[e] = e.slice(n)
    else
      res[e] = object[e]
  })
  return res
}
module.exports = {
  timeout: timeout,
  sanitize: sanitize,
  jsonContent: jsonContent
}
