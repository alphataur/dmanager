const { Store } = require("./utils/state/store")

async function main(){
  let store = new Store()
  await store.insert("name", { name: "nikhil", mode: "freedom" })
  console.log(await store.find("name"))
}

main()
