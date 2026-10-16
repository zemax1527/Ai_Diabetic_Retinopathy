const mongoose = require('mongoose');

const fundusImageSchema = new mongoose.Schema({
  screeningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Screening',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalUrl: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String,
    default: 'image/jpeg'
  },
  dimensions: {
    width: Number,
    height: Number
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 1
  },
  storageProvider: {
    type: String,
    enum: ['local', 'cloudinary', 'azure_blob'],
    default: 'cloudinary'
  }
}, {
  timestamps: true
});

const FundusImage = mongoose.model('FundusImage', fundusImageSchema);

module.exports = FundusImage;
