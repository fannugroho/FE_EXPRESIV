         function loadDashboard() {
            const userId = getUserId();
            if (!userId) {
                console.error('User ID not found. Please login again.');
                return;
            }

            fetch(`${BASE_URL}/api/cash-advance/dashboard`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.status && data.data) {
                        const documents = data.data;
                        console.log("Documents:", documents);
                        console.log("User ID:", userId);
                        console.log("Total documents from API:", documents.length);
                        
                        // Show all documents instead of filtering by user (for now)
                        const userDocuments = documents; // Changed: show all documents
                        console.log("Filtered documents:", userDocuments.length);
                        
                        // Update dashboard counts
                        document.getElementById("totalDocs").textContent = userDocuments.length;
                        document.getElementById("draftDocs").textContent = userDocuments.filter(doc => doc.status === "Draft").length;
                        document.getElementById("preparedDocs").textContent = userDocuments.filter(doc => doc.status === "Prepared").length;
                        document.getElementById("checkedDocs").textContent = userDocuments.filter(doc => doc.status === "Checked").length;
                        document.getElementById("acknowledgedDocs").textContent = userDocuments.filter(doc => doc.status === "Acknowledged").length;
                        document.getElementById("approvedDocs").textContent = userDocuments.filter(doc => doc.status === "Approved").length;
                        document.getElementById("paidDocs").textContent = userDocuments.filter(doc => doc.status === "Paid").length;
                        document.getElementById("rejectedDocs").textContent = userDocuments.filter(doc => doc.status === "Rejected").length;
                        document.getElementById("settledDocs").textContent = userDocuments.filter(doc => doc.status === "Settled").length;
                        
                        // Simpan dokumen untuk penggunaan di tab
                        window.allDocuments = userDocuments;
                        window.filteredDocuments = userDocuments;
                        window.currentTab = 'all';
                        window.currentPage = 1;
                        window.itemsPerPage = 10;
                        
                        // Display documents in table
                        displayDocuments(userDocuments);
                    } else {
                        console.error("API response does not contain expected data");
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    document.getElementById("recentDocs").innerHTML = 
                        `<tr><td colspan="9" class="p-4 text-center text-red-500">Error loading data. Please try again later.</td></tr>`;
                });
        }

        // Function untuk menampilkan dokumen dengan pagination
        function displayDocuments(documents) {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, documents.length);
            const paginatedDocuments = documents.slice(startIndex, endIndex);
            
            const tableBody = document.getElementById("recentDocs");
            tableBody.innerHTML = "";
            
            paginatedDocuments.forEach((doc, index) => {
                const row = `<tr class='border-b'>
                    <td class='p-2 text-left'><input type="checkbox" class="rowCheckbox"></td>
                    <td class='p-2'>${startIndex + index + 1}</td>
                    <td class='p-2'>${doc.cashAdvanceNo ? doc.cashAdvanceNo : ''}</td>
                    <td class='p-2'>${doc.requesterName}</td>
                    <td class='p-2'>${doc.departmentName}</td>
                    <td class='p-2'>${doc.purpose}</td>
                    <td class='p-2'>${new Date(doc.submissionDate).toLocaleDateString()}</td>
                    <td class='p-2'>${doc.status}</td>
                    <td class='p-2'>
                        <button onclick="detailDoc('${doc.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
                    </td>
                </tr>`;
                tableBody.innerHTML += row;
            });
            
            // Update pagination info
            document.getElementById('startItem').textContent = documents.length > 0 ? startIndex + 1 : 0;
            document.getElementById('endItem').textContent = endIndex;
            document.getElementById('totalItems').textContent = documents.length;
            
            // Update pagination buttons
            updatePaginationButtons(documents.length);
        }
        
        // Function untuk update pagination buttons
        function updatePaginationButtons(totalItems) {
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            document.getElementById('currentPage').textContent = currentPage;
            
            // Update prev/next button states
            const prevBtn = document.getElementById('prevPage');
            const nextBtn = document.getElementById('nextPage');
            
            prevBtn.classList.toggle('disabled', currentPage <= 1);
            nextBtn.classList.toggle('disabled', currentPage >= totalPages);
        }
        
        // Function untuk mengubah halaman
        function changePage(direction) {
            const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
            const newPage = currentPage + direction;
            
            if (newPage >= 1 && newPage <= totalPages) {
                currentPage = newPage;
                displayDocuments(filteredDocuments);
            }
        }
        
        // Function untuk switch tab
        function switchTab(tab) {
            currentTab = tab;
            currentPage = 1;
            
            // Update tab button styling
            document.getElementById('allTabBtn').classList.remove('tab-active');
            document.getElementById('draftTabBtn').classList.remove('tab-active');
            document.getElementById('preparedTabBtn').classList.remove('tab-active');
            
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
            
            // Filter berdasarkan pencarian jika ada
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            if (searchTerm) {
                filteredDocuments = filteredDocuments.filter(doc => 
                    (doc.cashAdvanceNo && doc.cashAdvanceNo.toLowerCase().includes(searchTerm)) ||
                    doc.requesterName.toLowerCase().includes(searchTerm) ||
                    doc.purpose.toLowerCase().includes(searchTerm)
                );
            }
            
            displayDocuments(filteredDocuments);
        }
        
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

        document.getElementById("selectAll").addEventListener("change", function () {
            let checkboxes = document.querySelectorAll(".rowCheckbox");
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
        
        // Event listener untuk search input
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            switchTab(currentTab); // Ini akan menerapkan filter pencarian dengan tab saat ini
        });
        
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
                'Document Number': doc.docNumber,
                'Cash Advance Number': doc.prno,
                'Requester': doc.requester,
                'Department': doc.department,
                'Purpose': doc.purpose,
                'Submission Date': doc.postingDate,
                'Status': doc.docStatus
            }));
            
            // Membuat worksheet dan menambahkannya ke workbook
            const worksheet = XLSX.utils.json_to_sheet(wsData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Cash Advance');
            
            // Menghasilkan file Excel
            XLSX.writeFile(workbook, 'cash_advance_list.xlsx');
        }

        // Fungsi Download PDF
        function downloadPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Menambahkan judul
            doc.setFontSize(16);
            doc.text('Cash Advance Report', 14, 15);
            
            // Membuat data tabel dari documents
            const documents = JSON.parse(localStorage.getItem("documents")) || [];
            const tableData = documents.map(doc => [
                doc.docNumber,
                doc.prno,
                doc.requester,
                doc.department,
                doc.purpose,
                doc.postingDate,
                doc.docStatus
            ]);
            
            // Menambahkan tabel
            doc.autoTable({
                head: [['Doc Number', 'Cash Advance Number', 'Requester', 'Department', 'Purpose', 'Submission Date', 'Status']],
                body: tableData,
                startY: 25
            });
            
            // Menyimpan PDF
            doc.save('cash_advance_list.pdf');
        }

        function goToMenu() { window.location.href = "Menu.html"; }
        function goToAddDoc() {window.location.href = "AddDoc.html"; }
        function goToAddReim() {window.location.href = "AddReim.html"; }
        function goToAddCash() {window.location.href = "../addPages/AddCash.html"; }
        function goToAddSettle() {window.location.href = "AddSettle.html"; }
        function goToAddPO() {window.location.href = "AddPO.html"; }
        function goToMenuPR() { window.location.href = "MenuPR.html"; }
        function goToMenuReim() { window.location.href = "pages/menuReim.html"; }
        function goToMenuCash() { window.location.href = "MenuCash.html"; }
        function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
        function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
        function goToMenuPO() { window.location.href = "MenuPO.html"; }
        function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
        function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
        function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; } 

        function detailDoc(caId) {
            // Store the selected document ID in localStorage for the detail page to use
            // localStorage.setItem("selectedCashAdvanceId", caId);
            // Navigate to detail page
            window.location.href = `/detailPages/detailCash.html?ca-id=${caId}`;
        }

        function downloadExcel() {

            fetch(`${BASE_URL}/api/cash-advance`)
                .then(response => response.json())
                .then(data => {
                    if (data.status && data.data) {
                        const documents = data.data;
                        
                        // Create worksheet data
                        const worksheetData = [
                            ['ID', 'Cash Advance No', 'Requester', 'Department', 'Purpose', 'Submission Date', 'Status']
                        ];
                        
                        documents.forEach(doc => {
                            worksheetData.push([
                                doc.id.substring(0, 10),
                                doc.cashAdvanceNo,
                                doc.requesterName,
                                doc.departmentName,
                                doc.purpose,
                                new Date(doc.submissionDate).toLocaleDateString(),
                                doc.status
                            ]);
                        });
                        
                        // Create worksheet
                        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
                        
                        // Create workbook
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Cash Advances');
                        
                        // Save file
                        XLSX.writeFile(wb, 'Cash_Advances.xlsx');
                    }
                })
                .catch(error => {
                    console.error('Error downloading Excel:', error);
                    alert('Failed to download Excel file. Please try again.');
                });
        }

        function downloadPDF() {
            fetch(`${BASE_URL}/api/cash-advance`)
                .then(response => response.json())
                .then(data => {
                    if (data.status && data.data) {
                        const documents = data.data;
                        
                        // Create document data
                        const docData = [];
                        
                        documents.forEach(doc => {
                            docData.push([
                                doc.id.substring(0, 10),
                                doc.cashAdvanceNo,
                                doc.requesterName,
                                doc.departmentName,
                                doc.purpose,
                                new Date(doc.submissionDate).toLocaleDateString(),
                                doc.status
                            ]);
                        });
                        
                        // Create PDF
                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF();
                        
                        doc.text('Cash Advances Report', 14, 16);
                        doc.autoTable({
                            head: [['ID', 'Cash Advance No', 'Requester', 'Department', 'Purpose', 'Submission Date', 'Status']],
                            body: docData,
                            startY: 20
                        });
                        
                        // Save file
                        doc.save('Cash_Advances.pdf');
                    }
                })
                .catch(error => {
                    console.error('Error downloading PDF:', error);
                    alert('Failed to download PDF file. Please try again.');
                });
        }

        window.onload = loadDashboard;