import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Guest',
    usercode: '',
    avatar: ''
  });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    loadUserData();

    // Close notification dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && buttonRef.current && 
          !buttonRef.current.contains(e.target) && 
          !dropdownRef.current.contains(e.target)) {
        setNotificationVisible(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const loadUserData = () => {
    const usersData = localStorage.getItem("users");
    const loggedInUserCode = localStorage.getItem("loggedInUserCode");
    const savedAvatar = localStorage.getItem("userAvatar");

    if (usersData && loggedInUserCode) {
      try {
        const users = JSON.parse(usersData);
        const loggedInUser = users.find(user => user.usercode === loggedInUserCode);

        if (loggedInUser) {
          setUserData({
            name: loggedInUser.name,
            usercode: loggedInUser.usercode,
            avatar: savedAvatar || ''
          });
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    }
  };

  const toggleNotification = () => {
    setNotificationVisible(!notificationVisible);
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const notifications = [
    {
      id: 1,
      icon: "fas fa-file-invoice-dollar",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
      title: "Purchase Request document",
      description: "Requires approval",
      time: "5 minutes ago"
    },
    {
      id: 2,
      icon: "fas fa-hand-holding-usd",
      iconBg: "bg-green-100", 
      iconColor: "text-green-500",
      title: "Reimbursement document",
      description: "Requires approval",
      time: "1 hour ago"
    }
  ];

  return (
    <>
      {/* User Avatar and Notifications */}
      <div className="absolute top-4 right-4 flex items-center space-x-4">
        {/* Notification Bell with Badge */}
        <div className="relative">
          <button 
            ref={buttonRef}
            onClick={toggleNotification}
            className="notification-btn relative text-white focus:outline-none p-2 rounded-full flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-bell text-xl"></i>
            {notifications.length > 0 && (
              <span className="notification-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {notificationVisible && (
            <div 
              ref={dropdownRef}
              className="notification-dropdown absolute right-0 mt-2 min-w-max w-72 max-w-xs bg-white rounded-lg shadow-xl border z-20"
            >
              <div className="p-4 font-bold border-b bg-gray-50 rounded-t-lg flex items-center">
                <i className="fas fa-bell text-blue-500 mr-2"></i>
                <span>Notifications</span>
              </div>
              <ul className="py-2 text-sm text-gray-700 max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className="notification-item px-4 py-3 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                        <span className={`h-8 w-8 rounded-full ${notification.iconBg} flex items-center justify-center`}>
                          <i className={`${notification.icon} ${notification.iconColor}`}></i>
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="font-semibold">{notification.title}</div>
                        <div className="text-xs text-gray-500">{notification.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{notification.time}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t p-3 text-right bg-gray-50 rounded-b-lg">
                <button className="text-blue-500 text-sm hover:underline flex items-center justify-center w-full">
                  <span>See All Notifications</span>
                  <i className="fas fa-arrow-right ml-1 text-xs"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div 
          onClick={goToProfile}
          className="flex items-center space-x-3 bg-white rounded-full px-3 py-1 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
            {userData.avatar ? (
              <img 
                src={userData.avatar} 
                alt="User Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <i className="fas fa-user text-gray-600"></i>
            )}
          </div>
          <div className="text-sm">
            <div className="font-semibold text-gray-800">{userData.name}</div>
            <div className="text-gray-500 text-xs">{userData.usercode}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header; 