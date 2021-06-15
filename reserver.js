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
  console.log(uri)
  return uri.includes("youtube.com")
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

app.post("/add/youtube", (req, res)=>{
  debugger;
  if(checkYoutube(req.body.uri)){
    let handle = new clients.youtube({uri: req.body.uri})
    if(!(handle.hash in downloads)){
      handle.init()
      downloads[handle.hash] = handle
      res.json({success: true, hash: handle.hash, message: "entry already added"})
    }
    else
      res.json({success: true, hash: handle.hash, message: "added to queue"})
  }
  else
    res.json({success: false, message: Errors.INVALID_USAGE})
})

app.get("/ping", (req, res)=>{
  res.json({success: true, message: "pong"})
})

app.listen(3000, ()=>{
  console.log("server spinning at 3000")
})

wsapp.on("connection", (connection)=>{
  debugger;
  connection.send("dont!")
  //setFeeder(connection, handle)
})
