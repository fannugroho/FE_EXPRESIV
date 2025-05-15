function loadDashboard() {
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    document.getElementById("totalDocs").textContent = documents.length;
    document.getElementById("draftCount").textContent = documents.filter(doc => doc.docStatus === "Pending").length;
    document.getElementById("checkedCount").textContent = documents.filter(doc => doc.docStatus === "Checked").length;  
    document.getElementById("approvedCount").textContent = documents.filter(doc => doc.docStatus === "Approved").length;
    document.getElementById("paidCount").textContent = documents.filter(doc => doc.docStatus === "Paid").length;
    document.getElementById("closeCount").textContent = documents.filter(doc => doc.docStatus === "Close").length;
    document.getElementById("rejectedCount").textContent = documents.filter(doc => doc.docStatus === "Rejected").length;

    const recentDocs = documents.slice().reverse();
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    recentDocs.forEach(doc => {
        const row = `<tr class='border-b'>
            <td class='p-2 text-left'><input type="checkbox" class="rowCheckbox"></td>
            <td class='p-2'>${doc.docNumber}</td>
            <td class='p-2'>${doc.prno}</td>
            <td class='p-2'>${doc.requester}</td>
            <td class='p-2'>${doc.department}</td>
            <td class='p-2'>${doc.postingDate}</td>
            <td class='p-2'>${doc.docStatus}</td>
            <td class='p-2'>
                <button onclick="detailDoc('${doc.docNumber}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

document.getElementById("selectAll").addEventListener("change", function () {
    let checkboxes = document.querySelectorAll(".rowCheckbox");
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});


function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("-translate-x-full");
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}


function goToMenu() { window.location.href = "Menu.html"; }
function goToAddDoc() {window.location.href = "AddDoc.html"; }
function goToAddReim() {window.location.href = "AddReim.html"; }
function goToAddCash() {window.location.href = "AddCash.html"; }
function goToAddSettle() {window.location.href = "AddSettle.html"; }
function goToAddPO() {window.location.href = "AddPO.html"; }
function goToMenuPR() { window.location.href = "MenuPR.html"; }
function goToMenuReim() { window.location.href = "MenuReim.html"; }
function goToMenuCash() { window.location.href = "MenuCash.html"; }
function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

window.onload = loadDashboard;