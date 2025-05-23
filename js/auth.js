// Authentication utilities for handling JWT tokens and API calls

// API Configuration
const API_BASE_URL = "http://localhost:5246";

// Helper function to get access token from localStorage
function getAccessToken() {
  return localStorage.getItem("accessToken");
}

// Helper function to get refresh token from localStorage
function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

// Helper function to check if user is authenticated
function isAuthenticated() {
  const token = getAccessToken();
  if (!token) return false;
  
  // Check if token is expired
  const userInfo = decodeJWT(token);
  if (!userInfo || !userInfo.exp) return false;
  
  return Date.now() < userInfo.exp * 1000;
}

// Helper function to decode JWT token (same as in login.js)
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Helper function to get user information from token
function getCurrentUser() {
  const token = getAccessToken();
  if (!token) return null;
  
  const userInfo = decodeJWT(token);
  if (!userInfo) return null;
  
  return {
    username: userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
    userId: userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
    roles: userInfo["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || []
  };
}

// Function to make authenticated API requests
async function makeAuthenticatedRequest(endpoint, options = {}) {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('No access token found. Please login again.');
  }
  
  // Check if token is expired
  if (!isAuthenticated()) {
    // Try to refresh token or redirect to login
    logout();
    throw new Error('Session expired. Please login again.');
  }
  
  // Set default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // Merge with provided headers
  const headers = {
    ...defaultHeaders,
    ...(options.headers || {})
  };
  
  // Make the request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  // Handle authentication errors
  if (response.status === 401) {
    logout();
    throw new Error('Authentication failed. Please login again.');
  }
  
  return response;
}

// Function to logout and clear all tokens
function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("loggedInUserCode");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRoles");
  
  // Redirect to login page
  window.location.href = "login.html";
}

// Function to check authentication on page load
function checkAuthOnPageLoad() {
  // Skip authentication check for login page
  if (window.location.href.includes('login.html')) {
    return;
  }
  
  if (!isAuthenticated()) {
    logout();
    return false;
  }
  
  return true;
}

// Auto-check authentication when this script is loaded (except on login page)
document.addEventListener("DOMContentLoaded", () => {
  checkAuthOnPageLoad();
}); 