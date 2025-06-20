// Password change functionality for first-time login users
document.addEventListener("DOMContentLoaded", () => {
  // Check if running in development mode with Live Server
  const isLocalDevelopment = window.location.hostname === "127.0.0.1" || 
                            window.location.hostname === "localhost";
  
  // Apply language settings
  const savedLang = localStorage.getItem("language") || "en";
  applyLanguage(savedLang);
  updateFlag(savedLang);

  // Get the form element
  const passwordForm = document.getElementById("passwordChangeForm");
  
  // Skip authentication check if in development mode
  if (isLocalDevelopment) {
    console.log("Development mode detected - skipping authentication check");
    
    // Add submit event listener for development mode
    if (passwordForm) {
      passwordForm.addEventListener("submit", handleDevPasswordChange);
    }
    
    return;
  }

  // For production environment, check if user is authenticated
  if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
    if (typeof getLoginPagePath === 'function') {
      window.location.href = getLoginPagePath();
    } else {
      window.location.href = "../pages/login.html";
    }
    return;
  }

  // Add submit event listener for production
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
    error: "An error occurred. Please try again."
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
    error: "Terjadi kesalahan. Silakan coba lagi."
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

// Handle password change for development mode
function handleDevPasswordChange(event) {
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
  
  // Set loading state
  const changeButton = document.getElementById("changeButton");
  const originalText = changeButton.innerText;
  changeButton.disabled = true;
  changeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  // Simulate API call in development mode
  setTimeout(() => {
    alert(translations[lang].passwordChanged);
    
    // Reset button state
    changeButton.disabled = false;
    changeButton.innerText = originalText;
    
    // Redirect to dashboard or login page
    window.location.href = "../pages/login.html";
  }, 1500);
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
  
  // Set loading state
  const changeButton = document.getElementById("changeButton");
  const originalText = changeButton.innerText;
  changeButton.disabled = true;
  changeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  try {
    // Check if we have the necessary functions from auth.js
    if (typeof getUserId !== 'function' || typeof makeAuthenticatedRequest !== 'function') {
      throw new Error("Authentication functions not available");
    }
    
    // Get current user ID
    const userId = getUserId();
    
    if (!userId) {
      throw new Error("User ID not found");
    }
    
    // Prepare request data
    const passwordData = {
      userId: userId,
      newPassword: newPassword
    };
    
    // Make API call to change password
    const response = await makeAuthenticatedRequest('/api/authentication/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData)
    });
    
    const result = await response.json();
    
    if (result.status && result.code === 200) {
      // Password change successful
      alert(translations[lang].passwordChanged);
      
      // Remove the password change requirement
      localStorage.removeItem("requirePasswordChange");
      
      // Redirect to dashboard
      window.location.href = "dashboard.html";
    } else {
      // Password change failed
      const errorMessage = result.message || translations[lang].error;
      alert(errorMessage);
    }
  } catch (error) {
    console.error('Password change error:', error);
    alert(translations[lang].error);
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