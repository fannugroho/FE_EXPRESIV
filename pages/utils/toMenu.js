function goToMenuPR() { window.location.href = "../pages/menuPR.html"; }
function goToAddPR() {window.location.href = "../addPages/addPR.html"; }
function goToAddReim() {window.location.href = "../addPages/AddReim.html"; }
function goToAddCash() {window.location.href = "../addPages/AddCash.html"; }
function goToAddSettle() {window.location.href = "../addPages/AddSettle.html"; }
function goToAddPO() {window.location.href = "../addPages/AddPO.html"; }

function goToDetailReim(reimId) {
    window.location.href = `/detailPages/detailReim.html?reim-id=${reimId}`;
}

function goToMenuAPR() { window.location.href = "menuPR.html"; }
function goToMenuReim() { window.location.href = "menuReim.html"; }
function goToMenuCash() { window.location.href = "menuCash.html"; }
function goToMenuSettle() { window.location.href = "menuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

window.onload = loadDashboard;