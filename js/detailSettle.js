// Initialize uploaded files array
let uploadedFiles = [];

// API configuration
const baseUrl = 'https://t246vds2-5246.asse.devtunnels.ms';
let settlementData = null;

// Get settlement ID from URL parameters
function getSettlementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('settle-id');
}

// Fetch settlement data from API
async function fetchSettlementData(settlementId) {
    try {
        const response = await fetch(`${baseUrl}/api/settlements/${settlementId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.status && result.code === 200) {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to fetch settlement data');
            }
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching settlement data:', error);
        alert('Error loading settlement data: ' + error.message);
        return null;
    }
}

// Populate form fields with settlement data
function populateFormWithData(data) {
    settlementData = data;

    // Basic settlement information
    document.getElementById('settlementNumber').value = data.settlementNumber || '';
    document.getElementById('requester').value = data.requester || '';
    document.getElementById('requesterName').value = data.requesterName || '';
    document.getElementById('settlementRefNo').value = data.settlementRefNo || '';
    document.getElementById('purpose').value = data.purpose || '';
    
    // Set transaction type
    if (data.transactionType) {
        document.getElementById('transactionType').value = data.transactionType;
    }
    
    // Set department to Finance as specified
    document.getElementById('department').value = 'Finance';
    
    // Format and set submission date
    if (data.submissionDate) {
        const date = new Date(data.submissionDate);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('submissionDate').value = formattedDate;
    }
    
    // Set status
    document.getElementById('status').value = data.status || '';
    
    // Set cash advance reference ID
    if (data.cashAdvanceReferenceId) {
        document.getElementById('cashAdvanceReferenceId').value = data.cashAdvanceReferenceId;
    }
    
    // Set remarks
    document.getElementById('remarks').value = data.remarks || '';

    // Populate settlement items table
    populateSettlementItemsTable(data.settlementItems || []);

    // Populate approval section
    if (data.approval) {
        populateApprovalSection(data.approval);
    }
}

// Populate settlement items table
function populateSettlementItemsTable(settlementItems) {
    const tableBody = document.getElementById('tableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';

    if (settlementItems.length === 0) {
        // Add empty row if no items
        addEmptyRow();
        return;
    }

    // Add rows for each settlement item
    settlementItems.forEach((item, index) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td class="p-2 border">
                <input type="text" value="${item.description || ''}" maxlength="200" class="w-full" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.glAccount || ''}" maxlength="200" class="w-full" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.accountName || ''}" maxlength="200" class="w-full" readonly />
            </td>
            <td class="p-2 border">
                <input type="number" value="${item.amount || 0}" maxlength="200" class="w-full" readonly />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
        tableBody.appendChild(newRow);
    });
}

// Populate approval section
function populateApprovalSection(approval) {
    // Set approval IDs and checkbox states
    if (approval.preparedById) {
        document.getElementById('preparedById').value = approval.preparedById;
        document.getElementById('preparedCheckbox').checked = approval.isPrepared || false;
    }
    
    if (approval.checkedById) {
        document.getElementById('checkedById').value = approval.checkedById;
        document.getElementById('checkedCheckbox').checked = approval.isChecked || false;
    }
    
    if (approval.approvedById) {
        document.getElementById('approvedById').value = approval.approvedById;
        document.getElementById('approvedCheckbox').checked = approval.isApproved || false;
    }
    
    if (approval.acknowledgedById) {
        document.getElementById('acknowledgedById').value = approval.acknowledgedById;
        document.getElementById('acknowledgedCheckbox').checked = approval.isAcknowledged || false;
    }
}

// Add empty row to table
function addEmptyRow() {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" readonly />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="200" class="w-full" readonly />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
}

function previewPDF(event) {
    const files = event.target.files;
    if (files.length + uploadedFiles.length > 5) {
        alert('Maximum 5 PDF files are allowed.');
        return;
    }
    Array.from(files).forEach(file => {
        if (file.type === 'application/pdf') {
            uploadedFiles.push(file);
        } else {
            alert('Please upload a valid PDF file');
        }
    });
    displayFileList();
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;

    tableBody.appendChild(newRow);
}

function deleteRow(button) {
    button.closest("tr").remove();
}

function goToMenuSettle() {
    window.location.href = "../pages/MenuSettle.html";
}

function displayFileList() {
    console.log('Uploaded files:', uploadedFiles);
}

// Add function to fetch and populate cash advance dropdown
async function loadCashAdvanceOptions() {
    const dropdown = document.getElementById('cashAdvanceReferenceId');
    
    try {
        // Show loading state
        dropdown.innerHTML = '<option value="" disabled selected>Loading...</option>';
        
        const response = await fetch(`${baseUrl}/api/cash-advance`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Clear dropdown and add default option
        dropdown.innerHTML = '<option value="" disabled selected>Select Cash Advance</option>';
        
        // Populate dropdown with API data
        if (responseData.status && responseData.data && Array.isArray(responseData.data)) {
            responseData.data.forEach(cashAdvance => {
                const option = document.createElement('option');
                option.value = cashAdvance.id;
                option.textContent = cashAdvance.cashAdvanceNo;
                dropdown.appendChild(option);
            });
        } else {
            dropdown.innerHTML = '<option value="" disabled selected>No data available</option>';
        }
        
    } catch (error) {
        console.error('Error loading cash advance options:', error);
        dropdown.innerHTML = '<option value="" disabled selected>Error loading data</option>';
    }
}

function confirmDelete() {
    if (confirm('Are you sure you want to delete this settlement?')) {
        const settlementId = getSettlementIdFromUrl();
        if (settlementId) {
            // TODO: Implement delete API call
            alert('Settlement deleted successfully!');
        }
    }
}

function updateSettle() {
    // TODO: Implement update API call
    alert('Settlement updated successfully!');
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Load cash advance options first
    await loadCashAdvanceOptions();
    
    // Get settlement ID from URL
    const settlementId = getSettlementIdFromUrl();
    
    if (!settlementId) {
        alert('Settlement ID not found in URL');
        return;
    }

    // Fetch and populate settlement data
    const data = await fetchSettlementData(settlementId);
    if (data) {
        populateFormWithData(data);
    }
}); 