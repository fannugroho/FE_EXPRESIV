// ===== CLEAN APPROVE OUTGOING PAYMENT REIMBURSEMENT SYSTEM =====
// File: approveOPReim.js

// ===== GLOBAL VARIABLES =====
let documentId = null;
let outgoingPaymentReimData = null;
let uploadedFiles = [];
let existingAttachments = [];
let attachmentsToKeep = [];

// ===== 1. GLOBAL STATE MANAGEMENT =====
class OPReimApproveState {
    constructor() {
        this.documentId = null;
        this.opReimData = null;
        this.usersList = [];
        this.existingAttachments = [];
        this.isLoading = false;
    }

    setDocumentId(id) {
        this.documentId = id;
        documentId = id; // Also set global variable
    }

    setOPReimData(data) {
        this.opReimData = data;
        outgoingPaymentReimData = data; // Also set global variable
    }

    setUsers(users) {
        this.usersList = users;
    }

    setAttachments(attachments) {
        this.existingAttachments = attachments || [];
        existingAttachments = attachments || [];
    }
}

const approveState = new OPReimApproveState();

// ===== 2. API SERVICE =====
class OPReimAPIService {
    static async fetchOPReimDetails(id) {
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${id}`, {
            method: 'GET'
        });
        return await response.json();
    }

    static async fetchUsers() {
        const response = await makeAuthenticatedRequest('/api/users', {
            method: 'GET'
        });
        return await response.json();
    }

    static async fetchAttachments(id) {
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/attachments/${id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
    }

    static async fetchReimbursementData(expressivNo) {
        const response = await makeAuthenticatedRequest(`/api/reimbursements/${expressivNo}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
    }

    static async approveDocument(id, requestData) {
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/approvals/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json-patch+json' },
            body: JSON.stringify(requestData)
        });
        return await response.json();
    }

    static async rejectDocument(id, requestData) {
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/approvals/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        return await response.json();
    }
}

// ===== 3. UI UTILITIES =====
class UIUtils {
    static showLoading(message = 'Loading...') {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
    }

    static showSuccess(title, text) {
        return Swal.fire({ icon: 'success', title, text });
    }

    static showError(title, text) {
        return Swal.fire({ icon: 'error', title, text });
    }

    static showInfo(title, text) {
        return Swal.fire({ icon: 'info', title, text });
    }

    static showWarning(title, text) {
        return Swal.fire({ icon: 'warning', title, text });
    }

    static formatCurrency(number) {
        if (number === null || number === undefined || number === '') {
            return '0';
        }

        const num = parseFloat(number);
        if (isNaN(num)) return '0';

        try {
            const numStr = num.toString();
            const hasDecimal = numStr.includes('.');

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
            console.error('Error formatting currency:', e);
            return this.formatLargeNumberFallback(num);
        }
    }

    static formatLargeNumberFallback(num) {
        const strNum = num.toString();
        let result = '';
        let sign = strNum.startsWith('-') ? '-' : '';
        const cleanNum = sign ? strNum.substring(1) : strNum;
        const parts = cleanNum.split('.');

        let formattedInteger = '';
        for (let i = 0; i < parts[0].length; i++) {
            if (i > 0 && (parts[0].length - i) % 3 === 0) {
                formattedInteger += '.';
            }
            formattedInteger += parts[0].charAt(i);
        }

        result = sign + formattedInteger;
        if (parts.length > 1) {
            result += ',' + parts[1];
        }

        return result;
    }

    static formatCurrencyWithTwoDecimals(number) {
        if (number === null || number === undefined || number === '') {
            return '0.00';
        }

        let num;
        try {
            if (typeof number === 'string') {
                const cleanedStr = number.replace(/[^\d,.]/g, '');
                num = cleanedStr.length > 15 ?
                    Number(cleanedStr.replace(/,/g, '')) :
                    parseFloat(cleanedStr.replace(/,/g, ''));
            } else {
                num = Number(number);
            }

            if (isNaN(num)) return '0.00';
        } catch (e) {
            console.error('Error parsing number:', e);
            return '0.00';
        }

        const maxAmount = 100000000000000;
        const limitedNum = Math.min(num, maxAmount);

        if (limitedNum >= 1e12) {
            return this.formatLargeNumberFallback(limitedNum) + '.00';
        } else {
            return limitedNum.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    }

    static formatDateSafely(dateValue) {
        if (!dateValue) return '';

        try {
            let date;

            if (typeof dateValue === 'string') {
                if (dateValue.includes('T') || dateValue.includes(' ')) {
                    date = new Date(dateValue);
                } else {
                    const parts = dateValue.split('-');
                    if (parts.length === 3) {
                        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    } else {
                        date = new Date(dateValue);
                    }
                }
            } else {
                date = new Date(dateValue);
            }

            if (isNaN(date.getTime())) {
                console.warn('Invalid date value:', dateValue);
                return '';
            }

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;

        } catch (error) {
            console.error('Error formatting date:', error, 'Original value:', dateValue);
            return '';
        }
    }

    static setElementValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value || '';
    }

    static getElementValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : '';
    }
}

// ===== 4. FORM MANAGER =====
class FormManager {
    static populateFormFields(data) {
        console.log('🔄 Populating form fields with data:', data);

        // Header fields
        UIUtils.setElementValue('CounterRef', data.counterRef || '');
        UIUtils.setElementValue('RequesterName', data.requesterName || '');
        UIUtils.setElementValue('CardName', data.cardName || '');
        UIUtils.setElementValue('Address', data.address || '');
        UIUtils.setElementValue('DocNum', data.counterRef || data.docNum || '');
        UIUtils.setElementValue('JrnlMemo', data.jrnlMemo || '');
        UIUtils.setElementValue('DocCurr', data.docCurr || 'IDR');
        UIUtils.setElementValue('TrsfrAcct', data.trsfrAcct || '');
        UIUtils.setElementValue('RemittanceRequestAmount', UIUtils.formatCurrency(data.trsfrSum || 0));

        // Date fields - FIXED VERSION FOR ACKNOWLEDGE
        const currentDocDate = UIUtils.getElementValue('DocDate');
        if (!currentDocDate && data.receivedDate) {
            const docDate = new Date(data.receivedDate);
            UIUtils.setElementValue('DocDate', docDate.toISOString().split('T')[0]);
        }

        if (data.docDueDate) {
            UIUtils.setElementValue('DocDueDate', UIUtils.formatDateSafely(data.docDueDate));
        }
        if (data.trsfrDate) {
            UIUtils.setElementValue('TrsfrDate', UIUtils.formatDateSafely(data.trsfrDate));
        }

        // Calculate and populate totals
        this.calculateTotals(data.lines);

        // Populate remarks
        UIUtils.setElementValue('remarks', data.remarks || '');
        UIUtils.setElementValue('journalRemarks', data.journalRemarks || '');

        // Populate approval info
        if (data.approval) {
            this.populateApprovalInfo(data.approval);
            this.handleRejectionRemarks(data.approval);
            this.displayApprovalStatus(data.approval);
        } else {
            this.displayApprovalStatus({ approvalStatus: 'Prepared' });
        }

        // Populate table
        TableManager.populateTableRows(data.lines);

        console.log('✅ Form fields populated successfully');
    }

    static calculateTotals(lines) {
        let netTotal = 0;
        let totalAmountDue = 0;
        const currencySummary = {};

        if (lines && lines.length > 0) {
            lines.forEach(line => {
                const amount = line.sumApplied || 0;
                const currency = line.CurrencyItem || line.currencyItem || 'IDR';

                netTotal += amount;
                totalAmountDue += amount;
                currencySummary[currency] = (currencySummary[currency] || 0) + amount;
            });
        }

        UIUtils.setElementValue('netTotal', UIUtils.formatCurrency(netTotal));
        UIUtils.setElementValue('totalTax', UIUtils.formatCurrency(0));
        UIUtils.setElementValue('totalAmountDue', UIUtils.formatCurrency(totalAmountDue));

        CurrencyManager.displayCurrencySummary(currencySummary);
        CurrencyManager.updateTotalOutstandingTransfers(currencySummary);
    }

    static populateApprovalInfo(approval) {
        if (!approval) return;

        const approvalFields = [
            { field: 'preparedBySearch', userId: approval.preparedBy },
            { field: 'checkedBySearch', userId: approval.checkedBy },
            { field: 'acknowledgedBySearch', userId: approval.acknowledgedBy },
            { field: 'approvedBySearch', userId: approval.approvedBy },
            { field: 'receivedBySearch', userId: approval.receivedBy }
        ];

        approvalFields.forEach(({ field, userId }) => {
            if (userId) {
                const userName = UserManager.getUserNameById(userId);
                UIUtils.setElementValue(field, userName);
            }
        });
    }

    static handleRejectionRemarks(approval) {
        if (approval.approvalStatus === 'Rejected') {
            const rejectionSection = document.getElementById('rejectionRemarksSection');
            const rejectionText = document.getElementById('rejectionRemarks');

            if (rejectionSection) rejectionSection.style.display = 'block';
            if (rejectionText) rejectionText.value = approval.rejectionRemarks || '';
        }
    }

    static displayApprovalStatus(approval) {
        const statusSelect = document.getElementById('status');
        if (!statusSelect) return;

        let status = 'Prepared';

        if (approval) {
            if (approval.approvalStatus) {
                status = approval.approvalStatus;
            } else if (approval.rejectedDate) {
                status = 'Rejected';
            } else if (approval.receivedBy) {
                status = 'Received';
            } else if (approval.approvedBy) {
                status = 'Approved';
            } else if (approval.acknowledgedBy) {
                status = 'Acknowledged';
            } else if (approval.checkedBy) {
                status = 'Checked';
            } else if (approval.preparedBy) {
                status = 'Prepared';
            }
        }

        const availableStatuses = ['Prepared', 'Checked', 'Acknowledged', 'Approved', 'Received', 'Rejected'];
        statusSelect.value = availableStatuses.includes(status) ? status : 'Prepared';
    }
}

// ===== 5. TABLE MANAGER =====
class TableManager {
    static populateTableRows(lines) {
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (!lines || lines.length === 0) {
            this.displayEmptyTable(tableBody);
            return;
        }

        lines.forEach((line, index) => {
            const amount = line.sumApplied || 0;
            const row = this.createTableRow(line, amount);
            tableBody.appendChild(row);
        });
    }

    static displayEmptyTable(tableBody) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" class="p-8 text-center text-gray-500">
                <div class="loading-shimmer h-4 rounded mx-auto w-1/2 mb-2"></div>
                <div class="loading-shimmer h-4 rounded mx-auto w-1/3"></div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
    }

    static createTableRow(line, amount) {
        const row = document.createElement('tr');
        const cells = [
            line.acctCode || '',
            line.acctName || '',
            line.descrip || '',
            line.divisionCode || line.division || '',
            line.CurrencyItem || line.currencyItem || 'IDR',
            UIUtils.formatCurrencyWithTwoDecimals(amount)
        ];

        row.innerHTML = cells.map((cell, index) => {
            const isLastCell = index === 5;
            const cellClass = `p-3 border-b${isLastCell ? ' text-right font-mono' : ''}`;
            return `<td class="${cellClass}">${cell}</td>`;
        }).join('');

        return row;
    }
}

// ===== 6. CURRENCY MANAGER =====
class CurrencyManager {
    static displayCurrencySummary(currencySummary) {
        const container = document.getElementById('currencySummaryTable');
        if (!container) return;

        if (!currencySummary || Object.keys(currencySummary).length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No amounts to display</p>';
            return;
        }

        const summaryEntries = Object.entries(currencySummary)
            .map(([currency, amount]) =>
                `<div class="text-base text-gray-700 font-mono font-semibold">
                    ${currency} ${UIUtils.formatCurrencyWithTwoDecimals(amount)}
                </div>`
            ).join('');

        container.innerHTML = `
            <div class="space-y-2">
                <div class="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                    Total Amount Due by Currency:
                </div>
                ${summaryEntries}
            </div>
        `;
    }

    static updateTotalOutstandingTransfers(currencySummary) {
        const container = document.getElementById('totalOutstandingTransfers');
        if (!container) return;

        if (!currencySummary || Object.keys(currencySummary).length === 0) {
            container.textContent = 'No outstanding transfers';
            return;
        }

        const transferEntries = Object.entries(currencySummary)
            .filter(([, amount]) => amount > 0)
            .map(([currency, amount]) =>
                `<div class="text-base text-gray-700 font-mono font-semibold leading-relaxed">
                    ${currency} ${this.numberToWords(amount)}
                </div>`
            ).join('');

        container.innerHTML = `<div class="space-y-3">${transferEntries}</div>`;
    }

    static numberToWords(num) {
        if (num === 0) return 'Zero';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        function convertLessThanOneThousand(n) {
            if (n === 0) return '';
            if (n < 10) return ones[n];
            if (n < 20) return teens[n - 10];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
            if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
        }

        function convert(n) {
            if (n === 0) return 'Zero';

            const scales = [
                { value: 1000000000000, name: 'Trillion' },
                { value: 1000000000, name: 'Billion' },
                { value: 1000000, name: 'Million' },
                { value: 1000, name: 'Thousand' }
            ];

            let result = '';
            let remaining = n;

            for (const scale of scales) {
                const count = Math.floor(remaining / scale.value);
                if (count > 0) {
                    result += (result ? ' ' : '') + convertLessThanOneThousand(count) + ' ' + scale.name;
                    remaining %= scale.value;
                }
            }

            if (remaining > 0) {
                result += (result ? ' ' : '') + convertLessThanOneThousand(remaining);
            }

            return result;
        }

        const integerPart = Math.floor(num);
        const decimalPart = Math.round((num - integerPart) * 100);

        let result = convert(integerPart);
        if (decimalPart > 0) {
            result += ' and ' + convert(decimalPart) + ' Cents';
        }

        return result;
    }
}

// ===== 7. USER MANAGER =====
class UserManager {
    static getUserNameById(userId) {
        if (!approveState.usersList || !userId) return 'Unknown User';

        const user = approveState.usersList.find(u => u.id === userId);
        return user ? user.fullName : 'Unknown User';
    }

    static getCurrentUserId() {
        try {
            const user = getCurrentUser();
            return user ? user.userId : null;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return null;
        }
    }

    static getUserInfo() {
        let userName = 'Unknown User';
        let userRole = 'Acknowledger';

        try {
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.username) {
                userName = currentUser.username;
            }
        } catch (e) {
            console.error('Error getting user info:', e);
        }

        return { name: userName, role: userRole };
    }
}

// ===== 8. PERMISSION MANAGER =====
class PermissionManager {
    static checkUserPermissions(data) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            UIUtils.showError('Error', 'User not authenticated. Please login again.')
                .then(() => window.location.href = getLoginPagePath());
            return;
        }

        const approval = data.approval;
        if (!approval) {
            console.error('No approval data found');
            return;
        }

        const currentStatus = this.determineCurrentStatus(approval);
        const isAssignedApprover = approval.approvedBy === currentUser.userId;
        const isReadyForApproving = currentStatus === 'Acknowledged' && !approval.approvedDate;
        const isAboveApprover = this.isUserAboveApprover(currentUser.userId, approval.approvedBy);

        console.log('Permission check:', {
            currentStatus,
            currentUserId: currentUser.userId,
            approvedById: approval.approvedBy,
            isAssignedApprover,
            isReadyForApproving,
            isAboveApprover
        });

        this.hideButtonsBasedOnStatus(data);
        this.updateButtonStates(currentStatus, isAssignedApprover, isReadyForApproving, approval);
    }

    static determineCurrentStatus(approval) {
        if (approval.receivedDate) return 'Received';
        if (approval.approvedDate) return 'Approved';
        if (approval.acknowledgedDate) return 'Acknowledged';
        if (approval.checkedDate) return 'Checked';
        if (approval.rejectedDate) return 'Rejected';
        return 'Prepared';
    }

    static updateButtonStates(currentStatus, isAssignedApprover, isReadyForApproving, approval) {
        const approveButton = document.querySelector('button[onclick="approveOPReim()"]') || document.getElementById('approveButton');
        const rejectButton = document.querySelector('button[onclick="rejectOPReim()"]') || document.getElementById('rejectButton');

        if (currentStatus === 'Acknowledged' && isAssignedApprover) {
            this.enableButtons(approveButton, rejectButton);
            UIUtils.showInfo('Ready for Approving', 'You can now approve this document');
        } else if (currentStatus === 'Acknowledged' && !isAssignedApprover) {
            this.disableButtons(approveButton, rejectButton);
            const approverName = UserManager.getUserNameById(approval.approvedBy);
            UIUtils.showWarning('Document Pending', `Only ${approverName} can approve this document`);
        } else if (currentStatus !== 'Acknowledged') {
            this.disableButtons(approveButton, rejectButton);
            const statusMessage = this.getStatusMessage(currentStatus);
            UIUtils.showInfo('Document Status', statusMessage);
        }
    }

    static enableButtons(approveButton, rejectButton) {
        if (approveButton) {
            approveButton.disabled = false;
            approveButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        if (rejectButton) {
            rejectButton.disabled = false;
            rejectButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    static disableButtons(approveButton, rejectButton) {
        if (approveButton) {
            approveButton.disabled = true;
            approveButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        if (rejectButton) {
            rejectButton.disabled = true;
            rejectButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    static hideButtonsBasedOnStatus(data) {
        const approveButton = document.querySelector('button[onclick="approveOPReim()"]') || document.getElementById('approveButton');
        const rejectButton = document.querySelector('button[onclick="rejectOPReim()"]') || document.getElementById('rejectButton');

        const currentStatus = this.determineCurrentStatus(data.approval || {});

        // Show buttons only when ready for approving (Acknowledged status)
        // Hide buttons when document is already processed
        if (currentStatus === 'Approved' || currentStatus === 'Received' || currentStatus === 'Rejected') {
            if (approveButton) approveButton.style.display = 'none';
            if (rejectButton) rejectButton.style.display = 'none';
        } else {
            if (approveButton) approveButton.style.display = 'inline-block';
            if (rejectButton) rejectButton.style.display = 'inline-block';
        }
    }

    static isUserAboveApprover(currentUserId, approverId) {
        return currentUserId !== approverId;
    }

    static getStatusMessage(status) {
        const messages = {
            'Prepared': 'This document is prepared and waiting to be checked.',
            'Checked': 'This document has been checked and waiting to be acknowledged.',
            'Acknowledged': 'This document has been acknowledged and is ready for approval.',
            'Approved': 'This document has been approved.',
            'Received': 'This document has been received.',
            'Rejected': 'This document has been rejected.'
        };
        return messages[status] || 'This document is not ready for approval.';
    }

    static validateDocumentStatus() {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            UIUtils.showError('Authentication Error', 'User not authenticated. Please login again.')
                .then(() => window.location.href = getLoginPagePath());
            return false;
        }

        if (!approveState.opReimData || !approveState.opReimData.approval) {
            UIUtils.showError('Error', 'Document data is incomplete. Please refresh the page.');
            return false;
        }

        const approval = approveState.opReimData.approval;

        if (approval.approvedDate) {
            UIUtils.showInfo('Already Approved', 'This document has already been approved.');
            return false;
        }

        if (approval.approvedBy !== currentUser.userId) {
            const approverName = UserManager.getUserNameById(approval.approvedBy);
            UIUtils.showWarning('Not Authorized', `Only ${approverName} can approve this document.`);
            return false;
        }

        if (!approval.acknowledgedDate) {
            UIUtils.showWarning('Not Ready', 'This document must be acknowledged before it can be approved.');
            return false;
        }

        return true;
    }
}

// ===== 9. ATTACHMENT MANAGER =====
class AttachmentManager {
    static async handleAttachments(result, docId) {
        console.log('📎 Handling attachments for document:', docId);

        if (result.attachments?.length > 0) {
            this.displayExistingAttachments(result.attachments);
        } else {
            await this.loadAttachmentsFromAPI(docId);
        }
    }

    static displayExistingAttachments(attachments) {
        const container = document.getElementById('attachmentsList');
        if (!container) return;

        container.innerHTML = '';

        if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
            return;
        }

        const attachmentItems = attachments.map((attachment, index) => {
            const fileName = attachment.fileName || attachment.name || `Attachment ${index + 1}`;
            const fileIcon = this.getFileIcon(fileName);
            const fileSize = this.formatFileSize(attachment.fileSize || attachment.size);
            const uploadDate = this.formatDate(attachment.uploadDate || attachment.createdAt);

            return this.createAttachmentItem(attachment, fileName, fileIcon, fileSize, uploadDate);
        }).join('');

        container.innerHTML = `
            <h4 class="text-md font-medium text-gray-700 mb-2">Outgoing Payment Attachments</h4>
            ${attachmentItems}
        `;
    }

    static createAttachmentItem(attachment, fileName, fileIcon, fileSize, uploadDate) {
        const attachmentJson = JSON.stringify(attachment).replace(/"/g, '&quot;');

        return `
            <div class="flex items-center justify-between p-2 mb-2 bg-gray-50 rounded border">
                <div class="flex items-center space-x-2">
                    <span class="text-lg">${fileIcon}</span>
                    <div>
                        <div class="font-medium text-sm">${fileName}</div>
                        <div class="text-xs text-gray-500">${fileSize} • ${attachment.fileType || attachment.contentType || 'Unknown Type'}</div>
                        <div class="text-xs text-gray-400">Outgoing Payment Attachment • Uploaded: ${uploadDate}</div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="AttachmentManager.viewEnhancedAttachment(${attachmentJson})" 
                            class="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50">
                        View
                    </button>
                </div>
            </div>
        `;
    }

    static async loadAttachmentsFromAPI(docId) {
        try {
            const result = await OPReimAPIService.fetchAttachments(docId);

            if (result.data?.length > 0) {
                this.displayExistingAttachments(result.data);
            } else {
                this.showNoAttachmentsMessage();
            }
        } catch (error) {
            console.error("Error loading attachments:", error);
            this.showAttachmentError();
        }
    }

    static async viewEnhancedAttachment(attachmentOrPath, fileName) {
        try {
            UIUtils.showLoading('Loading attachment, please wait...');

            const docId = approveState.documentId;
            if (!docId) {
                throw new Error('Document ID not found. Please ensure you are viewing an existing document.');
            }

            const attachment = this.normalizeAttachment(attachmentOrPath, fileName);

            if (attachment.filePath) {
                await this.openAttachmentFile(attachment.filePath);
                return;
            }

            await this.fetchAndOpenAttachment(docId, attachment);

        } catch (error) {
            console.error('Error viewing attachment:', error);
            UIUtils.showError('Error', `Failed to view attachment: ${error.message}`);
        }
    }

    static normalizeAttachment(attachmentOrPath, fileName) {
        if (typeof attachmentOrPath === 'string') {
            return { filePath: attachmentOrPath, fileName: fileName };
        }
        return attachmentOrPath;
    }

    static async openAttachmentFile(filePath) {
        Swal.close();

        const fileUrl = this.constructFileUrl(filePath);
        if (!fileUrl) {
            throw new Error('Failed to construct file URL');
        }

        window.open(fileUrl, '_blank');
        UIUtils.showSuccess('Success', 'Attachment opened in new tab');
    }

    static constructFileUrl(filePath) {
        if (!filePath) {
            console.error('No file path provided');
            return null;
        }

        try {
            const decodedPath = decodeURIComponent(filePath);
            const cleanPath = decodedPath.replace(/^\/+/, '');
            const fileUrl = `${BASE_URL}/${cleanPath}`;

            console.log('File URL construction:', {
                originalPath: filePath,
                decodedPath,
                cleanPath,
                baseUrl: BASE_URL,
                finalURL: fileUrl
            });

            return fileUrl;
        } catch (error) {
            console.error('Error constructing file URL:', error);
            return null;
        }
    }

    static async fetchAndOpenAttachment(docId, attachment) {
        const result = await OPReimAPIService.fetchAttachments(docId);
        const targetAttachment = this.findTargetAttachment(result.data, attachment);

        if (!targetAttachment?.filePath) {
            throw new Error('Attachment not found or file path not available');
        }

        await this.openAttachmentFile(targetAttachment.filePath);
    }

    static findTargetAttachment(attachments, target) {
        if (!attachments?.length) return null;

        return attachments.find(att =>
            att.id === target.id ||
            att.fileName === target.fileName ||
            att.filePath === target.filePath
        );
    }

    static getFileIcon(fileName) {
        if (!fileName || typeof fileName !== 'string') return '📄';

        const extension = fileName.split('.').pop()?.toLowerCase();
        const icons = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            xls: '📊',
            xlsx: '📊',
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️'
        };
        return icons[extension] || '📄';
    }

    static formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    static formatDate(dateString) {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    }

    static showNoAttachmentsMessage() {
        const container = document.getElementById('attachmentsList');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        }
    }

    static showAttachmentError() {
        const container = document.getElementById('attachmentsList');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Error loading attachments</p>';
        }
    }

    static async loadReimbursementAttachments(reimbursementId) {
        try {
            const result = await OPReimAPIService.fetchReimbursementData(reimbursementId);

            if (result.data?.reimbursementAttachments?.length > 0) {
                this.appendReimbursementAttachmentsSection(result.data.reimbursementAttachments);
            }
        } catch (error) {
            console.error("Error loading reimbursement attachments:", error);
        }
    }

    static appendReimbursementAttachmentsSection(attachments) {
        const container = document.getElementById('attachmentsList');
        if (!container) return;

        const existingHeader = container.querySelector('.reimbursement-header');
        if (!existingHeader) {
            const reimbursementHeader = document.createElement('div');
            reimbursementHeader.className = 'mt-4 mb-2 reimbursement-header';
            reimbursementHeader.innerHTML = '<h4 class="text-md font-medium text-blue-800">Reimbursement Attachments</h4>';
            container.appendChild(reimbursementHeader);
        }

        this.displayReimbursementAttachments(attachments);
    }

    static displayReimbursementAttachments(attachments) {
        const container = document.getElementById('attachmentsList');
        if (!container || !attachments?.length) return;

        let attachmentList = container.querySelector('.reimbursement-attachments-list');
        if (!attachmentList) {
            attachmentList = document.createElement('div');
            attachmentList.className = 'space-y-2 mb-4 reimbursement-attachments-list';
            container.appendChild(attachmentList);
        } else {
            attachmentList.innerHTML = '';
        }

        attachments.forEach(attachment => {
            const attachmentItem = this.createReimbursementAttachmentItem(attachment);
            attachmentList.appendChild(attachmentItem);
        });
    }

    static createReimbursementAttachmentItem(attachment) {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200';

        const fileInfo = this.createReimbursementFileInfo(attachment);
        const actions = this.createReimbursementActions(attachment);

        attachmentItem.appendChild(fileInfo);
        attachmentItem.appendChild(actions);

        return attachmentItem;
    }

    static createReimbursementFileInfo(attachment) {
        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex items-center space-x-2';

        const fileIcon = this.getFileIcon(attachment.fileName || attachment.name);
        const fileName = attachment.fileName || attachment.name || 'Unknown File';
        const fileSize = this.formatFileSize(attachment.fileSize || attachment.size);
        const fileType = attachment.fileType || attachment.contentType || 'Unknown Type';
        const uploadDate = this.formatDate(attachment.uploadDate || attachment.createdAt);

        fileInfo.innerHTML = `
            <span class="text-lg">${fileIcon}</span>
            <div>
                <div class="font-medium text-sm">${fileName}</div>
                <div class="text-xs text-gray-500">${fileSize} • ${fileType}</div>
                <div class="text-xs text-blue-600">Reimbursement Attachment • Uploaded: ${uploadDate}</div>
            </div>
        `;

        return fileInfo;
    }

    static createReimbursementActions(attachment) {
        const actions = document.createElement('div');
        actions.className = 'flex space-x-2';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
        viewBtn.innerHTML = 'View';
        viewBtn.onclick = () => this.viewReimbursementAttachment(attachment);

        actions.appendChild(viewBtn);
        return actions;
    }

    static async viewReimbursementAttachment(attachment) {
        try {
            UIUtils.showLoading('Loading attachment, please wait...');

            if (attachment.filePath) {
                Swal.close();

                const decodedPath = decodeURIComponent(attachment.filePath);
                const fileUrl = `${BASE_URL}${decodedPath.startsWith('/') ? decodedPath : '/' + decodedPath}`;

                window.open(fileUrl, '_blank');
                return;
            }

            throw new Error('No file path available for this attachment');

        } catch (error) {
            console.error('Error viewing reimbursement attachment:', error);
            Swal.close();
            UIUtils.showError('Error', `Failed to view attachment: ${error.message}`);
        }
    }
}

// ===== 10. PRINT MANAGER =====
class PrintManager {
    static displayPrintOutReimbursement(opReimData) {
        const container = document.getElementById('printOutReimbursementList');
        if (!container) return;

        container.innerHTML = '';

        let opReimId = this.getOPReimId(opReimData);

        if (!opReimId) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Outgoing Payment Reimbursement ID not found</p>';
            return;
        }

        const printUrl = this.buildPrintUrl(opReimId, opReimData);
        const documentItem = this.createPrintDocumentItem(opReimId, printUrl);

        container.appendChild(documentItem);
    }

    static getOPReimId(opReimData) {
        const urlParams = new URLSearchParams(window.location.search);
        let opReimId = urlParams.get('id');

        if (!opReimId) {
            const documentNumberField = document.getElementById('DocNum');
            if (documentNumberField && documentNumberField.value) {
                opReimId = documentNumberField.value;
            }
        }

        if (!opReimId && opReimData) {
            opReimId = opReimData.stagingID ||
                opReimData.id ||
                opReimData.expressivNo ||
                opReimData.counterRef;
        }

        return opReimId;
    }

    static buildPrintUrl(opReimId, opReimData) {
        const baseUrl = window.location.origin;
        // Use GetPrintReim.html for Print Reimbursement Document
        const printReimUrl = `${baseUrl}/approvalPages/approval/receive/outgoingPayment/GetPrintReim.html`;

        // Use expressivNo for GetPrintReim.html parameter
        const expressivNo = opReimData?.expressivNo || opReimId;
        const finalUrl = `${printReimUrl}?reim-id=${expressivNo}&_t=${Date.now()}`;

        console.log('🔧 Print Reimbursement URL points to GetPrintReim.html with expressivNo:', expressivNo);
        console.log('🔗 Print Reimbursement URL constructed:', finalUrl);

        // MINIMAL URL: Only send reim-id parameter, let GetPrintReim.html handle all data internally
        return finalUrl;
    }

    static createPrintDocumentItem(opReimId, printUrl) {
        const documentItem = document.createElement('div');
        documentItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex items-center space-x-2';
        fileInfo.innerHTML = `
            <span class="text-lg">📄</span>
            <div>
                <div class="font-medium text-sm text-blue-800">Print Reimbursement Document</div>
                <div class="text-xs text-gray-500">Document • PDF</div>
                <div class="text-xs text-blue-600">Reim ID: ${opReimId}</div>
            </div>
        `;

        const actions = document.createElement('div');
        actions.className = 'flex space-x-2';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
        viewBtn.innerHTML = 'View';
        viewBtn.onclick = () => this.viewPrintReimbursement(printUrl);

        const openBtn = document.createElement('button');
        openBtn.className = 'text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded border border-green-300 hover:bg-green-50';
        openBtn.innerHTML = 'Open';
        openBtn.onclick = () => this.openPrintReimbursement(printUrl);

        actions.appendChild(viewBtn);
        actions.appendChild(openBtn);

        documentItem.appendChild(fileInfo);
        documentItem.appendChild(actions);

        return documentItem;
    }

    static async viewPrintReimbursement(url) {
        try {
            UIUtils.showLoading('Loading Print Reimbursement document...');

            const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

            if (newWindow) {
                Swal.close();
                UIUtils.showSuccess('Success', 'Print Reimbursement document opened in new window');
            } else {
                throw new Error('Failed to open document window');
            }

        } catch (error) {
            console.error('Error viewing Print Reimbursement document:', error);
            UIUtils.showError('Error', `Failed to open Print Reimbursement document: ${error.message}`);
        }
    }

    static openPrintReimbursement(url) {
        try {
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error opening Print Reimbursement document:', error);
            UIUtils.showError('Error', `Failed to open Print Reimbursement document: ${error.message}`);
        }
    }
}

// ===== 11. DATA MANAGER =====
class DataManager {
    static async initialize() {
        try {
            console.log('🚀 Initializing Approve Outgoing Payment Reimbursement page...');

            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');

            if (!id) {
                UIUtils.showError('Error', 'No document ID provided')
                    .then(() => this.goToMenu());
                return;
            }

            // Set global variables
            documentId = id;
            approveState.setDocumentId(id);
            console.log('📋 Document ID:', id);

            await this.loadOPReimDetails(id);

        } catch (error) {
            console.error('❌ Initialization error:', error);
            UIUtils.showError('Error', 'Failed to initialize the system');
        }
    }

    static async loadOPReimDetails(id) {
        try {
            UIUtils.showLoading('Fetching document details');

            const data = await OPReimAPIService.fetchOPReimDetails(id);
            console.log('📋 Outgoing Payment API Response:', data);

            // Set global variables
            outgoingPaymentReimData = data;
            approveState.setOPReimData(data);

            await this.loadUsersData();
            FormManager.populateFormFields(data);
            PermissionManager.checkUserPermissions(data);
            AttachmentManager.handleAttachments(data, id);
            PrintManager.displayPrintOutReimbursement(data);
            await this.handleReimbursementData(data);

            Swal.close();

        } catch (error) {
            console.error('❌ Error loading document:', error);
            UIUtils.showError('Error', `Failed to load document: ${error.message}`)
                .then(() => this.goToMenu());
        }
    }

    static async loadUsersData() {
        try {
            const usersData = await OPReimAPIService.fetchUsers();
            approveState.setUsers(usersData.data || []);
        } catch (error) {
            console.error('❌ Error loading users:', error);
            approveState.setUsers([]);
        }
    }

    static async handleReimbursementData(result) {
        if (!result.expressivNo) return;

        try {
            const reimResult = await OPReimAPIService.fetchReimbursementData(result.expressivNo);

            if (reimResult?.data) {
                if (reimResult.data.voucherNo) {
                    UIUtils.setElementValue('CounterRef', reimResult.data.voucherNo);
                }

                if (reimResult.data.receivedDate) {
                    const formattedDate = new Date(reimResult.data.receivedDate).toISOString().split('T')[0];
                    UIUtils.setElementValue('DocDate', formattedDate);
                }
            }

            await AttachmentManager.loadReimbursementAttachments(result.expressivNo);
        } catch (err) {
            console.warn('Could not fetch reimbursement data:', err);
        }
    }

    static goToMenu() {
        window.location.href = '../../../dashboard/dashboardApprove/OPReim/menuOPReimApprove.html';
    }
}

// ===== 12. ACTION MANAGER =====
class ActionManager {
    static async acknowledgeOPReim() {
        try {
            if (!PermissionManager.validateDocumentStatus()) {
                return;
            }

            UIUtils.showLoading('Processing...', 'Submitting acknowledgment');

            const userId = UserManager.getCurrentUserId();
            if (!userId) {
                throw new Error('User ID not found. Please log in again.');
            }

            const currentUser = getCurrentUser();
            const currentUserName = currentUser ? currentUser.username : 'Unknown User';
            const currentDate = new Date().toISOString();

            const requestData = this.buildAcknowledgeRequestData(userId, currentUserName, currentDate);

            const response = await fetch(`${BASE_URL}/api/staging-outgoing-payments/approvals/${approveState.documentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json-patch+json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `API error: ${response.status}`);
            }

            UIUtils.showSuccess('Success', 'Document has been acknowledged successfully')
                .then(() => DataManager.goToMenu());

        } catch (error) {
            console.error('❌ Error acknowledging document:', error);
            UIUtils.showError('Error', `Failed to acknowledge document: ${error.message}`);
        }
    }

    static buildAcknowledgeRequestData(userId, currentUserName, currentDate) {
        const approval = approveState.opReimData.approval || {};

        return {
            stagingID: approveState.documentId,
            createdAt: approval.createdAt || currentDate,
            updatedAt: currentDate,
            approvalStatus: "Acknowledged",
            preparedBy: approval.preparedBy || null,
            checkedBy: approval.checkedBy || null,
            acknowledgedBy: userId,
            approvedBy: approval.approvedBy || null,
            receivedBy: approval.receivedBy || null,
            preparedDate: approval.preparedDate || null,
            preparedByName: approval.preparedByName || null,
            checkedByName: approval.checkedByName || null,
            acknowledgedByName: currentUserName,
            approvedByName: approval.approvedByName || null,
            receivedByName: approval.receivedByName || null,
            checkedDate: approval.checkedDate || null,
            acknowledgedDate: currentDate,
            approvedDate: approval.approvedDate || null,
            receivedDate: approval.receivedDate || null,
            rejectedDate: approval.rejectedDate || null,
            rejectionRemarks: approval.rejectionRemarks || "",
            revisionNumber: approval.revisionNumber || null,
            revisionDate: approval.revisionDate || null,
            revisionRemarks: approval.revisionRemarks || null,
            header: {}
        };
    }

    static async rejectOPReim() {
        try {
            if (!PermissionManager.validateDocumentStatus()) {
                return;
            }

            const rejectionReason = await this.showRejectionDialog();
            if (!rejectionReason) return;

            UIUtils.showLoading('Processing...', 'Rejecting document, please wait...');

            const userId = UserManager.getCurrentUserId();
            if (!userId) {
                throw new Error('Unable to get user ID. Please login again.');
            }

            const requestData = this.buildRejectionRequestData(userId, rejectionReason);

            const response = await fetch(`${BASE_URL}/api/staging-outgoing-payments/approvals/${approveState.documentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                let errorMessage = `API error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.Message || errorMessage;
                } catch (e) {
                    console.error('Could not parse error response:', e);
                }
                throw new Error(errorMessage);
            }

            await UIUtils.showSuccess('Success', 'Document has been rejected');
            DataManager.goToMenu();

        } catch (error) {
            console.error('❌ Error rejecting document:', error);
            await UIUtils.showError('Error', `Failed to reject document: ${error.message}`);
        }
    }

    static async showRejectionDialog() {
        const { value: rejectionReason } = await Swal.fire({
            title: 'Reject Outgoing Payment Reimbursement',
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
                const firstField = document.getElementById('rejectionField1');
                if (firstField) {
                    this.initializeWithRejectionPrefix(firstField);
                }
                const field = document.querySelector('#rejectionFieldsContainer textarea');
                if (field) {
                    field.addEventListener('input', this.handleRejectionInput);
                }
            },
            preConfirm: () => {
                const field = document.querySelector('#rejectionFieldsContainer textarea');
                const remarks = field ? field.value.trim() : '';
                if (remarks === '') {
                    Swal.showValidationMessage('Please enter a rejection reason');
                    return false;
                }
                return remarks;
            }
        });

        return rejectionReason;
    }

    static buildRejectionRequestData(userId, rejectionReason) {
        const approval = approveState.opReimData.approval || {};
        const currentDate = new Date().toISOString();

        return {
            stagingID: approveState.documentId,
            createdAt: approveState.opReimData.createdAt || currentDate,
            updatedAt: currentDate,
            approvalStatus: "Rejected",
            preparedBy: approval.preparedBy || null,
            checkedBy: approval.checkedBy || null,
            acknowledgedBy: approval.acknowledgedBy || null,
            approvedBy: approval.approvedBy || null,
            receivedBy: approval.receivedBy || null,
            preparedDate: approval.preparedDate || null,
            preparedByName: approval.preparedByName || null,
            checkedByName: approval.checkedByName || null,
            acknowledgedByName: approval.acknowledgedByName || null,
            approvedByName: approval.approvedByName || null,
            receivedByName: approval.receivedByName || null,
            checkedDate: approval.checkedDate || null,
            acknowledgedDate: approval.acknowledgedDate || null,
            approvedDate: approval.approvedDate || null,
            receivedDate: approval.receivedDate || null,
            rejectedDate: currentDate,
            rejectionRemarks: rejectionReason,
            revisionNumber: approval.revisionNumber || null,
            revisionDate: approval.revisionDate || null,
            revisionRemarks: approval.revisionRemarks || null,
            header: {}
        };
    }

    static initializeWithRejectionPrefix(textarea) {
        const userInfo = UserManager.getUserInfo();
        const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
        textarea.value = prefix;
        textarea.dataset.prefixLength = prefix.length;
        textarea.setSelectionRange(prefix.length, prefix.length);
        textarea.focus();
    }

    static handleRejectionInput(event) {
        const textarea = event.target;
        const prefixLength = parseInt(textarea.dataset.prefixLength || '0');

        if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
            const userInfo = UserManager.getUserInfo();
            const prefix = `[${userInfo.name} - ${userInfo.role}]: `;

            if (!textarea.value.startsWith(prefix)) {
                const userText = textarea.value.substring(prefixLength);
                textarea.value = prefix + userText;
                textarea.setSelectionRange(prefixLength, prefixLength);
            } else {
                textarea.setSelectionRange(prefixLength, prefixLength);
            }
        }
    }
}

// ===== 13. GLOBAL FUNCTIONS (Required by HTML) =====

// Navigate back to the menu
function goToMenuApproveOPReim() {
    window.location.href = '../../../dashboard/dashboardApprove/OPReim/menuOPReimApprove.html';
}

// Approve the outgoing payment reimbursement
async function approveOPReim() {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Processing...',
            text: 'Submitting approval',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Get current user ID
        const userId = getUserId();

        if (!userId) {
            throw new Error('User ID not found. Please log in again.');
        }

        // Get current user information
        const currentUser = getCurrentUser();
        const currentDate = new Date().toISOString();

        // Prepare request data based on the API structure
        const requestData = {
            stagingID: documentId,
            createdAt: outgoingPaymentReimData.approval?.createdAt || currentDate,
            updatedAt: currentDate,
            approvalStatus: "Approved",
            preparedBy: outgoingPaymentReimData.approval?.preparedBy || null,
            checkedBy: outgoingPaymentReimData.approval?.checkedBy || null,
            acknowledgedBy: outgoingPaymentReimData.approval?.acknowledgedBy || null,
            approvedBy: userId,
            receivedBy: outgoingPaymentReimData.approval?.receivedBy || null,
            preparedDate: outgoingPaymentReimData.approval?.preparedDate || null,
            preparedByName: outgoingPaymentReimData.approval?.preparedByName || null,
            checkedByName: outgoingPaymentReimData.approval?.checkedByName || null,
            acknowledgedByName: outgoingPaymentReimData.approval?.acknowledgedByName || null,
            approvedByName: currentUser?.username || null,
            receivedByName: outgoingPaymentReimData.approval?.receivedByName || null,
            checkedDate: outgoingPaymentReimData.approval?.checkedDate || null,
            acknowledgedDate: outgoingPaymentReimData.approval?.acknowledgedDate || null,
            approvedDate: currentDate,
            receivedDate: outgoingPaymentReimData.approval?.receivedDate || null,
            rejectedDate: outgoingPaymentReimData.approval?.rejectedDate || null,
            rejectionRemarks: outgoingPaymentReimData.approval?.rejectionRemarks || "",
            revisionNumber: outgoingPaymentReimData.approval?.revisionNumber || null,
            revisionDate: outgoingPaymentReimData.approval?.revisionDate || null,
            revisionRemarks: outgoingPaymentReimData.approval?.revisionRemarks || null,
            header: {}
        };

        // Make API request to update approval status using OPReimAPIService
        const response = await OPReimAPIService.approveDocument(documentId, requestData);

        console.log('✅ Document approved successfully:', response);

        // Show success message
        Swal.fire({
            title: 'Success',
            text: 'Document has been approved successfully',
            icon: 'success'
        }).then(() => {
            // Redirect back to menu
            goToMenuApproveOPReim();
        });

    } catch (error) {
        console.error('Error approving document:', error);

        Swal.fire({
            title: 'Error',
            text: `Failed to approve document: ${error.message}`,
            icon: 'error'
        });
    }
}

// Reject the outgoing payment reimbursement
async function rejectOPReim() {
    try {
        // Create custom dialog with single field
        const { value: rejectionReason } = await Swal.fire({
            title: 'Reject Outgoing Payment Reimbursement',
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
                const firstField = document.getElementById('rejectionField1');
                if (firstField) {
                    initializeWithRejectionPrefix(firstField);
                }
                const field = document.querySelector('#rejectionFieldsContainer textarea');
                if (field) {
                    field.addEventListener('input', handleRejectionInput);
                }
            },
            preConfirm: () => {
                const field = document.querySelector('#rejectionFieldsContainer textarea');
                const remarks = field ? field.value.trim() : '';
                if (remarks === '') {
                    Swal.showValidationMessage('Please enter a rejection reason');
                    return false;
                }
                return remarks;
            }
        });

        if (!rejectionReason) {
            return; // User cancelled or didn't provide a reason
        }

        // Show loading indicator
        Swal.fire({
            title: 'Processing...',
            text: 'Rejecting document, please wait...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Get current user ID
        const userId = getUserId();
        if (!userId) {
            throw new Error('Unable to get user ID. Please login again.');
        }

        // Prepare request data for rejection
        const requestData = {
            stagingID: documentId,
            createdAt: outgoingPaymentReimData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvalStatus: "Rejected",
            preparedBy: outgoingPaymentReimData.approval?.preparedBy || null,
            checkedBy: outgoingPaymentReimData.approval?.checkedBy || null,
            acknowledgedBy: outgoingPaymentReimData.approval?.acknowledgedBy || null,
            approvedBy: outgoingPaymentReimData.approval?.approvedBy || null,
            receivedBy: outgoingPaymentReimData.approval?.receivedBy || null,
            preparedDate: outgoingPaymentReimData.approval?.preparedDate || null,
            preparedByName: outgoingPaymentReimData.approval?.preparedByName || null,
            checkedByName: outgoingPaymentReimData.approval?.checkedByName || null,
            acknowledgedByName: outgoingPaymentReimData.approval?.acknowledgedByName || null,
            approvedByName: outgoingPaymentReimData.approval?.approvedByName || null,
            receivedByName: outgoingPaymentReimData.approval?.receivedByName || null,
            checkedDate: outgoingPaymentReimData.approval?.checkedDate || null,
            acknowledgedDate: outgoingPaymentReimData.approval?.acknowledgedDate || null,
            approvedDate: outgoingPaymentReimData.approval?.approvedDate || null,
            receivedDate: outgoingPaymentReimData.approval?.receivedDate || null,
            rejectedDate: new Date().toISOString(),
            rejectionRemarks: rejectionReason,
            revisionNumber: outgoingPaymentReimData.approval?.revisionNumber || null,
            revisionDate: outgoingPaymentReimData.approval?.revisionDate || null,
            revisionRemarks: outgoingPaymentReimData.approval?.revisionRemarks || null,
            header: {}
        };

        // Also add rejectionRemarks at root level in case backend expects it there
        requestData.rejectionRemarks = rejectionReason;

        // Make API request to reject document using OPReimAPIService
        const response = await OPReimAPIService.rejectDocument(documentId, requestData);

        console.log('✅ Document rejected successfully:', response);

        // Show success message
        await Swal.fire({
            title: 'Success',
            text: 'Document has been rejected',
            icon: 'success'
        });

        // Redirect back to menu
        goToMenuApproveOPReim();

    } catch (error) {
        console.error('Error rejecting document:', error);

        // Show error message
        await Swal.fire({
            title: 'Error',
            text: `Failed to reject document: ${error.message}`,
            icon: 'error'
        });
    }
}


// Helper function to get logged-in user ID
function getUserId() {
    try {
        const user = getCurrentUser();
        return user ? user.userId : null;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
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
        const userInfo = getUserInfo();
        const prefix = `[${userInfo.name} - ${userInfo.role}]: `;

        // Only restore if the prefix is damaged
        if (!textarea.value.startsWith(prefix)) {
            const userText = textarea.value.substring(prefixLength);
            textarea.value = prefix + userText;
            textarea.setSelectionRange(prefixLength, prefixLength);
        } else {
            textarea.setSelectionRange(prefixLength, prefixLength);
        }
    }
}

// Function to get current user information
function getUserInfo() {
    // Use functions from auth.js to get user information
    let userName = 'Unknown User';
    let userRole = 'Approver'; // Default role for this page

    try {
        // Get user info from getCurrentUser function in auth.js
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
            userName = currentUser.username;
        }
    } catch (e) {
        console.error('Error getting user info:', e);
    }

    return { name: userName, role: userRole };
}


// Legacy function for backward compatibility
function viewAttachment(attachmentId) {
    console.warn('Legacy viewAttachment function called. Consider updating to use AttachmentManager.viewEnhancedAttachment');
    // Implementation would need the attachment object, which isn't available with just ID
}

// Legacy function for displaying print out reimbursement
function displayPrintOutReimbursement(data) {
    PrintManager.displayPrintOutReimbursement(data);
}

// ===== 14. INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Approve Outgoing Payment Reimbursement System...');
    DataManager.initialize();
    console.log('✅ Approve Outgoing Payment Reimbursement System initialized successfully');
});


// Function to handle print functionality with proper URL encoding
function printOPReim() {
    try {
        // Get document ID
        const docId = documentId;

        if (!docId) {
            Swal.fire({
                title: 'Error',
                text: 'Document ID not found',
                icon: 'error'
            });
            return;
        }

        if (!outgoingPaymentReimData) {
            Swal.fire({
                title: 'Error',
                text: 'Document data not available',
                icon: 'error'
            });
            return;
        }

        // Extract data for URL parameters (avoid over-encoding)
        const approval = outgoingPaymentReimData.approval || {};
        const printParams = {
            'docId': docId,
            'reimId': outgoingPaymentReimData.expressivNo || docId,
            'payTo': outgoingPaymentReimData.cardName || outgoingPaymentReimData.requesterName || '',
            'voucherNo': outgoingPaymentReimData.counterRef || '',
            'submissionDate': outgoingPaymentReimData.docDate || outgoingPaymentReimData.trsfrDate || '',
            'preparedBy': approval.preparedByName || '',
            'checkedBy': approval.checkedByName || '',
            'acknowledgedBy': approval.acknowledgedByName || '',
            'approvedBy': approval.approvedByName || '',
            'receivedBy': approval.receivedByName || '',
            'currency': outgoingPaymentReimData.docCurr || 'IDR',
            'totalAmount': outgoingPaymentReimData.trsfrSum || 0,
            'remarks': outgoingPaymentReimData.remarks || outgoingPaymentReimData.jrnlMemo || ''
        };

        // Build details array from lines
        const details = [];
        if (outgoingPaymentReimData.lines && outgoingPaymentReimData.lines.length > 0) {
            outgoingPaymentReimData.lines.forEach(line => {
                details.push({
                    category: 'OUTGOING PAYMENT',
                    accountName: line.acctName || '',
                    glAccount: line.acctCode || '',
                    description: line.descrip || '',
                    amount: line.sumApplied || 0,
                    division: line.divisionCode || line.division || '',
                    currency: line.CurrencyItem || line.currencyItem || 'IDR'
                });
            });
        }

        // Store comprehensive data in localStorage for print page
        const printData = {
            ...outgoingPaymentReimData,
            attachments: existingAttachments || [],
            printParams: printParams,
            details: details
        };

        localStorage.setItem(`opReimData_${docId}`, JSON.stringify(printData));

        console.log('📄 Stored comprehensive data for print:', printData);

        // Build clean URL with properly encoded parameters
        const baseUrl = window.location.origin;
        let printUrl = `${baseUrl}/approvalPages/approval/receive/outgoingPayment/printOPReim.html`;

        // Add URL parameters with single encoding
        const urlParams = new URLSearchParams();
        Object.entries(printParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                urlParams.append(key, String(value));
            }
        });

        // Add details as JSON (will be properly encoded by URLSearchParams)
        if (details.length > 0) {
            urlParams.append('details', JSON.stringify(details));
        }

        printUrl += '?' + urlParams.toString();

        console.log('📄 Print URL created:', printUrl);
        console.log('📄 URL length:', printUrl.length);

        // Open print page in new window
        const newWindow = window.open(printUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

        if (newWindow) {
            Swal.fire({
                title: 'Success',
                text: 'Print page opened in new window',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            throw new Error('Failed to open print window. Please check if pop-ups are blocked.');
        }

    } catch (error) {
        console.error('Error opening print page:', error);

        Swal.fire({
            title: 'Error',
            text: `Failed to open print page: ${error.message}`,
            icon: 'error'
        });
    }
}