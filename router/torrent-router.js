require("dotenv").config()
const express = require("express")
const TorrentRouter = express.Router()
const {TorrentClient} = require("../utils/clients/torrent-client")
const {Store} = require("../utils/store")
const commons = require("../utils/commons")

if(Array.prototype.last ===  undefined){
    Array.prootype.last = function(){
          return this[this.length - 1]
        }
}

