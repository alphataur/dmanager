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

function pipeFile(source, target){
  return new Promise((resolve, reject) => {
    source.on("end", () => {
      return resolve(true)
    })
    source.on("error", (err) => {
      return reject(err)
    })
    source.pipe(target)
  })
}

async function truncateParts(sources, target){
  let wstream = fs.createWriteStream(target)
  for(let i = 0; i < sources.length; i++){
    let source = fs.createReadStream(sources[i])
    await pipeFile(source, wstream).catch(console.log)
  }
}

module.exports = {
  fileExists,
  truncateParts,
  pipeFile
}
