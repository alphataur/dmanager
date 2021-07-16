const express = require("express")
const router = express.Router()

const clients = require("../utils/clients/")
const {Store, Entry} = require("../utils/store")


if(Array.prototype.last === undefined){
  Array.prototype.last = function(){
    return this[this.length - 1]
  }
}

router.get("/add/single", async (req, res) => {
  let uri = req.body.uri
  let fpath = req.body.fpath
  if(fpath === undefined)
    fpath = uri.split("/").last()
  let handle = new clients.SingleClient({uri, fpath})
  handle.init()
})
