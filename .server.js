const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")
const clients = require("./utils/clients/core")
const ws = require("ws")
const app = express()
const wsapp = new ws.Server({port: 3001})
const collections = require("./utils/collections")

const uniCollections = new collections.uniEntryCollection({})
const uniModels = uniCollections.getDownloadEntryModel()

app.set("view engine", "pug")
app.set("views", path.join(__dirname, "templates"))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use("/static", express.static("static"))

class Errors{
  static INVALID_USAGE = "invalid API usage"
}


function setFeeder(connection, handle){
  debugger;
  console.log(handle)
}

function checkYoutube(uri){
  return true
}

var downloads = {}

app.get("/", (req, res)=>{
  res.render("index")
})

app.post("/add/uni", (req, res)=>{
  let handle = new clients.base({uri: req.body.uri, fpath: req.body.fpath})
  if(!(handle.hash in downloads)){
    downloads[handle.hash] = handle
    handle.init()
    res.json({success: true, hash: handle.hash, message: "message added to queue"})
  }
  else
    res.json({success: false, message: Errors.INVALID_USAGE})
})

app.post("/add/youtube",async (req, res)=>{
  if(checkYoutube(req.body.uri)){
    let handle = new clients.youtube({uri: req.body.uri})
    let results = await uniModels.find({uri: req.body.uri})
    console.log(results)
    if(downloads[handle.hash] === undefined){
      console.log("initing")
      handle.init()
      handle.on("error", console.log)
      downloads[handle.hash] = handle
      res.json({success: true, hash: handle.hash, message: "entry already added"})
    }
    else
      res.json({success: true, hash: handle.hash, message: "added to queue"})
  }
  else
    res.json({success: false, message: Errors.INVALID_USAGE})
})

app.post("/add/torrent", (req, res)=>{
  let handle = new clients.torrent({maxConnections: 4, torrent: req.body.torrent, fpath: process.env.BASE})
  handle.init()
  handle.on("hash", (hash)=>{
    res.json({success: true, hash: hash, message: "added to queue"})
  })
})

app.get("/ping", (req, res)=>{
  res.json({success: true, message: "pong"})
})

app.listen(3000, ()=>{
  console.log("server spinning at 3000")
})

app.get("/list", async (req, res)=>{
  let temp = await uniModels.find({})
  res.json({results: temp})
})

app.get("/:hash", async (req, res)=>{
  let result = await uniModels.findOne({hash: req.params.hash})
  res.json(result)
})

wsapp.on("connection", (connection)=>{
  connection.on("message", (message)=>{
    if(message in downloads)
      connection.send(downloads[message].metaCompact())
    else
      connection.send("sorry couldnt understand")
  })
  //setFeeder(connection, handle)
})
