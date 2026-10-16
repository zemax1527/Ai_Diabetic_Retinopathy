const mongoose = require('mongoose');

const xAiResultSchema = new mongoose.Schema({
  screeningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Screening',
    required: true
  },
  aiResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AiResult'
  },
  method: {
    type: String,
    enum: ['Grad-CAM', 'Grad-CAM++', 'Integrated-Gradients', 'SHAP'],
    default: 'Grad-CAM++'
  },
  targetClass: {
    type: Number,
    min: 0,
    max: 4
  },
  heatmapUrl: {
    type: String,
    trim: true
  },
  overlayUrl: {
    type: String,
    trim: true
  },
  lesionOverlayUrl: {
    type: String,
    trim: true
  },
  lesionCount: {
    type: Number,
    default: 0
  },
  detectedLesionTypes: [{
    type: String
  }],
  clinicalExplanation: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const XAiResult = mongoose.model('XAiResult', xAiResultSchema);

module.exports = XAiResult;
