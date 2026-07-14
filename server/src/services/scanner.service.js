const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const FileRecord = require('../models/file.model');
const logger = require('../config/logger');

/**
 * Scan a file for malicious intent (MIME spoofing, zip bombs, malicious archives)
 * @param {string} fileId - The ID of the FileRecord
 */
const scanFile = async (fileId) => {
  let fileRecord;
  try {
    fileRecord = await FileRecord.findById(fileId);
    if (!fileRecord) {
      logger.error(`Scanner: FileRecord ${fileId} not found`);
      return;
    }

    const filePath = path.resolve(fileRecord.path);
    
    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found on disk');
    }

    // 1. Signature Verification (MIME Spoofing)
    // using dynamic import for pure ESM module `file-type`
    const { fileTypeFromFile } = await import('file-type');
    const typeInfo = await fileTypeFromFile(filePath);
    
    const reportedExt = path.extname(fileRecord.originalName).toLowerCase().replace('.', '');

    if (!typeInfo) {
      // List of common extensions that MUST have a valid magic byte signature.
      // If typeInfo is undefined, it means file-type found no signature (e.g. plain text).
      const strictExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'zip', 'rar', 'exe', 'mp4', 'mp3'];
      if (strictExtensions.includes(reportedExt)) {
        logger.warn(`MIME spoofing detected for file ${fileId}. Reported: ${reportedExt}, Actual: none (plain text)`);
        fileRecord.status = 'REJECTED';
        fileRecord.scanReason = `MIME Spoofing: Reported extension was .${reportedExt} but file has no valid binary signature`;
        await fileRecord.save();
        return;
      }
    } else {
      // Some leniency for text files which might not be recognized by file-type
      // or for doc/docx which are zip-based
      if (typeInfo.ext !== reportedExt) {
        // Special cases: docx/xlsx are zip files under the hood
        const isOfficeDoc = (reportedExt === 'docx' || reportedExt === 'xlsx' || reportedExt === 'pptx') && typeInfo.ext === 'zip';
        // Special case: jpg/jpeg
        const isJpeg = (reportedExt === 'jpg' || reportedExt === 'jpeg') && (typeInfo.ext === 'jpg' || typeInfo.ext === 'jpeg');

        if (!isOfficeDoc && !isJpeg) {
          logger.warn(`MIME spoofing detected for file ${fileId}. Reported: ${reportedExt}, Actual: ${typeInfo.ext}`);
          fileRecord.status = 'REJECTED';
          fileRecord.scanReason = `MIME Spoofing: Reported extension was .${reportedExt} but signature matched .${typeInfo.ext}`;
          await fileRecord.save();
          return;
        }
      }
    }

    // 2. Archive Inspection
    const ext = path.extname(fileRecord.originalName).toLowerCase();
    if (ext === '.zip' || (typeInfo && typeInfo.ext === 'zip')) {
      try {
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();
        
        let totalSize = 0;
        let fileCount = 0;

        for (const entry of zipEntries) {
          fileCount++;
          if (!entry.isDirectory) {
            totalSize += entry.header.size; // uncompressed size
            
            // Check for malicious files inside zip
            const entryExt = path.extname(entry.entryName).toLowerCase();
            const dangerousExts = ['.exe', '.sh', '.bat', '.cmd', '.vbs', '.js'];
            if (dangerousExts.includes(entryExt)) {
              fileRecord.status = 'REJECTED';
              fileRecord.scanReason = `Suspicious Archive: Contains dangerous file type (${entryExt})`;
              await fileRecord.save();
              return;
            }
          }
        }

        // Check for zip bombs (e.g. extremely high compression ratio or too many files)
        const compressionRatio = totalSize / fileRecord.size;
        if (compressionRatio > 100 || fileCount > 10000) {
          fileRecord.status = 'REJECTED';
          fileRecord.scanReason = `Zip Bomb Detected: High compression ratio (${compressionRatio.toFixed(1)}) or too many files (${fileCount})`;
          await fileRecord.save();
          return;
        }

      } catch (zipError) {
        logger.error(`Error reading zip file ${fileId}: ${zipError.message}`);
        fileRecord.status = 'REJECTED';
        fileRecord.scanReason = `Invalid Archive: Unable to read zip structure`;
        await fileRecord.save();
        return;
      }
    }

    // If we passed all checks, mark as SAFE
    fileRecord.status = 'SAFE';
    fileRecord.scanReason = 'Passed all security checks';
    await fileRecord.save();
    
    logger.info(`File ${fileId} scanned successfully and marked as SAFE`);
  } catch (error) {
    logger.error(`Error scanning file ${fileId}: ${error.message}`);
    if (fileRecord) {
      fileRecord.status = 'SUSPICIOUS';
      fileRecord.scanReason = `Scanner Error: ${error.message}`;
      await fileRecord.save();
    }
  }
};

module.exports = {
  scanFile,
};
