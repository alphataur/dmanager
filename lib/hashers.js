const { createHash } = require("crypto")
const fs = require("fs")
const utils = require("../utils")

const hashString = (str) => {
  let hasher = createHash("md5")
  hasher.update(str)
  return hasher.digest("hex")
}

const hashFile = (fpath) => new Promise(async (resolve, reject) => {
  let hasher = createHash("md5")
  if(await utils.fileExists()){
    let stream = fs.createReadStream(fpath)
    stream.on("end", () => {
      return resolve(hasher.digest("hex"))
    })
    stream.on("error", (err) => {
      return reject(err)
    })
  }
  else{
    return reject("file doesnt exist")
  }
})

module.exports = {
  hashFile,
  hashString
}
