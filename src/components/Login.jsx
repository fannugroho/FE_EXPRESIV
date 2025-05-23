import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [usercode, setUsercode] = useState('');
  const [password, setPassword] = useState('');
  const [isEnglish, setIsEnglish] = useState(true);

  const handleLogin = (e) => {
    e.preventDefault();
    
    const usersData = localStorage.getItem("users");
    if (!usersData) {
      // Create default admin user if none exists
      const defaultUsers = [
        {
          usercode: "admin",
          password: "admin123",
          name: "Administrator",
          email: "admin@kansaipaint.com",
          role: "Admin",
          department: "IT"
        }
      ];
      localStorage.setItem("users", JSON.stringify(defaultUsers));
    }

    try {
      const users = JSON.parse(localStorage.getItem("users"));
      const user = users.find(u => 
        u.usercode === usercode && u.password === password
      );

      if (user) {
        localStorage.setItem("loggedInUserCode", user.usercode);
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        navigate('/dashboard');
      } else {
        alert("Invalid usercode or password");
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      alert("Login failed. Please try again.");
    }
  };

  const toggleLanguage = () => {
    setIsEnglish(!isEnglish);
  };

  const text = {
    welcome: isEnglish ? "Welcome to PT Kansai Paint Indonesia" : "PT Kansai Paint Indonesia へようこそ",
    signIn: isEnglish ? "Sign in to access your account" : "アカウントにアクセスするためにサインインしてください",
    login: isEnglish ? "Login" : "ログイン",
    usercodePlaceholder: isEnglish ? "Usercode / Email" : "ユーザーコード / メール",
    passwordPlaceholder: isEnglish ? "Password" : "パスワード"
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-red-500 p-4">
      {/* Language Toggle Button */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={toggleLanguage} 
          className="p-3 rounded-lg bg-white shadow-md transition-transform transform hover:scale-110 font-medium text-sm"
        >
          {isEnglish ? "🇯🇵 日本語" : "🇺🇸 English"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full">
        <div className="w-full md:w-1/2 bg-blue-50 p-8 flex flex-col items-center justify-center text-blue-900 text-center">
          <img src="/image/Seiho.png" alt="Kansai Paint Logo" className="mb-4 w-24 md:w-32 animate-bounce" />
          <h2 className="text-2xl font-bold mb-2">EXPRESSIV SYSTEM</h2>
          <p className="text-gray-600 opacity-80">Best Automotive Paint Supplier in Indonesia</p>
        </div>
        
        <div className="w-full md:w-1/2 p-8 bg-gray-50 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-blue-900 text-center md:text-left">
            {text.welcome}
          </h2>
          <p className="mb-6 text-blue-700 text-sm text-center md:text-left">
            {text.signIn}
          </p>
          
          Sample credentials info
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-medium mb-1">Sample Login Credentials:</p>
            <p className="text-xs text-blue-600">• Username: admin | Password: admin123</p>
            <p className="text-xs text-blue-600">• Username: user | Password: user123</p>
          </div>
          
          <form className="flex flex-col space-y-4" onSubmit={handleLogin}>
            <input 
              type="text" 
              value={usercode}
              onChange={(e) => setUsercode(e.target.value)}
              placeholder={text.usercodePlaceholder}
              className="p-3 w-full rounded-lg border focus:ring-2 focus:ring-blue-400" 
              required 
            />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={text.passwordPlaceholder}
              className="p-3 w-full rounded-lg border focus:ring-2 focus:ring-blue-400" 
              required 
            />
            
            <button 
              type="submit" 
              className="bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white p-3 rounded-lg font-semibold shadow-md transform hover:scale-105 transition-transform duration-300"
            >
              {text.login}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 