// components/auth/TwoFactorAuth.jsx
import React, { useState, useEffect } from 'react';
import { Shield, Mail, Key, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_VRI_URL;

const TwoFactorAuth = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Check 2FA status on component mount
  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsEnabled(data.user?.is2FAEnabled || false);
      }

    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setShowSetup(true);
        setOtpSent(true);
        setSuccess('OTP has been sent to your email. Please check your inbox.');
      } else {
        setError(data.message || data.error || 'Failed to enable 2FA');
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: verificationCode })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Two-Factor Authentication enabled successfully!');
        setIsEnabled(true);
        setShowSetup(false);
        setVerificationCode('');
        setOtpSent(false);
        // Refresh the page to update the status in parent component
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Two-Factor Authentication disabled successfully');
        setIsEnabled(false);
        // Refresh the page to update the status in parent component
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(data.message || 'Failed to disable 2FA');
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('New OTP has been sent to your email.');
        setVerificationCode('');
      } else {
        setError('Failed to resend OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-400">
              Add an extra layer of security to your account
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6 flex items-center gap-2">
          {isEnabled ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Enabled</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Not Enabled</span>
            </>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {!isEnabled && !showSetup && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium mb-1">Email-Based 2FA</h4>
                  <p className="text-gray-300 text-sm">
                    When enabled, you'll receive a one-time password (OTP) via email each time you log in. This OTP will be required along with your password to access your account.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleEnable2FA}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Enable 2FA'}
            </button>
          </div>
        )}

        {showSetup && otpSent && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Verify Your Email
              </h4>
              <p className="text-gray-400 text-sm">
                We've sent a 6-digit verification code to your registered email address. Please enter it below to enable Two-Factor Authentication.
              </p>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-center text-2xl tracking-widest font-mono"
                  required
                  autoFocus
                />
                <p className="text-gray-400 text-xs mt-2">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 text-green-400 rounded-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSetup(false);
                    setOtpSent(false);
                    setVerificationCode('');
                    setError('');
                    setSuccess('');
                  }}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-lg transition-all duration-300"
                >
                  Cancel
                </button>
              </div>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
              >
                Didn't receive the code? Resend OTP
              </button>
            </form>
          </div>
        )}

        {isEnabled && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-green-400 font-medium mb-1">2FA is Active</h4>
                  <p className="text-gray-300 text-sm">
                    Your account is protected with Two-Factor Authentication. You'll receive an OTP via email each time you log in.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleDisable2FA}
              disabled={loading}
              className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuth;