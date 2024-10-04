// // models/publicMessageModel.js
// const mongoose = require('mongoose');

// const publicMessageSchema = mongoose.Schema({
//   room: { type: String, required: true },
//   sender: { type: String, required: true },
//   message: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now },
// });




// module.exports = mongoose.model('PublicMessage', publicMessageSchema);










const mongoose = require('mongoose');

const publicMessageSchema = mongoose.Schema({
  room: { type: String, required: true },
  sender: { type: String, required: true },
  message: { type: String},
  file: { type: String },  // Add file field
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PublicMessage', publicMessageSchema);















