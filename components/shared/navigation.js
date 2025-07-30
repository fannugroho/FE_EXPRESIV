/**
 * Navigation functions for the sidebar
 * Enhanced version with better path calculation and glitch prevention
 * NOTE: All navigation functions work without access verification
 */

// Cache for base path to prevent recalculation
let cachedBasePath = null;

// Calculate relative path depth with caching
function getBasePath() {
    if (cachedBasePath !== null) {
        return cachedBasePath;
    }

    const currentPath = window.location.pathname;
    console.log("Current path:", currentPath);
    const pathSegments = currentPath.split('/').filter(Boolean);
    console.log("Path segments:", pathSegments);

    // Calculate relative path depth
    let basePath = '';
    const depth = pathSegments.length - 1; // -1 because we don't count the HTML file itself
    console.log("Calculated depth:", depth);

    if (depth > 0) {
        basePath = '../'.repeat(depth);
    }

    console.log("Calculated basePath:", basePath);
    cachedBasePath = basePath;
    return basePath;
}

// Enhanced navigation function with error handling
function navigateToPage(path) {
    try {
        const basePath = getBasePath();
        const fullPath = `${basePath}${path}`;
        console.log("Navigation - Current path:", window.location.pathname);
        console.log("Navigation - Target path:", path);
        console.log("Navigation - Base path:", basePath);
        console.log("Navigation - Full path:", fullPath);

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

// Make navigateToPage available globally
if (typeof window !== 'undefined') {
    window.navigateToPage = navigateToPage;
}

// Global toggleSubMenu function for sidebar functionality
function toggleSubMenu(id) {
    const submenu = document.getElementById(id);
    const button = submenu.previousElementSibling;
    const chevron = button.querySelector('.fa-chevron-right');
    
    if (submenu.classList.contains('hidden')) {
        submenu.classList.remove('hidden');
        if (chevron) {
            chevron.style.transform = 'rotate(90deg)';
        }
    } else {
        submenu.classList.add('hidden');
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
    }
}

window.toggleSubMenu = toggleSubMenu;

// Main Dashboard - No access verification required
function goToMenu() {
    navigateToPage('pages/dashboard.html');
}

// Purchase Request Navigation - No access verification required
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

// Reimbursement Navigation - No access verification required
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

// Outgoing Payment Reimbursement Navigation - No access verification required
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

// Cash Advance Navigation - No access verification required
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

// Settlement Navigation - No access verification required
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

// Decision Report Navigation - No access verification required
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
    navigateToPage('pages/menuInvoice.html');
}

function goToAddARInvoice() {
    navigateToPage('pages/menuInvoice.html');
}

function goToMenuCheckARInvoice() {
    navigateToPage('approvalPages/dashboard/dashboardCheck/ARInvoice/menuARItemCheck.html');
}

function goToMenuAcknowARInvoice() {
    navigateToPage('approvalPages/dashboard/dashboardAcknowledge/ARInvoice/menuARItemAcknow.html');
}

function goToMenuApprovARInvoice() {
    navigateToPage('approvalPages/dashboard/dashboardApprove/ARInvoice/menuARItemApprove.html');
}

function goToMenuReceiveARInvoice() {
    navigateToPage('approvalPages/dashboard/dashboardReceive/ARInvoice/menuARItemReceive.html');
}

// Additional AR Invoice navigation functions for mobile menu
function goToCheckedDocs() {
    navigateToPage('approvalPages/dashboard/dashboardCheck/ARInvoice/menuARItemCheck.html');
}

function goToApprovedDocs() {
    navigateToPage('approvalPages/dashboard/dashboardApprove/ARInvoice/menuARItemApprove.html');
}

function goToRejectDocs() {
    navigateToPage('approvalPages/dashboard/dashboardCheck/ARInvoice/menuARItemCheck.html');
}

function goToTotalDocs() {
    navigateToPage('pages/menuInvoice.html');
}

function goToAddInvoice() {
    // Placeholder - Update with correct path when addInvoice.html is created
    alert('Add Invoice page is not yet implemented');
}

function goToInvoiceList() {
    // Placeholder - Update with correct path when invoiceList.html is created
    alert('Invoice List page is not yet implemented');
}

// Admin Navigation - No access verification required
function goToMenuRegist() {
    navigateToPage('pages/register.html');
}

function goToMenuUser() {
    navigateToPage('pages/dashboard-users.html');
}

function goToMenuRole() {
    navigateToPage('pages/dashboard-roles.html');
}

// Profile and Logout - No access verification required
function goToProfile() {
    navigateToPage('pages/profil.html');
}


// AR Invoice Clone Navigation - No access verification required
function goToMenuARInvoiceClone() {
    navigateToPage('Modul_ARinvoice/0_Menu/menuARInvoiceNew.html');
}

function goToMenuCheckARInvoiceClone() {
    navigateToPage('Modul_ARinvoice/1_Check/menuCheck_ARInvoiceNew.html');
}

function goToMenuAcknowARInvoiceClone() {
    navigateToPage('Modul_ARinvoice/2_Acknowledge/menuAck_ARInvoiceNew.html');
}

function goToMenuApprovARInvoiceClone() {
    navigateToPage('Modul_ARinvoice/3_Approve/menuAppr_ARInvoiceNew.html');
}

function goToMenuReceiveARInvoiceClone() {
    navigateToPage('Modul_ARinvoice/4_Received/menuRec_ARInvoiceNew.html');
}


function logout() {
    // Clear any authentication tokens or session data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInUserCode");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRoles");

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

    // Make all navigation functions available globally
    window.navigateToPage = navigateToPage;
    window.goToMenu = goToMenu;
    window.goToMenuPR = goToMenuPR;
    window.goToMenuCheckPR = goToMenuCheckPR;
    window.goToMenuAcknowPR = goToMenuAcknowPR;
    window.goToMenuApprovPR = goToMenuApprovPR;
    window.goToMenuReceivePR = goToMenuReceivePR;
    window.goToMenuRevisionPR = goToMenuRevisionPR;
    window.goToAddReim = goToAddReim;
    window.goToMenuReim = goToMenuReim;
    window.goToMenuCheckReim = goToMenuCheckReim;
    window.goToMenuAcknowReim = goToMenuAcknowReim;
    window.goToMenuApprovReim = goToMenuApprovReim;
    window.goToMenuReceiveReim = goToMenuReceiveReim;
    window.goToMenuRevisionReim = goToMenuRevisionReim;
    window.goToMenuOPReim = goToMenuOPReim;
    window.goToMenuCheckOPReim = goToMenuCheckOPReim;
    window.goToMenuAcknowOPReim = goToMenuAcknowOPReim;
    window.goToMenuApprovOPReim = goToMenuApprovOPReim;
    window.goToMenuReceiveOPReim = goToMenuReceiveOPReim;
    window.goToMenuCash = goToMenuCash;
    window.goToMenuCheckCash = goToMenuCheckCash;
    window.goToMenuAcknowCash = goToMenuAcknowCash;
    window.goToMenuApprovCash = goToMenuApprovCash;
    window.goToMenuReceiveCash = goToMenuReceiveCash;
    window.goToMenuRevisionCash = goToMenuRevisionCash;
    window.goToMenuCloseCash = goToMenuCloseCash;
    window.goToMenuSettle = goToMenuSettle;
    window.goToMenuCheckSettle = goToMenuCheckSettle;
    window.goToMenuAcknowSettle = goToMenuAcknowSettle;
    window.goToMenuApprovSettle = goToMenuApprovSettle;
    window.goToMenuReceiveSettle = goToMenuReceiveSettle;
    window.goToMenuRevisionSettle = goToMenuRevisionSettle;
    window.goToMenuAPR = goToMenuAPR;
    window.goToMenuPO = goToMenuPO;
    window.goToMenuBanking = goToMenuBanking;
    window.goToMenuInvoice = goToMenuInvoice;
    window.goToAddARInvoice = goToAddARInvoice;
    window.goToMenuCheckARInvoice = goToMenuCheckARInvoice;
    window.goToMenuAcknowARInvoice = goToMenuAcknowARInvoice;
    window.goToMenuApprovARInvoice = goToMenuApprovARInvoice;
    window.goToMenuReceiveARInvoice = goToMenuReceiveARInvoice;
    window.goToCheckedDocs = goToCheckedDocs;
    window.goToApprovedDocs = goToApprovedDocs;
    window.goToRejectDocs = goToRejectDocs;
    window.goToTotalDocs = goToTotalDocs;
    window.goToAddInvoice = goToAddInvoice;
    window.goToInvoiceList = goToInvoiceList;
    window.goToMenuRegist = goToMenuRegist;
    window.goToMenuUser = goToMenuUser;
    window.goToMenuRole = goToMenuRole;
    window.goToProfile = goToProfile;
    window.goToMenuARInvoiceClone = goToMenuARInvoiceClone;
    window.goToMenuCheckARInvoiceClone = goToMenuCheckARInvoiceClone;
    window.goToMenuAcknowARInvoiceClone = goToMenuAcknowARInvoiceClone;
    window.goToMenuApprovARInvoiceClone = goToMenuApprovARInvoiceClone;
    window.goToMenuReceiveARInvoiceClone = goToMenuReceiveARInvoiceClone;
    window.logout = logout;
    window.toggleSubMenu = toggleSubMenu;
} 