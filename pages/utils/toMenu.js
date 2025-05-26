function goToMenu() { window.location.href = "../pages/dashboard.html"; }
function goToMenuPR() { window.location.href = "../pages/menuPR.html"; }
function goToAddPR() {window.location.href = "../addPages/addPR.html"; }
function goToAddReim() {window.location.href = "../addPages/AddReim.html"; }
function goToAddCash() {window.location.href = "../addPages/AddCash.html"; }
function goToAddSettle() {window.location.href = "../addPages/AddSettle.html"; }
function goToAddPO() {window.location.href = "../addPages/AddPO.html"; }
function goToAddInvoice() {window.location.href = "../addPages/AddInvoice.html"; }

function goToDetailReim(reimId) {
    window.location.href = `/detailPages/detailReim.html?reim-id=${reimId}`;
}
function goToDetailPR(prId) {
    window.location.href = `/detailPages/detailPR.html?pr-id=${prId}`;
}
function goToDetailCash(cashId) {
    window.location.href = `/detailPages/detailCash.html?cash-id=${cashId}`;
}
function goToDetailSettle(settleId) {
    window.location.href = `/detailPages/detailSettle.html?settle-id=${settleId}`;
}
function goToDetailPO(poId) {
    window.location.href = `/detailPages/detailPO.html?po-id=${poId}`;
}
function goToDetailInvoice(invoiceId) {
    window.location.href = `/detailPages/detailInvoice.html?invoice-id=${invoiceId}`;
}

function goToMenuAPR() { window.location.href = "menuPR.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuReim() { window.location.href = "menuReim.html"; }
function goToMenuCash() { window.location.href = "menuCash.html"; }
function goToMenuSettle() { window.location.href = "menuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function goToProfil() { window.location.href = "../pages/profil.html"; }
function goToRegister() { window.location.href = "../pages/register.html"; }
function goToLogin() { window.location.href = "../pages/login.html"; }
function goToSettings() { window.location.href = "../pages/settings.html"; }
function goToNotifications() { window.location.href = "../pages/notifications.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

// Approval pages navigation
function goToApprovalDashboard() { window.location.href = "../approvalPages/dashboard/index.html"; }
function goToApprovalReceive() { window.location.href = "../approvalPages/approval/receive/index.html"; }
function goToApprovalCheck() { window.location.href = "../approvalPages/approval/check/index.html"; }
function goToApprovalApprove() { window.location.href = "../approvalPages/approval/approve/index.html"; }
function goToApprovalAcknowledge() { window.location.href = "../approvalPages/approval/acknowledge/index.html"; }

// Helper functions for navigation with parameters
function navigateWithParams(page, params) {
    const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    window.location.href = `${page}?${queryString}`;
}

// Back navigation
function goBack() {
    window.history.back();
}