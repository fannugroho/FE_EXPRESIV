/**
 * Navigation functions for the sidebar
 */

// Calculate relative path depth
function getBasePath() {
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);
    
    // Calculate relative path depth
    let basePath = '';
    const depth = pathSegments.length - 1; // -1 because we don't count the HTML file itself
    
    if (depth > 0) {
        basePath = '../'.repeat(depth);
    }
    
    return basePath;
}

// Main Dashboard
function goToMenu() {
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/dashboard.html`;
}

// Purchase Request Navigation
function goToMenuPR() {
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/menuPR.html`;
}

function goToMenuCheckPR() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardCheck/purchaseRequest/menuPRCheck.html`;
}

function goToMenuAcknowPR() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardAcknowledge/purchaseRequest/menuPRAcknow.html`;
}

function goToMenuApprovPR() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardApprove/purchaseRequest/menuPRApprove.html`;
}

function goToMenuReceivePR() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardReceive/purchaseRequest/menuPRReceive.html`;
}

function goToMenuRevisionPR() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardRevision/purchaseRequest/menuPRRevision.html`;
}

// Reimbursement Navigation
function goToAddReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}addPages/addReim.html`;
}

function goToMenuReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/menuReim.html`;
}

function goToMenuCheckReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardCheck/reimbursement/menuReimCheck.html`;
}

function goToMenuAcknowReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardAcknowledge/reimbursement/menuReimAcknow.html`;
}

function goToMenuApprovReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardApprove/reimbursement/menuReimApprove.html`;
}

function goToMenuReceiveReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardReceive/reimbursement/menuReimReceive.html`;
}

function goToMenuRevisionReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardRevision/reimbursement/menuReimRevision.html`;
}

// Outgoing Payment Reimbursement Navigation
function goToMenuOPReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/menuOPReim.html`;
}

function goToMenuCheckOPReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardCheck/OPReim/menuOPReimCheck.html`;
}

function goToMenuAcknowOPReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardAcknowledge/OPReim/menuOPReimAcknow.html`;
}

function goToMenuApprovOPReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html`;
}

function goToMenuReceiveOPReim() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardReceive/OPReim/menuOPReimReceive.html`;
}

// Cash Advance Navigation
function goToMenuCash() {
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/menuCash.html`;
}

function goToMenuCheckCash() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardCheck/cashAdvance/menuCashCheck.html`;
}

function goToMenuAcknowCash() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html`;
}

function goToMenuApprovCash() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardApprove/cashAdvance/menuCashApprove.html`;
}

function goToMenuReceiveCash() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardReceive/cashAdvance/menuCashReceive.html`;
}

function goToMenuRevisionCash() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardRevision/cashAdvance/menuCashRevision.html`;
}

function goToMenuCloseCash() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardClose/cashAdvance/menuCloser.html`;
}

// Settlement Navigation
function goToMenuSettle() {
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/menuSettle.html`;
}

function goToMenuCheckSettle() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardCheck/settlement/menuSettleCheck.html`;
}

function goToMenuAcknowSettle() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardAcknowledge/settlement/menuSettleAcknow.html`;
}

function goToMenuApprovSettle() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardApprove/settlement/menuSettleApprove.html`;
}

function goToMenuReceiveSettle() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardReceive/settlement/menuSettleReceive.html`;
}

function goToMenuRevisionSettle() {
    const basePath = getBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardRevision/settlement/menuSettleRevision.html`;
}

// Decision Report Navigation
function goToMenuAPR() {
    const basePath = getBasePath();
    window.location.href = `${basePath}decisionReportApproval/dashboardApprove/purchaseRequest/menuPRApprove.html`;
}

function goToMenuPO() {
    // Placeholder - Update with correct path
    alert('PO Approval page is not yet implemented');
}

function goToMenuBanking() {
    // Placeholder - Update with correct path
    alert('Outgoing Approval page is not yet implemented');
}

function goToMenuInvoice() {
    // Placeholder - Update with correct path
    alert('AR Invoice Approval page is not yet implemented');
}

// Admin Navigation
function goToMenuRegist() {
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/register.html`;
}

function goToMenuUser() {
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/dashboard-users.html`;
}

function goToMenuRole() {
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/dashboard-roles.html`;
}

// Profile and Logout
function goToProfile() {
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/profil.html`;
}

function logout() {
    // Clear any authentication tokens or session data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInUserCode");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRoles");
    // Redirect to login page
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/login.html`;
} 