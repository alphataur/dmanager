require("dotenv").config()

const express = require("express")
const app = express()
const collections = require("./utils/collections")
const clients = require("./utils/clients/core")

const downloads = {}

function jsonContent(req, res, payload){
  res.setHeader("content-type", "application/json")
  res.end(payload)
}

let uniEntryCollection = new collections.uniEntryCollection({})
let collection = uniEntryCollection.getDownloadEntryModel()

app.get("/", async (req, res)=>{
  let results = await collection.find({})
  jsonContent(req, res, JSON.stringify({"results": results}))
})

app.get("/ping", (req, res)=>{
  res.end("pong")
})

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
app.get("/add", (req, res)=>{
  let query = sanitize(req.query)
  if(query.hash !== undefined)
    jsonContent(req, res, JSON.stringify(downloads[query.hash]))
  else if(query.uri !== undefined || query.fpath !== undefined){
    let handle = new clients.base({uri: query.uri, fpath: query.fpath})
    downloads[handle.hash] = handle.metaCompact()
    handle.init()
    handle.on("progress", (data)=>{
      downloads[handle.hash] = data
    })
    handle.on("end", ()=>{
      delete downloads[handle.hash]
    })
    handle.on("error", console.log)
    jsonContent(req, res, JSON.stringify({hash: handle.hash, message: "added to queue"}))
  }
  else{
    jsonContent(req, res, JSON.stringify({error: "invalid use of API"}))
  }
})

app.listen(3000, ()=>{
  console.log("server running at 3000")
})
