import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Shield className="brand-icon" />
            <Link to="/" className="brand-text">
              SecureShield
            </Link>
          </div>
          <div className="navbar-links">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <div className="user-info">
                  <UserIcon size={16} />
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="nav-btn-logout"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="nav-btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
