const mongoose = require('mongoose');

// define the schema for our data model
const dataSchema = mongoose.Schema({
  name : String,
  email : String,
  number : Number
});

module.exports = mongoose.model('Data', dataSchema);
