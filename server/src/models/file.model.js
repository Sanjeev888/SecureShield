const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const fileSchema = mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SAFE', 'SUSPICIOUS', 'REJECTED'],
      default: 'PENDING',
    },
    scanReason: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
fileSchema.plugin(toJSON);
fileSchema.plugin(paginate);

/**
 * @typedef FileRecord
 */
const FileRecord = mongoose.model('FileRecord', fileSchema);

module.exports = FileRecord;
