// src/services/authService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_VRI_URL;

// Create a reusable Axios instance
const API = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Needed if your backend uses cookies/sessions
});

// Token injector helper 
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token
        ? { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        : { withCredentials: true };
};

// ==================== Email Verification ====================
export const sendVerificationLink = () => API.post('/auth/send-verification-email', {}, getAuthHeaders());

export const verifyEmail = (tokenOrOtp) =>
    API.post('/verify-email', { code: tokenOrOtp }, getAuthHeaders());

// ==================== Password Management ====================
export const changePassword = (oldPassword, newPassword) =>
    API.post('/auth/change-password', { oldPassword, newPassword }, getAuthHeaders());

export const forgotPassword = (email) =>
    API.post('/auth/forgot-password', { email });

export const resetPassword = (token, newPassword) =>
    API.post('/auth/reset-password', { token, newPassword });

// ==================== Two Factor Auth ====================
export const enable2FA = () => API.post('/auth/enable-2fa', {}, getAuthHeaders());

export const verify2FA = (otp) => API.post('/auth/verify-2fa', { otp }, getAuthHeaders());

export const verifyTwoFactor = (otp) => API.post('/auth/2fa/verify', { otp }, getAuthHeaders());

export const disableTwoFactor = () => API.post('/auth/2fa/disable', {}, getAuthHeaders());

// ==================== Security & Sessions ====================
export const getSecurityLogs = async () => {
    const res = await API.get('/auth/security-logs', getAuthHeaders());
    if (!res.data.success) throw new Error("Failed to fetch logs");
    return res.data.data;
};

export const getActiveSessions = () =>
    API.get('/auth/active-sessions', getAuthHeaders());

// logout single session
export const logoutSession = (sessionId) =>
    API.delete(`/auth/sessions/${sessionId}`, getAuthHeaders());

// logout all sessions
export const logoutAllSessions = () =>
    API.delete('/auth/sessions', getAuthHeaders());

// ==================== Profile ====================
export const updateEmail = (email) =>
    API.put('/auth/update-email', { email }, getAuthHeaders());

export const updateName = ({ firstName, lastName }) =>
    API.put('/auth/update-name', { firstName, lastName }, getAuthHeaders());

export const uploadProfileImage = (file) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    return API.put('/auth/upload-profile-image', formData, {
        ...getAuthHeaders(),
        headers: {
            ...getAuthHeaders().headers,
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const getUser = () => API.get('/auth/users/me', getAuthHeaders());

export default {
    sendVerificationLink,
    verifyEmail,
    changePassword,
    forgotPassword,
    resetPassword,
    enable2FA,
    verifyTwoFactor,
    disableTwoFactor,
    getSecurityLogs,
    getActiveSessions,
    logoutSession,
    logoutAllSessions,
    verify2FA,
    updateEmail,
    updateName,
    uploadProfileImage,
    getUser
};