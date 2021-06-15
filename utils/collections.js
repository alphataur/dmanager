const mongoose = require("mongoose")

var set = false
var uni = false
var multi = false
var torrent = false

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
    if(!set){
      mongoose.connect(this.uri+this.db)
      set = true
    }
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
    if(!multi)
      multi =  (new mongoose.model(this.collection, downloadEntrySchema))
    return multi
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
    if(!set){
      mongoose.connect(this.uri+this.db)
      set = true  
    }
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
    if(!uni)
      uni = new mongoose.model(this.collection, downloadEntrySchema)
    return uni
  }
}

class torrentEntryCollection{
  constructor(options){
    debugger;
    this.uri = options.uri || "mongodb://localhost:27017/"
    this.db = options.db || "dmanager"
    this.collection = options.collection || "torrents"
    mongoose.set("useNewUrlParser", true)
    mongoose.set("useFindAndModify", false)
    mongoose.set("useCreateIndex", true)
    mongoose.set("useUnifiedTopology", true)
    if(!set){
      mongoose.connect(this.uri+this.db)
      set = true
    }
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
        },
      offset: Number,
      files: [Object],
      speed: Number,
      peer: Number,
      pieces: Number,
      upSpeed: Number,
      completed: Boolean,
    })
    if(!torrent)
      torrent = new mongoose.model(this.collection, downloadEntrySchema)
    return torrent
  }
}

module.exports = {
  multiEntryCollection,
  uniEntryCollection,
  torrentEntryCollection
}
