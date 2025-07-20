// Password change functionality for first-time login users
document.addEventListener("DOMContentLoaded", () => {
  // Apply language settings
  const savedLang = localStorage.getItem("language") || "en";
  applyLanguage(savedLang);
  updateFlag(savedLang);

  // Get the form element
  const passwordForm = document.getElementById("passwordChangeForm");
  
  // Check if user is authenticated
  if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
    if (typeof getLoginPagePath === 'function') {
      window.location.href = getLoginPagePath();
    } else {
      window.location.href = "../pages/login.html";
    }
    return;
  }

  // Add submit event listener
  if (passwordForm) {
    passwordForm.addEventListener("submit", handlePasswordChange);
  }
});

// Language translations
const translations = {
  en: {
    welcome: "Change Your Password",
    passwordChange: "Please change your password to continue",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    changeButton: "Change Password",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 8 characters long",
    passwordChanged: "Password changed successfully",
    error: "An error occurred. Please try again.",
    initialPasswordError: "You cannot use your initial login password. Please choose a different password."
  },
  id: {
    welcome: "Ubah Kata Sandi Anda",
    passwordChange: "Silakan ubah kata sandi Anda untuk melanjutkan",
    newPassword: "Kata Sandi Baru",
    confirmPassword: "Konfirmasi Kata Sandi",
    changeButton: "Ubah Kata Sandi",
    passwordMismatch: "Kata sandi tidak cocok",
    passwordTooShort: "Kata sandi harus minimal 8 karakter",
    passwordChanged: "Kata sandi berhasil diubah",
    error: "Terjadi kesalahan. Silakan coba lagi.",
    initialPasswordError: "Anda tidak dapat menggunakan kata sandi login awal. Silakan pilih kata sandi yang berbeda."
  }
};

// Apply language settings
function applyLanguage(lang) {
  document.getElementById("welcomeText").innerText = translations[lang].welcome;
  if (document.getElementById("passwordChangeText")) {
    document.getElementById("passwordChangeText").innerText = translations[lang].passwordChange;
  }
  document.getElementById("newPassword").placeholder = translations[lang].newPassword;
  document.getElementById("confirmPassword").placeholder = translations[lang].confirmPassword;
  document.getElementById("changeButton").innerText = translations[lang].changeButton;
}

// Function to hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Function to check if password matches initial password
async function isInitialPassword(newPassword) {
  try {
    const initialPasswordHash = localStorage.getItem('initialPasswordHash');
    if (!initialPasswordHash) {
      console.log('No initial password hash found, allowing password change');
      return false; // No initial password stored, allow the change
    }
    
    const newPasswordHash = await hashPassword(newPassword);
    const isMatch = newPasswordHash === initialPasswordHash;
    
    if (isMatch) {
      console.log('New password matches initial password - blocking change');
    } else {
      console.log('New password is different from initial password - allowing change');
    }
    
    return isMatch;
  } catch (error) {
    console.error('Error checking initial password:', error);
    return false;
  }
}

// Handle password change submission
async function handlePasswordChange(event) {
  event.preventDefault();
  
  const lang = localStorage.getItem("language") || "en";
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  
  // Validate passwords
  if (newPassword !== confirmPassword) {
    alert(translations[lang].passwordMismatch);
    return;
  }
  
  if (newPassword.length < 8) {
    alert(translations[lang].passwordTooShort);
    return;
  }
  
  // Check if new password is the same as initial password
  const isInitial = await isInitialPassword(newPassword);
  if (isInitial) {
    alert(translations[lang].initialPasswordError);
    return;
  }
  
  // Set loading state
  const changeButton = document.getElementById("changeButton");
  const originalText = changeButton.innerText;
  changeButton.disabled = true;
  changeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  try {
    // Check if we have the necessary functions from auth.js
    if (typeof makeAuthenticatedRequest !== 'function') {
      throw new Error("Authentication functions not available");
    }
    
    // Check if this is a first login password change
    const isFirstTimeLogin = typeof isFirstLogin === 'function' ? isFirstLogin() : false;
    
    // Get current user ID (only needed for regular password changes)
    let userId = null;
    if (!isFirstTimeLogin && typeof getUserId === 'function') {
      userId = getUserId();
      
      if (!userId) {
        throw new Error("User ID not found");
      }
    }
    
    // Prepare request data - format depends on whether it's first login or not
    let passwordData;
    
    if (isFirstTimeLogin) {
      // First login uses FirstLoginPasswordChangeDto format
      passwordData = {
        newPassword: newPassword,
        confirmPassword: confirmPassword
      };
    } else {
      // Regular password change uses PasswordChangeDto format
      passwordData = {
        userId: userId,
        newPassword: newPassword
      };
    }
    
    // Make API call to change password - use different endpoint for first login
    const endpoint = isFirstTimeLogin 
      ? '/api/authentication/initial-password' 
      : '/api/authentication/change-password';
      
    const response = await makeAuthenticatedRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(passwordData)
    });
    
    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    // Check for different possible response formats
    const isSuccess = (result.Status && result.Code === 200) || 
                     (result.status && result.code === 200) ||
                     (result.success === true) ||
                     (response.ok && result.message);
    
    if (isSuccess) {
      // Password change successful
      alert(translations[lang].passwordChanged);
      
      // Update the user's first login status in localStorage
      try {
        const userStr = localStorage.getItem('loggedInUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.isFirstLogin = false;
          localStorage.setItem('loggedInUser', JSON.stringify(user));
        }
      } catch (error) {
        console.error('Error updating first login status:', error);
      }
      
      // Remove the password change requirement
      localStorage.removeItem("requirePasswordChange");
      
      // Redirect to dashboard with better path handling
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/').filter(segment => segment !== '');
      
      // Remove the filename if it exists
      if (pathSegments.length > 0 && pathSegments[pathSegments.length - 1].includes('.html')) {
        pathSegments.pop();
      }
      
      // Calculate the relative path to dashboard
      let dashboardPath = '';
      if (pathSegments.length === 0) {
        dashboardPath = 'pages/dashboard.html';
      } else if (pathSegments.length === 1 && pathSegments[0] === 'pages') {
        dashboardPath = 'dashboard.html';
      } else {
        const goBack = '../'.repeat(pathSegments.length);
        dashboardPath = goBack + 'pages/dashboard.html';
      }
      
      window.location.href = dashboardPath;
    } else {
      // Password change failed
      const errorMessage = result.Message || result.message || translations[lang].error;
      alert(errorMessage);
    }
  } catch (error) {
    console.error('Password change error:', error);
    
    // Provide more specific error messages
    let errorMessage = translations[lang].error;
    if (error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('401')) {
      errorMessage = 'Session expired. Please login again.';
    } else if (error.message.includes('404')) {
      errorMessage = 'API endpoint not found. Please contact administrator.';
    } else if (error.message.includes('500')) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    alert(errorMessage);
  } finally {
    // Reset button state
    changeButton.disabled = false;
    changeButton.innerText = originalText;
  }
}

// Toggle language function
function toggleLanguage() {
  const currentLang = localStorage.getItem("language") || "en";
  const newLang = currentLang === "en" ? "id" : "en";
  localStorage.setItem("language", newLang);
  applyLanguage(newLang);
  updateFlag(newLang);
} 