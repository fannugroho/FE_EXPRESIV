let uploadedFiles = [];

let invServiceId; // Declare global variable
let currentTab; // Declare global variable for tab

// Function to fetch Invoice Service details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    invServiceId = urlParams.get('id');
    currentTab = urlParams.get('tab'); // Get the tab parameter
    
    if (invServiceId) {
        fetchInvServiceDetails(invServiceId);
    }
    
    // Hide approve/reject buttons if viewing from received or rejected tabs
    if (currentTab === 'received' || currentTab === 'rejected') {
        hideApprovalButtons();
    }
};

function fetchInvServiceDetails(id) {
    // Implementation for fetching invoice service details
    console.log('Fetching invoice service details for ID:', id);
    // TODO: Implement API call to fetch invoice service details
}

function populateInvServiceDetails(data) {
    // Implementation for populating form fields
    console.log('Populating invoice service details:', data);
    // TODO: Implement form population logic
}

function hideApprovalButtons() {
    const receiveButton = document.querySelector('button[onclick="receiveInvService()"]');
    const rejectButton = document.querySelector('button[onclick="rejectInvService()"]');
    
    if (receiveButton) {
        receiveButton.style.display = 'none';
    }
    if (rejectButton) {
        rejectButton.style.display = 'none';
    }
}

// Function to receive the invoice service
function receiveInvService() {
    // Implementation for receiving invoice service
    console.log('Receiving invoice service');
    // TODO: Implement receive logic
}

// Function to reject the invoice service
function rejectInvService() {
    // Create custom dialog with single field
    Swal.fire({
        title: 'Reject Invoice Service',
        html: `
            <div class="mb-4">
                <p class="text-sm text-gray-600 mb-3">Please provide a reason for rejection:</p>
                <div id="rejectionFieldsContainer">
                    <textarea id="rejectionField1" class="w-full p-2 border rounded-md" placeholder="Enter rejection reason" rows="3"></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        width: '600px',
        didOpen: () => {
            // Initialize the field with user prefix
            const firstField = document.getElementById('rejectionField1');
            if (firstField) {
                initializeWithRejectionPrefix(firstField);
            }
            
            // Add event listener for input protection
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            if (field) {
                field.addEventListener('input', handleRejectionInput);
            }
        },
        preConfirm: () => {
            // Get the rejection remark
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            const remarks = field ? field.value.trim() : '';
            
            if (remarks === '') {
                Swal.showValidationMessage('Please enter a rejection reason');
                return false;
            }
            
            return remarks;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            updateInvServiceStatusWithRemarks('reject', result.value);
        }
    });
}

// Function to update invoice service status with remarks
function updateInvServiceStatusWithRemarks(status, remarks) {
    // Implementation for updating status with remarks
    console.log('Updating invoice service status:', status, 'with remarks:', remarks);
    // TODO: Implement status update logic
}

// Function to get current user information
function getUserInfo() {
    // Use functions from auth.js to get user information
    let userName = 'Unknown User';
    let userRole = 'Receiver'; // Default role for this page since we're on the receiver page
    
    try {
        // Get user info from getCurrentUser function in auth.js
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
            userName = currentUser.username;
        }
        
        // Get user role based on the current page
        // Since we're on the receiver page, the role is Receiver
    } catch (e) {
        console.error('Error getting user info:', e);
    }
    
    return { name: userName, role: userRole };
}

// Function to initialize textarea with user prefix for rejection
function initializeWithRejectionPrefix(textarea) {
    const userInfo = getUserInfo();
    const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
    textarea.value = prefix;
    
    // Store the prefix length as a data attribute
    textarea.dataset.prefixLength = prefix.length;
    
    // Set selection range after the prefix
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();
}

// Function to handle input and protect the prefix for rejection
function handleRejectionInput(event) {
    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
    
    // If user tries to modify content before the prefix length
    if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
        // Restore the prefix
        const userInfo = getUserInfo();
        const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
        
        // Only restore if the prefix is damaged
        if (!textarea.value.startsWith(prefix)) {
            const userText = textarea.value.substring(prefixLength);
            textarea.value = prefix + userText;
            
            // Reset cursor position after the prefix
            textarea.setSelectionRange(prefixLength, prefixLength);
        } else {
            // Just move cursor after prefix
            textarea.setSelectionRange(prefixLength, prefixLength);
        }
    }
}

// Make functions globally accessible
window.receiveInvService = receiveInvService;
window.rejectInvService = rejectInvService;
