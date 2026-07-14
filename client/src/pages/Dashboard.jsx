import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  AlertTriangle,
  FileText,
  Activity,
  PieChart,
  ShieldX
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import FileUploader from '../components/FileUploader';
import './Dashboard.css';

const Dashboard = () => {
  const { user, tokens } = useAuthStore();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await axios.get('/v1/uploads', {
        headers: { Authorization: `Bearer ${tokens?.access?.token}` }
      });
      setFiles(res.data.files);
    } catch (err) {
      console.error('Error fetching files', err);
    }
  }, [tokens]);

  const fetchStats = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await axios.get('/v1/uploads/stats', {
        headers: { Authorization: `Bearer ${tokens?.access?.token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats', err);
    }
  }, [tokens, user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchFiles();
      if (user?.role === 'admin') {
        await fetchStats();
      }
      setLoading(false);
    };
    loadData();

    // Auto refresh every 5 seconds to get scan updates
    const interval = setInterval(() => {
      fetchFiles();
      if (user?.role === 'admin') fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchFiles, fetchStats, user]);

  const handleUploadSuccess = (fileRecord) => {
    setFiles([fileRecord, ...files]);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'SAFE': return <ShieldCheck className="status-icon safe" />;
      case 'REJECTED': return <ShieldX className="status-icon rejected" />;
      case 'SUSPICIOUS': return <AlertTriangle className="status-icon suspicious" />;
      default: return <Clock className="status-icon pending" />;
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'SAFE': return 'badge-safe';
      case 'REJECTED': return 'badge-rejected';
      case 'SUSPICIOUS': return 'badge-suspicious';
      default: return 'badge-pending';
    }
  };

  if (loading && files.length === 0) {
    return (
      <div className="flex justify-center items-center h-full mt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Security Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back, {user?.name}</p>
      </div>

      {user?.role === 'admin' && stats && (
        <div className="admin-stats-grid mb-6">
          <div className="glass-panel stat-card">
            <div className="stat-header">
              <Activity className="stat-icon emerald" />
              <h3>Total Scanned</h3>
            </div>
            <p className="stat-value">{stats.totalFiles}</p>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-header">
              <ShieldCheck className="stat-icon emerald" />
              <h3>Safe Files</h3>
            </div>
            <p className="stat-value">{stats.safeFiles}</p>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-header">
              <ShieldAlert className="stat-icon red" />
              <h3>Rejected</h3>
            </div>
            <p className="stat-value">{stats.rejectedFiles}</p>
            <p className="stat-meta">Rate: {stats.rejectionRate}%</p>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-header">
              <PieChart className="stat-icon yellow" />
              <h3>Suspicious</h3>
            </div>
            <p className="stat-value">{stats.suspiciousFiles}</p>
          </div>
        </div>
      )}

      {user?.role === 'admin' && stats && stats.topThreats.length > 0 && (
        <div className="dashboard-main glass-panel mb-6">
          <h2 className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-500" />
            Top Threats Detected
          </h2>
          <ul className="threat-list">
            {stats.topThreats.map((threat, i) => (
              <li key={i} className="threat-item">
                <span className="threat-reason">{threat._id}</span>
                <span className="threat-count badge-rejected">{threat.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-main glass-panel">
          <h2>Secure File Upload</h2>
          <FileUploader onUploadSuccess={handleUploadSuccess} />
        </div>

        <div className="dashboard-main glass-panel">
          <h2>Your File History</h2>
          
          {files.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} className="mx-auto mb-4 text-gray-500 opacity-50" />
              <p>No files uploaded yet.</p>
            </div>
          ) : (
            <div className="file-history-list">
              {files.map((f) => (
                <div key={f._id} className="history-item">
                  <div className="history-item-main">
                    <div className="history-item-icon">
                      {getStatusIcon(f.status)}
                    </div>
                    <div className="history-item-details">
                      <h4>{f.originalName}</h4>
                      <div className="history-meta">
                        <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>{new Date(f.createdAt).toLocaleString()}</span>
                      </div>
                      {f.scanReason && f.status !== 'SAFE' && (
                        <p className={`history-reason ${f.status === 'REJECTED' ? 'text-red' : 'text-yellow'}`}>
                          {f.scanReason}
                        </p>
                      )}
                    </div>
                    <div className="history-item-status">
                      <span className={`status-badge ${getStatusClass(f.status)}`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
