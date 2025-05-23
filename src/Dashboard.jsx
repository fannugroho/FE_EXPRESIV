import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Guest',
    usercode: '',
    avatar: ''
  });
  const [stats, setStats] = useState({
    totalDocs: 0,
    openDocs: 0,
    preparedDocs: 0,
    checkedDocs: 0,
    acknowledgeDocs: 0,
    approvedDocs: 0,
    receivedDocs: 0,
    rejectDocs: 0
  });

  useEffect(() => {
    loadUserGreeting();
    loadDashboardAvatar();
    loadDashboard();

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

  const loadUserGreeting = () => {
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
            avatar: userData.avatar
          });
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    }
  };

  const loadDashboardAvatar = () => {
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar) {
      setUserData(prev => ({
        ...prev,
        avatar: savedAvatar
      }));
    }
  };

  const loadDashboard = () => {
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    setStats({
      totalDocs: documents.length,
      openDocs: documents.filter(doc => doc.docStatus === "Open").length,
      preparedDocs: documents.filter(doc => doc.docStatus === "Prepared").length,
      checkedDocs: documents.filter(doc => doc.docStatus === "Checked").length,
      acknowledgeDocs: documents.filter(doc => doc.docStatus === "Acknowledge").length,
      approvedDocs: documents.filter(doc => doc.docStatus === "Approved").length,
      receivedDocs: documents.filter(doc => doc.docStatus === "Received").length,
      rejectDocs: documents.filter(doc => doc.docStatus === "Rejected").length
    });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleSubMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const toggleNotification = () => {
    setNotificationVisible(!notificationVisible);
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    navigate('/login');
  };

  // Navigation functions
  const goToMenu = () => navigate('/dashboard');
  const goToMenuPR = () => navigate('/menu-pr');
  const goToMenuCheckPR = () => navigate('/check-pr');
  const goToMenuAcknowPR = () => navigate('/acknow-pr');
  const goToMenuApprovPR = () => navigate('/approv-pr');
  const goToMenuReceivePR = () => navigate('/receive-pr');
  const goToMenuReim = () => navigate('/menu-reim');
  const goToMenuCash = () => navigate('/menu-cash');
  const goToMenuSettle = () => navigate('/menu-settle');
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
      >
        <div className="sidebar-logo-container">
          <img src="../image/Seiho.png" alt="Dentsu Soken" className="h-12 w-auto max-w-full mx-auto" />
        </div>
        
        <div className="px-3 py-4">
          <button 
            onClick={goToMenu} 
            className="menu-btn w-full text-left flex items-center py-2.5 px-3 rounded mb-1 active-menu-item"
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
              <button onClick={goToMenuPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Add Purchase Request</button>
              <button onClick={goToMenuCheckPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Checked Purchase Request</button>
              <button onClick={goToMenuAcknowPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Acknowledge Purchase Request</button>
              <button onClick={goToMenuApprovPR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Approval Purchase Request</button>
              <button onClick={goToMenuReceivePR} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Receive Purchase Request</button>
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
              <button onClick={goToMenuReim} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Add Reimbursement</button>
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
              <button onClick={goToMenuCash} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Add Cash Advance</button>
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
              <button onClick={goToMenuSettle} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Add Settlement</button>
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
              <button onClick={goToMenuRegist} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Register User</button>
              <button onClick={goToMenuUser} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> User List</button>
              <button onClick={goToMenuRole} className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm"> Role List</button>
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
          className="absolute bottom-4 right-[-12px] bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md cursor-pointer z-10 text-gray-500 text-xs"
        >
          <i className={`fas fa-chevron-${isSidebarCollapsed ? 'right' : 'left'}`}></i>
        </div>
      </aside>

      {/* User Avatar */}
      <div className="absolute top-4 right-4 flex items-center space-x-4">
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
            className={`notification-dropdown ${notificationVisible ? '' : 'hidden'} absolute right-0 mt-2 min-w-max w-72 max-w-xs bg-white z-20`}
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
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h2 id="greeting" className="text-5xl font-bold text-white mb-2">
            Hii {userData.name} {userData.usercode ? `(${userData.usercode})` : ''}
          </h2>
          <h2 className="text-2xl font-medium text-white opacity-80 mb-8">Welcome to Dashboard Expressiv System</h2>
          
          <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-filter backdrop-blur-sm border border-white border-opacity-20 mb-8">
            <h3 className="text-white text-xl font-semibold mb-4">System Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-lg text-center card-hover stat-card">
                <div className="text-blue-600 mb-2"><i className="text-2xl"></i></div>
                <h3 className="text-lg font-semibold text-gray-800">Purchase Request</h3>
                <p id="totalDocs" className="text-3xl font-bold text-blue-600 mt-2">{stats.totalDocs}</p>
                <p className="text-gray-500 text-sm mt-1">Total Documents</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-lg text-center card-hover stat-card">
                <div className="text-blue-600 mb-2"><i className="text-2xl"></i></div>
                <h3 className="text-lg font-semibold text-gray-800">Reimbursement</h3>
                <p id="openDocs" className="text-3xl font-bold text-blue-600 mt-2">{stats.openDocs}</p>
                <p className="text-gray-500 text-sm mt-1">Total Documents</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-lg text-center card-hover stat-card">
                <div className="text-blue-600 mb-2"><i className=" text-2xl"></i></div>
                <h3 className="text-lg font-semibold text-gray-800">Cash Advance</h3>
                <p id="preparedDocs" className="text-3xl font-bold text-blue-600 mt-2">{stats.preparedDocs}</p>
                <p className="text-gray-500 text-sm mt-1">Total Documents</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-lg text-center card-hover stat-card">
                <div className="text-blue-600 mb-2"><i className=" text-2xl"></i></div>
                <h3 className="text-lg font-semibold text-gray-800">Settlement</h3>
                <p id="checkedDocs" className="text-3xl font-bold text-blue-600 mt-2">{stats.checkedDocs}</p>
                <p className="text-gray-500 text-sm mt-1">Total Documents</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-filter backdrop-blur-sm border border-white border-opacity-20">
            <h3 className="text-white text-xl font-semibold mb-4">Approval Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-lg text-center card-hover stat-card">
                <div className="text-green-600 mb-2"><i className=" text-2xl"></i></div>
                <h3 className="text-lg font-semibold text-gray-800">PR Approval</h3>
                <p id="acknowledgeDocs" className="text-3xl font-bold text-green-600 mt-2">{stats.acknowledgeDocs}</p>
                <p className="text-gray-500 text-sm mt-1">Pending Approvals</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-lg text-center card-hover stat-card">
                <div className="text-green-600 mb-2"><i className="text-2xl"></i></div>
                <h3 className="text-lg font-semibold text-gray-800">PO Approval</h3>
                <p id="approvedDocs" className="text-3xl font-bold text-green-600 mt-2">{stats.approvedDocs}</p>
                <p className="text-gray-500 text-sm mt-1">Pending Approvals</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-lg text-center card-hover stat-card">
                <div className="text-green-600 mb-2"><i className="text-2xl"></i></div>
                <h3 className="text-lg font-semibold text-gray-800">Outgoing Payment</h3>
                <p id="receivedDocs" className="text-3xl font-bold text-green-600 mt-2">{stats.receivedDocs}</p>
                <p className="text-gray-500 text-sm mt-1">Pending Approvals</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-lg text-center card-hover stat-card">
                <div className="text-green-600 mb-2"><i className="text-2xl"></i></div>
                <h3 className="text-lg font-semibold text-gray-800">AR Invoice</h3>
                <p id="rejectDocs" className="text-3xl font-bold text-green-600 mt-2">{stats.rejectDocs}</p>
                <p className="text-gray-500 text-sm mt-1">Pending Approvals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 