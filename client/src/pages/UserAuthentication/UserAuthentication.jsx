// UserAuthentication.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import EmailVerification from '../../components/auth/EmailVerification';
import ChangePassword from '../../components/auth/ChangePassword';
import TwoFactorAuth from '../../components/auth/TwoFactorAuth';
import SecurityLogs from '../../components/auth/SecurityLogs';
import ActiveSessions from '../../components/auth/ActiveSessions';
import UserProfile from '../../components/UserProfile';
import { Shield, Lock } from 'lucide-react';
import Settings from '../Settings/Settings';

const API_URL = import.meta.env.VITE_VRI_URL;

const UserAuthentication = () => {
  const navigate = useNavigate();
  const [twoFactorStatus, setTwoFactorStatus] = useState('Not Enabled');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStatus();
  }, []);

  const fetchUserStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTwoFactorStatus(data.user?.is2FAEnabled ? 'Enabled' : 'Not Enabled');
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black mt-[5%]">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gray-400/5 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/3 rounded-full blur-3xl opacity-25"></div>
        </div>

        <div className="relative z-10 p-6 lg:p-8 space-y-8 pt-20 lg:pt-8">
          {/* Header Section */}
          <div className="text-center lg:text-left mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/5 rounded-xl backdrop-blur-sm">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-[#c2831f]">
                Authentication & Security
              </h1>
            </div>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0">
              Manage your account security settings, monitor login activity, and protect your data with advanced authentication features.
            </p>
          </div>

          {/* Security Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Account Status</h3>
                    <p className="text-green-400 font-medium">Secure</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Lock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">2FA Status</h3>
                    {loading ? (
                      <p className="text-gray-400 font-medium">Loading...</p>
                    ) : (
                      <p className={`font-medium ${
                        twoFactorStatus === 'Enabled' 
                          ? 'text-green-400' 
                          : 'text-yellow-400'
                      }`}>
                        {twoFactorStatus}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Last Login</h3>
                    <p className="text-gray-400 font-medium">Today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-8">
              <UserProfile />
              <EmailVerification />
              <ChangePassword />
            </div>
            <div className="space-y-8">
              <TwoFactorAuth />
              <SecurityLogs />
              <ActiveSessions />
              <Settings />
              <div className="mt-16 text-center ">
                <div className="inline-block bg-black/20 border border-white/5 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
                  <p className="text-gray-400 text-sm">
                    If you're experiencing any issues with your account security, please contact our support team.
                  </p>
                  <button
                    onClick={() => navigate('/support')}
                    className="cursor-pointer mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-lg transition-all duration-300"
                  >
                    Contact Support
                  </button>

                </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}

        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserAuthentication;