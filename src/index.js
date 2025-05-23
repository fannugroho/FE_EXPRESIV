import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Import components
import Dashboard from './Dashboard';
import Login from './components/Login';
import Profile from './components/Profile';
import MenuPR from './components/MenuPR';
import AddPR from './components/AddPR';

// Import sample data initializer
import { initializeSampleData } from './utils/sampleData';

// Initialize sample data
initializeSampleData();

const App = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/add-pr" element={<AddPR />} />
        <Route path="/check-pr" element={<MenuPR />} />
        <Route path="/acknow-pr" element={<MenuPR />} />
        <Route path="/approv-pr" element={<MenuPR />} />
        <Route path="/receive-pr" element={<MenuPR />} />
        <Route path="/add-reim" element={<MenuPR />} />
        <Route path="/check-reim" element={<MenuPR />} />
        <Route path="/acknow-reim" element={<MenuPR />} />
        <Route path="/approv-reim" element={<MenuPR />} />
        <Route path="/add-cash" element={<MenuPR />} />
        <Route path="/check-cash" element={<MenuPR />} />
        <Route path="/acknow-cash" element={<MenuPR />} />
        <Route path="/approv-cash" element={<MenuPR />} />
        <Route path="/add-settle" element={<MenuPR />} />
        <Route path="/check-settle" element={<MenuPR />} />
        <Route path="/acknow-settle" element={<MenuPR />} />
        <Route path="/approv-settle" element={<MenuPR />} />
        <Route path="/menu-pr" element={<MenuPR />} />
        <Route path="/menu-po" element={<MenuPR />} />
        <Route path="/menu-banking" element={<MenuPR />} />
        <Route path="/menu-invoice" element={<MenuPR />} />
        <Route path="/register" element={<MenuPR />} />
        <Route path="/user-list" element={<MenuPR />} />
        <Route path="/role-list" element={<MenuPR />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
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