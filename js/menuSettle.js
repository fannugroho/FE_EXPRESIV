    // Load data
    async function loadDashboard() {
        try {
            // Fetch data from API
            const response = await fetch("https://t246vds2-5246.asse.devtunnels.ms/api/settlements");
            const apiResponse = await response.json();
            
            if (!apiResponse.status || !apiResponse.data) {
                console.error("Failed to fetch settlements data");
                return;
            }
            
            const documents = apiResponse.data;
    
            // Hitung summary
            document.getElementById("totalDocs").textContent = documents.length;
            document.getElementById("pendingDocs").textContent =
              documents.filter(doc => doc.status === "Pending").length;
            document.getElementById("checkedDocs").textContent =
              documents.filter(doc => doc.status === "Checked").length;
            document.getElementById("approvedDocs").textContent =
              documents.filter(doc => doc.status === "Approved").length;
            document.getElementById("closeDocs").textContent =
              documents.filter(doc => doc.status === "Close").length;
            document.getElementById("rejectDocs").textContent =
              documents.filter(doc => doc.status === "Reject").length;
    
            // Tampilkan Recent Docs di tabel
            const recentDocs = documents.slice().reverse();
            const tableBody = document.getElementById("recentDocs");
            tableBody.innerHTML = "";
    
            recentDocs.forEach(doc => {
              // Format submission date to display only date part
              const formattedDate = new Date(doc.submissionDate).toLocaleDateString();
              
              const row = `
                <tr class="border-b">
                  <td class="p-2 text-left">
                    <input type="checkbox" class="rowCheckbox" />
                  </td>
                  <td class="p-2">${doc.id}</td>
                  <td class="p-2">${doc.settlementNumber}</td>
                  <td class="p-2">${doc.requesterName}</td>
                  <td class="p-2">IT</td>
                  <td class="p-2">${formattedDate}</td>
                  <td class="p-2">${doc.requesterName}</td>
                  <td class="p-2">Done</td>
                  <td class="p-2">${doc.status}</td>
                  <td class="p-2">
                    <button onclick="detailDoc('${doc.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      Detail
                    </button>
                  </td>
                </tr>
              `;
              tableBody.innerHTML += row;
            });
        } catch (error) {
            console.error("Error fetching settlements data:", error);
            // Fallback to empty state or show error message
            document.getElementById("totalDocs").textContent = "0";
            document.getElementById("pendingDocs").textContent = "0";
            document.getElementById("checkedDocs").textContent = "0";
            document.getElementById("approvedDocs").textContent = "0";
            document.getElementById("closeDocs").textContent = "0";
            document.getElementById("rejectDocs").textContent = "0";
            
            const tableBody = document.getElementById("recentDocs");
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="p-4 text-center text-red-500">
                        Failed to load settlements data. Please try again later.
                    </td>
                </tr>
            `;
        }
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
        // No-op function - sidebar toggle is disabled to keep it permanently open
        return;
      }
      
      // Toggle Submenu
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
          'Document Number': doc.docNumber,
          'Voucher Number': doc.prno,
          'Requester': doc.requester,
          'Department': doc.department,
          'Submission Date': doc.postingDate,
          'Paid to Employee': doc.paidtoEmployee,
          'Returned to Company': doc.returnedtoCompany,
          'Status': doc.docStatus
        }));
        
        // Membuat worksheet dan menambahkannya ke workbook
        const worksheet = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Settlement');
        
        // Menghasilkan file Excel
        XLSX.writeFile(workbook, 'settlement_list.xlsx');
      }

      // Fungsi Download PDF
      function downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Menambahkan judul
        doc.setFontSize(16);
        doc.text('Settlement Report', 14, 15);
        
        // Membuat data tabel dari documents
        const documents = JSON.parse(localStorage.getItem("documents")) || [];
        const tableData = documents.map(doc => [
          doc.docNumber,
          doc.prno,
          doc.requester,
          doc.department,
          doc.postingDate,
          doc.paidtoEmployee,
          doc.returnedtoCompany,
          doc.docStatus
        ]);
        
        // Menambahkan tabel
        doc.autoTable({
          head: [['Doc Number', 'Voucher Number', 'Requester', 'Department', 'Submission Date', 'Paid to Employee', 'Returned to Company', 'Status']],
          body: tableData,
          startY: 25
        });
        
        // Menyimpan PDF
        doc.save('settlement_list.pdf');
      }
  
      // Fungsi Navigasi
      function goToMenu() { window.location.href = "Menu.html"; }
      function goToAddDoc() { window.location.href = "AddDoc.html"; }
      function goToAddReim() { window.location.href = "AddReim.html"; }
      function goToAddCash() { window.location.href = "AddCash.html"; }
      function goToAddSettle() { window.location.href = "AddSettle.html"; }
      function goToAddPO() { window.location.href = "AddPO.html"; }
      function goToMenuPR() { window.location.href = "MenuPR.html"; }
      function goToMenuReim() { window.location.href = "MenuReim.html"; }
      function goToMenuCash() { window.location.href = "MenuCash.html"; }
      function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
      function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
      function goToMenuPO() { window.location.href = "MenuPO.html"; }
      function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
      function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
      function logout() {
        localStorage.removeItem("loggedInUser");
        window.location.href = "Login.html";
      }
      function detailDoc(settleId) {
        // Store the selected document ID in localStorage for the detail page to use
        // localStorage.setItem("selectedCashAdvanceId", caId);
        // Navigate to detail page
        window.location.href = `/detailPages/detailSettle.html?settle-id=${settleId}`;
    }
      
      window.onload = loadDashboard;