/**
 * Navigation functions for the sidebar
 * Enhanced version with better path calculation and glitch prevention
 */

// Cache for base path to prevent recalculation
let cachedBasePath = null;

// Calculate relative path depth with caching
function getBasePath() {
    if (cachedBasePath !== null) {
        return cachedBasePath;
    }
    
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);
    
    // Calculate relative path depth
    let basePath = '';
    const depth = pathSegments.length - 1; // -1 because we don't count the HTML file itself
    
    if (depth > 0) {
        basePath = '../'.repeat(depth);
    }
    
    cachedBasePath = basePath;
    return basePath;
}

// Enhanced navigation function with error handling
function navigateToPage(path) {
    try {
        const basePath = getBasePath();
        const fullPath = `${basePath}${path}`;
        
        // Add loading indicator
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.opacity = '0.7';
        }
        
        // Navigate with a small delay to show loading state
        setTimeout(() => {
            window.location.href = fullPath;
        }, 100);
        
    } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to direct navigation
        window.location.href = path;
    }
}

// Main Dashboard
function goToMenu() {
    navigateToPage('pages/dashboard.html');
}

// Purchase Request Navigation
function goToMenuPR() {
    navigateToPage('pages/menuPR.html');
}

function goToMenuCheckPR() {
    navigateToPage('approvalPages/dashboard/dashboardCheck/purchaseRequest/menuPRCheck.html');
}

function goToMenuAcknowPR() {
    navigateToPage('approvalPages/dashboard/dashboardAcknowledge/purchaseRequest/menuPRAcknow.html');
}

function goToMenuApprovPR() {
    navigateToPage('approvalPages/dashboard/dashboardApprove/purchaseRequest/menuPRApprove.html');
}

function goToMenuReceivePR() {
    navigateToPage('approvalPages/dashboard/dashboardReceive/purchaseRequest/menuPRReceive.html');
}

function goToMenuRevisionPR() {
    navigateToPage('approvalPages/dashboard/dashboardRevision/purchaseRequest/menuPRRevision.html');
}

// Reimbursement Navigation
function goToAddReim() {
    navigateToPage('addPages/addReim.html');
}

function goToMenuReim() {
    navigateToPage('pages/menuReim.html');
}

function goToMenuCheckReim() {
    navigateToPage('approvalPages/dashboard/dashboardCheck/reimbursement/menuReimCheck.html');
}

function goToMenuAcknowReim() {
    navigateToPage('approvalPages/dashboard/dashboardAcknowledge/reimbursement/menuReimAcknow.html');
}

function goToMenuApprovReim() {
    navigateToPage('approvalPages/dashboard/dashboardApprove/reimbursement/menuReimApprove.html');
}

function goToMenuReceiveReim() {
    navigateToPage('approvalPages/dashboard/dashboardReceive/reimbursement/menuReimReceive.html');
}

function goToMenuRevisionReim() {
    navigateToPage('approvalPages/dashboard/dashboardRevision/reimbursement/menuReimRevision.html');
}

// Outgoing Payment Reimbursement Navigation
function goToMenuOPReim() {
    navigateToPage('pages/menuOPReim.html');
}

function goToMenuCheckOPReim() {
    navigateToPage('approvalPages/dashboard/dashboardCheck/OPReim/menuOPReimCheck.html');
}

function goToMenuAcknowOPReim() {
    navigateToPage('approvalPages/dashboard/dashboardAcknowledge/OPReim/menuOPReimAcknow.html');
}

function goToMenuApprovOPReim() {
    navigateToPage('approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html');
}

function goToMenuReceiveOPReim() {
    navigateToPage('approvalPages/dashboard/dashboardReceive/OPReim/menuOPReimReceive.html');
}

// Cash Advance Navigation
function goToMenuCash() {
    navigateToPage('pages/menuCash.html');
}

function goToMenuCheckCash() {
    navigateToPage('approvalPages/dashboard/dashboardCheck/cashAdvance/menuCashCheck.html');
}

function goToMenuAcknowCash() {
    navigateToPage('approvalPages/dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html');
}

function goToMenuApprovCash() {
    navigateToPage('approvalPages/dashboard/dashboardApprove/cashAdvance/menuCashApprove.html');
}

function goToMenuReceiveCash() {
    navigateToPage('approvalPages/dashboard/dashboardReceive/cashAdvance/menuCashReceive.html');
}

function goToMenuRevisionCash() {
    navigateToPage('approvalPages/dashboard/dashboardRevision/cashAdvance/menuCashRevision.html');
}

function goToMenuCloseCash() {
    navigateToPage('approvalPages/dashboard/dashboardClose/cashAdvance/menuCloser.html');
}

// Settlement Navigation
function goToMenuSettle() {
    navigateToPage('pages/menuSettle.html');
}

function goToMenuCheckSettle() {
    navigateToPage('approvalPages/dashboard/dashboardCheck/settlement/menuSettleCheck.html');
}

function goToMenuAcknowSettle() {
    navigateToPage('approvalPages/dashboard/dashboardAcknowledge/settlement/menuSettleAcknow.html');
}

function goToMenuApprovSettle() {
    navigateToPage('approvalPages/dashboard/dashboardApprove/settlement/menuSettleApprove.html');
}

function goToMenuReceiveSettle() {
    navigateToPage('approvalPages/dashboard/dashboardReceive/settlement/menuSettleReceive.html');
}

function goToMenuRevisionSettle() {
    navigateToPage('approvalPages/dashboard/dashboardRevision/settlement/menuSettleRevision.html');
}

// Decision Report Navigation
function goToMenuAPR() {
    navigateToPage('decisionReportApproval/dashboardApprove/purchaseRequest/menuPRApprove.html');
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
    navigateToPage('pages/register.html');
}

function goToMenuUser() {
    navigateToPage('pages/dashboard-users.html');
}

function goToMenuRole() {
    navigateToPage('pages/dashboard-roles.html');
}

// Profile and Logout
function goToProfile() {
    navigateToPage('pages/profil.html');
}

function logout() {
    // Clear any authentication tokens or session data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInUserCode");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRoles");
    localStorage.removeItem("hasOutgoingPaymentAccess");
    
    // Clear cached base path
    cachedBasePath = null;
    
    // Redirect to login page
    const basePath = getBasePath();
    window.location.href = `${basePath}pages/login.html`;
}

// Reset cache when page loads (for development)
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        cachedBasePath = null;
    });
} 