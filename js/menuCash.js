         function loadDashboard() {
            const baseUrl = "https://t246vds2-5246.asse.devtunnels.ms";
            
            fetch(`${baseUrl}/api/cash-advance`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success && data.result) {
                        const documents = data.result;
                        
                        // Update dashboard counts
                        document.getElementById("totalDocs").textContent = documents.length;
                        document.getElementById("draftDocs").textContent = documents.filter(doc => doc.status === "Draft").length;
                        document.getElementById("submittedDocs").textContent = documents.filter(doc => doc.status === "Submitted").length;
                        document.getElementById("checkedDocs").textContent = documents.filter(doc => doc.status === "Checked").length;
                        document.getElementById("acknowledgedDocs").textContent = documents.filter(doc => doc.status === "Acknowledged").length;
                        document.getElementById("approvedDocs").textContent = documents.filter(doc => doc.status === "Approved").length;
                        document.getElementById("paidDocs").textContent = documents.filter(doc => doc.status === "Paid").length;
                        document.getElementById("rejectedDocs").textContent = documents.filter(doc => doc.status === "Rejected").length;
                        document.getElementById("settledDocs").textContent = documents.filter(doc => doc.status === "Settled").length;
                        
                        // Display documents in table
                        const tableBody = document.getElementById("recentDocs");
                        tableBody.innerHTML = "";
                        
                        documents.forEach(doc => {
                            const row = `<tr class='border-b'>
                                <td class='p-2 text-left'><input type="checkbox" class="rowCheckbox"></td>
                                <td class='p-2'>${doc.id}</td>
                                <td class='p-2'>${doc.cashAdvanceNo}</td>
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

        function detailDoc(caId) {
            // Store the selected document ID in localStorage for the detail page to use
            localStorage.setItem("selectedCashAdvanceId", caId);
            // Navigate to detail page
            window.location.href = `/detailPages/detailCash.html?ca-id=${caId}`;
        }

        function downloadExcel() {
            const baseUrl = "https://t246vds2-5246.asse.devtunnels.ms";
            
            fetch(`${baseUrl}/api/cash-advance`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.result) {
                        const documents = data.result;
                        
                        // Create worksheet data
                        const worksheetData = [
                            ['ID', 'Cash Advance No', 'Requester', 'Department', 'Purpose', 'Submission Date', 'Status']
                        ];
                        
                        documents.forEach(doc => {
                            worksheetData.push([
                                doc.id,
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
            const baseUrl = "https://t246vds2-5246.asse.devtunnels.ms";
            
            fetch(`${baseUrl}/api/cash-advance`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.result) {
                        const documents = data.result;
                        
                        // Create document data
                        const docData = [];
                        
                        documents.forEach(doc => {
                            docData.push([
                                doc.id,
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