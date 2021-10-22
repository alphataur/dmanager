require("dotenv").config()
const fs = require("fs")
const path = require("path")
const torrent = require("../clients/torrent")
const web = require("../clients/web")
const { Store } = require("../utils/state/store")


exports.addTorrent = (req, res) => {
  let iHash = req.body.hash
  let handle = new torrent.Client({ iHash })
  handle.init()
  return { success: true, error: false, message: "added to queue" }
}

exports.addWebDL = (req, res) => {
  let url = req.body.url
  let fpath = req.body.fpath
  let handle = new web.Client({ uri, fpath })
  handle.download() // dont await
  return { success: true, error: false, message: "added to queue" }
}

exports.torrentState = async (req, res) => {
  let iHash = req.body.hash
  let handle = new Store()
  let result = await handle.find(iHash)
  return result || { success: false, error: "failed to retrieve entry"}
}

exports.ping = (req, res) => {
  return { success: true, error: false, message: "ping"}
}

exports.listTorrent = async (req, res) => {
  let results = await fs.promises.readdir(path.join(process.env.CPATH, "torrent"))
  return { success: true, error: false, results: results}
}

exports.listDownloads = async (req, res) => {
  let results = await fs.promises.readdir(path.join(process.env.CPATH, "web"))
  return { success: true, error: false, results: results}
}
