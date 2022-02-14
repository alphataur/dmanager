const fs = require("fs")

async function fileExists(fpath){
  try{
    await fs.promises.lstat(fpath)
    return true
  }
  catch(e){
    return false
  }
}

module.exports = {
  fileExists
}
