function loadDashboard() {
    // Fetch status counts from API
    fetchStatusCounts();
    
    // Load documents from localStorage (keeping this functionality for now)
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    
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

// Function to fetch status counts from API
function fetchStatusCounts() {
    const baseUrl = "https://t246vds2-5246.asse.devtunnels.ms";
    const endpoint = "/api/reimbursements/status-counts";
    
    fetch(`${baseUrl}${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status && data.code === 200) {
                updateStatusCounts(data.data);
            } else {
                console.error('API returned an error:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching status counts:', error);
        });
}

// Function to update the status counts on the page
function updateStatusCounts(data) {
    document.getElementById("totalCount").textContent = data.totalCount || 0;
    document.getElementById("draftCount").textContent = data.draftCount || 0;
    document.getElementById("checkedCount").textContent = data.checkedCount || 0;
    document.getElementById("approvedCount").textContent = data.approvedCount || 0;
    document.getElementById("paidCount").textContent = data.paidCount || 0;
    document.getElementById("closeCount").textContent = data.closedCount || 0; // Note: API returns closedCount but HTML uses closeCount
    document.getElementById("rejectedCount").textContent = data.rejectedCount || 0;
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