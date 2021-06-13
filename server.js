const express = require("express")
const app = express()
const collections = require("./utils/collections")
const clients = require("./utils/clients/core")

let temp = new collections.uniEntryCollection({})
let collection = temp.getDownloadEntryModel()

function jsonContent(res){
  res.setHeader("content-type", "application/json")
}

app.get("/single", async (req, res)=>{
  let results = await collection.find({})
  jsonContent(res)
  res.end(JSON.stringify({results: results}))
})

app.get("/", (req, res)=>{
  res.end("go to /single")
})

app.post("/single", (req, res)=>{
  
})

app.listen(3000, ()=>{
  console.log("server running at 3000")
})
