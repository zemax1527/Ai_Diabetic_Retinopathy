const mongoose = require('mongoose');

const sequenceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true
    },
    seq: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Sequence = mongoose.models.Sequence || mongoose.model('Sequence', sequenceSchema);

module.exports = Sequence;
