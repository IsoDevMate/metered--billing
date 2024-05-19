const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  stripeCustomerId: { type: String },
  subscriptionId: { type: String },
  totalUsage: { type: Number, default: 0 },
  uploadedFiles: [{ type: String }],
});
const User = mongoose.model('User', userSchema);

module.exports = User;