/**
 * Acknowledger Reimbursement Page - Final Clean Version
 * Features: View, Approve, Reject, Check, Revision
 */

// ===============================
// GLOBAL STATE
// ===============================
const AppState = {
    reimbursementData: null,
    allUsers: [],
    businessPartners: [],
    revisionFieldCount: 0,
    MAX_REVISION_FIELDS: 4
};

// ===============================
// UTILITIES
// ===============================
const Utils = {
    // UI State Management
    showLoading() {
        document.getElementById('loadingContainer').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');
        document.getElementById('errorContainer').classList.add('hidden');
    },

    showMainContent() {
        document.getElementById('loadingContainer').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('errorContainer').classList.add('hidden');
    },

    showError(message) {
        document.getElementById('loadingContainer').classList.add('hidden');
        document.getElementById('mainContent').classList.add('hidden');
        document.getElementById('errorContainer').classList.remove('hidden');
        document.getElementById('errorMessage').textContent = message;
    },

    // Helper Functions
    getReimbursementIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('reim-id');
    },

    formatCurrency(number) {
        const num = parseFloat(number) || 0;
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    },

    getCurrentUserInfo() {
        try {
            const currentUser = getCurrentUser();
            return {
                name: currentUser?.username || 'Unknown User',
                role: 'Acknowledger',
                id: currentUser?.id || getUserId()
            };
        } catch (error) {
            console.error('Error getting user info:', error);
            return { name: 'Unknown User', role: 'Acknowledger', id: null };
        }
    }
};

// ===============================
// API SERVICE
// ===============================
const ApiService = {
    async request(url, options = {}) {
        try {
            const response = await fetch(`${BASE_URL}${url}`, {
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.status || result.code !== 200) {
                throw new Error(result.message || 'API request failed');
            }

            return result.data;
        } catch (error) {
            console.error(`API Error for ${url}:`, error);
            throw error;
        }
    },

    async fetchUsers() {
        const users = await this.request('/api/users');
        AppState.allUsers = users;
        console.log('✅ Users loaded:', users.length);
        return users;
    },

    async fetchBusinessPartners() {
        const partners = await this.request('/api/business-partners/type/employee');
        AppState.businessPartners = partners;
        console.log('✅ Business partners loaded:', partners.length);
        return partners;
    },

    async fetchReimbursementData(reimId) {
        const data = await this.request(`/api/reimbursements/${reimId}`);
        AppState.reimbursementData = data;
        console.log('✅ Reimbursement data loaded:', data.voucherNo);
        return data;
    },

    async submitRejection(reimId, remarks) {
        return await this.request(`/api/reimbursements/acknowledger/${reimId}/reject`, {
            method: 'PATCH',
            body: JSON.stringify({ remarks })
        });
    },

    async submitApproval(reimId) {
        return await this.request(`/api/reimbursements/acknowledger/${reimId}/approve`, {
            method: 'PATCH'
        });
    },

    async submitRevision(reimId, userId, remarks) {
        return await this.request(`/api/reimbursements/revision/${reimId}`, {
            method: 'POST',
            body: JSON.stringify({
                userId: userId,
                remarks: remarks,
                stage: "Acknowledge"
            })
        });
    }
};

// ===============================
// UI MANAGER
// ===============================
const UIManager = {
    populateForm(data) {
        console.log('🔄 Populating form with data:', data.voucherNo);

        // Basic fields
        this.setFieldValue('voucherNo', data.voucherNo);
        this.setFieldValue('requesterName', data.requesterName);
        this.setFieldValue('department', data.department);
        this.setFieldValue('currency', data.currency);
        this.setFieldValue('referenceDoc', data.referenceDoc);
        this.setFieldValue('typeOfTransaction', data.typeOfTransaction);
        this.setFieldValue('remarks', data.remarks);
        this.setFieldValue('status', data.status);

        // Date field
        if (data.submissionDate) {
            const date = new Date(data.submissionDate);
            this.setFieldValue('submissionDate', date.toISOString().split('T')[0]);
        }

        // Special fields
        this.populatePayToField(data.payTo);
        this.populateApprovalFields(data);
        this.populateReimbursementTable(data.reimbursementDetails || data.details || []);
        this.displayAttachments(data.reimbursementAttachments || data.attachments || []);

        // Conditional displays
        if (data.revisions?.length > 0) {
            this.renderRevisionHistory(data.revisions);
        }

        if (data.status === 'Rejected') {
            this.showRejectionRemarks(data);
        }

        this.updateUIBasedOnStatus(data.status);
    },

    setFieldValue(fieldId, value) {
        const element = document.getElementById(fieldId);
        if (element) element.value = value || '';
    },

    populatePayToField(payToId) {
        if (!payToId) return;

        const payToField = document.getElementById('payTo');

        // Try business partners first
        const matchingBP = AppState.businessPartners.find(bp =>
            bp.id.toString() === payToId.toString()
        );

        if (matchingBP) {
            payToField.value = `${matchingBP.code} - ${matchingBP.name}`;
            return;
        }

        // Try users
        const matchingUser = AppState.allUsers.find(user =>
            user.id.toString() === payToId.toString()
        );

        if (matchingUser) {
            const displayText = matchingUser.kansaiEmployeeId
                ? `${matchingUser.kansaiEmployeeId} - ${matchingUser.fullName}`
                : `${matchingUser.employeeId || ''} - ${matchingUser.fullName}`;
            payToField.value = displayText;
            return;
        }

        // Fallback
        payToField.value = `ID: ${payToId}`;
    },

    populateApprovalFields(data) {
        const approvalMappings = {
            'preparedBy': data.preparedBy,
            'acknowledgeBy': data.acknowledgedBy,
            'checkedBy': data.checkedBy,
            'approvedBy': data.approvedBy,
            'receivedBy': data.receivedBy
        };

        Object.entries(approvalMappings).forEach(([fieldId, userId]) => {
            if (!userId) return;

            const field = document.getElementById(fieldId);
            const matchingUser = AppState.allUsers.find(user =>
                user.id.toString() === userId.toString()
            );

            if (field) {
                field.value = matchingUser
                    ? (matchingUser.fullName || matchingUser.username || '')
                    : `User ID: ${userId}`;
            }
        });
    },

    populateReimbursementTable(details) {
        const tableBody = document.getElementById('reimbursementDetails');
        tableBody.innerHTML = '';

        if (details && details.length > 0) {
            details.forEach(detail => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="p-2 border">${detail.category || ''}</td>
                    <td class="p-2 border">${detail.accountName || ''}</td>
                    <td class="p-2 border">${detail.glAccount || ''}</td>
                    <td class="p-2 border">${detail.description || ''}</td>
                    <td class="p-2 border text-right">${Utils.formatCurrency(detail.amount)}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">No details available</td></tr>';
        }

        this.updateTotalAmount();
    },

    updateTotalAmount() {
        const rows = document.querySelectorAll('#reimbursementDetails tr');
        let total = 0;

        rows.forEach(row => {
            const amountCell = row.cells[4];
            if (amountCell && amountCell.textContent.trim() !== 'No details available') {
                const amount = parseFloat(amountCell.textContent.replace(/[^\d.-]/g, '')) || 0;
                total += amount;
            }
        });

        document.getElementById('totalAmount').value = Utils.formatCurrency(total);
    },

    displayAttachments(attachments) {
        const attachmentsList = document.getElementById('attachmentsList');
        attachmentsList.innerHTML = '';

        if (attachments && attachments.length > 0) {
            attachments.forEach(attachment => {
                const attachmentItem = document.createElement('div');
                attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
                attachmentItem.innerHTML = `
                    <span class="text-sm">${attachment.fileName}</span>
                    <a href="${BASE_URL}/${attachment.filePath}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm">View</a>
                `;
                attachmentsList.appendChild(attachmentItem);
            });
        } else {
            attachmentsList.innerHTML = '<div class="text-gray-500 text-sm">No attachments</div>';
        }
    },

    renderRevisionHistory(revisions) {
        const section = document.getElementById('revisedRemarksSection');
        if (!revisions || revisions.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');

        let html = `
            <h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>
            <div class="bg-gray-50 p-4 rounded-lg border">
                <div class="mb-4">
                    <span class="text-sm font-medium text-gray-600">Total Revisions: </span>
                    <span class="text-sm font-bold text-blue-600">${revisions.length}</span>
                </div>
        `;

        revisions.forEach((revision, index) => {
            html += `
                <div class="mb-3 p-3 bg-white border rounded">
                    <div class="text-sm font-medium text-gray-700 mb-1">Revision ${index + 1}</div>
                    <div class="text-sm text-gray-800 whitespace-pre-wrap mb-2">${revision.remarks || ''}</div>
                    <div class="text-xs text-gray-500">Date: ${Utils.formatDate(revision.createdAt)} | By: ${revision.revisedByName || ''}</div>
                </div>
            `;
        });

        html += '</div>';
        section.innerHTML = html;
    },

    showRejectionRemarks(data) {
        const section = document.getElementById('rejectionRemarksSection');
        const textarea = document.getElementById('rejectionRemarks');

        const rejectionRemarks = data.remarksRejectByAcknowledger ||
            data.remarksRejectByAcknowledger ||
            data.remarksRejectByApprover ||
            data.remarksRejectByReceiver ||
            data.rejectedRemarks || '';

        if (rejectionRemarks.trim()) {
            section.classList.remove('hidden');
            textarea.value = rejectionRemarks;
        }
    },

    updateUIBasedOnStatus(status) {
        const actionButtons = document.getElementById('actionButtons');
        const revisionSection = document.getElementById('revisionSection');

        // Only show action buttons for "Prepared" status
        if (status === 'Checked') {
            actionButtons.classList.remove('hidden');
            revisionSection.classList.remove('hidden');
        } else {
            actionButtons.classList.add('hidden');
            revisionSection.classList.add('hidden');
        }
    }
};

// ===============================
// REVISION MANAGER
// ===============================
const RevisionManager = {
    addRevisionField() {
        if (AppState.revisionFieldCount >= AppState.MAX_REVISION_FIELDS) {
            Swal.fire({
                icon: 'warning',
                title: 'Maximum Limit',
                text: `Maximum ${AppState.MAX_REVISION_FIELDS} revision fields allowed`
            });
            return;
        }

        const container = document.getElementById('revisionContainer');
        const userInfo = Utils.getCurrentUserInfo();

        // Create field wrapper
        const fieldWrapper = document.createElement('div');
        fieldWrapper.className = 'flex items-start space-x-2';

        // Create textarea with user prefix
        const textarea = document.createElement('textarea');
        textarea.className = 'w-full p-3 border rounded-md';
        textarea.placeholder = 'Enter revision details';
        textarea.rows = 3;

        const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
        textarea.value = prefix;
        textarea.dataset.prefixLength = prefix.length;

        // Protect prefix and enable revision button check
        textarea.addEventListener('input', (e) => {
            this.protectPrefix(e.target, prefix);
            this.checkRevisionButton();
        });

        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '×';
        deleteButton.className = 'bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 focus:outline-none mt-1';
        deleteButton.onclick = () => {
            fieldWrapper.remove();
            AppState.revisionFieldCount--;
            this.checkRevisionButton();
            this.updateAddButtonState();
        };

        // Assemble and add to container
        fieldWrapper.appendChild(textarea);
        fieldWrapper.appendChild(deleteButton);
        container.appendChild(fieldWrapper);

        AppState.revisionFieldCount++;

        // Set cursor and update UI
        setTimeout(() => {
            textarea.setSelectionRange(prefix.length, prefix.length);
            textarea.focus();
        }, 0);

        this.checkRevisionButton();
        this.updateAddButtonState();
    },

    protectPrefix(textarea, prefix) {
        const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
        if (textarea.selectionStart < prefixLength) {
            textarea.value = prefix + textarea.value.substring(prefixLength);
            textarea.setSelectionRange(prefixLength, prefixLength);
        }
    },

    checkRevisionButton() {
        const revisionButton = document.getElementById('revisionButton');
        const textareas = document.querySelectorAll('#revisionContainer textarea');

        let hasContent = false;
        textareas.forEach(textarea => {
            const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
            if (textarea.value.trim().length > prefixLength) {
                hasContent = true;
            }
        });

        revisionButton.disabled = !hasContent;
        revisionButton.classList.toggle('opacity-50', !hasContent);
        revisionButton.classList.toggle('cursor-not-allowed', !hasContent);
    },

    updateAddButtonState() {
        const addBtn = document.getElementById('addRevisionBtn');
        const isMaxReached = AppState.revisionFieldCount >= AppState.MAX_REVISION_FIELDS;

        if (isMaxReached) {
            addBtn.textContent = `Max ${AppState.MAX_REVISION_FIELDS} fields reached`;
            addBtn.disabled = true;
            addBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            addBtn.textContent = AppState.revisionFieldCount === 0 ? '+ Add revision' : '+ Add more revision';
            addBtn.disabled = false;
            addBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    },

    collectRevisionRemarks() {
        const textareas = document.querySelectorAll('#revisionContainer textarea');
        let allRemarks = '';

        textareas.forEach(textarea => {
            if (textarea.value.trim() !== '') {
                if (allRemarks !== '') allRemarks += '\n\n';
                allRemarks += textarea.value.trim();
            }
        });

        return allRemarks;
    }
};

// ===============================
// ACTION HANDLERS
// ===============================
const ActionHandlers = {
    async handleReject() {
        const userInfo = Utils.getCurrentUserInfo();

        const { value: remarks } = await Swal.fire({
            title: 'Reject Reimbursement',
            html: `
                <div class="mb-4">
                    <p class="text-sm text-gray-600 mb-3">Please provide a reason for rejection:</p>
                    <textarea id="rejectionTextarea" class="w-full p-3 border rounded-md" placeholder="Enter rejection reason" rows="4"></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc3545',
            width: '500px',
            didOpen: () => {
                const textarea = document.getElementById('rejectionTextarea');
                const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
                textarea.value = prefix;
                textarea.dataset.prefixLength = prefix.length;
                textarea.setSelectionRange(prefix.length, prefix.length);
                textarea.focus();

                textarea.addEventListener('input', (e) => {
                    RevisionManager.protectPrefix(e.target, prefix);
                });
            },
            preConfirm: () => {
                const textarea = document.getElementById('rejectionTextarea');
                const remarks = textarea.value.trim();
                const prefixLength = parseInt(textarea.dataset.prefixLength || '0');

                if (remarks.length <= prefixLength) {
                    Swal.showValidationMessage('Please enter a rejection reason');
                    return false;
                }
                return remarks;
            }
        });

        if (remarks) {
            try {
                const reimId = Utils.getReimbursementIdFromUrl();
                await ApiService.submitRejection(reimId, remarks);

                Swal.fire('Rejected!', 'The document has been rejected.', 'success')
                    .then(() => this.goToMenu());
            } catch (error) {
                Swal.fire('Error', 'An error occurred while rejecting the document', 'error');
            }
        }
    },

    async handleApprove() {
        const confirmed = await Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to approve this document?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Approve it!'
        });

        if (confirmed.isConfirmed) {
            try {
                const reimId = Utils.getReimbursementIdFromUrl();
                await ApiService.submitApproval(reimId);

                Swal.fire('Approved!', 'The document has been approved.', 'success')
                    .then(() => this.goToMenu());
            } catch (error) {
                Swal.fire('Error', 'An error occurred while approving the document', 'error');
            }
        }
    },

    async handleRevision() {
        const remarks = RevisionManager.collectRevisionRemarks();

        if (!remarks.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please add and fill revision field first'
            });
            return;
        }

        const confirmed = await Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to submit this revision?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Submit Revision!'
        });

        if (confirmed.isConfirmed) {
            try {
                const reimId = Utils.getReimbursementIdFromUrl();
                const userInfo = Utils.getCurrentUserInfo();

                await ApiService.submitRevision(reimId, userInfo.id, remarks);

                Swal.fire('Success!', 'Revision remarks have been submitted successfully.', 'success')
                    .then(() => this.goToMenu());
            } catch (error) {
                Swal.fire('Error', 'An error occurred while submitting the revision', 'error');
            }
        }
    },

    goToMenu() {
        try {
            window.location.href = '../../../dashboard/dashboardAcknowledge/reimbursement/menuReimAcknow.html';
        } catch (error) {
            console.error('Error navigating to menu:', error);
            window.location.href = '../pages/menuReim.html';
        }
    }
};

// ===============================
// GLOBAL FUNCTIONS (for HTML onclick)
// ===============================
function toggleRevisionField() {
    const container = document.getElementById('revisionContainer');
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
    }
    RevisionManager.addRevisionField();
}

function onReject() {
    ActionHandlers.handleReject();
}

function onApprove() {
    ActionHandlers.handleApprove();
}

function submitRevision() {
    ActionHandlers.handleRevision();
}

function goToMenuReim() {
    ActionHandlers.goToMenu();
}

// ===============================
// MAIN INITIALIZATION
// ===============================
document.addEventListener('DOMContentLoaded', async function () {
    console.log('=== Acknowledger PAGE INITIALIZATION ===');

    Utils.showLoading();

    try {
        // Validate requirements
        const reimId = Utils.getReimbursementIdFromUrl();
        if (!reimId) {
            throw new Error('No reimbursement ID found in URL. Please check the URL and try again.');
        }

        if (typeof BASE_URL === 'undefined' || !BASE_URL) {
            throw new Error('Application configuration is invalid. Please contact administrator.');
        }

        if (!isAuthenticated()) {
            throw new Error('Your session has expired. Please login again.');
        }

        console.log('📋 Loading data for reimbursement ID:', reimId);

        // Load all required data in parallel
        await Promise.all([
            ApiService.fetchUsers(),
            ApiService.fetchBusinessPartners(),
            ApiService.fetchReimbursementData(reimId)
        ]);

        // Populate UI
        UIManager.populateForm(AppState.reimbursementData);

        Utils.showMainContent();
        console.log('✅ Page initialization completed successfully');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        Utils.showError(error.message || 'Failed to load page. Please try again.');

        // If authentication error, redirect to login after delay
        if (error.message.includes('session') || error.message.includes('login')) {
            setTimeout(() => {
                if (typeof logoutAuth === 'function') {
                    logoutAuth();
                } else {
                    localStorage.clear();
                    window.location.href = '../pages/login.html';
                }
            }, 3000);
        }
    }
});