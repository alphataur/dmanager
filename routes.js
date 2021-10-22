const controller = require("./controllers/clients")

const routes = [
    {
        method: "GET",
        url: "/ping",
        handler: controller.ping
    },
    {
      method: "POST",
      url: "/add/torrent",
      handler: controller.addTorrent
    },
    {
      method: "POST",
      url: "/add/web",
      handler: controller.addWebDL
    },
    {
      method: "POST",
      url: "/stats/torrent",
      handler: controller.torrentState
    },
    {
      method: "GET",
      url: "/list/torrent",
      handler: controller.listTorrent
    }, 
    {
      method: "GET",
      url: "/list/web",
      handler: controller.listDownloads
    }
]
module.exports = routes
