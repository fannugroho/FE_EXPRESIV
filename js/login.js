    // Objek terjemahan
    const translations = {
      en: {
        welcome: "Welcome to PT Kansai Paint Indonesia",
        signIn: "Sign in to access your account",
        ExtEmpNo: "Username",
        password: "Password",
        // createAccount: "Create Account?",
        loginButton: "Login"
      },
      id: {
        welcome: "Selamat Datang di PT Kansai Paint Indonesia",
        signIn: "Masuk untuk mengakses akun Anda",
        ExtEmpNo: "Nama Pengguna",
        password: "Kata Sandi",
        // createAccount: "Buat Akun?",
        loginButton: "Masuk"
      }
    };

    function toggleLanguage() {
      const currentLang = localStorage.getItem("language") || "en";
      const newLang = currentLang === "en" ? "id" : "en";
      localStorage.setItem("language", newLang);
      applyLanguage(newLang);
      updateFlag(newLang);
    }

    function applyLanguage(lang) {
      document.getElementById("welcomeText").innerText = translations[lang].welcome;
      document.getElementById("signInText").innerText = translations[lang].signIn;
      document.getElementById("ExtEmpNo").placeholder = translations[lang].ExtEmpNo;
      document.getElementById("password").placeholder = translations[lang].password;
      // document.getElementById("createAccount").innerText = translations[lang].createAccount;
      document.getElementById("loginButton").innerText = translations[lang].loginButton;
    }

    function updateFlag(lang) {
      const flagElement = document.getElementById("flagIcon");
      const langText = document.getElementById("langText");
      
      if (lang === "en") {
        flagElement.className = "flag flag-en";
        langText.innerText = "EN";
      } else {
        flagElement.className = "flag flag-id";
        langText.innerText = "ID";
      }
    }

    document.addEventListener("DOMContentLoaded", () => {
      const savedLang = localStorage.getItem("language") || "en";
      applyLanguage(savedLang);
      updateFlag(savedLang);
      
      // Check if user is already logged in
      checkExistingLogin();
    });

    // Helper function to decode JWT token
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

    // Function to hash password using SHA-256
    async function hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }

    // Function to store initial password hash
    async function storeInitialPasswordHash(password) {
      try {
        const passwordHash = await hashPassword(password);
        localStorage.setItem('initialPasswordHash', passwordHash);
        console.log('Initial password hash stored successfully:', passwordHash.substring(0, 10) + '...');
      } catch (error) {
        console.error('Error storing initial password hash:', error);
      }
    }

    // Function to check if user is a first-time login
    async function checkFirstTimeLogin(userId) {
      try {
        // Make API call to check if user needs to change password
        const response = await fetch(`${BASE_URL}/api/authentication/check-first-login/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
          }
        });
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
          // Store the result in localStorage
          localStorage.setItem("requirePasswordChange", result.data.requirePasswordChange);
          return result.data.requirePasswordChange;
        }
        
        return false;
      } catch (error) {
        console.error('Error checking first-time login:', error);
        return false;
      }
    }

    // API-based login function
    async function handleLogin(event) {
      event.preventDefault();
      
      const usercode = document.getElementById("ExtEmpNo").value.trim();
      const password = document.getElementById("password").value.trim();

      // Basic validation
      if (!usercode || !password) {
        alert("Please enter both usercode and password!");
        return;
      }

      // Set loading state
      const loginButton = document.getElementById("loginButton");
      const originalText = loginButton.innerText;
      loginButton.disabled = true;
      loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

      // Prepare login request
      const loginData = {
        username: usercode,
        password: password
      };

      console.log(loginData);

      try {
        // Make API call
        const response = await fetch(`${BASE_URL}/api/authentication/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
          // Login successful
          const { accessToken, refreshToken } = result.data;
          
          // Store tokens in localStorage
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          
          // Decode JWT to get user information
          const userInfo = decodeJWT(accessToken);
          
          if (userInfo) {
            // Store user information
            const userObject = {
              id: userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
              name: userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
              roles: userInfo["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || [],
              isFirstLogin: result.data.isFirstLogin === true
            };
            
            localStorage.setItem("loggedInUser", JSON.stringify(userObject));
            localStorage.setItem("loggedInUserCode", userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"]);
            localStorage.setItem("userId", userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);
            localStorage.setItem("userRoles", JSON.stringify(userInfo["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]));
            
            // Store initial password hash for password change validation
            await storeInitialPasswordHash(password);
            
            // Show success message
            alert(`Login Success! Welcome, ${userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"]}`);
            
            // Check if this is a first-time login
            if (result.data.isFirstLogin === true) {
              console.log("First login detected, redirecting to change password page");
              // Redirect to password change page
              window.location.href = "changepass.html";
            } else if (result.data.requirePasswordChange) {
              // Store the requirement in localStorage
              localStorage.setItem("requirePasswordChange", "true");
              // Redirect to password change page
              window.location.href = "changepass.html";
            } else {
              // Check with the API if user needs to change password
              const requireChange = await checkFirstTimeLogin(userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);
              if (requireChange) {
                // Redirect to password change page
                window.location.href = "changepass.html";
              } else {
                // Redirect to dashboard
                window.location.href = "dashboard.html";
              }
            }
          } else {
            alert("Failed to decode user information from token");
          }
        } else {
          // Login failed
          const errorMessage = result.message || "Login failed. Please check your credentials.";
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert("Connection error. Please check if the server is running and try again.");
      } finally {
        // Reset button state
        loginButton.disabled = false;
        loginButton.innerText = originalText;
      }
    }

    // Function to check if user is already logged in
    function checkExistingLogin() {
      const accessToken = localStorage.getItem("accessToken");
      
      if (accessToken) {
        const userInfo = decodeJWT(accessToken);
        
        // Check if token is still valid (not expired)
        if (userInfo && userInfo.exp && Date.now() < userInfo.exp * 1000) {
          // Check if user needs to change password
          if (localStorage.getItem("requirePasswordChange") === "true") {
            window.location.href = "changepass.html";
            return true;
          }
          
          // Token is still valid, redirect to dashboard
          window.location.href = "dashboard.html";
          return true;
        } else {
          // Token is expired, clear localStorage
          clearLoginData();
        }
      }
      
      return false;
    }

    // Function to clear login data
    function clearLoginData() {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("loggedInUserCode");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRoles");
      localStorage.removeItem("requirePasswordChange");
      localStorage.removeItem("initialPasswordHash");
    }
