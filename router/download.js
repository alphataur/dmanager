const express = require("express")
const collections = require("../utils/collections")
const clients = require("../utils/clients/core")
const downloadRouter = express.Router()

const uniCollections = new collections.uniEntryCollection({})
const uniModels = uniCollections.getDownloadEntryModel()




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
  let payload = await uniModels.find({}).catch((err)=>{
    res.json(errorify(err))
  })
  res.json(payload)
})

downloadRouter.post("/uni/add", async (req, res)=>{
  let uri = req.body.uri
  let fpath = req.body.fpath
  if(fpath === undefined)
    fpath = uri.split("/").last()
  let handle = new clients.base({uri, fpath})
  handle.init().catch(err => res.json(errorify(err)))
  setTimeout(()=>{
    res.json(hashify(handle.hash))
  }, 1000)
})

downloadRouter.post("/youtube/add", async (req, res)=>{
  let uri = req.body.uri
  if(uri.includes("youtube") || uri.includes("youtu.be")){
    let handle = new clients.youtube({uri})
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
  let result = await uniModels.find({hash: hash}).catch((err)=>res.json(errorify(err)))
  res.json(payloadify(result))
})


module.exports = {
  downloadRouter
}
