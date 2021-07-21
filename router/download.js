const express = require("express")
const clients = require("../utils/clients/index")
const {Store, Entry} = require("../utils/store")
//const clients = require("../utils/clients/core")
const downloadRouter = express.Router()
let store;
try{
  store = new Store()
}
catch(e){
  console.log("something is wrong here")
}




if(Array.prototype.last === undefined){
  Array.prototype.last = function(){
    return this[this.length - 1]
  }
}


function hashify(hash){
  return {success: true, hash: hash, message: "added to queue"}
}


function errorify(err){
  return {success: false, error: err}
}

function payloadify(payload){
  return {success: true, result: payload}
}


downloadRouter.get("/uni/list", async (req, res)=>{
  payload = store.meta
  //payload = payload.map((e)=>{
  //  let temp = e.toObject()
  //  temp["size"] = temp["length"]
  //  delete temp["length"]
  //  delete temp["__v"]
  //  delete temp["_id"]
  //  return temp
  //})
  res.json({results: payload})
})

downloadRouter.post("/uni/add", async (req, res)=>{
  let uri = req.body.uri
  let fpath = req.body.fpath
  if(fpath === undefined)
    fpath = uri.split("/").last()
  let handle = new clients.SingleClient({uri, fpath})
  handle.init().catch(err => res.json(errorify(err)))
  setTimeout(()=>{
    res.json(hashify(handle.hash))
  }, 1000)
})

downloadRouter.post("/youtube/add", async (req, res)=>{
  let uri = req.body.uri
  if(uri.includes("youtube") || uri.includes("youtu.be")){
    let handle = new clients.YoutubeClient({uri})
    handle.init().catch(err=>res.json(errorify(err)))
    setTimeout(()=>{
      res.json(hashify(handle.hash))
    },1000)
  }
  else
    res.json(errorify("only youtube links in endpoint"))
})

downloadRouter.get("/uni/:hash", async (req, res)=>{
  let hash = req.params.hash
  let result = await uniModels.findOne({hash: hash}).catch((err)=>res.json(errorify(err)))
  debugger;
  if(result !== [])
    res.json(payloadify(result))
  else
    res.json(errorify("hash not found"))
})

downloadRouter.get("/info/list", async (req, res)=>{
  let payload = await uniModels.find({}).catch((err)=>res.json(errorify(err)))
  debugger;
  payload = payload.map((e)=>{
    let temp = e.toObject()
    temp["size"] = temp["length"]
    delete temp["length"]
    delete temp["__v"]
    delete temp["_id"]
    return temp
  })
  res.render("list", {results: payload})
})
downloadRouter.get("/info/:hash", async (req, res)=>{
  let results = await uniModels.findOne({hash: req.params.hash}).catch((err)=>res.json(errorify(err)))
  if(results !== null){
    results = results.toObject()
    results["size"] = (results["length"] / (1024 * 1024)).toFixed(2)
    results["speed"] = (results["speed"] / 1024).toFixed(2)
    results["offset"] = (results["offset"] / (1024 * 1024)).toFixed(2)
    delete results["length"]
    delete results["__v"]
    delete results["_id"]
    res.render("info", {results})
  }
  else
    res.json(errorify("hash not found"))
})

module.exports = {
  downloadRouter
}
