import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
// import bg4 from '../assets/background/bg4.avif'; 

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      return Swal.fire('Error', 'Both fields are required.', 'error');
    }

    if (password !== confirmPassword) {
      return Swal.fire('Error', 'Passwords do not match.', 'error');
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/users/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire('Success', 'Password reset successfully.', 'success');
        navigate('/signin'); // Redirect to sign-in after success
      } else {
        Swal.fire('Error', result.message || 'Reset failed.', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        // backgroundImage: `url(${bg4})`,
        // backgroundSize: 'cover',
        // backgroundPosition: 'center',
        // backgroundAttachment: 'fixed',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          position: 'relative',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#28a745', fontSize: '24px', fontWeight: 'bold' }}>Reset Password</h2>

        <button
          onClick={() => navigate('/Signin')}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'transparent',
            border: 'none',
            fontSize: '22px',
            color: '#888',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseOver={(e) => (e.target.style.background = '#e0f6e9')}
          onMouseOut={(e) => (e.target.style.background = 'transparent')}
          aria-label="Close"
        >
          &times;
        </button>

        <form onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '12px',
  borderRadius: '5px',
  border: '1px solid #ccc',
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#28a745',
  color: '#fff',
  fontWeight: 'bold',
  borderRadius: '5px',
  border: 'none',
  cursor: 'pointer',
};

export default ResetPassword;
