const mongoose = require('mongoose');

const aiResultSchema = new mongoose.Schema({
  screeningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Screening',
    required: true
  },
  modelName: {
    type: String,
    default: 'EfficientNet-B4-DR'
  },
  modelVersion: {
    type: String,
    default: '1.0.0'
  },
  predictedGrade: {
    type: Number,
    required: true,
    min: 0,
    max: 4
  },
  classificationLabel: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  probabilities: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  referableDR: {
    type: Boolean,
    default: false
  },
  rawOutput: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

const AiResult = mongoose.model('AiResult', aiResultSchema);

module.exports = AiResult;
