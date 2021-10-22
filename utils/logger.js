require("dotenv").config()
const bunyan = require("bunyan")

const logger = bunyan.createLogger({
  name: "dmanager",
  streams: [
            {
              level: "info",
              stream: process.stdout
            },
            {
              level: "warn",
              path: "logs"
            }
          ]
})

module.exports = {
  logger
}
