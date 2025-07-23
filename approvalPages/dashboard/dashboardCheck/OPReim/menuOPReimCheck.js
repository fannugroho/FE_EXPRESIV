// Debug: Check if script is loading
console.log('menuOPReimCheck.js loaded');

// Current tab state
let currentTab = 'prepared'; // Default tab
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

// Function to fetch all documents for "All Documents" tab (checking stage onwards)
async function fetchAllDocuments(userId) {
    try {
        const steps = ['CheckedBy', 'AcknowledgedBy', 'ApprovedBy', 'ReceivedBy'];
        
        // Make parallel API calls for all steps with onlyCurrentStep = false (historical view)
        const promises = steps.map(step => fetchOutgoingPaymentDocuments(step, userId, false));
        const results = await Promise.all(promises);
        
        // Combine all results into a single array
        const allDocuments = results.flat();
        
        // Remove duplicates based on document ID (assuming there's an id field)
        const uniqueDocuments = allDocuments.filter((doc, index, self) => 
            index === self.findIndex(d => d.id === doc.id)
        );
        
        return uniqueDocuments;
    } catch (error) {
        console.error('Error fetching all documents:', error);
        return [];
    }
}

// Function to fetch checked documents for "Checked" tab
async function fetchCheckedDocuments(userId) {
    console.log('fetchCheckedDocuments called with userId:', userId);
    
    // For "Checked" tab, we want documents with "Checked" status only
    try {
        // Get all documents from checkedBy endpoint
        const allDocuments = await fetchOutgoingPaymentDocuments('checkedBy', userId, false);
        console.log('All documents:', allDocuments);
        
        // Return all documents EXCEPT "Prepared"
        const checkedDocs = allDocuments.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isPrepared = status.toLowerCase() === 'prepared';
            
            // Debug logging for first few documents
            if (allDocuments.indexOf(doc) < 3) {
                console.log(`Document ${doc.stagingID || doc.id}: approvalStatus="${approval.approvalStatus}", status="${status}", isPrepared=${isPrepared}`);
            }
            
            // Return all documents EXCEPT "Prepared"
            return !isPrepared;
        });
        
        console.log('All documents except Prepared returned for checked tab:', checkedDocs.length);
        
        console.log('Filtered documents with Checked status:', checkedDocs);
        return checkedDocs;
    } catch (error) {
        console.error('Error in fetchCheckedDocuments:', error);
        return [];
    }
}

// Debug function to check all documents and their approval status
async function debugAllDocuments(userId) {
    console.log('=== DEBUG: Checking all documents for user:', userId, '===');
    
    try {
        // Get all documents from checkedBy endpoint
        const allDocs = await fetchOutgoingPaymentDocuments('checkedBy', userId, false);
        
        console.log('All documents:', allDocs);
        
        // Check each document's approval data
        allDocs.forEach((doc, index) => {
            console.log(`Document ${index + 1}:`, {
                id: doc.stagingID || doc.id,
                counterRef: doc.counterRef,
                status: doc.approval?.approvalStatus,
                preparedBy: doc.approval?.preparedBy,
                checkedBy: doc.approval?.checkedBy,
                approvedBy: doc.approval?.approvedBy,
                receivedBy: doc.approval?.receivedBy
            });
        });
        
        // Find documents where current user is checkedBy
        const userCheckedDocs = allDocs.filter(doc => {
            const approval = doc.approval || {};
            return approval.checkedBy === userId || approval.checkedById === userId;
        });
        
        console.log('Documents where current user is checkedBy:', userCheckedDocs);
        
        return {
            allDocs,
            userCheckedDocs
        };
        
    } catch (error) {
        console.error('Error in debugAllDocuments:', error);
        return null;
    }
}

// Enhanced debug function to check documents needing approval
async function debugDocumentsNeedingApproval(userId) {
    console.log('=== ENHANCED DEBUG: Checking documents needing approval for user:', userId, '===');
    
    try {
        // Get documents using the new function
        const approvalDocs = await fetchDocumentsNeedingApproval(userId);
        console.log('Documents needing approval:', approvalDocs);
        
        // Check each document's approval data in detail
        approvalDocs.forEach((doc, index) => {
            const approval = doc.approval || {};
            console.log(`Document ${index + 1} (${doc.counterRef}):`, {
                stagingID: doc.stagingID || doc.id,
                counterRef: doc.counterRef,
                approvalStatus: approval.approvalStatus,
                preparedBy: approval.preparedBy,
                checkedBy: approval.checkedBy,
                acknowledgedBy: approval.acknowledgedBy,
                approvedBy: approval.approvedBy,
                receivedBy: approval.receivedBy,
                isCheckedBy: approval.checkedBy === userId,
                isAcknowledgedBy: approval.acknowledgedBy === userId,
                isApprovedBy: approval.approvedBy === userId,
                isReceivedBy: approval.receivedBy === userId
            });
        });
        
        // Also check regular prepared documents for comparison
        const regularPreparedDocs = await fetchPreparedDocuments(userId);
        console.log('Regular prepared documents (old logic):', regularPreparedDocs);
        
        return {
            approvalDocs,
            regularPreparedDocs
        };
        
    } catch (error) {
        console.error('Error in debugDocumentsNeedingApproval:', error);
        return null;
    }
}

// Function to add debug button to the page
function addDebugButton() {
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug Documents';
    debugButton.className = 'bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 ml-4';
    debugButton.onclick = async () => {
        const userId = getUserId();
        if (userId) {
            const debugResult = await debugDocumentsNeedingApproval(userId);
            console.log('Debug result:', debugResult);
            
            // Show debug info in alert
            if (debugResult) {
                const message = `
Enhanced Debug Results:
- Documents needing approval: ${debugResult.approvalDocs.length}
- Regular prepared documents: ${debugResult.regularPreparedDocs.length}

Check browser console for detailed information.
                `;
                alert(message);
            }
        } else {
            alert('User ID not found');
        }
    };
    
    // Add button to the page
    const container = document.querySelector('.flex.justify-between.mt-4');
    if (container) {
        container.appendChild(debugButton);
    }
}

// Function to fetch prepared documents for "Prepared" tab
async function fetchPreparedDocuments(userId) {
    console.log('fetchPreparedDocuments called with userId:', userId);
    
    // For "Prepared" tab, we want documents with "Prepared" status that need approval from current user
    try {
        // Get all documents and filter by status
        const allDocuments = await fetchOutgoingPaymentDocuments('checkedBy', userId, false);
        console.log('All documents:', allDocuments);
        
        // Filter documents with "Prepared" status (ALL documents with Prepared status)
        const preparedDocs = allDocuments.filter(doc => {
            // Get status from approval.approvalStatus first, then fallback to other fields
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isPrepared = status.toLowerCase() === 'prepared';
            
            // Debug logging for first few documents
            if (allDocuments.indexOf(doc) < 3) {
                console.log(`Document ${doc.stagingID || doc.id}: approvalStatus="${approval.approvalStatus}", status="${status}", isPrepared=${isPrepared}`);
            }
            
            // Show ALL documents that are "Prepared" (regardless of checkedBy)
            return isPrepared;
        });
        
        console.log('Filtered documents with Prepared status needing approval:', preparedDocs);
        return preparedDocs;
    } catch (error) {
        console.error('Error in fetchPreparedDocuments:', error);
        return [];
    }
}

// Function to get all documents that need approval from current user
async function fetchDocumentsNeedingApproval(userId) {
    console.log('fetchDocumentsNeedingApproval called with userId:', userId);
    
    try {
        // Get all documents from checkedBy endpoint
        const allDocs = await fetchOutgoingPaymentDocuments('checkedBy', userId, false);
        
        console.log('All documents:', allDocs);
        
        // Remove duplicates based on stagingID
        const uniqueDocs = allDocs.filter((doc, index, self) => 
            index === self.findIndex(d => (d.stagingID || d.id) === (doc.stagingID || d.id))
        );
        
        // Filter documents where current user is the checkedBy
        const userApprovalDocs = uniqueDocs.filter(doc => {
            const approval = doc.approval || {};
            const isCheckedBy = approval.checkedBy === userId || approval.checkedById === userId;
            const isAcknowledgedBy = approval.acknowledgedBy === userId || approval.acknowledgedById === userId;
            const isApprovedBy = approval.approvedBy === userId || approval.approvedById === userId;
            const isReceivedBy = approval.receivedBy === userId || approval.receivedById === userId;
            
            console.log(`Document ${doc.counterRef}:`, {
                checkedBy: approval.checkedBy,
                acknowledgedBy: approval.acknowledgedBy,
                approvedBy: approval.approvedBy,
                receivedBy: approval.receivedBy,
                currentUser: userId,
                isCheckedBy,
                isAcknowledgedBy,
                isApprovedBy,
                isReceivedBy
            });
            
            return isCheckedBy || isAcknowledgedBy || isApprovedBy || isReceivedBy;
        });
        
        console.log('Documents needing approval from current user:', userApprovalDocs);
        return userApprovalDocs;
        
    } catch (error) {
        console.error('Error in fetchDocumentsNeedingApproval:', error);
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
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
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

// Debug function to test tab functionality
async function debugTabFunctionality() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found for debug');
        return;
    }
    
    console.log('=== DEBUG: Testing Tab Functionality ===');
    
    try {
        // Get all documents first using the checkedBy endpoint
        const allDocs = await fetchOutgoingPaymentDocuments('checkedBy', userId, false);
        console.log('All documents fetched:', allDocs.length);
        
        // Log all documents with their status for debugging
        console.log('=== ALL DOCUMENTS WITH STATUS ===');
        allDocs.forEach((doc, index) => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            console.log(`Document ${index + 1}:`, {
                id: doc.stagingID || doc.id,
                counterRef: doc.counterRef,
                approvalStatus: approval.approvalStatus,
                status: status,
                checkedBy: approval.checkedBy,
                checkedById: approval.checkedById,
                currentUser: userId,
                isCheckedBy: approval.checkedBy === userId || approval.checkedById === userId
            });
        });
        
        // Test Prepared tab
        console.log('=== TESTING PREPARED TAB ===');
        const preparedFiltered = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isPrepared = status.toLowerCase() === 'prepared';
            // Show ALL documents that are "Prepared"
            return isPrepared;
        });
        console.log('All Prepared documents:', preparedFiltered.length, preparedFiltered);
        
        // Test Checked tab
        console.log('=== TESTING CHECKED TAB ===');
        const checkedFiltered = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isPrepared = status.toLowerCase() === 'prepared';
            // Show all documents EXCEPT "Prepared"
            return !isPrepared;
        });
        console.log('All documents except Prepared for checked tab:', checkedFiltered.length, checkedFiltered);
        
        // Test Rejected tab
        console.log('=== TESTING REJECTED TAB ===');
        const rejectedFiltered = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            return status.toLowerCase() === 'rejected';
        });
        console.log('Rejected documents:', rejectedFiltered.length, rejectedFiltered);
        
        console.log('=== DEBUG: Tab Functionality Test Complete ===');
        
    } catch (error) {
        console.error('Error in debugTabFunctionality:', error);
    }
}

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, calling loadDashboard');
    loadDashboard();
    
    // Add debug button for troubleshooting
    addDebugButton();
    
    // Add event listener for search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 500); // Debounce search by 500ms
        });
    }
    
    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', function() {
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
        console.log('loadDashboard called');
        
        // Get user ID for approver ID
        const userId = getUserId();
        console.log('User ID:', userId);
        
        if (!userId) {
            console.error('Unable to get user ID from token');
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        // Load documents for the default tab (prepared - shows all documents)
        await switchTab('prepared');
        
        // Update counters only once on initial load
        await updateCounters(userId);
        
        // Debug: Test tab functionality
        await debugTabFunctionality();
        
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
        
        // Fetch all documents using the checkedBy endpoint
        const allDocuments = await fetchOutgoingPaymentDocuments('checkedBy', userId, false);
        
        // Count documents by status
        const preparedCount = allDocuments.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isPrepared = status.toLowerCase() === 'prepared';
            // Count ALL documents that are "Prepared"
            return isPrepared;
        }).length;
        
        // For checked count, count all documents EXCEPT "Prepared"
        const checkedCount = allDocuments.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isPrepared = status.toLowerCase() === 'prepared';
            return !isPrepared;
        }).length;
        
        const rejectedCount = allDocuments.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            return status.toLowerCase() === 'rejected';
        }).length;
        
        const totalCount = allDocuments.length;

        console.log('Counter results:', {
            total: totalCount,
            prepared: preparedCount,
            checked: checkedCount,
            rejected: rejectedCount
        });

        // Update counters
        document.getElementById("totalCount").textContent = totalCount;
        document.getElementById("preparedCount").textContent = preparedCount;
        document.getElementById("checkedCount").textContent = checkedCount;
        document.getElementById("rejectedCount").textContent = rejectedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
        // Set counters to 0 on error
        document.getElementById("totalCount").textContent = '0';
        document.getElementById("preparedCount").textContent = '0';
        document.getElementById("checkedCount").textContent = '0';
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
    console.log('updateTable called with documents:', documents);
    console.log('Number of documents to display:', documents.length);
    
    const tableBody = document.getElementById("recentDocs");
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }
    
    tableBody.innerHTML = "";
    
    if (documents.length === 0) {
        console.log('No documents to display, showing empty message');
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center p-4 text-gray-500">No documents found for the selected tab.</td></tr>`;
    } else {
        console.log('Processing documents for table display');
        documents.forEach((doc, index) => {
            console.log(`Processing document ${index + 1}:`, doc);
            
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
            
            // Get status display
            const status = getStatusDisplay(doc);
            const statusClass = getStatusClass(status);
            const statusDisplay = `<span class="px-2 py-1 ${statusClass} rounded-full text-xs">${status}</span>`;
            
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
                <td class='p-2'>${statusDisplay}</td>
                <td class='p-2 text-center'>
                    <button onclick="detailDoc('${doc.stagingID || doc.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>`;
            
            tableBody.innerHTML += row;
        });
        
        console.log('Table updated with', documents.length, 'documents');
    }
}

// Function to switch between tabs
async function switchTab(tabName) {
    console.log('switchTab called with:', tabName);
    currentTab = tabName;
    
    // Update active tab styling
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));
    
    const userId = getUserId();
    console.log('Current user ID for switchTab:', userId);
    
    if (!userId) {
        console.error('User ID not found');
        return;
    }
    
    try {
        let documents = [];
        
        // Use the checkedBy endpoint as specified in the API call
        const allDocuments = await fetchOutgoingPaymentDocuments('checkedBy', userId, false);
        console.log(`Total documents fetched from checkedBy endpoint: ${allDocuments.length}`);
        
        if (tabName === 'prepared') {
            console.log('Loading prepared tab...');
            document.getElementById('preparedTabBtn').classList.add('tab-active');
            
            // For "Prepared" tab, show all documents with "Prepared" status
            documents = allDocuments.filter(doc => {
                // Get status from approval.approvalStatus first, then fallback to other fields
                const approval = doc.approval || {};
                const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
                const isPrepared = status.toLowerCase() === 'prepared';
                
                // Debug logging for first few documents
                if (allDocuments.indexOf(doc) < 3) {
                    console.log(`Document ${doc.stagingID || doc.id}: approvalStatus="${approval.approvalStatus}", status="${status}", isPrepared=${isPrepared}`);
                    console.log('Document approval data:', approval);
                }
                
                // Show ALL documents that are "Prepared"
                return isPrepared;
            });
            console.log('Prepared documents loaded:', documents.length);
            
        } else if (tabName === 'checked') {
            console.log('Loading checked tab...');
            document.getElementById('checkedTabBtn').classList.add('tab-active');
            
            // For "Checked" tab, show all documents EXCEPT "Prepared"
            documents = allDocuments.filter(doc => {
                // Get status from approval.approvalStatus first, then fallback to other fields
                const approval = doc.approval || {};
                const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
                const isPrepared = status.toLowerCase() === 'prepared';
                
                // Debug logging for first few documents
                if (allDocuments.indexOf(doc) < 3) {
                    console.log(`Document ${doc.stagingID || doc.id}: approvalStatus="${approval.approvalStatus}", status="${status}", isPrepared=${isPrepared}`);
                }
                
                // Show all documents EXCEPT "Prepared"
                return !isPrepared;
            });
            
            console.log('All documents except Prepared loaded for checked tab:', documents.length);
            
        } else if (tabName === 'rejected') {
            console.log('Loading rejected tab...');
            document.getElementById('rejectedTabBtn').classList.add('tab-active');
            
            // For "Rejected" tab, show all documents with Approval Status "Rejected"
            documents = allDocuments.filter(doc => {
                // Get status from approval.approvalStatus first, then fallback to other fields
                const approval = doc.approval || {};
                const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
                const isRejected = status.toLowerCase() === 'rejected';
                
                // Debug logging for first few documents
                if (allDocuments.indexOf(doc) < 3) {
                    console.log(`Document ${doc.stagingID || doc.id}: approvalStatus="${approval.approvalStatus}", status="${status}", isRejected=${isRejected}`);
                    console.log('Document structure:', doc);
                }
                
                return isRejected;
            });
            console.log('Rejected documents loaded:', documents.length);
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
async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    currentSearchTerm = searchInput ? searchInput.value.trim() : '';
    currentSearchType = document.getElementById('searchType').value;
    currentPage = 1; // Reset to first page when searching
    
    // Reload the current tab with search filter
    await switchTab(currentTab);
}

// Helper function to get status styling
function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'prepared': return 'bg-yellow-100 text-yellow-800';
        case 'draft': return 'bg-yellow-100 text-yellow-800';
        case 'checked': return 'bg-green-100 text-green-800';
        case 'acknowledge': return 'bg-blue-100 text-blue-800';
        case 'acknowledged': return 'bg-blue-100 text-blue-800';
        case 'approved': return 'bg-indigo-100 text-indigo-800';
        case 'received': return 'bg-purple-100 text-purple-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'reject': return 'bg-red-100 text-red-800';
        case 'close': return 'bg-gray-100 text-gray-800';
        case 'settled': return 'bg-green-100 text-green-800';
        case 'paid': return 'bg-green-100 text-green-800';
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
async function changePage(direction) {
    const totalItems = parseInt(document.getElementById('totalItems').textContent);
    const maxPage = Math.ceil(totalItems / itemsPerPage);
    
    if (direction === -1 && currentPage > 1) {
        currentPage--;
        await switchTab(currentTab);
    } else if (direction === 1 && currentPage < maxPage) {
        currentPage++;
        await switchTab(currentTab);
    }
}

// Function to navigate to total documents page
function goToTotalDocs() {
    // This would navigate to the total documents view
    console.log('Navigate to total documents view');
}

function detailDoc(id) {
    window.location.href = `../../../approval/check/outgoingPayment/checkedOPReim.html?id=${id}&tab=${currentTab}`;
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

// Function to show all documents for debugging
async function showAllDocuments() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found');
        return;
    }
    
    try {
        const allDocs = await fetchOutgoingPaymentDocuments('checkedBy', userId, false);
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
                checkedBy: approval.checkedBy,
                checkedById: approval.checkedById,
                currentUser: userId,
                isCheckedBy: approval.checkedBy === userId || approval.checkedById === userId
            });
        });
        
        // Show alert with summary
        const preparedCount = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isPrepared = status.toLowerCase() === 'prepared';
            return isPrepared;
        }).length;
        
        const checkedCount = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const isPrepared = status.toLowerCase() === 'prepared';
            return !isPrepared;
        }).length; // All documents except Prepared for checked tab
        
        const rejectedCount = allDocs.filter(doc => {
            const approval = doc.approval || {};
            const status = approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            return status.toLowerCase() === 'rejected';
        }).length;
        
        alert(`Total Documents: ${allDocs.length}\nPrepared (needing approval): ${preparedCount}\nChecked: ${checkedCount}\nRejected: ${rejectedCount}\n\nCheck browser console for detailed information.`);
        
    } catch (error) {
        console.error('Error in showAllDocuments:', error);
        alert('Error loading documents. Check console for details.');
    }
}

// Function to navigate to user profile page
function goToProfile() {
    window.location.href = "../../../../pages/profil.html";
} 