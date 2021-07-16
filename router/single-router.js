require("dotenv").config()
const express = require("express")
const SingleRouter = express.Router()
const {SingleClient} = require("../utils/clients/single-client")
const {Store} = require("../utils/store")
const commons = require("../utils/commons")

if(Array.prototype.last ===  undefined){
  Array.prootype.last = function(){
    return this[this.length - 1]
  }
}



let states = new Store()

SingleRouter.post("/add", async (req, res) => {
  let uri = req.body.uri
  if(uri === undefined)
    return commons.sendError(req, res, Errors.URI_UNDEF)
  let fpath = req.body.fpath || uri.split("/").last() || commons.getRandomString(10)
  let handle = new SingleClient({uri, fpath})
  await states.loadAll()
  let meta = states.entries
  console.log(meta[handle.hash], handle.hash)
  if(meta[handle.hash] === undefined){
    handle.init().then(console.log).catch(console.log)
    return commons.sendSuccess(req, res, handle.hash, "added to queue")
  }
  else if(!meta[handle.hash].completed){
    handle.init().then(console.log).catch(console.log)
    return commons.sendSuccess(req, res, handle.hash, "resuming")
  }
  else{
    return commons.sendSuccess(req, res, handle.hash, "already downloaded")
  }
})

SingleRouter.get("/list", async (req, res) => {
  await states.loadAll()
  let ids = states.entries.filter(e => {return e.mode === "single"}).keys()
  return commons.sendPayload(req, res, ids)
})

SingleRouter.post("/details", async(req, res) => {
  await states.loadAll()
  let hash = req.body.hash
  let meta = states.entries[hash] || {}
  return commons.sendPayload(req, res, meta)
})

module.exports = {
  SingleRouter
}
