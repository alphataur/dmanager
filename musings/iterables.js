const fs = require("fs")
const crypto = require("crypto")


async function linear(){
  //consume stream in linear loop
  const rStream = fs.createReadStream("/home/iamfiasco/Downloads/mama/TE3N.2016.720p.BRRip.x264.Hindi.AAC-ETRG/TE3N.2016.720p.BRRip.x264.Hindi.AAC-ETRG.mp4")
  const hasher = crypto.createHash("md5")

  for await (const chunk of rStream){
    hasher.update(chunk)
  }
  console.log(hasher.digest("hex"))
}


function nlinear(){
  return new Promise((resolve, reject) => {
    const rStream = fs.createReadStream("/home/iamfiasco/Downloads/mama/TE3N.2016.720p.BRRip.x264.Hindi.AAC-ETRG/TE3N.2016.720p.BRRip.x264.Hindi.AAC-ETRG.mp4")
    const hasher = crypto.createHash("md5")
    rStream
      .on("data", (chunk) => console.log(`received ${chunk.byteLength} bytes`))
      .on("end", () => resolve({success: true, error: false, hash: hasher.digest("hex")}))
      .on("error", (err) => reject({success: false, error: err}))
      .pipe(hasher)
  })
}

nlinear().then(console.log).catch(console.error)
//linear()


