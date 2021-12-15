require("dotenv").config()

const path = require("path")
const express = require("express")
const { APIRouter, StaticRouter } = require("./router")

const app = express()

app.set("view engine", "pug")
app.set("views", path.join(__dirname, "templates"))

app.use("/api", APIRouter)
app.use("/", StaticRouter)

app.listen(process.env.PORT, () => {
  console.log(`server running at ${process.env.PORT}`)
})



