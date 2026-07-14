import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import './FileUploader.css';

const FileUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { tokens } = useAuthStore();

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError('File rejected. Please ensure it meets the size and type requirements.');
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setSuccess(false);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/v1/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${tokens?.access?.token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      setSuccess(true);
      if (onUploadSuccess) {
        onUploadSuccess(response.data.file);
      }
      setTimeout(() => {
        setFile(null);
        setSuccess(false);
        setProgress(0);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="uploader-container">
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="dropzone-icon" />
          <h3>{isDragActive ? 'Drop file here' : 'Drag & Drop file here'}</h3>
          <p>or click to browse</p>
          <div className="dropzone-limits">
            Max size: 5MB | Allowed: Images, PDF, Text, Zip
          </div>
          
          {error && (
            <div className="upload-error mt-4" style={{ marginTop: '1rem' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="file-preview-card">
          <div className="file-info-section">
            <div className="file-icon-wrapper">
              <FileIcon className="file-icon" />
            </div>
            <div className="file-details">
              <h4 className="file-name">{file.name}</h4>
              <p className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            {!uploading && !success && (
              <button onClick={removeFile} className="remove-btn">
                <X size={20} />
              </button>
            )}
          </div>

          {uploading && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          {error && (
            <div className="upload-error">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="upload-success">
              <CheckCircle size={16} />
              <span>File uploaded successfully!</span>
            </div>
          )}

          {!uploading && !success && !error && (
            <button className="btn btn-primary btn-full mt-4" onClick={handleUpload}>
              Upload File
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
