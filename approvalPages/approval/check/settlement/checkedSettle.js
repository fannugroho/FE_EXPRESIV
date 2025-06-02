let uploadedFiles = [];

let settlementId = null;
let currentTab; // Global variable for tab

// Parse URL parameters when page loads
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    settlementId = urlParams.get('settle-id');
    currentTab = urlParams.get('tab');
    
    if (settlementId) {
        fetchSettleDetails(settlementId);
    } else {
        alert('Settlement ID not provided');
        window.history.back();
    }
});

// Function to fetch and populate settlement details
function fetchSettleDetails(id) {
    const token = getAccessToken();
    
    if (!token) {
        alert('Please login first');
        return;
    }
    
    console.log('Fetching settlement details for ID:', id);
    
    fetch(`${BASE_URL}/api/settlements/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log('Settlement Details API response:', result);
        
        if (result.status && result.data) {
            populateSettleDetails(result.data);
        } else {
            console.error('API returned error:', result.message);
            alert('Failed to load settlement details: ' + (result.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error fetching settlement details:', error);
        alert('Error fetching settlement details: ' + error.message);
    });
}

function populateSettleDetails(data) {
    // Populate basic settlement information
    document.getElementById('invno').value = data.settlementNumber || '';
    document.getElementById('Employee').value = data.employeeNik || '';
    document.getElementById('EmployeeName').value = data.employeeName || '';
    document.getElementById('requester').value = data.requesterName || '';
    document.getElementById('department').value = data.departmentName || '';
    document.getElementById('cashAdvanceNumber').value = data.cashAdvanceNumber || '';
    
    // Handle submission date - convert from ISO to YYYY-MM-DD format for date input
    if (data.submissionDate) {
        const date = new Date(data.submissionDate);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('SubmissionDate').value = formattedDate;
    }
    
    document.getElementById('purpose').value = data.purpose || '';
    document.getElementById('Approved').value = data.transactionType || '';
    
    // Populate settlement details in table if available
    if (data.settlementDetails && data.settlementDetails.length > 0) {
        populateSettleDetailsTable(data.settlementDetails);
    }
    
    // Show remarks if exists
    if (data.remarks) {
        document.getElementById('remarks').value = data.remarks;
    }
    
    console.log('Settlement details populated successfully');
}

function populateSettleDetailsTable(settlementDetails) {
    const tableBody = document.getElementById('tableBody');
    
    // Clear existing rows first
    tableBody.innerHTML = '';
    
    settlementDetails.forEach((detail, index) => {
        addSettleDetailRow(detail, index);
    });
}

function addSettleDetailRow(detail = null, index = 0) {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" class="w-full bg-gray-100" value="${detail ? detail.description || '' : ''}" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full bg-gray-100" value="${detail ? detail.detail || '' : ''}" readonly />
        </td>
        <td class="p-2 border">
            <input type="number" class="w-full bg-gray-100" value="${detail ? detail.amount || '' : ''}" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full bg-gray-100" value="${detail ? detail.receipt || '' : ''}" readonly />
        </td>
    `;
    
    tableBody.appendChild(newRow);
}

// Function to approve settlement
function approveSettle() {
    if (!settlementId) {
        alert('Settlement ID not found');
        return;
    }
    
    // Get remarks
    const remarks = document.getElementById('remarks').value;
    
    // Show confirmation dialog
    Swal.fire({
        title: 'Approve Settlement',
        text: 'Are you sure you want to approve this settlement?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateSettleStatus('approved', remarks);
        }
    });
}

// Function to reject settlement
function rejectSettle() {
    if (!settlementId) {
        alert('Settlement ID not found');
        return;
    }
    
    // Get remarks (should be required for rejection)
    const remarks = document.getElementById('remarks').value;
    
    if (!remarks.trim()) {
        alert('Please provide remarks for rejection');
        return;
    }
    
    // Show confirmation dialog
    Swal.fire({
        title: 'Reject Settlement',
        text: 'Are you sure you want to reject this settlement?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, reject it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateSettleStatus('rejected', remarks);
        }
    });
}

// Function to update settlement status
function updateSettleStatus(status, remarks) {
    const token = getAccessToken();
    const userId = getUserId();
    
    if (!userId) {
        alert('Unable to get user ID from token. Please login again.');
        return;
    }
    
    // Show loading
    Swal.fire({
        title: 'Processing...',
        text: `Please wait while we ${status === 'approved' ? 'approve' : 'reject'} the settlement.`,
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    const requestBody = {
        Id: settlementId,
        ApproverId: userId,
        ApproverRole: 'checked',
        Status: status,
        Remarks: remarks || ''
    };
    
    console.log('Sending status update request:', requestBody);
    
    fetch(`${BASE_URL}/api/settlements/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(result => {
        console.log('Status update response:', result);
        
        if (result.status) {
            Swal.fire({
                title: 'Success!',
                text: `Settlement has been ${status === 'approved' ? 'approved' : 'rejected'} successfully.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to dashboard
                window.location.href = '../../../dashboard/dashboardCheck/settlement/menuSettleCheck.html';
            });
        } else {
            throw new Error(result.message || 'Failed to update settlement status');
        }
    })
    .catch(error => {
        console.error('Error updating settlement status:', error);
        Swal.fire({
            title: 'Error!',
            text: `Failed to ${status === 'approved' ? 'approve' : 'reject'} settlement: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    });
}

// Navigation functions
function goBack() {
    window.history.back();
}

function goToMenuSettle() {
    window.location.href = '../../../dashboard/dashboardCheck/settlement/menuSettleCheck.html';
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

// Display file list function - if needed
function displayFileList() {
    // Implementation for displaying uploaded files if needed
}
