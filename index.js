const fastify = require("fastify")

let makeSuccess = (payload) => ({ error: false, success: true, ...payload })
let makeError = (payload) => ({ error: true, success: false, ...payload })

const app = fastify({ useLogger: true })

app.register("/httx", require("./routes/httx"))
app.register("/torrent", require("./routes/torrent"))

app.get("/ping", (req, res) => {
  return makeSuccess({ message: "pong" })
})

app.listen(3000, (err, address) => {
  if(err) console.log("failed to start server")
  else console.log("server running at 3000")
})
