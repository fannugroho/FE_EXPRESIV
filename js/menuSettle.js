// Load data
function loadDashboard() {
    const documents = JSON.parse(localStorage.getItem("documents")) || [];

    // Hitung summary
    document.getElementById("totalDocs").textContent = documents.length;
    document.getElementById("pendingDocs").textContent =
      documents.filter(doc => doc.docStatus === "Pending").length;
    document.getElementById("checkedDocs").textContent =
      documents.filter(doc => doc.docStatus === "Checked").length;
    document.getElementById("approvedDocs").textContent =
      documents.filter(doc => doc.docStatus === "Approved").length;
    document.getElementById("closeDocs").textContent =
      documents.filter(doc => doc.docStatus === "Close").length;
    document.getElementById("rejectDocs").textContent =
      documents.filter(doc => doc.docStatus === "Reject").length;

    // Tampilkan Recent Docs di tabel
    const recentDocs = documents.slice().reverse();
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";

    recentDocs.forEach(doc => {
      const row = `
        <tr class="border-b">
          <td class="p-2 text-left">
            <input type="checkbox" class="rowCheckbox" />
          </td>
          <td class="p-2">${doc.docNumber}</td>
          <td class="p-2">${doc.prno}</td>
          <td class="p-2">${doc.requester}</td>
          <td class="p-2">${doc.department}</td>
          <td class="p-2">${doc.postingDate}</td>
          <td class="p-2">${doc.paidtoEmployee}</td>
          <td class="p-2">${doc.returnedtoCompany}</td>
          <td class="p-2">${doc.docStatus}</td>
          <td class="p-2">
            <button onclick="detailDoc('${doc.docNumber}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
              Detail
            </button>
          </td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  }

  // Select All
  document.getElementById("selectAll").addEventListener("change", function() {
    let checkboxes = document.querySelectorAll(".rowCheckbox");
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.checked;
    });
  });

  // Toggle Sidebar (mobile)
  function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("-translate-x-full");
  }
  
  // Toggle Submenu
  function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
  }
