// // models/privateMessageModel.js

// const mongoose = require('mongoose');

// const privateMessageSchema = mongoose.Schema({
//   room: { type: String, required: true }, // e.g., "userA-userB"
//   sender: { type: String, required: true },
//   receiver: { type: String, required: true },
//   message: { type: String, required: true },
//   unread: { type: Boolean, default: true },  // Add unread field
//   timestamp: { type: Date, default: Date.now },
// });





// module.exports = mongoose.model('PrivateMessage', privateMessageSchema);

















const mongoose = require('mongoose');

const privateMessageSchema = mongoose.Schema({
  room: { type: String, required: true }, // e.g., "userA-userB"
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String},
  file: { type: String },  // Add file field
  unread: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PrivateMessage', privateMessageSchema);






