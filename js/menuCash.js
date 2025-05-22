         function loadDashboard() {
            const documents = JSON.parse(localStorage.getItem("documents")) || [];
            document.getElementById("totalDocs").textContent = documents.length;
            document.getElementById("pendingDocs").textContent = documents.filter(doc => doc.docStatus === "Pending").length;
            document.getElementById("approvedDocs").textContent = documents.filter(doc => doc.docStatus === "Approved").length;

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
                    <td class='p-2'>${doc.purpose}</td>
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
        function goToMenuReim() { window.location.href = "MenuReim.html"; }
        function goToMenuCash() { window.location.href = "MenuCash.html"; }
        function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
        function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
        function goToMenuPO() { window.location.href = "MenuPO.html"; }
        function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
        function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
        function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; } 

        window.onload = loadDashboard;