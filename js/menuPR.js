const BASE_URL = "http://localhost:5246";

function loadDashboard() {
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    document.getElementById("totalDocs").textContent = documents.length;
    document.getElementById("openDocs").textContent = documents.filter(doc => doc.approval && doc.approval.status === "Submitted").length;
    document.getElementById("checkedDocs").textContent = documents.filter(doc => doc.approval && doc.approval.status === "Checked").length;
    document.getElementById("acknowledgeDocs").textContent = documents.filter(doc => doc.approval && doc.approval.status === "Acknowledged").length;
    document.getElementById("approvedDocs").textContent = documents.filter(doc => doc.approval && doc.approval.status === "Approved").length;
    document.getElementById("rejectDocs").textContent = documents.filter(doc => doc.approval && doc.approval.status === "Rejected").length;
    document.getElementById("closeDocs").textContent = documents.filter(doc => doc.approval && doc.approval.status === "Closed").length;

    const recentDocs = documents.slice().reverse();
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    recentDocs.forEach((doc, index) => {
        // Format dates for display
        const submissionDate = new Date(doc.submissionDate).toISOString().split('T')[0];
        const requiredDate = new Date(doc.requiredDate).toISOString().split('T')[0];
        
        // PO number may be null, handle that case
        const poNumber = doc.docEntrySAP ? `PO-${doc.docEntrySAP.toString().padStart(4, '0')}` : '';
        
        // Get status from approval object
        const status = doc.approval ? doc.approval.status : "Open";
        
        // GR date currently not in the JSON, leaving empty for now
        const grDate = '';
        
        const row = `<tr class='w-full border-b'>
            <td class='p-2'>${index + 1}</td>
            <td class='p-2'>${doc.purchaseRequestNo}</td>
            <td class='p-2'>${doc.requesterName}</td>
            <td class='p-2'>${doc.departmentName}</td>
            <td class='p-2'>${submissionDate}</td>
            <td class='p-2'>${requiredDate}</td>
            <td class='p-2'>${poNumber}</td>
            <td class='p-2'>${status}</td>
            <td class='p-2'>
                <button onclick="detailDoc('${doc.id}', '${doc.prType}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
            <td class='p-2'>${grDate}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

async function fetchPurchaseRequests() {
    fetch(`${BASE_URL}/api/pr`)
        .then(response => response.json())
        .then(data => {
            if (data && data.data) {
                populatePurchaseRequests(data.data);
                updateDashboardCounts(data.data);
            }
        })
        .catch(error => console.error('Error fetching purchase requests:', error));
}

function updateDashboardCounts(data) {
    document.getElementById("totalDocs").textContent = data.length;
    document.getElementById("openDocs").textContent = data.filter(doc => doc.approval && doc.approval.status === "Submitted").length;
    document.getElementById("checkedDocs").textContent = data.filter(doc => doc.approval && doc.approval.status === "Checked").length;
    document.getElementById("acknowledgeDocs").textContent = data.filter(doc => doc.approval && doc.approval.status === "Acknowledged").length;
    document.getElementById("approvedDocs").textContent = data.filter(doc => doc.approval && doc.approval.status === "Approved").length;
    document.getElementById("rejectDocs").textContent = data.filter(doc => doc.approval && doc.approval.status === "Rejected").length;
    document.getElementById("closeDocs").textContent = data.filter(doc => doc.approval && doc.approval.status === "Closed").length;
}

function populatePurchaseRequests(data) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    data.forEach((doc, index) => {
        // Format dates for display
        const submissionDate = new Date(doc.submissionDate).toISOString().split('T')[0];
        const requiredDate = new Date(doc.requiredDate).toISOString().split('T')[0];
        
        // PO number may be null, handle that case
        const poNumber = doc.docEntrySAP ? `PO-${doc.docEntrySAP.toString().padStart(4, '0')}` : '';
        
        // Get status from approval object
        const status = doc.approval ? doc.approval.status : "Open";
        
        // GR date currently not in the JSON, leaving empty for now
        const grDate = '';
        
        const row = `<tr class='w-full border-b'>
            <td class='p-2'>${index + 1}</td>
            <td class='p-2'>${doc.purchaseRequestNo}</td>
            <td class='p-2'>${doc.requesterName}</td>
            <td class='p-2'>${doc.departmentName}</td>
            <td class='p-2'>${submissionDate}</td>
            <td class='p-2'>${requiredDate}</td>
            <td class='p-2'>${poNumber}</td>
            <td class='p-2'>${status}</td>
            <td class='p-2'>
                <button onclick="detailDoc('${doc.id}', '${doc.prType}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
            <td class='p-2'>${grDate}</td>
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

// Add window.onload event listener
window.onload = function() {
    fetchPurchaseRequests();
    
};

function detailDoc(id, prType) {
    window.location.href = `../detailPages/detailPR.html?pr-id=${id}&pr-type=${prType}`;
}
