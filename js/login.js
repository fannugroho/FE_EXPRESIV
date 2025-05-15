    // Objek terjemahan
    const translations = {
      en: {
        welcome: "Welcome to PT Kansai Paint Indonesia",
        signIn: "Sign in to access your account",
        ExtEmpNo: "Usercode / Email",
        password: "Password",
        createAccount: "Create Account?",
        loginButton: "Login"
      },
      id: {
        welcome: "Selamat Datang di PT Kansai Paint Indonesia",
        signIn: "Masuk untuk mengakses akun Anda",
        ExtEmpNo: "Kode Pengguna / Email",
        password: "Kata Sandi",
        createAccount: "Buat Akun?",
        loginButton: "Masuk"
      }
    };

    function toggleLanguage() {
      const currentLang = localStorage.getItem("language") || "en";
      const newLang = currentLang === "en" ? "id" : "en"; // Toggle bahasa
      localStorage.setItem("language", newLang);
      applyLanguage(newLang);
      updateFlag(newLang);
    }

    function applyLanguage(lang) {
      document.getElementById("welcomeText").innerText = translations[lang].welcome;
      document.getElementById("signInText").innerText = translations[lang].signIn;
      document.getElementById("ExtEmpNo").placeholder = translations[lang].usercode;
      document.getElementById("password").placeholder = translations[lang].password;
      document.getElementById("createAccount").innerText = translations[lang].createAccount;
      document.getElementById("loginButton").innerText = translations[lang].loginButton;
    }

    function updateFlag(lang) {
      const flagImg = document.getElementById("flagIcon");
      if (lang === "en") {
        flagImg.src = "English.png"; // Ganti dengan URL gambar bendera UK 🇬🇧
        flagImg.alt = "English";
      } else {
        flagImg.src = "Indonesia.png"; // Ganti dengan URL gambar bendera Indonesia 🇮🇩
        flagImg.alt = "Indonesia";
      }
    }

    document.addEventListener("DOMContentLoaded", () => {
      const savedLang = localStorage.getItem("language") || "en";
      applyLanguage(savedLang);
      updateFlag(savedLang);
    });

    function handleLogin(event) {
      event.preventDefault();
      const usercode = document.getElementById("ExtEmpNo").value.trim();
      const password = document.getElementById("password").value.trim();

      let users = JSON.parse(localStorage.getItem("users")) || [];
      const user = users.find(user => user.usercode === usercode && user.password === password);

      if (user) {
        alert("Login Success! Welcome, " + usercode);
        window.location.href = "menu.html";
      } else {
        alert("Incorrect user code or password!");
      }
    }
