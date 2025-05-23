import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInUserCode");
    navigate('/login');
  };

  const isActiveRoute = (path) => location.pathname === path;

  const menuItems = [
    {
      title: "Dashboard",
      icon: "fas fa-home",
      action: () => navigate('/dashboard'),
      path: '/dashboard'
    },
    {
      category: "Request Management"
    },
    {
      title: "Purchase Request",
      icon: "fas fa-file-invoice-dollar",
      id: "MenuPurchaseReq",
      submenu: [
        { title: "Add Purchase Request", action: () => navigate('/add-pr') },
        { title: "Checked Purchase Request", action: () => navigate('/check-pr') },
        { title: "Acknowledge Purchase Request", action: () => navigate('/acknow-pr') },
        { title: "Approval Purchase Request", action: () => navigate('/approv-pr') },
        { title: "Receive Purchase Request", action: () => navigate('/receive-pr') }
      ]
    },
    {
      title: "Reimbursement",
      icon: "fas fa-hand-holding-usd",
      id: "MenuReimbursement",
      submenu: [
        { title: "Add Reimbursement", action: () => navigate('/add-reim') },
        { title: "Checked Reimbursement", action: () => navigate('/check-reim') },
        { title: "Acknowledge Reimbursement", action: () => navigate('/acknow-reim') },
        { title: "Approval Reimbursement", action: () => navigate('/approv-reim') }
      ]
    },
    {
      title: "Cash Advance",
      icon: "fas fa-wallet",
      id: "MenuCashAdvance",
      submenu: [
        { title: "Add Cash Advance", action: () => navigate('/add-cash') },
        { title: "Checked Cash Advance", action: () => navigate('/check-cash') },
        { title: "Acknowledge Cash Advance", action: () => navigate('/acknow-cash') },
        { title: "Approval Cash Advance", action: () => navigate('/approv-cash') }
      ]
    },
    {
      title: "Settlement",
      icon: "fas fa-balance-scale",
      id: "MenuSettlement", 
      submenu: [
        { title: "Add Settlement", action: () => navigate('/add-settle') },
        { title: "Checked Settlement", action: () => navigate('/check-settle') },
        { title: "Acknowledge Settlement", action: () => navigate('/acknow-settle') },
        { title: "Approval Settlement", action: () => navigate('/approv-settle') }
      ]
    },
    {
      category: "Approval Center"
    },
    {
      title: "Decision Report",
      icon: "fas fa-check-circle",
      id: "ApprovalReport",
      submenu: [
        { title: "PR Approval", action: () => navigate('/menu-apr') },
        { title: "PO Approval", action: () => navigate('/menu-po') },
        { title: "Outgoing Approval", action: () => navigate('/menu-banking') },
        { title: "AR Invoice Approval", action: () => navigate('/menu-invoice') }
      ]
    },
    {
      category: "Administration"
    },
    {
      title: "Settings",
      icon: "fas fa-cog",
      id: "settings",
      submenu: [
        { title: "Register User", action: () => navigate('/register') },
        { title: "User List", action: () => navigate('/user-list') },
        { title: "Role List", action: () => navigate('/role-list') }
      ]
    }
  ];

  return (
    <aside 
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg transition-all duration-300 relative`}
    >
      <div className="sidebar-logo-container">
        <img src="/image/Seiho.png" alt="Dentsu Soken" className="h-12 w-auto max-w-full mx-auto" />
      </div>
      
      <div className="px-3 py-4">
        {menuItems.map((item, index) => {
          if (item.category) {
            return (
              <div key={index} className={`menu-category ${isCollapsed ? 'hidden' : ''}`}>
                {item.category}
              </div>
            );
          }

          if (item.submenu) {
            return (
              <div key={index} className="mb-1">
                <button 
                  onClick={() => toggleSubMenu(item.id)} 
                  className="menu-btn w-full text-left flex items-center justify-between py-2.5 px-3 rounded"
                >
                  <div className="flex items-center">
                    <span className={`menu-icon ${isCollapsed ? 'mx-auto' : ''}`}>
                      <i className={item.icon}></i>
                    </span>
                    <span className={`ml-3 ${isCollapsed ? 'hidden' : ''}`}>{item.title}</span>
                  </div>
                  <i className={`fas fa-chevron-right text-xs transition-transform duration-200 ${isCollapsed ? 'hidden' : ''} ${expandedMenus[item.id] ? 'transform rotate-90' : ''}`}></i>
                </button>
                <div className={`${expandedMenus[item.id] ? '' : 'hidden'} pl-10 mt-1 mb-1`}>
                  {item.submenu.map((subItem, subIndex) => (
                    <button 
                      key={subIndex}
                      onClick={subItem.action} 
                      className="submenu-btn w-full text-left text-gray-600 py-2 px-2 rounded-md text-sm hover:bg-gray-100"
                    >
                      {subItem.title}
                    </button>
                  ))}
                </div>            
              </div>
            );
          }

          return (
            <button 
              key={index}
              onClick={item.action} 
              className={`menu-btn w-full text-left flex items-center py-2.5 px-3 rounded mb-1 ${
                isActiveRoute(item.path) ? 'active-menu-item' : ''
              }`}
            >
              <span className={`menu-icon ${isCollapsed ? 'mx-auto' : ''}`}>
                <i className={item.icon}></i>
              </span>
              <span className={`ml-3 ${isCollapsed ? 'hidden' : ''}`}>{item.title}</span>
            </button>
          );
        })}

        <div className="pt-4 mt-6 border-t border-gray-200">
          <button 
            onClick={logout} 
            className="menu-btn w-full text-left flex items-center py-2.5 px-3 text-red-500 rounded hover:bg-red-50"
          >
            <span className={`menu-icon ${isCollapsed ? 'mx-auto' : ''}`}>
              <i className="fas fa-sign-out-alt"></i>
            </span>
            <span className={`ml-3 ${isCollapsed ? 'hidden' : ''}`}>Logout</span>
          </button>
        </div>
      </div>
      
      <div 
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
        onClick={onToggle}
      >
        <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'} text-xs`}></i>
      </div>
    </aside>
  );
};

export default Sidebar; 