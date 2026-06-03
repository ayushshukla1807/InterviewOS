const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // optional if candidate is guest
  },
  jobId: {
    type: String,
    default: 'GENERAL',
  },
  candidateName: {
    type: String,
    required: true,
  },
  candidateEmail: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  track: {
    type: String,
    required: true,
  },
  violations: {
    type: Array,
    default: [],
  },
  koyoSignals: {
    type: Array,
    default: [],
  },
  proctoringLogs: {
    type: Array,
    default: [],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  simulation: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  report: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
});

module.exports = mongoose.model('Report', ReportSchema);
