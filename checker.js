const http = require("https")
const util = require("util")

function requests(uri){
  return new Promise((resolve, reject)=>{
    http.get(uri, res => {
      return resolve(res)
    })
  })
}

async function main(){
  let response = await requests("https://in-the-raw.org")
  console.log(response.headers)
}

main()

