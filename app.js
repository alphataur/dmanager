const fastify = require("fastify")
const app = fastify({ logger: true })
const routes = require("./routes")

routes.forEach(route => app.route(route))


app.listen(3000, () => console.log("server running at 3000"))
