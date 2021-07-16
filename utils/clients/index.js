const {YoutubeClient} = require("./youtube-client")
const {TorrentClient} = require("./torrent-client")
const {SingleClient} = require("./single-client")
const {ParallelClient = require("./parallel-client")}


module.exports = {
  YoutubeClient,
  TorrentClient,
  SingleClient,
  ParallelClient
}
