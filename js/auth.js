// Authentication utilities for handling JWT tokens and API calls

// API Configuration
const BASE_URL = "http://localhost:5246";

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

// Helper function to get just the user ID from token
function getUserId() {
  const token = getAccessToken();
  if (!token) return null;
  
  const userInfo = decodeJWT(token);
  if (!userInfo) return null;
  
  return userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
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
  const response = await fetch(`${BASE_URL}${endpoint}`, {
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

// Function to get the correct path to login page based on current location
function getLoginPagePath() {
  const currentPath = window.location.pathname;
  
  // Count the directory depth to determine how many "../" we need
  const pathSegments = currentPath.split('/').filter(segment => segment !== '');
  
  // Remove the filename if it exists (ends with .html)
  if (pathSegments.length > 0 && pathSegments[pathSegments.length - 1].includes('.html')) {
    pathSegments.pop();
  }
  
  // Calculate the relative path
  let relativePath = '';
  if (pathSegments.length === 0) {
    // We're at root level
    relativePath = 'pages/login.html';
  } else if (pathSegments.length === 1 && pathSegments[0] === 'pages') {
    // We're in pages directory
    relativePath = 'login.html';
  } else {
    // We're in subdirectories, need to go back
    const goBack = '../'.repeat(pathSegments.length);
    relativePath = goBack + 'pages/login.html';
  }
  
  return relativePath;
}

// Function to logout and clear all tokens
function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("loggedInUserCode");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRoles");
  
  // Redirect to login page with correct relative path
  window.location.href = getLoginPagePath();
}

// Function to check if current page is login page
function isLoginPage() {
  const currentPath = window.location.pathname.toLowerCase();
  return currentPath.includes('login.html') || currentPath.endsWith('/login');
}

// Function to check authentication on page load
function checkAuthOnPageLoad() {
  // Skip authentication check for login page
  if (isLoginPage()) {
    console.log('Login page detected, skipping auth check');
    return;
  }
  
  console.log('Checking authentication for:', window.location.href);
  
  if (!isAuthenticated()) {
    console.log('User not authenticated, redirecting to login');
    logout();
    return false;
  }
  
  return true;
}

// Auto-check authentication when this script is loaded (except on login page)
document.addEventListener("DOMContentLoaded", () => {
  checkAuthOnPageLoad();
}); 