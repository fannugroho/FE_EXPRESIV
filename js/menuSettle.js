    // Load data
    // Using BASE_URL from auth.js instead of hardcoded baseUrl
    async function loadDashboard() {
        try {
            // Get userId for filtering
            const userId = getUserId();
            if (!userId) {
                console.error("User ID not found. Please login again.");
                return;
            }
            
            // Fetch data from API
            const response = await fetch(`${BASE_URL}/api/settlements/dashboard`);
            const apiResponse = await response.json();
            
            if (!apiResponse.status || !apiResponse.data) {
                console.error("Failed to fetch settlements data");
                return;
            }
            
            const documents = apiResponse.data;
            
            // Filter documents by logged in user
            const userDocuments = documents
            
            // Store documents globally for tab functionality
            allDocuments = userDocuments;
            filteredDocuments = userDocuments;
    
            // Update summary counts with correct element IDs
            const totalCountEl = document.getElementById("totalCount");
            const draftCountEl = document.getElementById("draftCount");
            const preparedCountEl = document.getElementById("preparedCount");
            const checkedCountEl = document.getElementById("checkedCount");
            const approvedCountEl = document.getElementById("approvedCount");
            const paidCountEl = document.getElementById("paidCount");
            const closeCountEl = document.getElementById("closeCount");
            const rejectedCountEl = document.getElementById("rejectedCount");
            
            if (totalCountEl) totalCountEl.textContent = userDocuments.length;
            if (draftCountEl) draftCountEl.textContent = userDocuments.filter(doc => doc.status === "Draft").length;
            if (preparedCountEl) preparedCountEl.textContent = userDocuments.filter(doc => doc.status === "Prepared").length;
            if (checkedCountEl) checkedCountEl.textContent = userDocuments.filter(doc => doc.status === "Checked").length;
            if (approvedCountEl) approvedCountEl.textContent = userDocuments.filter(doc => doc.status === "Approved").length;
            if (paidCountEl) paidCountEl.textContent = userDocuments.filter(doc => doc.status === "Paid").length;
            if (closeCountEl) closeCountEl.textContent = userDocuments.filter(doc => doc.status === "Close").length;
            if (rejectedCountEl) rejectedCountEl.textContent = userDocuments.filter(doc => doc.status === "Rejected").length;
    
            // Initialize table and pagination
            updateTable();
            updatePagination();
            
        } catch (error) {
            console.error("Error fetching settlements data:", error);
            // Fallback to empty state or show error message
            allDocuments = [];
            filteredDocuments = [];
            
            const totalCountEl = document.getElementById("totalCount");
            const draftCountEl = document.getElementById("draftCount");
            const preparedCountEl = document.getElementById("preparedCount");
            const checkedCountEl = document.getElementById("checkedCount");
            const approvedCountEl = document.getElementById("approvedCount");
            const paidCountEl = document.getElementById("paidCount");
            const closeCountEl = document.getElementById("closeCount");
            const rejectedCountEl = document.getElementById("rejectedCount");
            
            if (totalCountEl) totalCountEl.textContent = "0";
            if (draftCountEl) draftCountEl.textContent = "0";
            if (preparedCountEl) preparedCountEl.textContent = "0";
            if (checkedCountEl) checkedCountEl.textContent = "0";
            if (approvedCountEl) approvedCountEl.textContent = "0";
            if (paidCountEl) paidCountEl.textContent = "0";
            if (closeCountEl) closeCountEl.textContent = "0";
            if (rejectedCountEl) rejectedCountEl.textContent = "0";
            
            const tableBody = document.getElementById("recentDocs");
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="p-4 text-center text-red-500">
                            Failed to load settlements data. Please try again later.
                        </td>
                    </tr>
                `;
            }
        }
      }
  
      // Tab switching functionality
      let currentTab = 'all';
      let currentPage = 1;
      const itemsPerPage = 10;
      let allDocuments = [];
      let filteredDocuments = [];

      function switchTab(tab) {
        currentTab = tab;
        currentPage = 1;
        
        // Update tab buttons
        document.querySelectorAll('[id$="TabBtn"]').forEach(btn => {
          btn.classList.remove('tab-active');
        });
        
        if (tab === 'all') {
          document.getElementById('allTabBtn').classList.add('tab-active');
          filteredDocuments = allDocuments;
        } else if (tab === 'draft') {
          document.getElementById('draftTabBtn').classList.add('tab-active');
          filteredDocuments = allDocuments.filter(doc => doc.status === 'Draft');
        } else if (tab === 'prepared') {
          document.getElementById('preparedTabBtn').classList.add('tab-active');
          filteredDocuments = allDocuments.filter(doc => doc.status === 'Prepared');
        }
        
        updateTable();
        updatePagination();
      }

      function updateTable() {
        const tableBody = document.getElementById("recentDocs");
        if (!tableBody) return;
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageDocuments = filteredDocuments.slice(startIndex, endIndex);
        
        tableBody.innerHTML = "";
        
        pageDocuments.forEach((doc, index) => {
          const formattedDate = new Date(doc.submissionDate).toLocaleDateString();
          
          const row = `
            <tr class="border-b">
              <td class="p-2 text-left">
                <input type="checkbox" class="rowCheckbox" />
              </td>
              <td class="p-2">${index + 1}</td>
              <td class="p-2">${doc.settlementNumber ?? ''}</td>
              <td class="p-2">${doc.requesterName}</td>
              <td class="p-2">${doc.departmentName}</td>
              <td class="p-2">${formattedDate}</td>
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
      }

      function updatePagination() {
        const totalItems = filteredDocuments.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        document.getElementById('startItem').textContent = totalItems > 0 ? startItem : 0;
        document.getElementById('endItem').textContent = endItem;
        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('currentPage').textContent = currentPage;
        
        // Update pagination buttons
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
          prevBtn.classList.toggle('disabled', currentPage === 1);
        }
        if (nextBtn) {
          nextBtn.classList.toggle('disabled', currentPage === totalPages || totalPages === 0);
        }
      }

      function changePage(direction) {
        const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
        const newPage = currentPage + direction;
        
        if (newPage >= 1 && newPage <= totalPages) {
          currentPage = newPage;
          updateTable();
          updatePagination();
        }
      }

      // Search functionality
      document.addEventListener('DOMContentLoaded', function() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            if (searchTerm === '') {
              filteredDocuments = currentTab === 'all' ? allDocuments : allDocuments.filter(doc => doc.status === 'Draft');
            } else {
              const baseDocuments = currentTab === 'all' ? allDocuments : allDocuments.filter(doc => doc.status === 'Draft');
              filteredDocuments = baseDocuments.filter(doc => 
                doc.settlementNumber.toLowerCase().includes(searchTerm) ||
                doc.requesterName.toLowerCase().includes(searchTerm)
              );
            }
            
            currentPage = 1;
            updateTable();
            updatePagination();
          });
        }
        
        // Initialize select all checkbox
        const selectAllCheckbox = document.getElementById("selectAll");
        if (selectAllCheckbox) {
          selectAllCheckbox.addEventListener("change", function() {
            let checkboxes = document.querySelectorAll(".rowCheckbox");
            checkboxes.forEach(checkbox => {
              checkbox.checked = this.checked;
            });
          });
        }
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
        const documents = filteredDocuments || [];
        
        // Membuat workbook baru
        const workbook = XLSX.utils.book_new();
        
        // Mengonversi data ke format worksheet
        const wsData = documents.map(doc => ({
          'Document Number': doc.id,
          'Settlement Number': doc.settlementNumber,
          'Requester': doc.requesterName,
          'Department': 'IT',
          'Submission Date': new Date(doc.submissionDate).toLocaleDateString(),
          'Status': doc.status
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
        const documents = filteredDocuments || [];
        const tableData = documents.map(doc => [
          doc.id,
          doc.settlementNumber,
          doc.requesterName,
          'IT',
          new Date(doc.submissionDate).toLocaleDateString(),
          doc.status
        ]);
        
        // Menambahkan tabel
        doc.autoTable({
          head: [['Doc Number', 'Settlement Number', 'Requester', 'Department', 'Submission Date', 'Status']],
          body: tableData,
          startY: 25
        });
        
        // Menyimpan PDF
        doc.save('settlement_list.pdf');
      }
  
      // // Fungsi Navigasi
      // function goToMenu() { window.location.href = "Menu.html"; }
      // function goToAddDoc() { window.location.href = "AddDoc.html"; }
      // function goToAddReim() { window.location.href = "AddReim.html"; }
      // function goToAddCash() { window.location.href = "AddCash.html"; }
       function goToAddSettle() { window.location.href = "../addPages/AddSettle.html"; }
      // function goToAddPO() { window.location.href = "AddPO.html"; }
      // function goToMenuPR() { window.location.href = "MenuPR.html"; }
      // function goToMenuReim() { window.location.href = "MenuReim.html"; }
      // function goToMenuCash() { window.location.href = "MenuCash.html"; }
      // function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
      // function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
      // function goToMenuPO() { window.location.href = "MenuPO.html"; }
      // function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
      // function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
      
      // Additional navigation functions for mobile menu
      function goToCheckedDocs() { 
        // Navigate to checked documents view or filter current view
        switchTab('all');
        // You can add specific filtering logic here
      }
      function goToApprovedDocs() { 
        // Navigate to approved documents view or filter current view
        switchTab('all');
        // You can add specific filtering logic here
      }
      function goToCloseDocs() { 
        // Navigate to closed documents view or filter current view
        switchTab('all');
        // You can add specific filtering logic here
      }
      function goToRejectDocs() { 
        // Navigate to rejected documents view or filter current view
        switchTab('all');
        // You can add specific filtering logic here
      }
      
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



      // Fungsi untuk mendapatkan ID pengguna yang login
      function getUserId() {
        const userStr = localStorage.getItem('loggedInUser');
        if (!userStr) return null;
        
        try {
          const user = JSON.parse(userStr);
          return user.id || null;
        } catch (e) {
          console.error('Error parsing user data:', e);
          return null;
        }
      }