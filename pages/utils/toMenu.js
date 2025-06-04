// Get the current path depth to calculate relative navigation
function getRelativeBasePath() {
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(part => part !== '');
    
    // Count how many levels deep we are from the root
    const depth = pathParts.length - 1; // Subtract 1 for the HTML file itself
    
    // Return the appropriate number of "../" to get back to root
    return '../'.repeat(depth);
}

function goToMenu() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/dashboard.html`; 
}

function goToMenuPR() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/menuPR.html`; 
}

function goToAddPR() {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}addPages/addPR.html`; 
}

function goToAddReim() {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}addPages/AddReim.html`; 
}

function goToAddCash() {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}addPages/AddCash.html`; 
}

function goToAddSettle() {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}addPages/AddSettle.html`; 
}

function goToAddPO() {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}addPages/AddPO.html`; 
}

function goToAddInvoice() {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}addPages/AddInvoice.html`; 
}

function goToDetailReim(reimId) {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}detailPages/detailReim.html?reim-id=${reimId}`;
}

function goToDetailPR(prId) {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}detailPages/detailPR.html?pr-id=${prId}`;
}

function goToDetailCash(cashId) {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}detailPages/detailCash.html?cash-id=${cashId}`;
}

function goToDetailSettle(settleId) {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}detailPages/detailSettle.html?settle-id=${settleId}`;
}

function goToDetailPO(poId) {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}detailPages/detailPO.html?po-id=${poId}`;
}

function goToDetailInvoice(invoiceId) {
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}detailPages/detailInvoice.html?invoice-id=${invoiceId}`;
}

function goToMenuAPR() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/menuPR.html`; 
}

function goToMenuPO() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/MenuPO.html`; 
}

function goToMenuReim() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/menuReim.html`; 
}

function goToMenuCash() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/menuCash.html`; 
}

function goToMenuSettle() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/menuSettle.html`; 
}

function goToApprovalReport() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/ApprovalReport.html`; 
}

function goToMenuInvoice() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/MenuInvoice.html`; 
}

function goToMenuBanking() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/MenuBanking.html`; 
}

function goToProfil() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/profil.html`; 
}

function goToRegister() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/register.html`; 
}

function goToLogin() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/login.html`; 
}

function goToSettings() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/settings.html`; 
}

function goToNotifications() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/notifications.html`; 
}

function logout() { 
    localStorage.removeItem("loggedInUser"); 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/login.html`; 
}

// Purchase Request approval workflow functions
function goToMenuCheckPR() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardCheck/purchaseRequest/menuPRCheck.html`; 
}

function goToMenuAcknowPR() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardAcknowledge/purchaseRequest/menuPRAcknow.html`; 
}

function goToMenuApprovPR() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardApprove/purchaseRequest/menuPRApprove.html`; 
}

function goToMenuReceivePR() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardReceive/menuPRReceive.html`; 
}

// Reimbursement approval workflow functions
function goToMenuCheckReim() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardCheck/reimbursement/menuReimCheck.html`; 
}

function goToMenuAcknowReim() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardAcknowledge/reimbursement/menuReimAcknow.html`; 
}

function goToMenuApprovReim() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardApprove/reimbursement/menuReimApprove.html`; 
}

// Cash Advance approval workflow functions
function goToMenuCheckCash() { 
    const basePath = getRelativeBasePath();
    console.log(basePath)
    window.location.href = `${basePath}approvalPages/dashboard/dashboardCheck/cashAdvance/menuCashCheck.html`; 
}

function goToMenuAcknowCash() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html`; 
}

function goToMenuApprovCash() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardApprove/cashAdvance/menuCashApprove.html`; 
}

// Settlement approval workflow functions
function goToMenuCheckSettle() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardCheck/settlement/menuSettleCheck.html`; 
}

function goToMenuAcknowSettle() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardAcknowledge/settlement/menuSettleAcknow.html`; 
}

function goToMenuApprovSettle() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/dashboardApprove/settlement/menuSettleApprove.html`; 
}

// Administration functions
function goToMenuRegist() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/register.html`; 
}

function goToMenuUser() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/userList.html`; 
}

function goToMenuRole() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}pages/roleList.html`; 
}

// Approval pages navigation
function goToApprovalDashboard() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/dashboard/index.html`; 
}

function goToApprovalReceive() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/approval/receive/index.html`; 
}

function goToApprovalCheck() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/approval/check/index.html`; 
}

function goToApprovalApprove() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/approval/approve/index.html`; 
}

function goToApprovalAcknowledge() { 
    const basePath = getRelativeBasePath();
    window.location.href = `${basePath}approvalPages/approval/acknowledge/index.html`; 
}

// Helper functions for navigation with parameters
function navigateWithParams(page, params) {
    const basePath = getRelativeBasePath();
    const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    window.location.href = `${basePath}${page}?${queryString}`;
}

// Back navigation
function goBack() {
    window.history.back();
}