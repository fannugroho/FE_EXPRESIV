import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Dashboard from './Dashboard';

// Import other components as needed
// import Login from './Login';
// import Profile from './Profile';
// import MenuPR from './MenuPR';
// ... other imports

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* 
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/menu-pr" element={<MenuPR />} />
        <Route path="/check-pr" element={<CheckPR />} />
        <Route path="/acknow-pr" element={<AcknowPR />} />
        <Route path="/approv-pr" element={<ApprovPR />} />
        <Route path="/receive-pr" element={<ReceivePR />} />
        <Route path="/menu-reim" element={<MenuReim />} />
        <Route path="/menu-cash" element={<MenuCash />} />
        <Route path="/menu-settle" element={<MenuSettle />} />
        <Route path="/menu-apr" element={<MenuAPR />} />
        <Route path="/menu-po" element={<MenuPO />} />
        <Route path="/menu-banking" element={<MenuBanking />} />
        <Route path="/menu-invoice" element={<MenuInvoice />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user-list" element={<UserList />} />
        <Route path="/role-list" element={<RoleList />} />
        */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 