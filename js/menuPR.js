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



async function fetchPurchaseRequests() {
    fetch(`${BASE_URL}/pr`)
        .then(response => response.json())
        .then(data => populatePurchaseRequests(data.data))
        .catch(error => console.error('Error fetching purchase requests:', error));
    console.log(data);
}

function populatePurchaseRequests(data) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    data.forEach(doc => {
        const row = `<tr class='w-full border-b'>
            <td class='p-2'>${doc.id}</td>
            <td class='p-2'>${doc.purchaseRequestNo}</td>
            <td class='p-2'>${doc.requesterName}</td>
            <td class='p-2'>${doc.departmentName}</td>
            <td class='p-2'>${doc.submissionDate}</td>
            <td class='p-2'>${doc.requiredDate}</td>
            <td class='p-2'>${doc.poNumber}</td>
            <td class='p-2'>${doc.status}</td>
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
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Fungsi Download Excel
function downloadExcel() {
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    
    // Membuat workbook baru
    const workbook = XLSX.utils.book_new();
    
    // Mengonversi data ke format worksheet
    const wsData = documents.map(doc => ({
        'Document Number': doc.id,
        'PR Number': doc.purchaseRequestNo,
        'Requester': doc.requesterName,
        'Department': doc.departmentName,
        'Submission Date': doc.submissionDate,
        'Required Date': doc.requiredDate,
        'PO Number': doc.poNumber,
        'Status': doc.status,
        'GR Date': doc.grDate
    }));
    
    // Membuat worksheet dan menambahkannya ke workbook
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Requests');
    
    // Menghasilkan file Excel
    XLSX.writeFile(workbook, 'purchase_request_list.xlsx');
}

// Fungsi Download PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Menambahkan judul
    doc.setFontSize(16);
    doc.text('Purchase Request Report', 14, 15);
    
    // Membuat data tabel dari documents
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    const tableData = documents.map(doc => [
        doc.id,
        doc.purchaseRequestNo,
        doc.requesterName,
        doc.departmentName,
        doc.submissionDate,
        doc.requiredDate,
        doc.poNumber,
        doc.status,
        doc.grDate
    ]);
    
    // Menambahkan tabel
    doc.autoTable({
        head: [['Doc Number', 'PR Number', 'Requester', 'Department', 'Submission Date', 'Required Date', 'PO Number', 'Status', 'GR Date']],
        body: tableData,
        startY: 25
    });
    
    // Menyimpan PDF
    doc.save('purchase_request_list.pdf');
}