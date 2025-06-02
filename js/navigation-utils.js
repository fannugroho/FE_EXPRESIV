// Centralized Navigation Utilities for Approval Pages
// This file provides consistent navigation across all approval pages

// Function to calculate the correct relative path based on current location
function getRelativePathToRoot() {
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/').filter(segment => segment !== '');
    
    // Remove the filename if it exists (ends with .html)
    if (pathSegments.length > 0 && pathSegments[pathSegments.length - 1].includes('.html')) {
        pathSegments.pop();
    }
    
    // Calculate how many directories we need to go back
    let goBackCount = 0;
    
    // Count directories after the main project folder
    for (let i = 0; i < pathSegments.length; i++) {
        // Skip until we find a main directory
        if (pathSegments[i] === 'approvalPages' || 
            pathSegments[i] === 'pages' || 
            pathSegments[i] === 'addPages' || 
            pathSegments[i] === 'detailPages') {
            goBackCount = pathSegments.length - i;
            break;
        }
    }
    
    return '../'.repeat(goBackCount);
}

// Standard navigation functions that work from any location
function goToMenu() { 
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/dashboard.html"; 
}

function goToMenuPR() { 
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/menuPR.html"; 
}

function goToAddPR() {
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "addPages/addPR.html"; 
}

function goToAddReim() {
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "addPages/AddReim.html"; 
}

function goToAddCash() {
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "addPages/AddCash.html"; 
}

function goToAddSettle() {
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "addPages/AddSettle.html"; 
}

function goToAddPO() {
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "addPages/AddPO.html"; 
}

// Detail pages
function goToDetailReim(reimId) {
    const basePath = getRelativePathToRoot();
    window.location.href = `${basePath}detailPages/detailReim.html?reim-id=${reimId}`;
}

function goToDetailCash(cashId) {
    const basePath = getRelativePathToRoot();
    window.location.href = `${basePath}detailPages/detailCash.html?cash-id=${cashId}`;
}

function goToDetailSettle(settleId) {
    const basePath = getRelativePathToRoot();
    window.location.href = `${basePath}detailPages/detailSettle.html?settle-id=${settleId}`;
}

function goToDetailPR(prId, prType) {
    const basePath = getRelativePathToRoot();
    window.location.href = `${basePath}detailPages/detailPR.html?pr-id=${prId}&pr-type=${prType}`;
}

// Menu pages
function goToMenuAPR() { 
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/menuPR.html"; 
}

function goToMenuPO() { 
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/MenuPO.html"; 
}

function goToMenuReim() { 
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/menuReim.html"; 
}

function goToMenuCash() { 
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/menuCash.html"; 
}

function goToMenuSettle() { 
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/menuSettle.html"; 
}

function goToApprovalReport() { 
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/ApprovalReport.html"; 
}

function goToMenuInvoice() { 
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/MenuInvoice.html"; 
}

function goToMenuBanking() { 
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/MenuBanking.html"; 
}

// Dashboard navigation for approval workflows
function goToPRCheckDashboard() {
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "approvalPages/dashboard/dashboardCheck/purchaseRequest/menuPRCheck.html";
}

function goToCashCheckDashboard() {
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "approvalPages/dashboard/dashboardCheck/cashAdvance/menuCashCheck.html";
}

function goToReimCheckDashboard() {
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "approvalPages/dashboard/dashboardCheck/reimbursement/menuReimCheck.html";
}

function goToSettleCheckDashboard() {
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "approvalPages/dashboard/dashboardCheck/settlement/menuSettleCheck.html";
}

// Approval pages navigation
function goToCheckedPR() { 
    // This will be context-dependent, staying in current approval type
    window.location.href = "checkedPR.html"; 
}

function goToCheckedReim() { 
    // Navigate to sibling reimbursement check page
    window.location.href = "../reimbursement/checkedReim.html"; 
}

function goToCheckedCash() { 
    // Navigate to sibling cash advance check page
    window.location.href = "../cashAdvance/checkedCash.html"; 
}

function goToCheckedSettle() { 
    // Navigate to sibling settlement check page
    window.location.href = "../settlement/checkedSettle.html"; 
}

// Logout function
function logout() { 
    // Clear all authentication data
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("loggedInUserCode");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRoles");
    
    // Navigate to login
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/login.html"; 
}

// Profile navigation
function goToProfile() {
    const basePath = getRelativePathToRoot();
    window.location.href = basePath + "pages/profil.html";
} 