import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../Dashboard.css';

const Layout = ({ children, title = "Dashboard" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Guest',
    usercode: '',
    avatar: ''
  });

  useEffect(() => {
    loadUserData();

    // Close notification dropdown when clicking outside
    const handleClickOutside = (e) => {
      const dropdown = document.getElementById("notificationDropdown");
      const btn = document.getElementById("notificationBtn");
      if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        setNotificationVisible(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const loadUserData = () => {
    const usersData = localStorage.getItem("users");
    const loggedInUserCode = localStorage.getItem("loggedInUserCode");

    if (usersData && loggedInUserCode) {
      try {
        const users = JSON.parse(usersData);
        const loggedInUser = users.find(user => user.usercode === loggedInUserCode);

        if (loggedInUser) {
          setUserData({
            name: loggedInUser.name,
            usercode: loggedInUser.usercode,
            avatar: localStorage.getItem("userAvatar") || ''
          });
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleSubMenu = (menuId) => {
    setExpandedMenus(prev => {
      // Close all other submenus when opening a new one
      const newState = {};
      Object.keys(prev).forEach(key => {
        newState[key] = key === menuId ? !prev[key] : false;
      });
      newState[menuId] = !prev[menuId];
      return newState;
    });
  };

  const toggleNotification = () => {
    setNotificationVisible(!notificationVisible);
  };

  const isActiveMenu = (path) => {
    return location.pathname === path;
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInUserCode");
    navigate('/login');
  };

  // Navigation functions
  const goToMenu = () => navigate('/dashboard');
  const goToMenuPR = () => navigate('/add-pr');
  const goToMenuCheckPR = () => navigate('/check-pr');
  const goToMenuAcknowPR = () => navigate('/acknow-pr');
  const goToMenuApprovPR = () => navigate('/approv-pr');
  const goToMenuReceivePR = () => navigate('/receive-pr');
  const goToMenuReim = () => navigate('/add-reim');
  const goToMenuCash = () => navigate('/add-cash');
  const goToMenuSettle = () => navigate('/add-settle');
  const goToMenuAPR = () => navigate('/menu-apr');
  const goToMenuPO = () => navigate('/menu-po');
  const goToMenuBanking = () => navigate('/menu-banking');
  const goToMenuInvoice = () => navigate('/menu-invoice');
  const goToMenuRegist = () => navigate('/register');
  const goToMenuUser = () => navigate('/user-list');
  const goToMenuRole = () => navigate('/role-list');

  return (
    <div className="flex min-h-screen bg-gradient">
      {/* Sidebar */}
      <aside 
        id="sidebar" 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg transition-all duration-300 relative`}
        style={{
          height: '100vh',
          position: 'sticky',
          top: 0,
          overflowY: 'auto',
          scrollbarWidth: 'thin'
        }}
      >
        <div className="sidebar-logo-container">
          <img src="../image/Seiho.png" alt="Dentsu Soken" className="h-12 w-auto max-w-full mx-auto" />
        </div>
        
        <div className="px-3 py-4">
          <button 
            onClick={goToMenu} 
            className={`menu-btn w-full text-left flex items-center py-2.5 px-3 rounded mb-1 ${isActiveMenu('/dashboard') ? 'active-menu-item' : ''}`}
          >
            <span className={`menu-icon ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
              <i className="fas fa-home"></i>
            </span>
            <span className={`ml-3 ${isSidebarCollapsed ? 'hidden' : ''}`}>Dashboard</span>
          </button>
          
          <div className={`menu-category ${isSidebarCollapsed ? 'hidden' : ''}`}>Request Management</div>
          
          <div className="mb-1">
            <button 
              onClick={() => toggleSubMenu('MenuPurchaseReq')} 
              className="menu-btn w-full text-left flex items-center justify-between py-2.5 px-3 rounded"
            >
              <div className="flex items-center">
                <span className={`menu-icon ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                  <i className="fas fa-file-invoice-dollar"></i>
                </span>
                <span className={`ml-3 ${isSidebarCollapsed ? 'hidden' : ''}`}>Purchase Request</span>
              </div>
              <i className={`fas fa-chevron-right text-xs transition-transform duration-200 ${isSidebarCollapsed ? 'hidden' : ''} ${expandedMenus.MenuPurchaseReq ? 'transform rotate-90' : ''}`}></i>
            </button>
            <div id="MenuPurchaseReq" className={`${expandedMenus.MenuPurchaseReq ? '' : 'hidden'} pl-10 mt-1 mb-1`}>
              <button onClick={goToMenuPR} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/add-pr') ? 'bg-blue-50 text-blue-600' : ''}`}> Add Purchase Request</button>
              <button onClick={goToMenuCheckPR} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/check-pr') ? 'bg-blue-50 text-blue-600' : ''}`}> Checked Purchase Request</button>
              <button onClick={goToMenuAcknowPR} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/acknow-pr') ? 'bg-blue-50 text-blue-600' : ''}`}> Acknowledge Purchase Request</button>
              <button onClick={goToMenuApprovPR} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/approv-pr') ? 'bg-blue-50 text-blue-600' : ''}`}> Approval Purchase Request</button>
              <button onClick={goToMenuReceivePR} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/receive-pr') ? 'bg-blue-50 text-blue-600' : ''}`}> Receive Purchase Request</button>
            </div>            
          </div>

          <div className="mb-1">
            <button 
              onClick={() => toggleSubMenu('MenuReimbursement')} 
              className="menu-btn w-full text-left flex items-center justify-between py-2.5 px-3 rounded"
            >
              <div className="flex items-center">
                <span className={`menu-icon ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                  <i className="fas fa-hand-holding-usd"></i>
                </span>
                <span className={`ml-3 ${isSidebarCollapsed ? 'hidden' : ''}`}>Reimbursement</span>
              </div>
              <i className={`fas fa-chevron-right text-xs transition-transform duration-200 ${isSidebarCollapsed ? 'hidden' : ''} ${expandedMenus.MenuReimbursement ? 'transform rotate-90' : ''}`}></i>
            </button>
            <div id="MenuReimbursement" className={`${expandedMenus.MenuReimbursement ? '' : 'hidden'} pl-10 mt-1 mb-1`}>
              <button onClick={goToMenuReim} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/add-reim') ? 'bg-blue-50 text-blue-600' : ''}`}> Add Reimbursement</button>
              <button onClick={goToMenuCheckPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Checked Reimbursement</button>
              <button onClick={goToMenuAcknowPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Acknowledge Reimbursement</button>
              <button onClick={goToMenuApprovPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Approval Reimbursement</button>
            </div>            
          </div>

          <div className="mb-1">
            <button 
              onClick={() => toggleSubMenu('MenuCashAdvance')} 
              className="menu-btn w-full text-left flex items-center justify-between py-2.5 px-3 rounded"
            >
              <div className="flex items-center">
                <span className={`menu-icon ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                  <i className="fas fa-wallet"></i>
                </span>
                <span className={`ml-3 ${isSidebarCollapsed ? 'hidden' : ''}`}>Cash Advance</span>
              </div>
              <i className={`fas fa-chevron-right text-xs transition-transform duration-200 ${isSidebarCollapsed ? 'hidden' : ''} ${expandedMenus.MenuCashAdvance ? 'transform rotate-90' : ''}`}></i>
            </button>
            <div id="MenuCashAdvance" className={`${expandedMenus.MenuCashAdvance ? '' : 'hidden'} pl-10 mt-1 mb-1`}>
              <button onClick={goToMenuCash} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/add-cash') ? 'bg-blue-50 text-blue-600' : ''}`}> Add Cash Advance</button>
              <button onClick={goToMenuCheckPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Checked Cash Advance</button>
              <button onClick={goToMenuAcknowPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Acknowledge Cash Advance</button>
              <button onClick={goToMenuApprovPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Approval Cash Advance</button>
            </div>            
          </div>

          <div className="mb-1">
            <button 
              onClick={() => toggleSubMenu('MenuSettlement')} 
              className="menu-btn w-full text-left flex items-center justify-between py-2.5 px-3 rounded"
            >
              <div className="flex items-center">
                <span className={`menu-icon ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                  <i className="fas fa-balance-scale"></i>
                </span>
                <span className={`ml-3 ${isSidebarCollapsed ? 'hidden' : ''}`}>Settlement</span>
              </div>
              <i className={`fas fa-chevron-right text-xs transition-transform duration-200 ${isSidebarCollapsed ? 'hidden' : ''} ${expandedMenus.MenuSettlement ? 'transform rotate-90' : ''}`}></i>
            </button>
            <div id="MenuSettlement" className={`${expandedMenus.MenuSettlement ? '' : 'hidden'} pl-10 mt-1 mb-1`}>
              <button onClick={goToMenuSettle} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/add-settle') ? 'bg-blue-50 text-blue-600' : ''}`}> Add Settlement</button>
              <button onClick={goToMenuCheckPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Checked Settlement</button>
              <button onClick={goToMenuAcknowPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Acknowledge Settlement</button>
              <button onClick={goToMenuApprovPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Approval Settlement</button>
            </div>            
          </div>

          <div className={`menu-category ${isSidebarCollapsed ? 'hidden' : ''}`}>Approval Center</div>
        
          <div className="mb-1">
            <button 
              onClick={() => toggleSubMenu('ApprovalReport')} 
              className="menu-btn w-full text-left flex items-center justify-between py-2.5 px-3 rounded"
            >
              <div className="flex items-center">
                <span className={`menu-icon ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                  <i className="fas fa-check-circle"></i>
                </span>
                <span className={`ml-3 ${isSidebarCollapsed ? 'hidden' : ''}`}>Decision Report</span>
              </div>
              <i className={`fas fa-chevron-right text-xs transition-transform duration-200 ${isSidebarCollapsed ? 'hidden' : ''} ${expandedMenus.ApprovalReport ? 'transform rotate-90' : ''}`}></i>
            </button>
            <div id="ApprovalReport" className={`${expandedMenus.ApprovalReport ? '' : 'hidden'} pl-10 mt-1 mb-1`}>
              <button onClick={goToMenuAPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> PR Approval</button>
              <button onClick={goToMenuPO} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> PO Approval</button>
              <button onClick={goToMenuBanking} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Outgoing Approval</button>
              <button onClick={goToMenuInvoice} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> AR Invoice Approval</button>
            </div>
          </div>

          <div className={`menu-category ${isSidebarCollapsed ? 'hidden' : ''}`}>Administration</div>

          <div className="mb-1">
            <button 
              onClick={() => toggleSubMenu('settings')} 
              className="menu-btn w-full text-left flex items-center justify-between py-2.5 px-3 rounded"
            >
              <div className="flex items-center">
                <span className={`menu-icon ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                  <i className="fas fa-cog"></i>
                </span>
                <span className={`ml-3 ${isSidebarCollapsed ? 'hidden' : ''}`}>Settings</span>
              </div>
              <i className={`fas fa-chevron-right text-xs transition-transform duration-200 ${isSidebarCollapsed ? 'hidden' : ''} ${expandedMenus.settings ? 'transform rotate-90' : ''}`}></i>
            </button>
            <div id="settings" className={`${expandedMenus.settings ? '' : 'hidden'} pl-10 mt-1 mb-1`}>
              <button onClick={goToMenuRegist} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/register') ? 'bg-blue-50 text-blue-600' : ''}`}> Register User</button>
              <button onClick={goToMenuUser} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/user-list') ? 'bg-blue-50 text-blue-600' : ''}`}> User List</button>
              <button onClick={goToMenuRole} className={`submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm ${isActiveMenu('/role-list') ? 'bg-blue-50 text-blue-600' : ''}`}> Role List</button>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-gray-200">
            <button 
              onClick={logout} 
              className="menu-btn w-full text-left flex items-center py-2.5 px-3 text-red-500 rounded"
            >
              <span className={`menu-icon ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                <i className="fas fa-sign-out-alt"></i>
              </span>
              <span className={`ml-3 ${isSidebarCollapsed ? 'hidden' : ''}`}>Logout</span>
            </button>
          </div>
        </div>
        
        <div 
          id="sidebarToggle" 
          onClick={toggleSidebar} 
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '-12px',
            background: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            zIndex: 10,
            fontSize: '0.7rem',
            color: '#6B7280'
          }}
        >
          <i className={`fas fa-chevron-${isSidebarCollapsed ? 'right' : 'left'}`}></i>
        </div>
      </aside>

      {/* User Avatar & Notifications */}
      <div className="absolute top-4 right-4 flex items-center space-x-4 z-30">
        {/* Notification Bell with Badge */}
        <div className="relative">
          <button 
            id="notificationBtn" 
            className="notification-btn relative text-white focus:outline-none p-2 rounded-full flex items-center justify-center w-10 h-10"
            onClick={toggleNotification}
          >
            <i className="fas fa-bell text-xl"></i>
            <span className="notification-badge absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">2</span>
          </button>
          
          {/* Notification Dropdown */}
          <div 
            id="notificationDropdown" 
            className={`notification-dropdown ${notificationVisible ? '' : 'hidden'} absolute right-0 mt-2 min-w-max w-72 max-w-xs bg-white z-20 rounded-xl border border-gray-200 shadow-lg`}
          >
            <div className="p-4 font-bold border-b bg-gray-50 rounded-t-lg flex items-center">
              <i className="fas fa-bell text-blue-500 mr-2"></i>
              <span>Notifikasi</span>
            </div>
            <ul className="py-2 text-sm text-gray-700 max-h-80 overflow-y-auto">
              <li className="notification-item px-4 py-3 hover:bg-gray-100 cursor-pointer whitespace-nowrap">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-1">
                    <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <i className="fas fa-file-invoice-dollar text-blue-500"></i>
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">Purchase Request document</div>
                    <div className="text-xs text-gray-500">Requires approval</div>
                    <div className="text-xs text-gray-400 mt-1">5 minutes ago</div>
                  </div>
                </div>
              </li>
              <li className="notification-item px-4 py-3 hover:bg-gray-100 cursor-pointer whitespace-nowrap">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-1">
                    <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <i className="fas fa-hand-holding-usd text-green-500"></i>
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">Reimbursement document</div>
                    <div className="text-xs text-gray-500">Requires approval</div>
                    <div className="text-xs text-gray-400 mt-1">1 hour ago</div>
                  </div>
                </div>
              </li>
            </ul>
            <div className="border-t p-3 text-right bg-gray-50 rounded-b-lg">
              <a href="#" className="text-blue-500 text-sm hover:underline flex items-center justify-center">
                <span>See All Notifications</span>
                <i className="fas fa-arrow-right ml-1 text-xs"></i>
              </a>
            </div>
          </div>
        </div>
    
        {/* User Avatar + Name */}
        <div className="user-profile flex items-center space-x-3 px-3 py-1.5 rounded-full">
          <img 
            id="dashboardUserIcon" 
            src={userData.avatar || ''} 
            alt="User Avatar"
            className="user-avatar w-9 h-9 rounded-full cursor-pointer"
            onClick={goToProfile}
          />
          <div>
            <span id="userNameDisplay" className="font-semibold text-white block leading-tight">
              {userData.name}
            </span>
            <span className="text-white text-opacity-70 text-xs">Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout; 