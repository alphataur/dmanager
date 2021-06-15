const mongoose = require("mongoose")
var uni;
class multiEntryCollection{
  constructor(options){
    this.uri = options.uri || 'mongodb://localhost:27017/'
    this.db = options.db || 'dmanager'
    this.collection = options.collection || "multidownloads"
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set("useUnifiedTopology", true)
    this.mongoose = mongoose
    mongoose.connect(this.uri+this.db)
  }
  close(){
    mongoose.connection.close()
  }
  getDownloadEntryModel(){
    let downloadEntrySchema = new mongoose.Schema({
      hash: {
        index: true,
        unique: true,
        type: String
      },
      uris: [String],
      fpaths: [String],
      offsets: [Number],
      lengths: [Number],
      speeds: [Number],
      completed: [Boolean]
    })
    return (new mongoose.model(this.collection, downloadEntrySchema))
  }
}


class uniEntryCollection{
  constructor(options){
    this.uri = options.uri || 'mongodb://localhost:27017/'
    this.db = options.db || 'dmanager'
    this.collection = options.collection || "downloads"

    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set("useUnifiedTopology", true)
    mongoose.connect(this.uri+this.db)
  }
  close(){
    mongoose.connection.close()
  }
  getDownloadEntryModel(){
    let downloadEntrySchema = new mongoose.Schema({
      hash: {
        index: true,
        unique: true,
        type: String
      },
      uri: String,
      fpath: String,
      offset: Number,
      length: Number,
      speed: Number,
      completed: Boolean
    })
    if(uni === undefined)
      uni = new mongoose.model(this.collection, downloadEntrySchema)
    return uni
  }
}

class torrentEntryCollection{
  constructor(options){
    this.uri = options.uri || "mongodb://localhost:27017"
    this.db = options.db || "damanger"
    this.collection = options.collection || "downloads"
    mongoose.set("useNewUrlParser", true)
    mongoose.set("useFindAndModify", false)
    mongoose.set("useCreateIndex", true)
    mongoose.set("useUnifiedTopology", true)
    mongoose.connect(this.uri+this.db)
  }
  close(){
    mongoose.connection.close()
  }
  getDownloadEntryModel(){
    let downloadEntrySchema = new mongoose.Schema({
      hash: {
        index: true,
        unique: true,
        type: String,
      }
      uri, this.uri,
      offset: Number,
      files: [Object],
      speed: Number,
      peer: Number,
      pieces: Number,
      upSpeed: Number,
      completed: Boolean,
    })
    if(torrent === undefined)
      torrent = new mongoose.model(this.collection, downloadEntrySchema)
    return torrent
  }
}

module.exports = {
  multiEntryCollection,
  uniEntryCollection,
  torrentEntryCollection
}
