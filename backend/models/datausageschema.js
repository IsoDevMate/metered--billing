const mongoose = require('mongoose');
const User = require('./schema'); 

const dataUsageSchema = new mongoose.Schema({
  userId: {
    type: String, 
    required: true,
  },
  totalUsage: {
    type: Number,
    default: 0,
  },
  usageRecords: [
    {
      fileSize: {
        type: Number,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const DataUsage = mongoose.model('DataUsage', dataUsageSchema);
module.exports = DataUsage;