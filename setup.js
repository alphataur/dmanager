const fs = require("fs")

let preReqs = ["state", "downloads"]


preReqs.forEach((elem) => {
  try{
    fs.mkdirSync(elem)
  }
  catch(e){
    console.log("folder", elem, "already exists")
  }
})
