import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: '',
    usercode: '',
    email: '',
    role: '',
    department: '',
    avatar: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = () => {
    const loggedInUserCode = localStorage.getItem("loggedInUserCode");
    const usersData = localStorage.getItem("users");
    const savedAvatar = localStorage.getItem("userAvatar");

    if (usersData && loggedInUserCode) {
      try {
        const users = JSON.parse(usersData);
        const user = users.find(u => u.usercode === loggedInUserCode);
        
        if (user) {
          setUserData({
            ...user,
            avatar: savedAvatar || ''
          });
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserData(prev => ({
          ...prev,
          avatar: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    try {
      const usersData = localStorage.getItem("users");
      if (usersData) {
        const users = JSON.parse(usersData);
        const userIndex = users.findIndex(u => u.usercode === userData.usercode);
        
        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...userData };
          localStorage.setItem("users", JSON.stringify(users));
          localStorage.setItem("loggedInUser", JSON.stringify(users[userIndex]));
          
          if (userData.avatar) {
            localStorage.setItem("userAvatar", userData.avatar);
          }
          
          alert("Profile updated successfully!");
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadUserProfile();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-red-600 px-6 py-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  {userData.avatar ? (
                    <img 
                      src={userData.avatar} 
                      alt="User Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <i className="fas fa-user text-gray-400 text-3xl"></i>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                    <i className="fas fa-camera text-sm"></i>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">{userData.name}</h1>
                <p className="text-blue-100">{userData.role} - {userData.department}</p>
                <p className="text-blue-100 text-sm">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
              <div className="space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <i className="fas fa-save mr-2"></i>
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <i className="fas fa-times mr-2"></i>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Code
                </label>
                <p className="text-gray-900 py-2">{userData.usercode}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                {isEditing ? (
                  <select
                    name="role"
                    value={userData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                ) : (
                  <p className="text-gray-900 py-2">{userData.role}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="department"
                    value={userData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{userData.department}</p>
                )}
              </div>
            </div>

            {/* Activity Log */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-file-invoice-dollar text-blue-600 text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">Created Purchase Request PR-2023-001</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-green-600 text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">Approved Reimbursement RB-2023-045</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-edit text-yellow-600 text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">Updated profile information</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile; 