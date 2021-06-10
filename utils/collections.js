const mongoose = require("mongoose")

class dmanagerCollections{
  constructor(options){
    this.uri = 'mongodb://localhost:27017/'
    this.db = 'dmanager'
    this.collection = "downloads"
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set("useUnifiedTopology", true)
    mongoose.connect(this.uri+this.db)
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

module.exports = {
  dmanagerCollections: dmanagerCollections
}
