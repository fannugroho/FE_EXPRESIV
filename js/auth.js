// Authentication utilities for handling JWT tokens and API calls

// API Configuration
if (typeof BASE_URL === 'undefined') {
    var BASE_URL = "https://expressiv-be-sb.idsdev.site";
    // var BASE_URL = "https://expressiv.idsdev.site";
    // var BASE_URL = "http://localhost:5246"
}

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

// Function to check if this is user's first login
function isFirstLogin() {
  const userStr = localStorage.getItem('loggedInUser');
  if (!userStr) return false;
  
  try {
    const user = JSON.parse(userStr);
    return user.isFirstLogin === true;
  } catch (error) {
    console.error('Error checking first login status:', error);
    return false;
  }
}

  // Enhanced logout function that clears permissions
  function logoutAuth() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInUserCode");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRoles");
    localStorage.removeItem("userPermissions");
    localStorage.removeItem("initialPasswordHash");
    userPermissions = [];
    
    // Redirect to login page with correct relative path
    window.location.href = getLoginPagePath();
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
    logoutAuth();
    throw new Error('No access token found. Please login again.');
  }
  
  // Check if token is expired
  if (!isAuthenticated()) {
    // Try to refresh token or redirect to login
    logoutAuth();
    throw new Error('Session expired. Please login again.');
  }
  
  // Set default headers
  const defaultHeaders = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
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
    logoutAuth();
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
// Function to check if current page is login page
function isLoginPage() {
  const currentPath = window.location.pathname.toLowerCase();
  return currentPath.includes('login.html') || currentPath.endsWith('/login');
}

// Function to check if current page is change password page
function isChangePasswordPage() {
  const currentPath = window.location.pathname.toLowerCase();
  return currentPath.includes('changepass.html') || currentPath.endsWith('/changepass');
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
    logoutAuth();
    return false;
  }
  
  // Check if first login and redirect to change password page if needed
  if (isFirstLogin() && !isChangePasswordPage()) {
    console.log('First login detected, redirecting to change password page');
    redirectToChangePassword();
    return false;
  }
  
  return true;
}

// Function to redirect to change password page
function redirectToChangePassword() {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/').filter(segment => segment !== '');
  
  // Remove the filename if it exists
  if (pathSegments.length > 0 && pathSegments[pathSegments.length - 1].includes('.html')) {
    pathSegments.pop();
  }
  
  // Calculate the relative path
  let relativePath = '';
  if (pathSegments.length === 0) {
    relativePath = 'pages/changepass.html';
  } else if (pathSegments.length === 1 && pathSegments[0] === 'pages') {
    relativePath = 'changepass.html';
  } else {
    const goBack = '../'.repeat(pathSegments.length);
    relativePath = goBack + 'pages/changepass.html';
  }
  
  window.location.href = relativePath;
}

// Permission checking functionality
let userPermissions = [];

// Function to load user permissions
async function loadUserPermissions() {
  try {
    if (!isAuthenticated()) {
      console.log('User not authenticated, cannot load permissions');
      return;
    }

    const response = await makeAuthenticatedRequest('/api/users/me/permissions', {
      method: 'GET'
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status) {
        userPermissions = result.data;
        localStorage.setItem('userPermissions', JSON.stringify(userPermissions));
        console.log('User permissions loaded:', userPermissions);
      }
    }
  } catch (error) {
    console.error('Error loading user permissions:', error);
  }
}

// Function to check if user has a specific permission
function hasPermission(permissionName) {
  // Try to get from memory first
  if (userPermissions.length > 0) {
    return userPermissions.includes(permissionName);
  }
  
  // Try to get from localStorage
  const storedPermissions = localStorage.getItem('userPermissions');
  if (storedPermissions) {
    try {
      userPermissions = JSON.parse(storedPermissions);
      return userPermissions.includes(permissionName);
    } catch (error) {
      console.error('Error parsing stored permissions:', error);
    }
  }
  
  return false;
}

// Function to check multiple permissions (user needs ALL of them)
function hasAllPermissions(permissionNames) {
  return permissionNames.every(permission => hasPermission(permission));
}

// Function to check if user has any of the specified permissions
function hasAnyPermission(permissionNames) {
  return permissionNames.some(permission => hasPermission(permission));
}

// Function to redirect to access denied page or login
function redirectToAccessDenied() {
  // You can customize this path as needed
  const accessDeniedPath = 'pages/access-denied.html';
  window.location.href = getRelativePath(accessDeniedPath);
}

// Function to get relative path (similar to getLoginPagePath)
function getRelativePath(targetPath) {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/').filter(segment => segment !== '');
  
  if (pathSegments.length > 0 && pathSegments[pathSegments.length - 1].includes('.html')) {
    pathSegments.pop();
  }
  
  if (pathSegments.length === 0) {
    return targetPath;
  } else {
    const goBack = '../'.repeat(pathSegments.length);
    return goBack + targetPath;
  }
}

// Function to protect pages based on permissions
function requirePermission(permissionName) {
  if (!isAuthenticated()) {
    logoutAuth();
    return false;
  }
  
  if (!hasPermission(permissionName)) {
    console.log(`Access denied: Missing permission '${permissionName}'`);
    redirectToAccessDenied();
    return false;
  }
  
  return true;
}

// Function to protect pages based on multiple permissions (needs ALL)
function requireAllPermissions(permissionNames) {
  if (!isAuthenticated()) {
    logoutAuth();
    return false;
  }
  
  if (!hasAllPermissions(permissionNames)) {
    console.log(`Access denied: Missing one or more permissions:`, permissionNames);
    redirectToAccessDenied();
    return false;
  }
  
  return true;
}

// Function to protect pages based on any of the permissions (needs ANY)
function requireAnyPermission(permissionNames) {
  if (!isAuthenticated()) {
    logoutAuth();
    return false;
  }
  
  if (!hasAnyPermission(permissionNames)) {
    console.log(`Access denied: Missing all required permissions:`, permissionNames);
    redirectToAccessDenied();
    return false;
  }
  
  return true;
}

// Function to hide/show elements based on permissions
function toggleElementsByPermission(permissionName, show = true) {
  const elements = document.querySelectorAll(`[data-requires-permission="${permissionName}"]`);
  elements.forEach(element => {
    if (hasPermission(permissionName)) {
      element.style.display = show ? 'block' : 'none';
    } else {
      element.style.display = show ? 'none' : 'block';
    }
  });
}

// Function to apply all permission-based visibility rules
function applyPermissionVisibility() {
  const elementsWithPermissions = document.querySelectorAll('[data-requires-permission]');
  elementsWithPermissions.forEach(element => {
    const requiredPermission = element.getAttribute('data-requires-permission');
    if (requiredPermission) {
      element.style.display = hasPermission(requiredPermission) ? 'block' : 'none';
    }
  });
}



// Page-based permission mapping
const PAGE_PERMISSIONS = {
  // Purchase Request pages
  // 'addPR.html': ['PREPARE_PR'],
  // 'detailPR.html': ['PREPARE_PR'],
  
  // You can add more page mappings here
  // 'addCash.html': ['PREPARE_CASH_ADVANCE'],
  // 'detailCash.html': ['PREPARE_CASH_ADVANCE'],
  // 'addReim.html': ['PREPARE_REIMBURSEMENT'],
  // 'approval-dashboard.html': ['USER_APPROVAL'],
};

// Function to get current page filename
function getCurrentPageName() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf('/') + 1);
}

// Function to check page-level permissions automatically
function checkPagePermissions() {
  // Skip if on login page
  if (isLoginPage()) {
    return true;
  }

  // Check if page has permission requirements in data attribute
  const body = document.body || document.documentElement;
  const requiredPermission = body.getAttribute('data-requires-permission');
  const requiredPermissions = body.getAttribute('data-requires-permissions');

  if (requiredPermission) {
    return requirePermission(requiredPermission);
  }

  if (requiredPermissions) {
    const permissions = requiredPermissions.split(',').map(p => p.trim());
    return requireAllPermissions(permissions);
  }

  // Check based on page filename
  const currentPage = getCurrentPageName();
  const requiredPagePermissions = PAGE_PERMISSIONS[currentPage];

  if (requiredPagePermissions) {
    console.log(`Page ${currentPage} requires permissions:`, requiredPagePermissions);
    return requireAllPermissions(requiredPagePermissions);
  }

  // No specific permission required for this page
  return true;
}

// Function to show page content after permission check passes
function showPageContent() {
  document.body.style.visibility = 'visible';
  document.body.style.opacity = '1';
  console.log('Page content now visible - permissions verified');
}

// Function to hide page content initially
function hidePageContent() {
  document.body.style.visibility = 'hidden';
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.2s ease-in-out';
}

// Function to show loading screen
function showLoadingScreen() {
  // Only show loading if we don't already have one
  if (document.getElementById('auth-loading-screen')) {
    return;
  }

  const loadingScreen = document.createElement('div');
  loadingScreen.id = 'auth-loading-screen';
  loadingScreen.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      font-family: Arial, sans-serif;
    ">
      <div style="text-align: center;">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <p style="color: #666; margin: 0;">Verifying permissions...</p>
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  document.documentElement.appendChild(loadingScreen);
}

// Function to hide loading screen
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('auth-loading-screen');
  if (loadingScreen) {
    loadingScreen.remove();
  }
}

// Function to check if current page needs protection
function pageNeedsProtection() {
  if (isLoginPage()) {
    return false;
  }

  // Check data attributes
  const body = document.body || document.documentElement;
  if (body.getAttribute('data-requires-permission') || body.getAttribute('data-requires-permissions')) {
    return true;
  }

  // Check page mapping
  const currentPage = getCurrentPageName();
  return !!PAGE_PERMISSIONS[currentPage];
}

// Immediate permission check (runs before page is visible)
async function immediatePermissionCheck() {
  // If page doesn't need protection, show it immediately
  if (!pageNeedsProtection()) {
    showPageContent();
    return;
  }

  // Hide page content and show loading for protected pages
  hidePageContent();
  showLoadingScreen();

  // Check authentication first
  if (!checkAuthOnPageLoad()) {
    hideLoadingScreen();
    return; // Will redirect to login
  }

  try {
    // Load permissions
    await loadUserPermissions();
    
    // Check page permissions
    if (checkPagePermissions()) {
      hideLoadingScreen();
      showPageContent();
    } else {
      hideLoadingScreen();
      // checkPagePermissions will handle the redirect
    }
  } catch (error) {
    console.error('Error during permission check:', error);
    hideLoadingScreen();
    redirectToAccessDenied();
  }
}

// Run immediate check as soon as possible (before DOM is ready)
(async () => {
  // Wait a tiny bit for body to exist, but don't wait for full DOM
  const waitForBody = () => {
    return new Promise((resolve) => {
      if (document.body) {
        resolve();
      } else {
        const observer = new MutationObserver(() => {
          if (document.body) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(document.documentElement, { childList: true });
      }
    });
  };

  await waitForBody();
  await immediatePermissionCheck();
})();

// Apply permission-based visibility after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (isAuthenticated() && !isLoginPage()) {
    applyPermissionVisibility();
  }
}); 