// ===== CLEAN RECEIVE OUTGOING PAYMENT REIMBURSEMENT SYSTEM =====
// File: receiveOPReim.js - Functional/Procedural Version

/*
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                    🔧 CENTRALIZED API MANAGEMENT SYSTEM                          │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                 │
 │ 📍 LOKASI API CONFIGURATION:                                                   │
 │   • API_CONFIG (Line ~20) - Semua endpoint dan konfigurasi API                 │
 │   • apiRequest (Line ~95) - Wrapper untuk makeAuthenticatedRequest             │
 │   • opReimAPI (Line ~155) - Service functions untuk business logic             │
 │   • apiHelpers (Line ~235) - Utility functions untuk API operations            │
 │                                                                                 │
 │ 🎯 KEUNTUNGAN CENTRALIZATION:                                                  │
 │   ✅ Single source of truth untuk semua API endpoints                          │
 │   ✅ Konsisten error handling dan logging                                      │
 │   ✅ Mudah untuk mengubah base URL atau endpoint                               │
 │   ✅ Timeout management yang terpusat                                          │
 │   ✅ Type safety dan dokumentasi yang jelas                                    │
 │                                                                                 │
 │ 📝 CARA MENAMBAH API BARU:                                                     │
 │   1. Tambahkan endpoint di API_CONFIG.ENDPOINTS                                │
 │   2. Tambahkan function di opReimAPI                                           │
 │   3. Gunakan apiRequest untuk request                                          │
 │   4. Error handling otomatis sudah tersedia                                    │
 │                                                                                 │
 │ 🔍 CARA MENGUBAH EXISTING API:                                                 │
 │   1. Cari di API_CONFIG.ENDPOINTS                                              │
 │   2. Update endpoint atau konfigurasi                                          │
 │   3. Semua usage akan terupdate otomatis                                       │
 │                                                                                 │
 └─────────────────────────────────────────────────────────────────────────────────┘
 */

// ===== API CONFIGURATION - CENTRALIZED =====
const API_CONFIG = {
    // Base Configuration
    BASE_URL: window.location.origin,

    // API Endpoints - DAFTAR LENGKAP API YANG DIGUNAKAN
    ENDPOINTS: {
        // 📋 Outgoing Payment Reimbursement APIs
        OP_REIM: {
            HEADERS: '/api/staging-outgoing-payments/headers',
            ATTACHMENTS: '/api/staging-outgoing-payments/attachments',
            APPROVALS: '/api/staging-outgoing-payments/approvals'
        },

        // 👥 Users & Authentication APIs
        USERS: '/api/users',

        // 💰 Reimbursements APIs
        REIMBURSEMENTS: '/api/reimbursements',

        // 📁 Files APIs
        FILES: '/api/files'
    },

    // HTTP Methods
    METHODS: {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        PATCH: 'PATCH',
        DELETE: 'DELETE'
    },

    // Content Types
    CONTENT_TYPES: {
        JSON: 'application/json',
        JSON_PATCH: 'application/json-patch+json',
        FORM_DATA: 'multipart/form-data'
    },

    // Request Timeouts (milliseconds)
    TIMEOUTS: {
        DEFAULT: 30000,   // 30 seconds
        UPLOAD: 120000,   // 2 minutes
        DOWNLOAD: 60000   // 1 minute
    },

    // Error Messages - Pesan error dalam Bahasa Indonesia
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Terjadi kesalahan jaringan. Silakan periksa koneksi Anda.',
        TIMEOUT_ERROR: 'Request timeout. Silakan coba lagi.',
        UNAUTHORIZED: 'Akses tidak diizinkan. Silakan login kembali.',
        FORBIDDEN: 'Akses ditolak. Anda tidak memiliki izin.',
        NOT_FOUND: 'Resource tidak ditemukan.',
        SERVER_ERROR: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
        VALIDATION_ERROR: 'Kesalahan validasi. Silakan periksa input Anda.'
    }
};

// ===== API CONFIGURATION HELPER FUNCTIONS =====
function buildApiUrl(endpoint, id = null, params = null) {
    let url = `${API_CONFIG.BASE_URL}${endpoint}`;

    if (id) {
        url += `/${id}`;
    }

    if (params) {
        const urlParams = new URLSearchParams(params);
        url += `?${urlParams.toString()}`;
    }

    return url;
}

function getApiErrorMessage(status) {
    switch (status) {
        case 401:
            return API_CONFIG.ERROR_MESSAGES.UNAUTHORIZED;
        case 403:
            return API_CONFIG.ERROR_MESSAGES.FORBIDDEN;
        case 404:
            return API_CONFIG.ERROR_MESSAGES.NOT_FOUND;
        case 422:
            return API_CONFIG.ERROR_MESSAGES.VALIDATION_ERROR;
        case 500:
        case 502:
        case 503:
            return API_CONFIG.ERROR_MESSAGES.SERVER_ERROR;
        default:
            return API_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
    }
}

// ===== CENTRALIZED API CLIENT FUNCTIONS =====
async function apiRequest(endpoint, options = {}) {
    const {
        method = API_CONFIG.METHODS.GET,
        headers = {},
        body = null,
        timeout = API_CONFIG.TIMEOUTS.DEFAULT,
        ...otherOptions
    } = options;

    const requestOptions = {
        method,
        headers: {
            'Content-Type': API_CONFIG.CONTENT_TYPES.JSON,
            ...headers
        },
        ...otherOptions
    };

    if (body && method !== API_CONFIG.METHODS.GET) {
        if (body instanceof FormData) {
            delete requestOptions.headers['Content-Type'];
            requestOptions.body = body;
        } else {
            requestOptions.body = JSON.stringify(body);
        }
    }

    try {
        console.log(`🌐 API Request: ${method} ${endpoint}`);

        const response = await makeAuthenticatedRequest(endpoint, requestOptions);

        if (!response.ok) {
            const errorMessage = getApiErrorMessage(response.status);
            throw new Error(`${errorMessage} (Status: ${response.status})`);
        }

        console.log(`✅ API Response: ${response.status} ${response.statusText}`);
        return await response.json();

    } catch (error) {
        console.error(`❌ API Error: ${method} ${endpoint}`, error);
        throw error;
    }
}

// GET request
async function apiGet(endpoint, params = null, options = {}) {
    const url = params ? buildApiUrl(endpoint, null, params) : endpoint;
    return apiRequest(url, {
        method: API_CONFIG.METHODS.GET,
        ...options
    });
}

// POST request
async function apiPost(endpoint, data = null, options = {}) {
    return apiRequest(endpoint, {
        method: API_CONFIG.METHODS.POST,
        body: data,
        ...options
    });
}

// PUT request
async function apiPut(endpoint, data = null, options = {}) {
    return apiRequest(endpoint, {
        method: API_CONFIG.METHODS.PUT,
        body: data,
        ...options
    });
}

// PATCH request
async function apiPatch(endpoint, data = null, options = {}) {
    return apiRequest(endpoint, {
        method: API_CONFIG.METHODS.PATCH,
        body: data,
        headers: {
            'Content-Type': API_CONFIG.CONTENT_TYPES.JSON_PATCH
        },
        ...options
    });
}

// DELETE request
async function apiDelete(endpoint, options = {}) {
    return apiRequest(endpoint, {
        method: API_CONFIG.METHODS.DELETE,
        ...options
    });
}

// ===== API HELPER FUNCTIONS =====
function getApiEndpoints() {
    return {
        getOPReimDetails: (id) => `${API_CONFIG.ENDPOINTS.OP_REIM.HEADERS}/${id}`,
        getAttachments: (id) => `${API_CONFIG.ENDPOINTS.OP_REIM.ATTACHMENTS}/${id}`,
        approveDocument: (id) => `${API_CONFIG.ENDPOINTS.OP_REIM.APPROVALS}/${id}`,
        getUsers: () => API_CONFIG.ENDPOINTS.USERS,
        getReimbursement: (expressivNo) => `${API_CONFIG.ENDPOINTS.REIMBURSEMENTS}/${expressivNo}`,
        downloadFile: (filePath) => `${API_CONFIG.ENDPOINTS.FILES}/${filePath}`
    };
}

function validateApiResponse(response, expectedFields = []) {
    if (!response) {
        throw new Error('Response is null or undefined');
    }

    for (const field of expectedFields) {
        if (!(field in response)) {
            console.warn(`Missing field in API response: ${field}`);
        }
    }

    return response;
}

function handleApiError(error, context = '') {
    console.error(`API Error in ${context}:`, error);

    let userMessage = error.message;

    if (error.message.includes('401')) {
        userMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
    } else if (error.message.includes('403')) {
        userMessage = 'Anda tidak memiliki izin untuk melakukan aksi ini.';
    } else if (error.message.includes('404')) {
        userMessage = 'Data tidak ditemukan. Mungkin sudah dihapus atau dipindahkan.';
    } else if (error.message.includes('500')) {
        userMessage = 'Terjadi kesalahan server. Tim IT telah diberitahu.';
    }

    return userMessage;
}

function formatRequestLog(method, endpoint, data = null) {
    const log = {
        timestamp: new Date().toISOString(),
        method,
        endpoint,
        hasData: !!data,
        dataSize: data ? JSON.stringify(data).length : 0
    };

    console.log('📋 API Request Log:', log);
    return log;
}

// ===== GLOBAL VARIABLES =====
let documentId = null;
let outgoingPaymentReimData = null;
let uploadedFiles = [];
let existingAttachments = [];
let attachmentsToKeep = [];
let usersList = [];

// ===== GLOBAL STATE MANAGEMENT FUNCTIONS =====
function setDocumentId(id) {
    documentId = id;
}

function setOPReimData(data) {
    outgoingPaymentReimData = data;
}

function setUsers(users) {
    usersList = users;
}

function setAttachments(attachments) {
    existingAttachments = attachments || [];
}

// ===== API SERVICE FUNCTIONS =====

// Fetch detail dokumen outgoing payment reimbursement
async function fetchOPReimDetails(id) {
    const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.HEADERS}/${id}`;
    return await apiGet(endpoint);
}

// Fetch daftar users untuk dropdown approval
async function fetchUsers() {
    return await apiGet(API_CONFIG.ENDPOINTS.USERS);
}

// Fetch attachments dokumen
async function fetchAttachments(id) {
    const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.ATTACHMENTS}/${id}`;
    return await apiGet(endpoint);
}

// Fetch data reimbursement berdasarkan expressivNo
async function fetchReimbursementData(expressivNo) {
    const endpoint = `${API_CONFIG.ENDPOINTS.REIMBURSEMENTS}/${expressivNo}`;
    return await apiGet(endpoint);
}

// Approve dokumen (Checked, Acknowledged, Approved)
async function approveDocument(id, requestData) {
    const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.APPROVALS}/${id}`;
    return await apiPut(endpoint, requestData);
}

// Receive dokumen (approve untuk diterima)
async function receiveDocument(id, requestData) {
    const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.APPROVALS}/${id}`;
    return await apiPut(endpoint, requestData);
}

// Reject dokumen
async function rejectDocument(id, requestData) {
    const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.APPROVALS}/${id}`;
    return await apiPut(endpoint, requestData);
}

// Upload file attachment
async function uploadAttachment(id, formData) {
    const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.ATTACHMENTS}/${id}`;
    return await apiPost(endpoint, formData, {
        timeout: API_CONFIG.TIMEOUTS.UPLOAD
    });
}

// Delete attachment
async function deleteAttachment(id, attachmentId) {
    const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.ATTACHMENTS}/${id}/${attachmentId}`;
    return await apiDelete(endpoint);
}

// Fetch file content untuk download/view
async function fetchFileContent(filePath, options = {}) {
    const endpoint = `${API_CONFIG.ENDPOINTS.FILES}/${filePath}`;
    return await apiGet(endpoint, null, {
        timeout: API_CONFIG.TIMEOUTS.DOWNLOAD,
        ...options
    });
}

// ===== UI UTILITY FUNCTIONS =====
function showLoading(message = 'Loading...') {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
}

function showSuccess(title, text) {
    return Swal.fire({ icon: 'success', title, text });
}

function showError(title, text) {
    return Swal.fire({ icon: 'error', title, text });
}

function showInfo(title, text) {
    return Swal.fire({ icon: 'info', title, text });
}

function showWarning(title, text) {
    return Swal.fire({ icon: 'warning', title, text });
}

function formatCurrency(number) {
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
        return formatLargeNumberFallback(num);
    }
}

function formatLargeNumberFallback(num) {
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

function formatCurrencyWithTwoDecimals(number) {
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
        return formatLargeNumberFallback(limitedNum) + '.00';
    } else {
        return limitedNum.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

function formatDateSafely(dateValue) {
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

function setElementValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value || '';
}

function getElementValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

// ===== FORM MANAGEMENT FUNCTIONS =====
function populateFormFields(data) {
    console.log('🔄 Populating form fields with data:', data);

    // Header fields
    setElementValue('CounterRef', data.counterRef || '');
    setElementValue('RequesterName', data.requesterName || '');
    setElementValue('CardName', data.cardName || '');
    setElementValue('Address', data.address || '');
    setElementValue('DocNum', data.counterRef || data.docNum || '');
    setElementValue('JrnlMemo', data.jrnlMemo || '');
    setElementValue('DocCurr', data.docCurr || 'IDR');
    setElementValue('TrsfrAcct', data.trsfrAcct || '');
    setElementValue('RemittanceRequestAmount', formatCurrency(data.trsfrSum || 0));

    // Date fields - FIXED VERSION FOR ACKNOWLEDGE
    const currentDocDate = getElementValue('DocDate');
    if (!currentDocDate && data.receivedDate) {
        const docDate = new Date(data.receivedDate);
        setElementValue('DocDate', docDate.toISOString().split('T')[0]);
    }

    if (data.docDueDate) {
        setElementValue('DocDueDate', formatDateSafely(data.docDueDate));
    }
    if (data.trsfrDate) {
        setElementValue('TrsfrDate', formatDateSafely(data.trsfrDate));
    }

    // Calculate and populate totals
    calculateTotals(data.lines);

    // Populate remarks
    setElementValue('remarks', data.remarks || '');
    setElementValue('journalRemarks', data.journalRemarks || '');

    // Populate approval info
    if (data.approval) {
        populateApprovalInfo(data.approval);
        handleRejectionRemarks(data.approval);
        displayApprovalStatus(data.approval);
    } else {
        displayApprovalStatus({ approvalStatus: 'Prepared' });
    }

    // Populate table
    populateTableRows(data.lines);

    console.log('✅ Form fields populated successfully');
}

function calculateTotals(lines) {
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

    setElementValue('netTotal', formatCurrency(netTotal));
    setElementValue('totalTax', formatCurrency(0));
    setElementValue('totalAmountDue', formatCurrency(totalAmountDue));

    displayCurrencySummary(currencySummary);
    updateTotalOutstandingTransfers(currencySummary);
}

function populateApprovalInfo(approval) {
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
            const userName = getUserNameById(userId);
            setElementValue(field, userName);
        }
    });
}

function handleRejectionRemarks(approval) {
    if (approval.approvalStatus === 'Rejected') {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        const rejectionText = document.getElementById('rejectionRemarks');

        if (rejectionSection) rejectionSection.style.display = 'block';
        if (rejectionText) rejectionText.value = approval.rejectionRemarks || '';
    }
}

function displayApprovalStatus(approval) {
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

// ===== TABLE MANAGEMENT FUNCTIONS =====
function populateTableRows(lines) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!lines || lines.length === 0) {
        displayEmptyTable(tableBody);
        return;
    }

    lines.forEach((line, index) => {
        const amount = line.sumApplied || 0;
        const row = createTableRow(line, amount);
        tableBody.appendChild(row);
    });
}

function displayEmptyTable(tableBody) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
        <td colspan="6" class="p-8 text-center text-gray-500">
            <div class="loading-shimmer h-4 rounded mx-auto w-1/2 mb-2"></div>
            <div class="loading-shimmer h-4 rounded mx-auto w-1/3"></div>
        </td>
    `;
    tableBody.appendChild(emptyRow);
}

function createTableRow(line, amount) {
    const row = document.createElement('tr');
    const cells = [
        line.acctCode || '',
        line.acctName || '',
        line.descrip || '',
        line.divisionCode || line.division || '',
        line.CurrencyItem || line.currencyItem || 'IDR',
        formatCurrencyWithTwoDecimals(amount)
    ];

    row.innerHTML = cells.map((cell, index) => {
        const isLastCell = index === 5;
        const cellClass = `p-3 border-b${isLastCell ? ' text-right font-mono' : ''}`;
        return `<td class="${cellClass}">${cell}</td>`;
    }).join('');

    return row;
}

// ===== CURRENCY MANAGEMENT FUNCTIONS =====
function displayCurrencySummary(currencySummary) {
    const container = document.getElementById('currencySummaryTable');
    if (!container) return;

    if (!currencySummary || Object.keys(currencySummary).length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No amounts to display</p>';
        return;
    }

    const summaryEntries = Object.entries(currencySummary)
        .map(([currency, amount]) =>
            `<div class="text-base text-gray-700 font-mono font-semibold">
                ${currency} ${formatCurrencyWithTwoDecimals(amount)}
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

function updateTotalOutstandingTransfers(currencySummary) {
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
                ${currency} ${numberToWords(amount)}
            </div>`
        ).join('');

    container.innerHTML = `<div class="space-y-3">${transferEntries}</div>`;
}

function numberToWords(num) {
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

// ===== USER MANAGEMENT FUNCTIONS =====
function getUserNameById(userId) {
    if (!usersList || !userId) return 'Unknown User';

    const user = usersList.find(u => u.id === userId);
    return user ? user.fullName : 'Unknown User';
}

function getCurrentUserId() {
    try {
        const user = getCurrentUser();
        return user ? user.userId : null;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
}

function getUserInfo() {
    let userName = 'Unknown User';
    let userRole = 'Approver';

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

// ===== PERMISSION MANAGEMENT FUNCTIONS =====

// STATUS MAPPING - Urutan workflow approval
const APPROVAL_WORKFLOW = [
    { status: 'Prepared', nextStatus: 'Checked', roleField: 'preparedBy', dateField: 'preparedDate', nameField: 'preparedByName' },
    { status: 'Checked', nextStatus: 'Acknowledged', roleField: 'checkedBy', dateField: 'checkedDate', nameField: 'checkedByName' },
    { status: 'Acknowledged', nextStatus: 'Approved', roleField: 'acknowledgedBy', dateField: 'acknowledgedDate', nameField: 'acknowledgedByName' },
    { status: 'Approved', nextStatus: 'Received', roleField: 'approvedBy', dateField: 'approvedDate', nameField: 'approvedByName' },
    { status: 'Received', nextStatus: null, roleField: 'receivedBy', dateField: 'receivedDate', nameField: 'receivedByName' }
];

function checkUserPermissions(data) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showError('Error', 'User not authenticated. Please login again.')
            .then(() => window.location.href = getLoginPagePath());
        return;
    }

    const approval = data.approval;
    if (!approval) {
        console.error('No approval data found');
        return;
    }

    // Gunakan sistem approval workflow yang baru
    const permissionResult = checkUserPermissionsNew(data);
    updateUIBasedOnPermissions(permissionResult, approval);
}

// Mengecek user permissions berdasarkan status dokumen dan role user - ENHANCED DEBUG
function checkUserPermissionsNew(data) {
    const currentUser = getCurrentUser();
    if (!currentUser || !data || !data.approval) {
        console.warn('⚠️ Missing user or approval data');
        return { canApprove: false, currentStep: null, userRole: null };
    }

    const approval = data.approval;
    const currentUserId = currentUser.userId;

    console.log('🔍 DETAILED PERMISSION CHECK START');
    console.log('👤 Current User ID:', currentUserId);
    console.log('📋 Approval Data:', approval);
    console.log('📊 Current Approval Status:', approval.approvalStatus);

    // Cek status dokumen saat ini
    const currentStep = determineCurrentApprovalStep(approval);
    console.log('📍 Current Step:', currentStep);

    const userRole = getUserRoleInApproval(currentUserId, approval);
    console.log('👥 User Roles:', userRole);

    const canApprove = canUserApproveAtCurrentStep(currentUserId, approval, currentStep);
    console.log('✅❌ Can Approve:', canApprove);

    // Additional debugging for the specific case
    if (currentUserId === '1b7137ab-e63c-4a21-8a6d-d0e2575b6254') { // Ida's user ID
        console.log('🔍 IDA SPECIFIC DEBUG:');
        console.log('- Is CheckedBy:', approval.checkedBy === currentUserId, '(checkedDate:', approval.checkedDate, ')');
        console.log('- Is AcknowledgedBy:', approval.acknowledgedBy === currentUserId, '(acknowledgedDate:', approval.acknowledgedDate, ')');
        console.log('- Current Status:', approval.approvalStatus);
        console.log('- Next Action Should Be:', currentStep?.nextStatus);
        
        const nextStep = getNextStep(currentStep);
        if (nextStep) {
            console.log('- Next Step Details:', nextStep);
            console.log('- Is Assigned to Next Step:', approval[nextStep.roleField] === currentUserId);
            console.log('- Has Already Done Next Action:', !!approval[nextStep.dateField]);
        }
        
        const hasCompleted = hasUserCompletedTheirAction(currentUserId, approval);
        console.log('- Has Completed Current Action:', hasCompleted);
    }

    console.log('🔍 DETAILED PERMISSION CHECK END');

    return {
        canApprove,
        currentStep,
        userRole,
        nextAction: currentStep?.nextStatus,
        isAssignedToCurrentStep: isUserAssignedToStep(currentUserId, approval, currentStep)
    };
}

// Menentukan step approval saat ini berdasarkan status dokumen
function determineCurrentApprovalStep(approval) {
    if (!approval) return APPROVAL_WORKFLOW[0]; // Default: Prepared

    // Jika sudah rejected, return rejected status
    if (approval.rejectedDate) {
        return { status: 'Rejected', nextStatus: null, roleField: null, dateField: 'rejectedDate' };
    }

    // Cari step terakhir yang sudah diselesaikan (memiliki tanggal)
    let lastCompletedStep = null;

    for (let i = 0; i < APPROVAL_WORKFLOW.length; i++) {
        const step = APPROVAL_WORKFLOW[i];
        if (approval[step.dateField]) {
            lastCompletedStep = step;
        } else {
            // Berhenti pada step pertama yang belum diselesaikan
            break;
        }
    }

    // Jika ada step yang sudah diselesaikan, return step tersebut
    if (lastCompletedStep) {
        return lastCompletedStep;
    }

    // Jika tidak ada step yang diselesaikan, return step pertama
    return APPROVAL_WORKFLOW[0];
}

// Menentukan role user dalam approval workflow
function getUserRoleInApproval(userId, approval) {
    const roles = [];

    APPROVAL_WORKFLOW.forEach(step => {
        if (approval[step.roleField] === userId) {
            roles.push(step.status);
        }
    });

    return roles.length > 0 ? roles : ['None'];
}

// Mengecek apakah user bisa approve di step saat ini - FIXED VERSION
function canUserApproveAtCurrentStep(userId, approval, currentStep) {
    if (!currentStep) return false;

    // Jika dokumen sudah received atau rejected, tidak ada yang bisa approve
    if (currentStep.status === 'Received' || currentStep.status === 'Rejected') {
        return false;
    }

    // Cari next step berdasarkan current step
    const nextStep = getNextStep(currentStep);
    if (!nextStep) return false; // Tidak ada step berikutnya

    // Cek apakah user adalah assigned approver untuk next step
    const isAssigned = approval[nextStep.roleField] === userId;
    if (!isAssigned) {
        console.log(`❌ Permission denied: User not assigned to ${nextStep.status}. Expected: ${approval[nextStep.roleField]}, Got: ${userId}`);
        return false;
    }

    // 🔧 FIXED: Cek apakah user sudah melakukan action untuk NEXT STEP (bukan current step)
    const hasUserAlreadyActed = approval[nextStep.dateField];
    if (hasUserAlreadyActed) {
        console.log(`❌ Permission denied: User ${nextStep.status} has already completed their action on ${hasUserAlreadyActed}`);
        return false;
    }

    // STRICT PERMISSION CHECK berdasarkan role dan status
    const currentStatus = currentStep.status;
    const userRole = nextStep.status; // Role yang akan user lakukan

    // Mapping yang ketat: User hanya bisa approve jika status tepat sebelum role mereka
    const allowedTransitions = {
        'Checked': 'Prepared',      // CheckedBy hanya bisa approve jika status = Prepared
        'Acknowledged': 'Checked',  // AcknowledgedBy hanya bisa approve jika status = Checked
        'Approved': 'Acknowledged', // ApprovedBy hanya bisa approve jika status = Acknowledged
        'Received': 'Approved'      // ReceivedBy hanya bisa approve jika status = Approved
    };

    const requiredStatus = allowedTransitions[userRole];
    if (currentStatus !== requiredStatus) {
        console.log(`❌ Permission denied: User role ${userRole} requires status ${requiredStatus}, but current status is ${currentStatus}`);
        return false;
    }

    // 🔧 FIXED: Special handling untuk user yang memiliki multiple roles
    // Jika user yang sama assigned untuk multiple consecutive roles
    if (userRole === 'Acknowledged' && currentStatus === 'Checked') {
        // User bisa acknowledge setelah document di-check, regardless of who checked it
        // Bahkan jika dia sendiri yang melakukan check
        console.log(`✅ Permission granted: User can acknowledge checked document`);
        return true;
    }

    // Special case untuk CheckedBy: bisa approve meskipun Prepared belum fully completed
    if (userRole === 'Checked') {
        console.log(`✅ Permission granted: CheckedBy can approve prepared document`);
        return true;
    }

    // Untuk role lainnya: current step harus sudah diselesaikan
    const isCurrentStepCompleted = approval[currentStep.dateField];

    console.log(`🔍 Permission Check Detail:`, {
        userRole,
        currentStatus,
        requiredStatus,
        isAssigned,
        hasUserAlreadyActed,
        isCurrentStepCompleted,
        userId,
        assignedUserId: approval[nextStep.roleField],
        nextStepDateField: nextStep.dateField,
        nextStepDate: approval[nextStep.dateField]
    });

    const canApprove = isAssigned && !hasUserAlreadyActed && isCurrentStepCompleted;
    
    if (canApprove) {
        console.log(`✅ Permission granted: User can perform ${userRole}`);
    } else {
        console.log(`❌ Permission denied: User cannot perform ${userRole}`);
    }

    return canApprove;
}

// Mendapatkan step berikutnya berdasarkan current step
function getNextStep(currentStep) {
    if (!currentStep || !currentStep.nextStatus) return null;

    return APPROVAL_WORKFLOW.find(step => step.status === currentStep.nextStatus);
}

// Mengecek apakah user assigned ke step berikutnya
function isUserAssignedToStep(userId, approval, currentStep) {
    const nextStep = getNextStep(currentStep);
    if (!nextStep || !nextStep.roleField) return false;
    return approval[nextStep.roleField] === userId;
}

// Mengecek apakah step sebelumnya sudah diselesaikan
function isPreviousStepCompleted(approval, currentStep) {
    const currentIndex = APPROVAL_WORKFLOW.findIndex(step => step.status === currentStep.status);

    // Jika ini adalah step pertama (Prepared), selalu return true
    if (currentIndex <= 0) return true;

    // Cek apakah step sebelumnya sudah diselesaikan
    const previousStep = APPROVAL_WORKFLOW[currentIndex - 1];
    return approval[previousStep.dateField] !== null && approval[previousStep.dateField] !== undefined;
}

// Update UI berdasarkan permission check
function updateUIBasedOnPermissions(permissionResult, approval) {
    const { canApprove, currentStep, userRole, nextAction, isAssignedToCurrentStep } = permissionResult;

    // Update page title berdasarkan role dan status
    updatePageTitle(currentStep, userRole, isAssignedToCurrentStep);

    // Update button states
    updateButtonStates(canApprove, currentStep, nextAction);

    // Update status display
    updateStatusDisplay(currentStep, approval);

    // Update form readonly state
    updateFormState(canApprove);
}

// Update judul halaman berdasarkan role dan status
function updatePageTitle(currentStep, userRole, isAssignedToCurrentStep) {
    const titleElement = document.querySelector('h2');
    if (!titleElement) return;

    const currentUser = getCurrentUser();
    if (!currentUser || !outgoingPaymentReimData?.approval) {
        titleElement.textContent = 'Outgoing Payment Reimbursement';
        return;
    }

    const approval = outgoingPaymentReimData.approval;
    const currentUserId = currentUser.userId;
    const currentStatus = currentStep ? currentStep.status : 'Prepared';

    // Cek role user dalam approval workflow
    const userRoles = [];
    if (approval.preparedBy === currentUserId) userRoles.push('PreparedBy');
    if (approval.checkedBy === currentUserId) userRoles.push('CheckedBy');
    if (approval.acknowledgedBy === currentUserId) userRoles.push('AcknowledgedBy');
    if (approval.approvedBy === currentUserId) userRoles.push('ApprovedBy');
    if (approval.receivedBy === currentUserId) userRoles.push('ReceivedBy');

    let newTitle = 'Outgoing Payment Reimbursement';

    // UPDATED TITLE LOGIC berdasarkan status dokumen dan role user
    if (currentStatus === 'Received') {
        // Dokumen sudah complete - semua user view mode
        newTitle = 'Detail Outgoing Payment Reimbursement (Completed)';
    } else if (currentStatus === 'Rejected') {
        // Dokumen sudah rejected - semua user view mode
        newTitle = 'Detail Outgoing Payment Reimbursement (Rejected)';
    } else if (userRoles.includes('PreparedBy') && currentStatus === 'Prepared') {
        // PreparedBy melihat dokumen yang masih Prepared = Detail mode
        newTitle = 'Detail Outgoing Payment Reimbursement';
    } else if (userRoles.includes('CheckedBy') && currentStatus === 'Prepared' && !approval.checkedDate) {
        // CheckedBy melihat dokumen Prepared dan belum check = bisa Check
        newTitle = 'Check Outgoing Payment Reimbursement';
    } else if (userRoles.includes('AcknowledgedBy') && currentStatus === 'Checked' && !approval.acknowledgedDate) {
        // AcknowledgedBy melihat dokumen Checked dan belum acknowledge = bisa Acknowledge
        newTitle = 'Acknowledge Outgoing Payment Reimbursement';
    } else if (userRoles.includes('ApprovedBy') && currentStatus === 'Acknowledged' && !approval.approvedDate) {
        // ApprovedBy melihat dokumen Acknowledged dan belum approve = bisa Approve
        newTitle = 'Approve Outgoing Payment Reimbursement';
    } else if (userRoles.includes('ReceivedBy') && currentStatus === 'Approved' && !approval.receivedDate) {
        // ReceivedBy melihat dokumen Approved dan belum receive = bisa Receive
        newTitle = 'Receive Outgoing Payment Reimbursement';
    } else {
        // Untuk semua kondisi lainnya = View mode
        newTitle = `Detail Outgoing Payment Reimbursement (${currentStatus})`;
    }

    titleElement.textContent = newTitle;
    console.log('📝 Updated Page title:', newTitle, {
        userRoles,
        currentStatus,
        userId: currentUserId,
        completedActions: {
            checked: !!approval.checkedDate,
            acknowledged: !!approval.acknowledgedDate,
            approved: !!approval.approvedDate,
            received: !!approval.receivedDate
        }
    });
}

// Update status tombol berdasarkan permission
function updateButtonStates(canApprove, currentStep, nextAction) {
    const receiveButton = document.getElementById('receiveButton');
    const rejectButton = document.getElementById('rejectButton');
    const printButton = document.getElementById('printButton');

    if (!receiveButton || !rejectButton) return;

    const currentUser = getCurrentUser();
    if (!currentUser || !outgoingPaymentReimData?.approval) {
        hideAllButtons(receiveButton, rejectButton);
        hidePrintButton(printButton);
        return;
    }

    const approval = outgoingPaymentReimData.approval;
    const currentUserId = currentUser.userId;
    const currentStatus = currentStep ? currentStep.status : 'Prepared';

    // UPDATED BUTTON LOGIC berdasarkan status dokumen dan user role

    // 1. Jika dokumen sudah Received atau Rejected = semua action buttons hidden
    if (currentStatus === 'Received' || currentStatus === 'Rejected') {
        hideAllButtons(receiveButton, rejectButton);

        // Print button hanya untuk ReceivedBy jika dokumen completed
        if (currentStatus === 'Received' && approval.receivedBy === currentUserId) {
            showPrintButton(printButton);
            console.log('🖨️ Print button enabled - ReceivedBy viewing completed document');
        } else {
            hidePrintButton(printButton);
        }

        console.log('📝 Action buttons hidden - Document completed/rejected');
        return;
    }

    // 2. Cek apakah user adalah PreparedBy yang melihat dokumen Prepared
    const isPreparedByViewingPrepared = (approval.preparedBy === currentUserId && currentStatus === 'Prepared');
    if (isPreparedByViewingPrepared) {
        hideAllButtons(receiveButton, rejectButton);
        hidePrintButton(printButton);
        console.log('📝 Buttons hidden - PreparedBy viewing Prepared document');
        return;
    }

    // 3. Cek apakah user sudah melakukan action mereka
    const hasUserAlreadyActed = hasUserCompletedTheirAction(currentUserId, approval);
    if (hasUserAlreadyActed) {
        hideAllButtons(receiveButton, rejectButton);
        hidePrintButton(printButton);
        console.log('📝 Buttons hidden - User has already completed their action');
        return;
    }

    // 4. User bisa melakukan action
    if (canApprove && nextAction) {
        // User bisa approve - update button text dan enable
        receiveButton.textContent = nextAction;
        receiveButton.disabled = false;
        receiveButton.style.display = 'inline-block';
        receiveButton.className = receiveButton.className.replace('bg-gray-400', 'bg-green-600').replace('opacity-50', '').replace('cursor-not-allowed', '');

        rejectButton.disabled = false;
        rejectButton.style.display = 'inline-block';
        rejectButton.className = rejectButton.className.replace('bg-gray-400', 'bg-red-400').replace('opacity-50', '').replace('cursor-not-allowed', '');

        hidePrintButton(printButton); // Hide print saat masih bisa approve

        console.log(`✅ Action buttons enabled - Action: ${nextAction}`);
    } else {
        // User tidak bisa approve - disable buttons
        receiveButton.textContent = 'Not Authorized';
        receiveButton.disabled = true;
        receiveButton.style.display = 'inline-block';
        receiveButton.className = receiveButton.className.replace('bg-green-600', 'bg-gray-400') + ' opacity-50 cursor-not-allowed';

        rejectButton.disabled = true;
        rejectButton.style.display = 'inline-block';
        rejectButton.className = rejectButton.className.replace('bg-red-400', 'bg-gray-400') + ' opacity-50 cursor-not-allowed';

        hidePrintButton(printButton);

        console.log('❌ Action buttons disabled - No permission');
    }
}

// Helper: Cek apakah user sudah melakukan action mereka - FIXED VERSION
function hasUserCompletedTheirAction(userId, approval) {
    // 🔧 FIXED: Check each role individually, not collectively
    // User bisa punya multiple roles, tapi hanya yang sudah completed yang dihitung
    
    const userRoles = [];
    
    // Collect all roles for this user
    if (approval.checkedBy === userId) userRoles.push({ role: 'Checked', dateField: 'checkedDate', date: approval.checkedDate });
    if (approval.acknowledgedBy === userId) userRoles.push({ role: 'Acknowledged', dateField: 'acknowledgedDate', date: approval.acknowledgedDate });
    if (approval.approvedBy === userId) userRoles.push({ role: 'Approved', dateField: 'approvedDate', date: approval.approvedDate });
    if (approval.receivedBy === userId) userRoles.push({ role: 'Received', dateField: 'receivedDate', date: approval.receivedDate });
    
    console.log(`🔍 User roles analysis:`, {
        userId,
        userRoles,
        currentStatus: approval.approvalStatus
    });
    
    // 🔧 FIXED: Untuk user dengan multiple roles, check berdasarkan workflow sequence
    // Jika user sudah complete semua role yang seharusnya dia lakukan sampai status sekarang, return true
    
    const currentStatus = approval.approvalStatus;
    
    // Define workflow order
    const workflowOrder = ['Prepared', 'Checked', 'Acknowledged', 'Approved', 'Received'];
    const currentStatusIndex = workflowOrder.indexOf(currentStatus);
    
    // Check apakah user sudah complete semua role mereka sampai status sekarang
    let hasCompletedCurrentWorkflow = false;
    
    for (const userRole of userRoles) {
        const roleIndex = workflowOrder.indexOf(userRole.role);
        
        // Jika role ini sudah passed (index <= current status index) dan ada datenya
        if (roleIndex <= currentStatusIndex && userRole.date) {
            console.log(`✅ User completed ${userRole.role} on ${userRole.date}`);
            hasCompletedCurrentWorkflow = true;
        }
        // Jika role ini adalah next step dan belum ada datenya
        else if (roleIndex === currentStatusIndex + 1 && !userRole.date) {
            console.log(`⏳ User can perform next action: ${userRole.role}`);
            return false; // User belum complete next action mereka
        }
    }
    
    // 🔧 SPECIAL CASE: Jika user punya role untuk next step tapi belum melakukan
    // Misalnya: status "Checked", user punya acknowledgedBy role tapi acknowledgedDate null
    if (currentStatus === 'Checked' && approval.acknowledgedBy === userId && !approval.acknowledgedDate) {
        console.log(`⏳ User can acknowledge after checking`);
        return false;
    }
    
    if (currentStatus === 'Acknowledged' && approval.approvedBy === userId && !approval.approvedDate) {
        console.log(`⏳ User can approve after acknowledging`);
        return false;
    }
    
    if (currentStatus === 'Approved' && approval.receivedBy === userId && !approval.receivedDate) {
        console.log(`⏳ User can receive after approving`);
        return false;
    }
    
    console.log(`🔍 hasCompletedCurrentWorkflow: ${hasCompletedCurrentWorkflow}`);
    return hasCompletedCurrentWorkflow && userRoles.length > 0;
}

// Helper method untuk hide semua action buttons
function hideAllButtons(receiveButton, rejectButton) {
    if (receiveButton) {
        receiveButton.style.display = 'none';
    }
    if (rejectButton) {
        rejectButton.style.display = 'none';
    }
}

// Helper method untuk show print button
function showPrintButton(printButton) {
    if (printButton) {
        printButton.style.display = 'inline-block';
        printButton.disabled = false;
        printButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Helper method untuk hide print button
function hidePrintButton(printButton) {
    if (printButton) {
        printButton.style.display = 'none';
    }
}

// Update tampilan status
function updateStatusDisplay(currentStep, approval) {
    const statusSelect = document.getElementById('status');
    if (!statusSelect) return;

    if (currentStep) {
        statusSelect.value = currentStep.status;
        console.log(`📊 Status display updated: ${currentStep.status}`);
    }
}

// Update state form (readonly/editable)
function updateFormState(canApprove) {
    // Semua field tetap readonly kecuali yang spesifik diizinkan untuk edit
    // Untuk saat ini, semua field tetap readonly
    console.log(`📝 Form state: ${canApprove ? 'Can approve' : 'Read-only'}`);
}

function determineCurrentStatus(approval) {
    const step = determineCurrentApprovalStep(approval);
    return step ? step.status : 'Prepared';
}

function validateDocumentStatus() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showError('Authentication Error', 'User not authenticated. Please login again.')
            .then(() => window.location.href = getLoginPagePath());
        return false;
    }

    if (!outgoingPaymentReimData || !outgoingPaymentReimData.approval) {
        showError('Error', 'Document data is incomplete. Please refresh the page.');
        return false;
    }

    const approval = outgoingPaymentReimData.approval;
    const permissionResult = checkUserPermissionsNew(outgoingPaymentReimData);

    if (!permissionResult.canApprove) {
        showWarning('Not Authorized', 'You are not authorized to perform this action.');
        return false;
    }

    return true;
}

// ===== ATTACHMENT MANAGEMENT FUNCTIONS =====
async function handleAttachments(result, docId) {
    console.log('📎 Handling attachments for document:', docId);

    if (result.attachments?.length > 0) {
        displayExistingAttachments(result.attachments);
    } else {
        await loadAttachmentsFromAPI(docId);
    }
}

function displayExistingAttachments(attachments) {
    const container = document.getElementById('attachmentsList');
    if (!container) return;

    container.innerHTML = '';

    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        return;
    }

    const attachmentItems = attachments.map((attachment, index) => {
        const fileName = attachment.fileName || attachment.name || `Attachment ${index + 1}`;
        const fileIcon = getFileIcon(fileName);
        const fileSize = formatFileSize(attachment.fileSize || attachment.size);
        const uploadDate = formatDate(attachment.uploadDate || attachment.createdAt);

        return createAttachmentItem(attachment, fileName, fileIcon, fileSize, uploadDate);
    }).join('');

    container.innerHTML = `
        <h4 class="text-md font-medium text-gray-700 mb-2">Outgoing Payment Attachments</h4>
        ${attachmentItems}
    `;
}

function createAttachmentItem(attachment, fileName, fileIcon, fileSize, uploadDate) {
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
                <button onclick="viewEnhancedAttachment(${attachmentJson})" 
                        class="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50">
                    View
                </button>
            </div>
        </div>
    `;
}

async function loadAttachmentsFromAPI(docId) {
    try {
        const result = await fetchAttachments(docId);

        if (result.data?.length > 0) {
            displayExistingAttachments(result.data);
        } else {
            showNoAttachmentsMessage();
        }
    } catch (error) {
        console.error("Error loading attachments:", error);
        showAttachmentError();
    }
}

async function viewEnhancedAttachment(attachmentOrPath, fileName) {
    try {
        showLoading('Loading attachment, please wait...');

        const docId = documentId;
        if (!docId) {
            throw new Error('Document ID not found. Please ensure you are viewing an existing document.');
        }

        const attachment = normalizeAttachment(attachmentOrPath, fileName);

        if (attachment.filePath) {
            await openAttachmentFile(attachment.filePath);
            return;
        }

        await fetchAndOpenAttachment(docId, attachment);

    } catch (error) {
        console.error('Error viewing attachment:', error);
        showError('Error', `Failed to view attachment: ${error.message}`);
    }
}

function normalizeAttachment(attachmentOrPath, fileName) {
    if (typeof attachmentOrPath === 'string') {
        return { filePath: attachmentOrPath, fileName: fileName };
    }
    return attachmentOrPath;
}

async function openAttachmentFile(filePath) {
    Swal.close();

    const fileUrl = constructFileUrl(filePath);
    if (!fileUrl) {
        throw new Error('Failed to construct file URL');
    }

    window.open(fileUrl, '_blank');
    showSuccess('Success', 'Attachment opened in new tab');
}

function constructFileUrl(filePath) {
    if (!filePath) {
        console.error('No file path provided');
        return null;
    }

    try {
        const decodedPath = decodeURIComponent(filePath);
        const cleanPath = decodedPath.replace(/^\/+/, '');
        const fileUrl = `${API_CONFIG.BASE_URL}/${cleanPath}`;

        console.log('File URL construction:', {
            originalPath: filePath,
            decodedPath,
            cleanPath,
            baseUrl: API_CONFIG.BASE_URL,
            finalURL: fileUrl
        });

        return fileUrl;
    } catch (error) {
        console.error('Error constructing file URL:', error);
        return null;
    }
}

async function fetchAndOpenAttachment(docId, attachment) {
    const result = await fetchAttachments(docId);
    const targetAttachment = findTargetAttachment(result.data, attachment);

    if (!targetAttachment?.filePath) {
        throw new Error('Attachment not found or file path not available');
    }

    await openAttachmentFile(targetAttachment.filePath);
}

function findTargetAttachment(attachments, target) {
    if (!attachments?.length) return null;

    return attachments.find(att =>
        att.id === target.id ||
        att.fileName === target.fileName ||
        att.filePath === target.filePath
    );
}

function getFileIcon(fileName) {
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

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString) {
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

function showNoAttachmentsMessage() {
    const container = document.getElementById('attachmentsList');
    if (container) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
    }
}

function showAttachmentError() {
    const container = document.getElementById('attachmentsList');
    if (container) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Error loading attachments</p>';
    }
}

async function loadReimbursementAttachments(reimbursementId) {
    try {
        const result = await fetchReimbursementData(reimbursementId);

        if (result.data?.reimbursementAttachments?.length > 0) {
            appendReimbursementAttachmentsSection(result.data.reimbursementAttachments);
        }
    } catch (error) {
        console.error("Error loading reimbursement attachments:", error);
    }
}

function appendReimbursementAttachmentsSection(attachments) {
    const container = document.getElementById('attachmentsList');
    if (!container) return;

    const existingHeader = container.querySelector('.reimbursement-header');
    if (!existingHeader) {
        const reimbursementHeader = document.createElement('div');
        reimbursementHeader.className = 'mt-4 mb-2 reimbursement-header';
        reimbursementHeader.innerHTML = '<h4 class="text-md font-medium text-blue-800">Reimbursement Attachments</h4>';
        container.appendChild(reimbursementHeader);
    }

    displayReimbursementAttachments(attachments);
}

function displayReimbursementAttachments(attachments) {
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
        const attachmentItem = createReimbursementAttachmentItem(attachment);
        attachmentList.appendChild(attachmentItem);
    });
}

function createReimbursementAttachmentItem(attachment) {
    const attachmentItem = document.createElement('div');
    attachmentItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200';

    const fileInfo = createReimbursementFileInfo(attachment);
    const actions = createReimbursementActions(attachment);

    attachmentItem.appendChild(fileInfo);
    attachmentItem.appendChild(actions);

    return attachmentItem;
}

function createReimbursementFileInfo(attachment) {
    const fileInfo = document.createElement('div');
    fileInfo.className = 'flex items-center space-x-2';

    const fileIcon = getFileIcon(attachment.fileName || attachment.name);
    const fileName = attachment.fileName || attachment.name || 'Unknown File';
    const fileSize = formatFileSize(attachment.fileSize || attachment.size);
    const fileType = attachment.fileType || attachment.contentType || 'Unknown Type';
    const uploadDate = formatDate(attachment.uploadDate || attachment.createdAt);

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

function createReimbursementActions(attachment) {
    const actions = document.createElement('div');
    actions.className = 'flex space-x-2';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
    viewBtn.innerHTML = 'View';
    viewBtn.onclick = () => viewReimbursementAttachment(attachment);

    actions.appendChild(viewBtn);
    return actions;
}

async function viewReimbursementAttachment(attachment) {
    try {
        showLoading('Loading attachment, please wait...');

        if (attachment.filePath) {
            Swal.close();

            const decodedPath = decodeURIComponent(attachment.filePath);
            const fileUrl = `${API_CONFIG.BASE_URL}${decodedPath.startsWith('/') ? decodedPath : '/' + decodedPath}`;

            window.open(fileUrl, '_blank');
            return;
        }

        throw new Error('No file path available for this attachment');

    } catch (error) {
        console.error('Error viewing reimbursement attachment:', error);
        Swal.close();
        showError('Error', `Failed to view attachment: ${error.message}`);
    }
}

// ===== PRINT MANAGEMENT FUNCTIONS =====
function displayPrintOutReimbursement(opReimData) {
    const container = document.getElementById('printOutReimbursementList');
    if (!container) return;

    container.innerHTML = '';

    let opReimId = getOPReimId(opReimData);

    if (!opReimId) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Outgoing Payment Reimbursement ID not found</p>';
        return;
    }

    const printUrl = buildPrintReimbursementUrl(opReimId, opReimData);
    const documentItem = createPrintDocumentItem(opReimId, printUrl);

    container.appendChild(documentItem);
}

function displayPrintVoucher(opReimData) {
    const container = document.getElementById('printVoucherList');
    if (!container) return;

    container.innerHTML = '';

    let opReimId = getOPReimId(opReimData);

    if (!opReimId) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Outgoing Payment Voucher ID not found</p>';
        return;
    }

    const printVoucherUrl = buildPrintVoucherUrl(opReimId, opReimData);
    const voucherItem = createPrintVoucherItem(opReimId, printVoucherUrl);

    container.appendChild(voucherItem);
}

function buildPrintVoucherUrl(opReimId, opReimData) {
    const baseUrl = window.location.origin;
    const printVoucherUrl = `${baseUrl}/approvalPages/approval/receive/outgoingPayment/printOPReim.html?docId=${opReimId}`;

    if (!opReimData) return printVoucherUrl;

    const params = new URLSearchParams();

    // Add voucher-specific parameters
    if (opReimData.counterRef) params.append('reimId', opReimData.counterRef);
    if (opReimData.expressivNo) params.append('reimId', opReimData.expressivNo);
    if (opReimData.cardName) params.append('payTo', opReimData.cardName);
    if (opReimData.requesterName) params.append('payTo', opReimData.requesterName);
    if (opReimData.counterRef) params.append('voucherNo', opReimData.counterRef);
    if (opReimData.docDate) params.append('submissionDate', opReimData.docDate);
    if (opReimData.trsfrDate) params.append('submissionDate', opReimData.trsfrDate);
    if (opReimData.docCurr) params.append('currency', opReimData.docCurr);
    if (opReimData.trsfrSum) params.append('totalAmount', opReimData.trsfrSum);
    if (opReimData.jrnlMemo) params.append('remarks', opReimData.jrnlMemo);
    if (opReimData.remarks) params.append('remarks', opReimData.remarks);

    // Add approval information for voucher
    if (opReimData.approval) {
        const approval = opReimData.approval;
        if (approval.preparedBy) {
            const preparedByName = getUserNameById(approval.preparedBy);
            params.append('preparedBy', preparedByName);
        }
        if (approval.checkedBy) {
            const checkedByName = getUserNameById(approval.checkedBy);
            params.append('checkedBy', checkedByName);
        }
        if (approval.acknowledgedBy) {
            const acknowledgedByName = getUserNameById(approval.acknowledgedBy);
            params.append('acknowledgedBy', acknowledgedByName);
        }
        if (approval.approvedBy) {
            const approvedByName = getUserNameById(approval.approvedBy);
            params.append('approvedBy', approvedByName);
        }
        if (approval.receivedBy) {
            const receivedByName = getUserNameById(approval.receivedBy);
            params.append('receivedBy', receivedByName);
        }
    }

    // Add line details for voucher
    if (opReimData.lines && opReimData.lines.length > 0) {
        const details = opReimData.lines.map(line => ({
            category: 'OUTGOING PAYMENT',
            accountName: line.acctName || '',
            glAccount: line.acctCode || '',
            description: line.descrip || '',
            amount: line.sumApplied || 0,
            division: line.divisionCode || line.division || '',
            currency: line.CurrencyItem || line.currencyItem || 'IDR'
        }));
        params.append('details', JSON.stringify(details));
    }

    return params.toString() ? `${printVoucherUrl}&${params.toString()}` : printVoucherUrl;
}

function createPrintVoucherItem(opReimId, printUrl) {
    const voucherItem = document.createElement('div');
    voucherItem.className = 'flex items-center justify-between p-2 bg-green-50 rounded border border-green-200';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'flex items-center space-x-2';
    fileInfo.innerHTML = `
        <span class="text-lg">🧾</span>
        <div>
            <div class="font-medium text-sm text-green-800">Print Voucher Document</div>
            <div class="text-xs text-gray-500">Voucher • PDF</div>
            <div class="text-xs text-green-600">Voucher ID: ${opReimId}</div>
        </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'flex space-x-2';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded border border-green-300 hover:bg-green-50';
    viewBtn.innerHTML = 'View';
    viewBtn.onclick = () => viewPrintVoucher(printUrl);

    const openBtn = document.createElement('button');
    openBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
    openBtn.innerHTML = 'Open';
    openBtn.onclick = () => openPrintVoucher(printUrl);

    actions.appendChild(viewBtn);
    actions.appendChild(openBtn);

    voucherItem.appendChild(fileInfo);
    voucherItem.appendChild(actions);

    return voucherItem;
}

async function viewPrintVoucher(url) {
    try {
        showLoading('Loading Print Voucher document...');

        const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

        if (newWindow) {
            Swal.close();
            showSuccess('Success', 'Print Voucher document opened in new window');
        } else {
            throw new Error('Failed to open voucher window');
        }

    } catch (error) {
        console.error('Error viewing Print Voucher document:', error);
        showError('Error', `Failed to open Print Voucher document: ${error.message}`);
    }
}

function openPrintVoucher(url) {
    try {
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error opening Print Voucher document:', error);
        showError('Error', `Failed to open Print Voucher document: ${error.message}`);
    }
}

function getOPReimId(opReimData) {
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

function buildPrintReimbursementUrl(opReimId, opReimData) {
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));

    // Use expressivNo for GetPrintReim.html parameter
    const expressivNo = opReimData?.expressivNo || opReimId;
    const printReimUrl = `${baseUrl}${currentDir}/GetPrintReim.html?reim-id=${expressivNo}&_t=${Date.now()}`;

    console.log('🔧 Print Reimbursement URL points to GetPrintReim.html with expressivNo:', expressivNo);
    console.log('🔗 Print Reimbursement URL constructed:', printReimUrl);

    if (!opReimData) return printReimUrl;

    // MINIMAL URL: Only send reim-id parameter, let GetPrintReim.html handle all data internally
    const params = new URLSearchParams();
    params.append('reim-id', expressivNo);

    return params.toString() ? `${printReimUrl}&${params.toString()}` : printReimUrl;
}

function createPrintDocumentItem(opReimId, printUrl) {
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
    viewBtn.onclick = () => viewPrintReimbursement(printUrl);

    const openBtn = document.createElement('button');
    openBtn.className = 'text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded border border-green-300 hover:bg-green-50';
    openBtn.innerHTML = 'Open';
    openBtn.onclick = () => openPrintReimbursement(printUrl);

    actions.appendChild(viewBtn);
    actions.appendChild(openBtn);

    documentItem.appendChild(fileInfo);
    documentItem.appendChild(actions);

    return documentItem;
}

async function viewPrintReimbursement(url) {
    try {
        showLoading('Loading Print Reimbursement document...');

        const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

        if (newWindow) {
            Swal.close();
            showSuccess('Success', 'Print Reimbursement document opened in new window');
        } else {
            throw new Error('Failed to open document window');
        }

    } catch (error) {
        console.error('Error viewing Print Reimbursement document:', error);
        showError('Error', `Failed to open Print Reimbursement document: ${error.message}`);
    }
}

function openPrintReimbursement(url) {
    try {
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error opening Print Reimbursement document:', error);
        showError('Error', `Failed to open Print Reimbursement document: ${error.message}`);
    }
}

// ===== DATA MANAGEMENT FUNCTIONS =====
async function initializeDataManager() {
    try {
        console.log('🚀 Initializing Receive Outgoing Payment Reimbursement page...');

        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (!id) {
            showError('Error', 'No document ID provided')
                .then(() => goToMenu());
            return;
        }

        // Set global variables
        documentId = id;
        setDocumentId(id);
        console.log('📋 Document ID:', id);

        await loadOPReimDetails(id);

    } catch (error) {
        console.error('❌ Initialization error:', error);
        showError('Error', 'Failed to initialize the system');
    }
}

async function loadOPReimDetails(id) {
    try {
        showLoading('Fetching document details');

        const data = await fetchOPReimDetails(id);
        console.log('📋 Outgoing Payment API Response:', data);
        
        // 🔍 DEBUG: Check data structure
        console.log('🔍 Data type:', Array.isArray(data) ? 'Array' : typeof data);
        console.log('🔍 Data keys:', Object.keys(data || {}));
        console.log('🔍 Has approval property:', !!(data && data.approval));
        console.log('🔍 Approval status:', data?.approval?.approvalStatus);
        
        // Validate data structure
        if (!data || !data.approval) {
            throw new Error('Invalid data structure: Missing approval information');
        }

        // Set global variables
        outgoingPaymentReimData = data;
        setOPReimData(data);

        await loadUsersData();
        populateFormFields(data);
        checkUserPermissions(data);
        handleAttachments(data, id);
        displayPrintOutReimbursement(data);
        displayPrintVoucher(data);
        await handleReimbursementData(data);

        Swal.close();

    } catch (error) {
        console.error('❌ Error loading document:', error);
        showError('Error', `Failed to load document: ${error.message}`)
            .then(() => goToMenu());
    }
}

async function loadUsersData() {
    try {
        const usersData = await fetchUsers();
        setUsers(usersData.data || []);
    } catch (error) {
        console.error('❌ Error loading users:', error);
        setUsers([]);
    }
}

async function handleReimbursementData(result) {
    if (!result.expressivNo) return;

    try {
        const reimResult = await fetchReimbursementData(result.expressivNo);

        if (reimResult?.data) {
            if (reimResult.data.voucherNo) {
                setElementValue('CounterRef', reimResult.data.voucherNo);
            }

            if (reimResult.data.receivedDate) {
                const formattedDate = new Date(reimResult.data.receivedDate).toISOString().split('T')[0];
                setElementValue('DocDate', formattedDate);
            }
        }

        await loadReimbursementAttachments(result.expressivNo);
    } catch (err) {
        console.warn('Could not fetch reimbursement data:', err);
    }
}

function goToMenu() {
    window.location.href = '../../../dashboard/dashboardReceive/OPReim/menuOPReimReceive.html';
}

// ===== ACTION MANAGEMENT FUNCTIONS =====

// Universal approval action - dapat menangani Checked, Acknowledged, Approved, atau Received
async function performApprovalAction() {
    try {
        if (!validateDocumentStatus()) {
            return;
        }

        // Get current permission state to determine action
        const permissionResult = checkUserPermissionsNew(outgoingPaymentReimData);

        if (!permissionResult.canApprove || !permissionResult.nextAction) {
            showWarning('Not Authorized', 'You are not authorized to perform this action.');
            return;
        }

        const actionType = permissionResult.nextAction;
        showLoading('Processing...', `Submitting ${actionType.toLowerCase()} confirmation`);

        const userId = getCurrentUserId();
        if (!userId) {
            throw new Error('User ID not found. Please log in again.');
        }

        const currentUser = getCurrentUser();
        const currentUserName = currentUser ? currentUser.username : 'Unknown User';
        const currentDate = new Date().toISOString();

        const requestData = buildApprovalRequestData(userId, currentUserName, currentDate, actionType);

        // Use PUT method for all approval actions (consistent with API design)
        const response = await approveDocument(documentId, requestData);

        console.log(`✅ Document ${actionType.toLowerCase()} successfully:`, response);

        showSuccess('Success', `Document has been ${actionType.toLowerCase()} successfully`)
            .then(() => {
                // Go back to previous page if possible, else fallback to menu
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '/pages/menuOPReim.html';
                }
            });

    } catch (error) {
        console.error(`❌ Error performing ${permissionResult?.nextAction || 'approval'} action:`, error);

        // Enhanced error message with more details
        let errorMessage = error.message;
        if (error.message.includes('400')) {
            errorMessage = 'Invalid request data. Please check the document status and try again.';
        } else if (error.message.includes('401')) {
            errorMessage = 'Authentication failed. Please login again.';
        } else if (error.message.includes('403')) {
            errorMessage = 'You do not have permission to perform this action.';
        } else if (error.message.includes('404')) {
            errorMessage = 'Document not found. Please refresh the page and try again.';
        } else if (error.message.includes('422')) {
            errorMessage = 'Validation error. Please check the document data and try again.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later or contact support.';
        }

        showError('Error', `Failed to ${permissionResult?.nextAction?.toLowerCase() || 'process'} document: ${errorMessage}`);
    }
}

// Build approval request data based on action type
function buildApprovalRequestData(userId, currentUserName, currentDate, actionType) {
    const approval = outgoingPaymentReimData.approval || {};

    // Base request data structure
    const requestData = {
        stagingID: documentId,
        createdAt: approval.createdAt || currentDate,
        updatedAt: currentDate,
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
        rejectedDate: approval.rejectedDate || null,
        rejectionRemarks: approval.rejectionRemarks || "",
        revisionNumber: approval.revisionNumber || null,
        revisionDate: approval.revisionDate || null,
        revisionRemarks: approval.revisionRemarks || null,
        header: {}
    };

    // Update fields based on action type
    switch (actionType) {
        case 'Checked':
            requestData.approvalStatus = 'Checked';
            requestData.checkedDate = currentDate;
            requestData.checkedByName = currentUserName;
            break;

        case 'Acknowledged':
            requestData.approvalStatus = 'Acknowledged';
            requestData.acknowledgedDate = currentDate;
            requestData.acknowledgedByName = currentUserName;
            break;

        case 'Approved':
            requestData.approvalStatus = 'Approved';
            requestData.approvedDate = currentDate;
            requestData.approvedByName = currentUserName;
            break;

        case 'Received':
            requestData.approvalStatus = 'Received';
            requestData.receivedDate = currentDate;
            requestData.receivedByName = currentUserName;
            break;

        default:
            throw new Error(`Unsupported action type: ${actionType}`);
    }

    return requestData;
}

async function rejectOPReim() {
    try {
        if (!validateDocumentStatus()) {
            return;
        }

        const rejectionReason = await showRejectionDialog();
        if (!rejectionReason) return;

        showLoading('Processing...', 'Rejecting document, please wait...');

        const userId = getCurrentUserId();
        if (!userId) {
            throw new Error('Unable to get user ID. Please login again.');
        }

        const requestData = buildRejectionRequestData(userId, rejectionReason);

        const response = await rejectDocument(documentId, requestData);

        console.log('✅ Document rejected successfully:', response);

        await showSuccess('Success', 'Document has been rejected');
        goToMenu();

    } catch (error) {
        console.error('❌ Error rejecting document:', error);
        await showError('Error', `Failed to reject document: ${error.message}`);
    }
}

async function showRejectionDialog() {
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

    return rejectionReason;
}

function buildRejectionRequestData(userId, rejectionReason) {
    const approval = outgoingPaymentReimData.approval || {};
    const currentDate = new Date().toISOString();

    return {
        stagingID: documentId,
        createdAt: outgoingPaymentReimData.createdAt || currentDate,
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

function initializeWithRejectionPrefix(textarea) {
    const userInfo = getUserInfo();
    const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
    textarea.value = prefix;
    textarea.dataset.prefixLength = prefix.length;
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();
}

function handleRejectionInput(event) {
    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');

    if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
        const userInfo = getUserInfo();
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

// ===== GLOBAL FUNCTIONS (Required by HTML) =====

// Navigate back to the menu
function goToMenuReceiveOPReim() {
    // Go back to previous page if possible, else fallback to menu
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/pages/menuOPReim.html';
    }
}

// Initialize page on load
async function initializePage() {
    try {
        console.log('🚀 Initializing Receive Outgoing Payment Reimbursement page...');

        const urlParams = new URLSearchParams(window.location.search);
        documentId = urlParams.get('id');

        if (!documentId) {
            showError('Error', 'No document ID provided')
                .then(() => goToMenuReceiveOPReim());
            return;
        }

        console.log('📋 Document ID:', documentId);
        await loadOPReimDetails(documentId);

    } catch (error) {
        console.error('❌ Initialization error:', error);
        showError('Error', 'Failed to initialize the system');
    }
}

// Receive/Approve the outgoing payment reimbursement
async function receiveOPReim() {
    await performApprovalAction();
}

// Legacy function alias for backward compatibility
async function approveOPReim() {
    await performApprovalAction();
}

// Validate document status for receive
function validateDocumentStatusForReceive() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        Swal.fire({
            title: 'Authentication Error',
            text: 'User not authenticated. Please login again.',
            icon: 'error'
        }).then(() => window.location.href = getLoginPagePath());
        return false;
    }

    if (!outgoingPaymentReimData || !outgoingPaymentReimData.approval) {
        Swal.fire({
            title: 'Error',
            text: 'Document data is incomplete. Please refresh the page.',
            icon: 'error'
        });
        return false;
    }

    const approval = outgoingPaymentReimData.approval;

    // Check if already received
    if (approval.receivedDate) {
        Swal.fire({
            title: 'Already Received',
            text: 'This document has already been received.',
            icon: 'info'
        });
        return false;
    }

    // Check if user is assigned receiver
    if (approval.receivedBy !== currentUser.userId) {
        const receiverName = getUserNameById(approval.receivedBy);
        Swal.fire({
            title: 'Not Authorized',
            text: `Only ${receiverName} can receive this document.`,
            icon: 'warning'
        });
        return false;
    }

    // Check if document is approved
    if (!approval.approvedDate) {
        Swal.fire({
            title: 'Not Ready',
            text: 'This document must be approved before it can be received.',
            icon: 'warning'
        });
        return false;
    }

    return true;
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

// Legacy function for backward compatibility
function viewAttachment(attachmentId) {
    console.warn('Legacy viewAttachment function called. Consider updating to use viewEnhancedAttachment');
    // Implementation would need the attachment object, which isn't available with just ID
}

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

// Function to display Print Out Reimbursement document
function displayPrintOutReimbursement(reimbursementData) {
    console.log('🔍 DEBUG: displayPrintOutReimbursement called with:', reimbursementData);
    console.log('📍 Current location:', window.location);

    const container = document.getElementById('printOutReimbursementList');
    if (!container) {
        console.warn('Print Out Reimbursement container not found: printOutReimbursementList');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Get OP Reim ID from various possible sources (for display purposes)
    let opReimId = null;

    // Try to get from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    opReimId = urlParams.get('id');
    console.log('🆔 OP Reim ID from URL:', opReimId);

    // If not in URL, try to get from form data
    if (!opReimId) {
        const documentNumberField = document.getElementById('DocNum');
        if (documentNumberField && documentNumberField.value) {
            opReimId = documentNumberField.value;
        }
    }

    // If still not found, try to get from reimbursement data
    if (!opReimId && reimbursementData) {
        opReimId = reimbursementData.stagingID ||
                  reimbursementData.id ||
                  reimbursementData.expressivNo ||
                  reimbursementData.counterRef;
    }

    if (!opReimId) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Outgoing Payment Reimbursement ID not found</p>';
        return;
    }

    // Build the Print Receive Reimbursement URL - CORRECT VERSION using expressivNo
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));

    // Use expressivNo for GetPrintReim.html parameter (the correct identifier)
    const expressivNo = reimbursementData?.expressivNo || opReimId;
    const printReimUrl = `${baseUrl}${currentDir}/GetPrintReim.html?reim-id=${expressivNo}&_t=${Date.now()}`;

    console.log('🔗 Print Reimbursement URL constructed:', printReimUrl);
    console.log('📂 Current directory:', currentDir);
    console.log('🏠 Base URL:', baseUrl);
    console.log('🆔 Using expressivNo:', expressivNo);
    console.log('🆔 Display opReimId:', opReimId);

    // Use the simple URL without additional parameters
    // Let GetPrintReim.html handle fetching data internally using the expressivNo
    const fullUrl = printReimUrl;

    // Create the document item
    const documentItem = document.createElement('div');
    documentItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'flex items-center space-x-2';

    // Use a document icon for the print reimbursement
    fileInfo.innerHTML = `
        <span class="text-lg">📄</span>
        <div>
            <div class="font-medium text-sm text-blue-800">Print Reimbursement Document</div>
            <div class="text-xs text-gray-500">Document • PDF</div>
            <div class="text-xs text-blue-600">Reim ID: ${expressivNo}</div>
        </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'flex space-x-2';

    // View button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
    viewBtn.innerHTML = 'View';
    viewBtn.onclick = () => viewPrintReimbursement(fullUrl);

    // Open in new tab button
    const openBtn = document.createElement('button');
    openBtn.className = 'text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded border border-green-300 hover:bg-green-50';
    openBtn.innerHTML = 'Open';
    openBtn.onclick = () => openPrintReimbursement(fullUrl);

    actions.appendChild(viewBtn);
    actions.appendChild(openBtn);

    documentItem.appendChild(fileInfo);
    documentItem.appendChild(actions);
    container.appendChild(documentItem);
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    // Back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', goToMenuReceiveOPReim);
    }

    // Reject button
    const rejectButton = document.getElementById('rejectButton');
    if (rejectButton) {
        rejectButton.addEventListener('click', rejectOPReim);
    }

    // Receive button - now supports all approval actions
    const receiveButton = document.getElementById('receiveButton');
    if (receiveButton) {
        receiveButton.addEventListener('click', receiveOPReim);
    }

    // Print button
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', printOPReim);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Receive Outgoing Payment Reimbursement System...');

    // Setup event listeners
    setupEventListeners();

    // Initialize data manager
    initializeDataManager();

    console.log('✅ Receive Outgoing Payment Reimbursement System initialized successfully');
});

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);