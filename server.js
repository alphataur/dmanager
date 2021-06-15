require("dotenv").config()

const express = require("express")
const app = express()
const collections = require("./utils/collections")
const clients = require("./utils/clients/core")
const misc = require("./utils/misc")


const downloads = {}



let uniEntryCollection = new collections.uniEntryCollection({})
let collection = uniEntryCollection.getDownloadEntryModel()

app.get("/", async (req, res)=>{
  let results = await collection.find({})
  misc.jsonContent(req, res, JSON.stringify({"results": results}))
})

app.get("/ping", (req, res)=>{
  res.end("pong")
})


app.get("/add", (req, res)=>{
  let query = misc.sanitize(req.query)
  if(query.hash !== undefined)
    misc.jsonContent(req, res, JSON.stringify(downloads[query.hash]))
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
    misc.jsonContent(req, res, JSON.stringify({hash: handle.hash, message: "added to queue"}))
  }
  else{
    misc.jsonContent(req, res, JSON.stringify({error: "invalid use of API"}))
  }
})

app.get("/ytadd", (req, res)=>{
  let query = misc.sanitize(req.query)
  if(query.hash !== undefined)
    misc.jsonContent(req, res, JSON.stringify(downloads[query.hash]))
  else if(query.uri !== undefined){
    let handle = new clients.youtube({uri: query.uri})
    handle.init()
    downloads[handle.hash] = handle.metaCompact()
    handle.on("progress", (data)=>{
      downloads[handle.hash] = handle.metaCompact()
    })
    handle.on("end", ()=>{
      delete downloads[handle.hash]
    })
    misc.jsonContent(req, res, JSON.stringify({hash: handle.hash, message: "added to queue"}))
  }
  else
    misc.jsonContent(req, res, JSON.stringify({error: "invalid API usage"}))
})

app.listen(3000, ()=>{
  console.log("server running at 3000")
})
