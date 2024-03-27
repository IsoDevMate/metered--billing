import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import './css/ResetPassword.css'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Check your inbox.');
    } catch (error) {
      setMessage('Error sending password reset email: ' + error.message);
    }
  };

  return (
<div className="forgot-password-container">
  <h2>Forgot Password ?</h2>
  <input
    type="email"
    placeholder="Enter your email"
    value={email}
    onChange={handleEmailChange}
  />
  <button onClick={handlePasswordReset}>Reset Password</button>
  {message && <p>{message}</p>}
</div>
  );
};

