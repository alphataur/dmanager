const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")
const ws = require("ws")
const app = express()
const wsapp = new ws.Server({port: 3001})
const downloadRouter = require("./router/download").downloadRouter

app.set("view engine", "pug")
app.set("views", path.join(__dirname, "templates"))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use("/static", express.static("static"))
app.use("/download", downloadRouter)

app.get("/ping", (req, res)=>{
  res.json({success: true, message: "pong"})
})

app.listen(3000, ()=>{
  console.log("server spinning at 3000")
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
