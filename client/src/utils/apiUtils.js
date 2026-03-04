// client/src/utils/apiUtils.js
const API_URL = import.meta.env.VITE_VRI_URL;

// Get token from localStorage
export const getToken = () => {
    return localStorage.getItem('token');
};

// Set token in localStorage
export const setToken = (token) => {
    localStorage.setItem('token', token);
};

// Remove token from localStorage
export const removeToken = () => {
    localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;
    
    try {
        // Decode JWT to check expiration (basic check)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
            removeToken(); // Remove expired token
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error checking token:', error);
        removeToken(); // Remove invalid token
        return false;
    }
};

// Create authenticated fetch request
export const authenticatedFetch = async (url, options = {}) => {
    const token = getToken();
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    // Ensure the URL is complete
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    // Default headers
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Merge headers
    const headers = {
        ...defaultHeaders,
        ...options.headers
    };

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers
        });

        // Check if token is expired or invalid
        if (response.status === 401) {
            removeToken();
            // Optionally redirect to login
            window.location.href = '/login';
            throw new Error('Authentication failed');
        }

        return response;
    } catch (error) {
        console.error('Authenticated fetch error:', error);
        throw error;
    }
};

// API request helpers
export const api = {
    // GET request
    get: async (endpoint) => {
        const response = await authenticatedFetch(endpoint, {
            method: 'GET'
        });
        return response.json();
    },

    // POST request
    post: async (endpoint, data) => {
        const response = await authenticatedFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // PUT request
    put: async (endpoint, data) => {
        const response = await authenticatedFetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // DELETE request
    delete: async (endpoint) => {
        const response = await authenticatedFetch(endpoint, {
            method: 'DELETE'
        });
        return response.json();
    }
};

// Login helper
export const loginUser = async (credentials) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok && data.token) {
            setToken(data.token);
            return data;
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Signup helper
export const signupUser = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok && data.token) {
            setToken(data.token);
            return data;
        } else {
            throw new Error(data.message || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
};

// Logout helper
export const logoutUser = () => {
    removeToken();
    // Optionally redirect to login
    window.location.href = '/login';
};