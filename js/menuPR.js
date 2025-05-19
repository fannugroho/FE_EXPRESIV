
function loadDashboard() {
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    document.getElementById("totalDocs").textContent = documents.length;
    document.getElementById("openDocs").textContent = documents.filter(doc => doc.status === "Open").length;
    document.getElementById("checkedDocs").textContent = documents.filter(doc => doc.status === "Checked").length;
    document.getElementById("acknowledgeDocs").textContent = documents.filter(doc => doc.status === "Acknowledge").length;
    document.getElementById("approvedDocs").textContent = documents.filter(doc => doc.status === "Approved").length;
    document.getElementById("rejectDocs").textContent = documents.filter(doc => doc.status === "Reject").length;
    document.getElementById("closeDocs").textContent = documents.filter(doc => doc.status === "Close").length;



    const recentDocs = documents.slice().reverse();
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    recentDocs.forEach(doc => {
        const row = `<tr class='w-full border-b'>
            
            <td class='p-2'>${doc.id}</td>
            <td class='p-2'>${doc.purchaseRequestNo}</td>
            <td class='p-2'>${doc.requesterName}</td>
            <td class='p-2'>${doc.departmentName}</td>
            <td class='p-2'>${doc.submissionDate}</td>
            <td class='p-2'>${doc.requiredDate}</td>
            <td class='p-2'>${doc.poNumber}</td>
            <td class='p-2'>${doc.status}</td>
            <td class='p-2'>
                <button onclick="detailDoc('${doc.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
            <td class='p-2'>${doc.grDate}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}


function updateDoc(id) {
    alert(`Update document: ${id}`);
}

function deleteDoc(id) {
    if (confirm("Are you sure you want to delete this document?")) {
        let documents = JSON.parse(localStorage.getItem("documents")) || [];
        documents = documents.filter(doc => doc.id !== id);
        localStorage.setItem("documents", JSON.stringify(documents));
        loadDashboard(); // Refresh tabel setelah menghapus
        }
}

function editDoc() {
alert("Edit Document: " + detail);
// Di sini kamu bisa menambahkan kode untuk membuka modal edit atau halaman edit
}

function updateDoc(id) {
alert("Update Document: " + id);
// Di sini kamu bisa menambahkan logika untuk update dokumen, misalnya memperbarui status di localStorage
}

// document.getElementById("selectAll").addEventListener("change", function () {
//     let checkboxes = document.querySelectorAll(".rowCheckbox");
//     checkboxes.forEach(checkbox => {
//         checkbox.checked = this.checked;
//     });
// });


function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("-translate-x-full");
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Fungsi Download Excel
function downloadExcel() {
let table = document.getElementById("recentDocs").parentElement; // Ambil elemen tabel
let wb = XLSX.utils.table_to_book(table, { sheet: "Recent Documents" });
XLSX.writeFile(wb, "Recent_Documents.xlsx");
}

// Fungsi Download PDF
function downloadPDF() {
const { jsPDF } = window.jspdf;
let doc = new jsPDF();

doc.text("Recent Documents", 14, 10);
doc.autoTable({ 
html: "#recentDocs", 
startY: 20 
});

doc.save("Recent_Documents.pdf");
}

function goToMenu() { window.location.href = "../pages/menuPR.html"; }
function goToAddDoc() {window.location.href = "../addPages/addPR.html"; }
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