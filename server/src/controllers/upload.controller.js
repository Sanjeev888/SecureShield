const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const FileRecord = require('../models/file.model');
const scannerService = require('../services/scanner.service');

const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Please upload a file' });
  }

  const fileRecord = await FileRecord.create({
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype,
    status: 'PENDING',
    user: req.user.id
  });

  // Run the security scan asynchronously so we don't block the upload response
  scannerService.scanFile(fileRecord.id).catch((err) => {
    // Error is already logged in the service
  });

  res.status(httpStatus.CREATED).send({
    message: 'File uploaded successfully and queued for scanning',
    file: fileRecord
  });
});

const getFiles = catchAsync(async (req, res) => {
  const files = await FileRecord.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.send({ files });
});

const getStats = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(httpStatus.FORBIDDEN).send({ message: 'Forbidden' });
  }

  const totalFiles = await FileRecord.countDocuments();
  const safeFiles = await FileRecord.countDocuments({ status: 'SAFE' });
  const rejectedFiles = await FileRecord.countDocuments({ status: 'REJECTED' });
  const suspiciousFiles = await FileRecord.countDocuments({ status: 'SUSPICIOUS' });
  const pendingFiles = await FileRecord.countDocuments({ status: 'PENDING' });

  const rejectionRate = totalFiles > 0 ? ((rejectedFiles / totalFiles) * 100).toFixed(2) : 0;

  // Aggregate top threats (scan reasons)
  const topThreats = await FileRecord.aggregate([
    { $match: { status: 'REJECTED' } },
    { $group: { _id: '$scanReason', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  res.send({
    totalFiles,
    safeFiles,
    rejectedFiles,
    suspiciousFiles,
    pendingFiles,
    rejectionRate,
    topThreats
  });
});

module.exports = {
  uploadFile,
  getFiles,
  getStats
};
