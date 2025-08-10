// Current tab state
let currentTab = 'approved'; // Default tab
let currentSearchTerm = '';
let currentSearchType = 'reimNo';
let currentPage = 1;
let itemsPerPage = 10;

// Reusable function to fetch outgoing payment documents by approval step
async function fetchOutgoingPaymentDocuments(step, userId, onlyCurrentStep = false, isRejected = false) {
    try {
        console.log(`Fetching documents for step: ${step}, userId: ${userId}, onlyCurrentStep: ${onlyCurrentStep}, isRejected: ${isRejected}`);

        const params = new URLSearchParams({
            step: step,
            userId: userId,
            onlyCurrentStep: onlyCurrentStep.toString(),
            includeDetails: 'false'
        });

        // Add isRejected parameter if specified
        if (isRejected) {
            params.append('isRejected', 'true');
        }

        const apiUrl = `${BASE_URL}/api/staging-outgoing-payments/headers?${params.toString()}`;
        console.log('API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log(`API response for step ${step} (onlyCurrentStep: ${onlyCurrentStep}):`, result);

        // Handle different response structures
        let documents = [];
        if (result.status && result.data) {
            documents = result.data;
        } else if (Array.isArray(result)) {
            documents = result;
        } else if (result.data) {
            documents = result.data;
        } else {
            documents = [];
        }

        console.log(`Returning ${documents.length} documents for step ${step}`);

        // Debug: Log first document structure if available
        if (documents.length > 0) {
            console.log('First document structure:', documents[0]);
            console.log('First document status fields:', {
                approval: documents[0].approval,
                status: documents[0].status,
                type: documents[0].type,
                doctype: documents[0].doctype
            });
        }

        return documents;
    } catch (error) {
        console.error(`Error fetching documents for step ${step}:`, error);
        return [];
    }
}

// Helper function to get access token
// Fallback getUserId function if not available from auth.js
if (typeof getUserId === 'undefined') {
    function getUserId() {
        const token = localStorage.getItem("accessToken");
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const userInfo = JSON.parse(jsonPayload);
                const userId = userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
                if (userId) return userId;
            } catch (e) {
                console.error('Error parsing JWT token:', e);
            }
        }

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
}

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function () {
    loadDashboard();

    // Add event listener for search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 500); // Debounce search by 500ms
        });
    }

    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', function () {
            const searchInput = document.getElementById('searchInput');

            // Update input type and placeholder based on search type
            if (this.value === 'docDate' || this.value === 'dueDate') {
                searchInput.type = 'date';
                searchInput.placeholder = 'Select date...';
            } else {
                searchInput.type = 'text';
                searchInput.placeholder = `Search by ${this.options[this.selectedIndex].text}...`;
            }

            // Clear current search and trigger new search
            searchInput.value = '';
            currentSearchTerm = '';
            currentSearchType = this.value;
            loadDashboard();
        });
    }
});

async function loadDashboard() {
    try {
        // Get user ID for approver ID
        const userId = getUserId();
        console.log('User ID from getUserId():', userId);

        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        console.log('loadDashboard called with currentTab:', currentTab);

        // Update counters first
        await updateCounters(userId);

        // Use the switchTab function to load the appropriate data
        await switchTab(currentTab);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Failed to load dashboard data. Please try again.');

        // Fallback to empty state
        updateTable([]);
        updatePaginationInfo(0);
    }
}

// Function to update counters by fetching data for all statuses
async function updateCounters(userId) {
    try {
        console.log('updateCounters called with userId:', userId);

        // Fetch all documents using the receivedBy endpoint
        console.log('Fetching documents for userId:', userId);
        const allDocuments = await fetchOutgoingPaymentDocuments('receivedBy', userId, false);
        console.log('All documents fetched:', allDocuments.length);
        console.log('All documents:', allDocuments);

        // Debug: Log each document's approval data
        allDocuments.forEach((doc, index) => {
            const approval = doc.approval || {};
            console.log(`Document ${index + 1}:`, {
                id: doc.stagingID || doc.id,
                counterRef: doc.counterRef,
                approvalStatus: approval.approvalStatus,
                receivedBy: approval.receivedBy,
                rejectedBy: approval.rejectedBy,
                currentUser: userId,
                isReceivedBy: approval.receivedBy === userId,
                isRejectedBy: approval.rejectedBy === userId
            });
        });

        // Count documents by status - only count documents where current user is receivedBy
        const approvedCount = allDocuments.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isApproved = status.toLowerCase() === 'approved';
            const isReceivedByCurrentUser = approval.receivedBy === userId;

            console.log(`Document ${doc.counterRef}: status="${status}", isApproved=${isApproved}, receivedBy="${approval.receivedBy}", currentUser="${userId}", isReceivedByCurrentUser=${isReceivedByCurrentUser}`);

            return isApproved && isReceivedByCurrentUser;
        }).length;

        // For received count, count documents with "Received" status assigned to current user
        const receivedCount = allDocuments.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isReceived = status.toLowerCase() === 'received';
            const isReceivedByCurrentUser = approval.receivedBy === userId;
            return isReceived && isReceivedByCurrentUser;
        }).length;

        const rejectedCount = allDocuments.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isRejected = status.toLowerCase() === 'rejected';
            const isRejectedByCurrentUser = approval.rejectedBy === userId;
            return isRejected && isRejectedByCurrentUser;
        }).length;

        // Total count should be documents that can be received (Approved or Received status)
        const totalCount = allDocuments.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isApproved = status.toLowerCase() === 'approved';
            const isReceived = status.toLowerCase() === 'received';
            const isReceivedByCurrentUser = approval.receivedBy === userId;
            return (isApproved || isReceived) && isReceivedByCurrentUser;
        }).length;

        console.log('Counter results:', {
            total: totalCount,
            approved: approvedCount,
            received: receivedCount,
            rejected: rejectedCount
        });

        // Update counters
        console.log('Updating DOM elements with counts:', {
            total: totalCount,
            approved: approvedCount,
            received: receivedCount,
            rejected: rejectedCount
        });

        const totalElement = document.getElementById("totalCount");
        const approvedElement = document.getElementById("approvedCount");
        const receivedElement = document.getElementById("receivedCount");
        const rejectedElement = document.getElementById("rejectedCount");

        if (totalElement) totalElement.textContent = totalCount;
        if (approvedElement) approvedElement.textContent = approvedCount;
        if (receivedElement) receivedElement.textContent = receivedCount;
        if (rejectedElement) rejectedElement.textContent = rejectedCount;

        console.log('DOM elements updated successfully');

    } catch (error) {
        console.error('Error updating counters:', error);
        // Set counters to 0 on error
        document.getElementById("totalCount").textContent = '0';
        document.getElementById("approvedCount").textContent = '0';
        document.getElementById("receivedCount").textContent = '0';
        document.getElementById("rejectedCount").textContent = '0';
    }
}

// Function to sort documents by Reimburse No (newest first)
function sortDocumentsByReimNo(documents) {
    return documents.sort((a, b) => {
        // Extract running number from Reimburse No
        const getRunningNumber = (reimNo) => {
            if (!reimNo) return 0;

            // Try to extract numeric part from Reimburse No
            const numericMatch = reimNo.toString().match(/\d+/g);
            if (numericMatch && numericMatch.length > 0) {
                // Join all numeric parts and convert to number
                return parseInt(numericMatch.join(''));
            }

            // If no numeric part found, use the entire string as fallback
            return reimNo.toString().localeCompare(b.counterRef || '');
        };

        const runningNumberA = getRunningNumber(a.counterRef);
        const runningNumberB = getRunningNumber(b.counterRef);

        // Sort in descending order (newest/highest number first)
        return runningNumberB - runningNumberA;
    });
}

// Function to format currency with Indonesian format
function formatCurrency(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '0';
    }

    // Parse the number
    const num = parseFloat(number);
    if (isNaN(num)) {
        return '0';
    }

    // Get the string representation to check if it has decimal places
    const numStr = num.toString();
    const hasDecimal = numStr.includes('.');

    try {
        // Format with Indonesian locale (thousand separator: '.', decimal separator: ',')
        if (hasDecimal) {
            const decimalPlaces = numStr.split('.')[1].length;
            return num.toLocaleString('id-ID', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
            });
        } else {
            return num.toLocaleString('id-ID', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }
    } catch (e) {
        // Fallback for very large numbers
        console.error('Error formatting number:', e);

        let strNum = num.toString();
        let sign = '';

        if (strNum.startsWith('-')) {
            sign = '-';
            strNum = strNum.substring(1);
        }

        const parts = strNum.split('.');
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? ',' + parts[1] : '';

        let formattedInteger = '';
        for (let i = 0; i < integerPart.length; i++) {
            if (i > 0 && (integerPart.length - i) % 3 === 0) {
                formattedInteger += '.';
            }
            formattedInteger += integerPart.charAt(i);
        }

        return sign + formattedInteger + decimalPart;
    }
}

// Function to update the table with documents
function updateTable(documents) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";

    if (documents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center p-4">No documents found</td></tr>`;
    } else {
        documents.forEach((doc, index) => {
            // Format dates
            const docDate = doc.docDate ? new Date(doc.docDate).toLocaleDateString() : '-';
            const docDueDate = doc.docDueDate ? new Date(doc.docDueDate).toLocaleDateString() : '-';

            // Calculate total amount from lines
            let totalAmount = 0;
            if (doc.lines && doc.lines.length > 0) {
                totalAmount = doc.lines.reduce((sum, line) => sum + (line.sumApplied || 0), 0);
            } else if (doc.trsfrSum) {
                totalAmount = doc.trsfrSum;
            }

            // Format total amount
            const formattedAmount = formatCurrency(totalAmount);

            // Check if fields are longer than 10 characters and apply scrollable class
            const reimNoClass = doc.counterRef && doc.counterRef.length > 10 ? 'scrollable-cell' : '';
            const requesterClass = doc.requesterName && doc.requesterName.length > 10 ? 'scrollable-cell' : '';
            const payToClass = doc.cardName && doc.cardName.length > 10 ? 'scrollable-cell' : '';

            const row = `<tr class='w-full border-b'>
                <td class='p-2'>${index + 1}</td>
                <td class='p-2'>
                    <div class="${reimNoClass}">${doc.counterRef || '-'}</div>
                </td>
                <td class='p-2'>
                    <div class="${requesterClass}">${doc.requesterName || '-'}</div>
                </td>
                <td class='p-2'>
                    <div class="${payToClass}">${doc.cardName || '-'}</div>
                </td>
                <td class='p-2'>${docDate}</td>
                <td class='p-2'>${docDueDate}</td>
                <td class='p-2'>${formattedAmount}</td>
                <td class='p-2'><span class="px-2 py-1 rounded-full text-xs ${getStatusClass(getStatusDisplay(doc))}">${getStatusDisplay(doc)}</span></td>
                <td class='p-2'>
                    <button onclick="detailDoc('${doc.stagingID || doc.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    }
}

// Function to switch between tabs
async function switchTab(tabName) {
    console.log('switchTab called with:', tabName);
    currentTab = tabName;

    // Update active tab styling
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));

    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found');
        return;
    }

    try {
        let documents = [];

        // Use the receivedBy endpoint as specified in the API call
        const allDocuments = await fetchOutgoingPaymentDocuments('receivedBy', userId, false);
        console.log(`Total documents fetched from receivedBy endpoint: ${allDocuments.length}`);

        if (tabName === 'approved') {
            console.log('Loading approved tab...');
            document.getElementById('approvedTabBtn').classList.add('tab-active');

            // For "Approved" tab, show documents with Approval Status "Approved" assigned to current user
            documents = allDocuments.filter(doc => {
                const approval = doc.approval || {};
                const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
                const isApproved = status.toLowerCase() === 'approved';
                const isReceivedByCurrentUser = approval.receivedBy === userId;

                // Debug logging for first few documents
                if (allDocuments.indexOf(doc) < 3) {
                    console.log(`Document ${doc.stagingID || doc.id}: approvalStatus="${approval.approvalStatus}", status="${status}", isApproved=${isApproved}, receivedBy="${approval.receivedBy}", currentUser="${userId}", isReceivedByCurrentUser=${isReceivedByCurrentUser}`);
                    console.log('Document approval data:', approval);
                }

                return isApproved && isReceivedByCurrentUser;
            });
            console.log('Approved documents loaded:', documents.length);

        } else if (tabName === 'received') {
            console.log('Loading received tab...');
            document.getElementById('receivedTabBtn').classList.add('tab-active');

            // For "Received" tab, show documents with "Received" status assigned to current user
            documents = allDocuments.filter(doc => {
                const approval = doc.approval || {};
                const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
                const isReceived = status.toLowerCase() === 'received';
                const isReceivedByCurrentUser = approval.receivedBy === userId;

                // Debug logging for first few documents
                if (allDocuments.indexOf(doc) < 3) {
                    console.log(`Document ${doc.stagingID || doc.id}: approvalStatus="${approval.approvalStatus}", status="${status}", isReceived=${isReceived}, receivedBy="${approval.receivedBy}", currentUser="${userId}", isReceivedByCurrentUser=${isReceivedByCurrentUser}`);
                }

                // Show documents with "Received" status assigned to current user
                return isReceived && isReceivedByCurrentUser;
            });
            console.log('Received documents loaded:', documents.length);

        } else if (tabName === 'rejected') {
            console.log('Loading rejected tab...');
            document.getElementById('rejectedTabBtn').classList.add('tab-active');

            // For "Rejected" tab, show documents with "Rejected" status that were rejected by current user
            documents = allDocuments.filter(doc => {
                const approval = doc.approval || {};
                const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
                const isRejected = status.toLowerCase() === 'rejected';
                const isRejectedByCurrentUser = approval.rejectedBy === userId;

                // Debug logging for first few documents
                if (allDocuments.indexOf(doc) < 3) {
                    console.log(`Document ${doc.stagingID || doc.id}: approvalStatus="${approval.approvalStatus}", status="${status}", isRejected=${isRejected}, rejectedBy="${approval.rejectedBy}", currentUser="${userId}", isRejectedByCurrentUser=${isRejectedByCurrentUser}`);
                    console.log('Document structure:', doc);
                }

                return isRejected && isRejectedByCurrentUser;
            });
            console.log('Rejected documents loaded:', documents.length);
        } else if (tabName === 'all') {
            console.log('Loading all documents tab...');
            document.getElementById('allTabBtn').classList.add('tab-active');

            // For "All" tab, show all documents assigned to current user
            documents = allDocuments;
            console.log('All documents loaded:', documents.length);
        }

        console.log('Total documents before filtering:', documents.length);

        // Apply search filter if there's a search term
        let filteredDocuments = documents;
        if (currentSearchTerm) {
            console.log('Applying search filter with term:', currentSearchTerm);
            filteredDocuments = documents.filter(doc => {
                switch (currentSearchType) {
                    case 'reimNo':
                        return doc.counterRef && doc.counterRef.toLowerCase().includes(currentSearchTerm.toLowerCase());
                    case 'requester':
                        return doc.requesterName && doc.requesterName.toLowerCase().includes(currentSearchTerm.toLowerCase());
                    case 'payTo':
                        return doc.cardName && doc.cardName.toLowerCase().includes(currentSearchTerm.toLowerCase());
                    case 'totalAmount':
                        const totalAmount = doc.trsfrSum ? doc.trsfrSum.toString() : '';
                        return totalAmount.toLowerCase().includes(currentSearchTerm.toLowerCase());
                    case 'status':
                        const status = getStatusDisplay(doc);
                        return status.toLowerCase().includes(currentSearchTerm.toLowerCase());
                    case 'docDate':
                        const docDate = doc.docDate ? new Date(doc.docDate).toLocaleDateString() : '';
                        return docDate.toLowerCase().includes(currentSearchTerm.toLowerCase());
                    case 'dueDate':
                        const dueDate = doc.docDueDate ? new Date(doc.docDueDate).toLocaleDateString() : '';
                        return dueDate.toLowerCase().includes(currentSearchTerm.toLowerCase());
                    default:
                        return true;
                }
            });
            console.log('Documents after filtering:', filteredDocuments.length);
        }

        // Sort documents by Reimburse No (newest first)
        const sortedDocuments = sortDocumentsByReimNo(filteredDocuments);
        console.log('Documents after sorting:', sortedDocuments.length);

        // Update the table with filtered documents
        updateTable(sortedDocuments);

        // Update pagination info
        updatePaginationInfo(sortedDocuments.length);

    } catch (error) {
        console.error('Error switching tab:', error);
        // Fallback to empty state
        updateTable([]);
        updatePaginationInfo(0);
    }

    // Reset search when switching tabs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        currentSearchTerm = '';
    }

    // Reset pagination
    currentPage = 1;
}

// Function to handle search input
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    currentSearchTerm = searchInput ? searchInput.value.trim() : '';
    currentSearchType = document.getElementById('searchType').value;
    currentPage = 1; // Reset to first page when searching
    loadDashboard();
}

// Helper function to get status styling
function getStatusClass(status) {
    switch (status) {
        case 'Prepared': return 'bg-yellow-100 text-yellow-800';
        case 'Draft': return 'bg-yellow-100 text-yellow-800';
        case 'Checked': return 'bg-green-100 text-green-800';
        case 'Acknowledge': return 'bg-blue-100 text-blue-800';
        case 'Approved': return 'bg-indigo-100 text-indigo-800';
        case 'Received': return 'bg-purple-100 text-purple-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'Reject': return 'bg-red-100 text-red-800';
        case 'Close': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Helper function to determine status display for documents
function getStatusDisplay(doc) {
    // If no approval object, check various status fields
    if (!doc.approval) {
        const status = doc.status || doc.type || doc.doctype || 'Draft';
        // Map "Draft" status to "Prepared" for display consistency
        if (status.toLowerCase() === 'draft') {
            return 'Prepared';
        }
        return status;
    }

    // Check if document is rejected
    if (doc.approval.rejectedDate) {
        return 'Rejected';
    }

    // Return normal approval status
    const status = doc.approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';

    // Map "Draft" status to "Prepared" for display consistency
    if (status.toLowerCase() === 'draft') {
        return 'Prepared';
    }

    return status;
}

// Update pagination information
function updatePaginationInfo(totalItems) {
    document.getElementById('totalItems').textContent = totalItems;

    // Calculate start and end items for current page
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    document.getElementById('startItem').textContent = startItem;
    document.getElementById('endItem').textContent = endItem;

    // Update pagination buttons state
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (prevPageBtn) {
        if (currentPage <= 1) {
            prevPageBtn.classList.add('disabled');
        } else {
            prevPageBtn.classList.remove('disabled');
        }
    }

    if (nextPageBtn) {
        if (currentPage >= Math.ceil(totalItems / itemsPerPage)) {
            nextPageBtn.classList.add('disabled');
        } else {
            nextPageBtn.classList.remove('disabled');
        }
    }

    // Update current page display
    document.getElementById('currentPage').textContent = currentPage;
}

// Pagination handlers
function changePage(direction) {
    const totalItems = parseInt(document.getElementById('totalItems').textContent);
    const maxPage = Math.ceil(totalItems / itemsPerPage);

    if (direction === -1 && currentPage > 1) {
        currentPage--;
        loadDashboard();
    } else if (direction === 1 && currentPage < maxPage) {
        currentPage++;
        loadDashboard();
    }
}

// Function to navigate to total documents page
function goToTotalDocs() {
    // This would navigate to the total documents view
    console.log('Navigate to total documents view');
}

function detailDoc(id) {
    window.location.href = `../../../approval/receive/outgoingPayment/receiveOPReim.html?id=${id}&tab=${currentTab}`;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

// Excel Export Function
function downloadExcel() {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Get current tab name for the file name
    const statusText = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

    // Get table data
    const tableRows = document.querySelectorAll('#recentDocs tr');
    const tableData = [];

    // Table headers
    const headers = [
        'No', 'Voucher No.', 'Requester', 'Pay To',
        'Document Date', 'Due Date', 'Total Amount', 'Status'
    ];
    tableData.push(headers);

    // Table rows
    tableRows.forEach((row, index) => {
        const rowData = [];
        const cells = row.querySelectorAll('td');

        if (cells.length > 0) {
            rowData.push(cells[0] ? cells[0].textContent.trim() : index + 1); // No
            rowData.push(cells[1] ? cells[1].textContent.trim() : ''); // Voucher No.
            rowData.push(cells[2] ? cells[2].textContent.trim() : ''); // Requester
            rowData.push(cells[3] ? cells[3].textContent.trim() : ''); // Pay To
            rowData.push(cells[4] ? cells[4].textContent.trim() : ''); // Document Date
            rowData.push(cells[5] ? cells[5].textContent.trim() : ''); // Due Date
            rowData.push(cells[6] ? cells[6].textContent.trim() : ''); // Total Amount
            rowData.push(cells[7] ? cells[7].textContent.trim() : ''); // Status

            tableData.push(rowData);
        }
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(tableData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OP Reimbursement');

    // Generate Excel file
    XLSX.writeFile(workbook, `op_reimbursement_${statusText.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// PDF Export Function
function downloadPDF() {
    // Use the jsPDF library
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Get current tab name for the title
    const statusText = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

    // Add title with current filter information
    doc.setFontSize(16);
    doc.text(`Outgoing Payment Reimbursement Report - ${statusText}`, 14, 15);

    // Add timestamp
    const now = new Date();
    const timestamp = `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    doc.setFontSize(10);
    doc.text(timestamp, 14, 22);

    // Get table data
    const tableRows = document.querySelectorAll('#recentDocs tr');
    const tableData = [];

    // Table rows
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = [
                cells[0] ? cells[0].textContent.trim() : '', // No
                cells[1] ? cells[1].textContent.trim() : '', // Voucher No.
                cells[2] ? cells[2].textContent.trim() : '', // Requester
                cells[3] ? cells[3].textContent.trim() : '', // Pay To
                cells[4] ? cells[4].textContent.trim() : '', // Document Date
                cells[5] ? cells[5].textContent.trim() : '', // Due Date
                cells[6] ? cells[6].textContent.trim() : '', // Total Amount
                cells[7] ? cells[7].textContent.trim() : ''  // Status
            ];
            tableData.push(rowData);
        }
    });

    // Add table with styling
    doc.autoTable({
        head: [['No', 'Voucher No.', 'Requester', 'Pay To', 'Document Date', 'Due Date', 'Total Amount', 'Status']],
        body: tableData,
        startY: 30,
        styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak'
        },
        columnStyles: {
            0: { cellWidth: 10 },     // No
            1: { cellWidth: 25 },     // Reimburse No
            2: { cellWidth: 25 },     // Requester
            3: { cellWidth: 25 },     // Pay To
            4: { cellWidth: 20 },     // Document Date
            5: { cellWidth: 20 },     // Due Date
            6: { cellWidth: 25 },     // Total Amount
            7: { cellWidth: 20 }      // Status
        },
        headStyles: {
            fillColor: [66, 133, 244],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        }
    });

    // Add total count at the bottom
    const finalY = doc.lastAutoTable.finalY || 30;
    doc.setFontSize(10);
    doc.text(`Total Records: ${tableData.length}`, 14, finalY + 10);

    // Save the PDF with current filter in the filename
    doc.save(`op_reimbursement_${statusText.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Debug function to test tab functionality
async function debugTabFunctionality() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found for debug');
        return;
    }

    console.log('=== DEBUG: Testing Tab Functionality ===');

    try {
        // Get all documents using the receivedBy endpoint
        const allDocs = await fetchOutgoingPaymentDocuments('receivedBy', userId, false);
        console.log('All documents fetched:', allDocs.length);

        // Test Approved tab
        console.log('=== TESTING APPROVED TAB ===');
        const approvedFiltered = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isApproved = status.toLowerCase() === 'approved';
            const isReceivedByCurrentUser = approval.receivedBy === userId;
            return isApproved && isReceivedByCurrentUser;
        });
        console.log('Approved documents by current user:', approvedFiltered.length, approvedFiltered);

        // Test Received tab
        console.log('=== TESTING RECEIVED TAB ===');
        const receivedFiltered = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isReceived = status.toLowerCase() === 'received';
            const isReceivedByCurrentUser = approval.receivedBy === userId;
            return isReceived && isReceivedByCurrentUser;
        });
        console.log('Received documents by current user:', receivedFiltered.length, receivedFiltered);

        // Test Rejected tab
        console.log('=== TESTING REJECTED TAB ===');
        const rejectedFiltered = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isRejected = status.toLowerCase() === 'rejected';
            const isRejectedByCurrentUser = approval.rejectedBy === userId;
            return isRejected && isRejectedByCurrentUser;
        });
        console.log('Rejected documents by current user:', rejectedFiltered.length, rejectedFiltered);

        console.log('=== DEBUG: Tab Functionality Test Complete ===');

    } catch (error) {
        console.error('Error in debugTabFunctionality:', error);
    }
}

// Function to show all documents for debugging
async function showAllDocuments() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found');
        return;
    }

    try {
        const allDocs = await fetchOutgoingPaymentDocuments('receivedBy', userId, false);
        console.log('=== ALL DOCUMENTS FOR DEBUGGING ===');
        console.log('Total documents:', allDocs.length);

        allDocs.forEach((doc, index) => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            console.log(`Document ${index + 1}:`, {
                id: doc.stagingID || doc.id,
                counterRef: doc.counterRef,
                approvalStatus: approval.approvalStatus,
                status: status,
                receivedBy: approval.receivedBy,
                receivedById: approval.receivedById,
                currentUser: userId,
                isReceivedBy: approval.receivedBy === userId || approval.receivedById === userId
            });
        });

        // Show alert with summary
        const approvedCount = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isApproved = status.toLowerCase() === 'approved';
            const isReceivedByCurrentUser = approval.receivedBy === userId;
            return isApproved && isReceivedByCurrentUser;
        }).length;

        const receivedCount = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isReceived = status.toLowerCase() === 'received';
            const isReceivedByCurrentUser = approval.receivedBy === userId;
            return isReceived && isReceivedByCurrentUser;
        }).length;

        const rejectedCount = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isRejected = status.toLowerCase() === 'rejected';
            const isRejectedByCurrentUser = approval.rejectedBy === userId;
            return isRejected && isRejectedByCurrentUser;
        }).length;

        alert(`Total Documents: ${allDocs.length}\nApproved (assigned to current user): ${approvedCount}\nReceived (assigned to current user): ${receivedCount}\nRejected (by current user): ${rejectedCount}\n\nNote: Total shows documents that can be received (Approved or Received). Rejected only shows documents rejected by this receiver, not by others.\n\nCheck browser console for detailed information.`);

    } catch (error) {
        console.error('Error in showAllDocuments:', error);
        alert('Error loading documents. Check console for details.');
    }
}

// Function to navigate to user profile page
function goToProfile() {
    window.location.href = "../../../../pages/profil.html";
} 