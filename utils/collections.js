const mongoose = require("mongoose")

class dmanagerCollections{
  const singleTargetDownloadSchema = new mongoose.Schema({
    hash: String,
    uri: String,
    fpath: String,
    offset: Number,
    length: Number,
    speed: Number,
  })
  const multiTargetDownloadSchema = new mongoose.Schema({
    hash: String
    downloads: [this.singleTargetDownload]
  })
  constructor(){
    this.uri = options.uri || 'mongodb://localhost:27017/'
    this.db = options.db || 'dmanager'
    this.collection = options.collection || "downstats"
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set("useUnifiedTopology", true)
    mongoose.connect(this.uri+this.db)
  }
  singleTargetDownloadModel(){
    return new mongoose.model(this.collection, this.singleTargetDownloadSchema)
  }
  multiTargetDownloadSchema(){
    return new mongoose.model(this.collection, this.multiTargetDownloadSchema)
  }
}

module.exports = {
  dmanagerCollections: dmanagerCollections
}
