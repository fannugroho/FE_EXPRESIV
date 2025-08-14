// File: receiveOPReim.js

/*
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                    🔧 CENTRALIZED API MANAGEMENT SYSTEM                          │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                 │
 │ 📍 LOKASI API CONFIGURATION:                                                   │
 │   • API_CONFIG (Line ~20) - Semua endpoint dan konfigurasi API                 │
 │   • CentralizedAPIClient (Line ~95) - Wrapper untuk makeAuthenticatedRequest   │
 │   • OPReimAPIService (Line ~155) - Service methods untuk business logic        │
 │   • APIHelpers (Line ~235) - Utility functions untuk API operations            │
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
 │   2. Tambahkan method di OPReimAPIService                                      │
 │   3. Gunakan CentralizedAPIClient untuk request                                │
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
// Semua konfigurasi API dipusatkan di sini untuk memudahkan maintenance
const API_CONFIG = {
    // Base Configuration
    BASE_URL: window.location.origin,

    // API Endpoints - DAFTAR LENGKAP API YANG DIGUNAKAN
    ENDPOINTS: {
        // 📋 Outgoing Payment Reimbursement APIs
        OP_REIM: {
            HEADERS: '/api/staging-outgoing-payments/headers',      // GET /{id} - Ambil detail dokumen
            ATTACHMENTS: '/api/staging-outgoing-payments/attachments', // GET /{id} - Ambil attachments
            APPROVALS: '/api/staging-outgoing-payments/approvals'    // PUT /{id} - Receive/Reject dokumen
        },

        // 👥 Users & Authentication APIs
        USERS: '/api/users',                                       // GET - Ambil daftar users

        // 💰 Reimbursements APIs
        REIMBURSEMENTS: '/api/reimbursements',                     // GET /{expressivNo} - Ambil data reimbursement

        // 📁 Files APIs
        FILES: '/api/files'                                        // GET /{filePath} - Download files
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
        DEFAULT: 30000,   // 30 seconds - untuk request biasa
        UPLOAD: 120000,   // 2 minutes - untuk upload file
        DOWNLOAD: 60000   // 1 minute - untuk download file
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
    },

    // Helper Methods
    buildUrl(endpoint, id = null, params = null) {
        let url = `${this.BASE_URL}${endpoint}`;

        if (id) {
            url += `/${id}`;
        }

        if (params) {
            const urlParams = new URLSearchParams(params);
            url += `?${urlParams.toString()}`;
        }

        return url;
    },

    getErrorMessage(status) {
        switch (status) {
            case 401:
                return this.ERROR_MESSAGES.UNAUTHORIZED;
            case 403:
                return this.ERROR_MESSAGES.FORBIDDEN;
            case 404:
                return this.ERROR_MESSAGES.NOT_FOUND;
            case 422:
                return this.ERROR_MESSAGES.VALIDATION_ERROR;
            case 500:
            case 502:
            case 503:
                return this.ERROR_MESSAGES.SERVER_ERROR;
            default:
                return this.ERROR_MESSAGES.NETWORK_ERROR;
        }
    }
};

// ===== DAFTAR API YANG DIGUNAKAN DALAM APLIKASI INI =====
/*
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           📋 API ENDPOINTS REFERENCE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ 🔸 OUTGOING PAYMENT REIMBURSEMENT APIs:                                        │
│   • GET  /api/staging-outgoing-payments/headers/{id}                           │
│     └─ Mengambil detail dokumen outgoing payment reimbursement                 │
│     └─ Usage: await OPReimAPIService.fetchOPReimDetails(docId)                 │
│                                                                                 │
│   • GET  /api/staging-outgoing-payments/attachments/{id}                       │
│     └─ Mengambil daftar attachments dokumen                                    │
│     └─ Usage: await OPReimAPIService.fetchAttachments(docId)                   │
│                                                                                 │
│   • PUT  /api/staging-outgoing-payments/approvals/{id}                         │
│     └─ Receive atau Reject dokumen (dengan status approval)                    │
│     └─ Usage: await OPReimAPIService.receiveDocument(docId, requestData)       │
│     └─ Usage: await OPReimAPIService.rejectDocument(docId, requestData)        │
│                                                                                 │
│ 🔸 USER MANAGEMENT APIs:                                                       │
│   • GET  /api/users                                                            │
│     └─ Mengambil daftar semua users untuk dropdown approval                    │
│     └─ Usage: await OPReimAPIService.fetchUsers()                              │
│                                                                                 │
│ 🔸 REIMBURSEMENT APIs:                                                         │
│   • GET  /api/reimbursements/{expressivNo}                                     │
│     └─ Mengambil data reimbursement terkait berdasarkan expressivNo            │
│     └─ Usage: await OPReimAPIService.fetchReimbursementData(expressivNo)       │
│                                                                                 │
│ 🔸 FILE MANAGEMENT APIs:                                                       │
│   • GET  /api/files/{filePath}                                                 │
│     └─ Download/view file attachments                                          │
│     └─ Usage: await OPReimAPIService.fetchFileContent(filePath)                │
│                                                                                 │
│ � CONTOH USAGE PATTERN:                                                       │
│                                                                                 │
│   // ✅ CARA YANG BENAR - Menggunakan OPReimAPIService                         │
│   try {                                                                        │
│     const data = await OPReimAPIService.fetchOPReimDetails(docId);             │
│     console.log('Data received:', data);                                       │
│   } catch (error) {                                                            │
│     console.error('Error:', APIHelpers.handleAPIError(error, 'fetchDetails')); │
│   }                                                                            │
│                                                                                 │
│   // ❌ CARA YANG SALAH - Jangan langsung gunakan makeAuthenticatedRequest     │
│   // makeAuthenticatedRequest('/api/staging-outgoing-payments/headers/123')    │
│                                                                                 │
│ �📝 Notes:                                                                      │
│   - Semua request menggunakan authentication token otomatis                    │
│   - Error handling dilakukan secara terpusat di CentralizedAPIClient          │
│   - Timeout dikonfigurasi berdasarkan jenis operasi di API_CONFIG             │
│   - Logging otomatis untuk debugging dan monitoring                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
*/

// ===== CENTRALIZED API CLIENT =====
// Wrapper untuk makeAuthenticatedRequest dengan error handling yang konsisten
class CentralizedAPIClient {
    static async request(endpoint, options = {}) {
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
                // Don't set Content-Type for FormData, let browser set it
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
                const errorMessage = API_CONFIG.getErrorMessage(response.status);
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
    static async get(endpoint, params = null, options = {}) {
        const url = params ? API_CONFIG.buildUrl(endpoint, null, params) : endpoint;
        return this.request(url, {
            method: API_CONFIG.METHODS.GET,
            ...options
        });
    }

    // POST request
    static async post(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: API_CONFIG.METHODS.POST,
            body: data,
            ...options
        });
    }

    // PUT request
    static async put(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: API_CONFIG.METHODS.PUT,
            body: data,
            ...options
        });
    }

    // PATCH request
    static async patch(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: API_CONFIG.METHODS.PATCH,
            body: data,
            headers: {
                'Content-Type': API_CONFIG.CONTENT_TYPES.JSON_PATCH
            },
            ...options
        });
    }

    // DELETE request
    static async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: API_CONFIG.METHODS.DELETE,
            ...options
        });
    }
}

// ===== API UTILITIES & HELPERS =====
/**
 * 🛠️ Helper functions untuk memudahkan penggunaan API
 */
class APIHelpers {
    /**
     * Quick access untuk API endpoints yang sering digunakan
     */
    static get ENDPOINTS() {
        return {
            getOPReimDetails: (id) => `${API_CONFIG.ENDPOINTS.OP_REIM.HEADERS}/${id}`,
            getAttachments: (id) => `${API_CONFIG.ENDPOINTS.OP_REIM.ATTACHMENTS}/${id}`,
            approveDocument: (id) => `${API_CONFIG.ENDPOINTS.OP_REIM.APPROVALS}/${id}`,
            getUsers: () => API_CONFIG.ENDPOINTS.USERS,
            getReimbursement: (expressivNo) => `${API_CONFIG.ENDPOINTS.REIMBURSEMENTS}/${expressivNo}`,
            downloadFile: (filePath) => `${API_CONFIG.ENDPOINTS.FILES}/${filePath}`
        };
    }

    /**
     * Validate API response structure
     */
    static validateResponse(response, expectedFields = []) {
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

    /**
     * Handle API errors dengan user-friendly messages
     */
    static handleAPIError(error, context = '') {
        console.error(`API Error in ${context}:`, error);

        let userMessage = error.message;

        // Extract meaningful error messages from common API responses
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

    /**
     * Format API request untuk logging
     */
    static formatRequestLog(method, endpoint, data = null) {
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
}

// ===== GLOBAL VARIABLES =====
let documentId = null;
let outgoingPaymentReimData = null;
let uploadedFiles = [];
let existingAttachments = [];
let attachmentsToKeep = [];

// ===== 1. GLOBAL STATE MANAGEMENT =====
class OPReimReceiveState {
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

const receiveState = new OPReimReceiveState();

// ===== 2. API SERVICE - MENGGUNAKAN CENTRALIZED API CLIENT =====
/**
 * 🔧 OPReimAPIService - Service untuk semua API calls terkait Outgoing Payment Reimbursement
 * 
 * Class ini menggunakan CentralizedAPIClient untuk:
 * - Konsistensi error handling
 * - Logging yang uniform
 * - Timeout management
 * - Authentication handling otomatis
 * 
 * Semua endpoint sudah didefinisikan di API_CONFIG di atas untuk memudahkan maintenance
 */
class OPReimAPIService {

    /**
     * 📋 Fetch detail dokumen outgoing payment reimbursement
     * @param {string} id - ID dokumen staging outgoing payment
     * @returns {Promise<Object>} Data detail dokumen
     */
    static async fetchOPReimDetails(id) {
        const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.HEADERS}/${id}`;
        return await CentralizedAPIClient.get(endpoint);
    }

    /**
     * 👥 Fetch daftar users untuk dropdown approval
     * @returns {Promise<Object>} Data users dengan format { data: [...] }
     */
    static async fetchUsers() {
        return await CentralizedAPIClient.get(API_CONFIG.ENDPOINTS.USERS);
    }

    /**
     * 📎 Fetch attachments dokumen
     * @param {string} id - ID dokumen staging outgoing payment
     * @returns {Promise<Object>} Data attachments dengan format { data: [...] }
     */
    static async fetchAttachments(id) {
        const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.ATTACHMENTS}/${id}`;
        return await CentralizedAPIClient.get(endpoint);
    }

    /**
     * 💰 Fetch data reimbursement berdasarkan expressivNo
     * @param {string} expressivNo - Nomor expressiv reimbursement
     * @returns {Promise<Object>} Data reimbursement terkait
     */
    static async fetchReimbursementData(expressivNo) {
        const endpoint = `${API_CONFIG.ENDPOINTS.REIMBURSEMENTS}/${expressivNo}`;
        return await CentralizedAPIClient.get(endpoint);
    }

    /**
     * ✅ Approve dokumen (Checked, Acknowledged, Approved)
     * Menggunakan PUT method dengan content-type application/json
     * @param {string} id - ID dokumen staging outgoing payment
     * @param {Object} requestData - Data approval dengan status approval
     * @returns {Promise<Object>} Response hasil approve
     */
    static async approveDocument(id, requestData) {
        const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.APPROVALS}/${id}`;
        return await CentralizedAPIClient.put(endpoint, requestData);
    }

    /**
     * ✅ Receive dokumen (approve untuk diterima)
     * Menggunakan PUT method dengan content-type application/json (sama seperti approve lainnya)
     * @param {string} id - ID dokumen staging outgoing payment
     * @param {Object} requestData - Data approval dengan status "Received"
     * @returns {Promise<Object>} Response hasil receive
     */
    static async receiveDocument(id, requestData) {
        const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.APPROVALS}/${id}`;
        return await CentralizedAPIClient.put(endpoint, requestData);
    }

    /**
     * ❌ Reject dokumen
     * Menggunakan PUT method dengan content-type application/json
     * @param {string} id - ID dokumen staging outgoing payment
     * @param {Object} requestData - Data approval dengan status "Rejected" dan rejection remarks
     * @returns {Promise<Object>} Response hasil reject
     */
    static async rejectDocument(id, requestData) {
        const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.APPROVALS}/${id}`;
        return await CentralizedAPIClient.put(endpoint, requestData);
    }

    /**
     * 📤 Upload file attachment (jika diperlukan untuk future enhancement)
     * @param {string} id - ID dokumen staging outgoing payment
     * @param {FormData} formData - Form data berisi file yang akan di-upload
     * @returns {Promise<Object>} Response hasil upload
     */
    static async uploadAttachment(id, formData) {
        const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.ATTACHMENTS}/${id}`;
        return await CentralizedAPIClient.post(endpoint, formData, {
            timeout: API_CONFIG.TIMEOUTS.UPLOAD
        });
    }

    /**
     * 🗑️ Delete attachment (jika diperlukan untuk future enhancement)
     * @param {string} id - ID dokumen staging outgoing payment
     * @param {string} attachmentId - ID attachment yang akan dihapus
     * @returns {Promise<Object>} Response hasil delete
     */
    static async deleteAttachment(id, attachmentId) {
        const endpoint = `${API_CONFIG.ENDPOINTS.OP_REIM.ATTACHMENTS}/${id}/${attachmentId}`;
        return await CentralizedAPIClient.delete(endpoint);
    }

    /**
     * 📁 Fetch file content untuk download/view
     * @param {string} filePath - Path file yang akan diambil
     * @param {Object} options - Options tambahan untuk request
     * @returns {Promise<Object>} Content file atau URL redirect
     */
    static async fetchFileContent(filePath, options = {}) {
        const endpoint = `${API_CONFIG.ENDPOINTS.FILES}/${filePath}`;
        return await CentralizedAPIClient.get(endpoint, null, {
            timeout: API_CONFIG.TIMEOUTS.DOWNLOAD,
            ...options
        });
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
        if (!usersList || !userId) return 'Unknown User';

        const user = usersList.find(u => u.id === userId);
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
}

// ===== 8. PERMISSION MANAGER =====
class PermissionManager {
    /**
     * 🔐 STATUS MAPPING - Urutan workflow approval
     */
    static APPROVAL_WORKFLOW = [
        { status: 'Prepared', nextStatus: 'Checked', roleField: 'preparedBy', dateField: 'preparedDate', nameField: 'preparedByName' },
        { status: 'Checked', nextStatus: 'Acknowledged', roleField: 'checkedBy', dateField: 'checkedDate', nameField: 'checkedByName' },
        { status: 'Acknowledged', nextStatus: 'Approved', roleField: 'acknowledgedBy', dateField: 'acknowledgedDate', nameField: 'acknowledgedByName' },
        { status: 'Approved', nextStatus: 'Received', roleField: 'approvedBy', dateField: 'approvedDate', nameField: 'approvedByName' },
        { status: 'Received', nextStatus: null, roleField: 'receivedBy', dateField: 'receivedDate', nameField: 'receivedByName' }
    ];

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

        // Gunakan sistem approval workflow yang baru
        const permissionResult = this.checkUserPermissionsNew(data);
        this.updateUIBasedOnPermissions(permissionResult, approval);
    }

    /**
     * 👤 Mengecek user permissions berdasarkan status dokumen dan role user
     */
    static checkUserPermissionsNew(data) {
        const currentUser = getCurrentUser();
        if (!currentUser || !data || !data.approval) {
            console.warn('⚠️ Missing user or approval data');
            return { canApprove: false, currentStep: null, userRole: null };
        }

        const approval = data.approval;
        const currentUserId = currentUser.userId;

        // Cek status dokumen saat ini
        const currentStep = this.determineCurrentApprovalStep(approval);
        const userRole = this.getUserRoleInApproval(currentUserId, approval);
        const canApprove = this.canUserApproveAtCurrentStep(currentUserId, approval, currentStep);

        console.log('🔍 Permission Check:', {
            currentUserId,
            currentStep: currentStep?.status,
            userRole,
            canApprove,
            approval
        });

        return {
            canApprove,
            currentStep,
            userRole,
            nextAction: currentStep?.nextStatus,
            isAssignedToCurrentStep: this.isUserAssignedToStep(currentUserId, approval, currentStep)
        };
    }

    /**
     * 📋 Menentukan step approval saat ini berdasarkan status dokumen
     * Current step = step terakhir yang sudah diselesaikan
     * Next action = action yang bisa dilakukan berikutnya
     */
    static determineCurrentApprovalStep(approval) {
        if (!approval) return this.APPROVAL_WORKFLOW[0]; // Default: Prepared

        // Jika sudah rejected, return rejected status
        if (approval.rejectedDate) {
            return { status: 'Rejected', nextStatus: null, roleField: null, dateField: 'rejectedDate' };
        }

        // Cari step terakhir yang sudah diselesaikan (memiliki tanggal)
        let lastCompletedStep = null;

        for (let i = 0; i < this.APPROVAL_WORKFLOW.length; i++) {
            const step = this.APPROVAL_WORKFLOW[i];
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
        return this.APPROVAL_WORKFLOW[0];
    }

    /**
     * 👥 Menentukan role user dalam approval workflow
     */
    static getUserRoleInApproval(userId, approval) {
        const roles = [];

        this.APPROVAL_WORKFLOW.forEach(step => {
            if (approval[step.roleField] === userId) {
                roles.push(step.status);
            }
        });

        return roles.length > 0 ? roles : ['None'];
    }

    /**
     * ✅ Mengecek apakah user bisa approve di step saat ini
     * UPDATED STRICT LOGIC: 
     * 1. Jika dokumen sudah Received/Rejected → Semua user view-only (kecuali ReceivedBy bisa print)
     * 2. Jika user sudah melakukan action mereka → View-only
     * 3. Status dokumen harus tepat sebelum role user
     * 4. User harus assigned untuk step berikutnya
     */
    static canUserApproveAtCurrentStep(userId, approval, currentStep) {
        if (!currentStep) return false;

        // Jika dokumen sudah received atau rejected, tidak ada yang bisa approve
        if (currentStep.status === 'Received' || currentStep.status === 'Rejected') {
            return false;
        }

        // Cari next step berdasarkan current step
        const nextStep = this.getNextStep(currentStep);
        if (!nextStep) return false; // Tidak ada step berikutnya

        // Cek apakah user adalah assigned approver untuk next step
        const isAssigned = approval[nextStep.roleField] === userId;
        if (!isAssigned) return false;

        // Cek apakah user sudah melakukan action mereka (sudah ada tanggal)
        const hasUserAlreadyActed = approval[nextStep.dateField];
        if (hasUserAlreadyActed) {
            console.log(`❌ Permission denied: User ${nextStep.status} has already completed their action`);
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

        // Special case untuk CheckedBy: bisa approve meskipun Prepared belum fully completed
        if (userRole === 'Checked') {
            return true; // CheckedBy bisa approve prepared document
        }

        // Untuk role lainnya: current step harus sudah diselesaikan
        const isCurrentStepCompleted = approval[currentStep.dateField];

        console.log(`🔍 Updated Strict Permission Check:`, {
            userRole,
            currentStatus,
            requiredStatus,
            isAssigned,
            hasUserAlreadyActed,
            isCurrentStepCompleted,
            canApprove: isAssigned && !hasUserAlreadyActed && isCurrentStepCompleted
        });

        return isAssigned && !hasUserAlreadyActed && isCurrentStepCompleted;
    }

    /**
     * 🔄 Mendapatkan step berikutnya berdasarkan current step
     */
    static getNextStep(currentStep) {
        if (!currentStep || !currentStep.nextStatus) return null;

        return this.APPROVAL_WORKFLOW.find(step => step.status === currentStep.nextStatus);
    }

    /**
     * 🔗 Mengecek apakah user assigned ke step berikutnya
     */
    static isUserAssignedToStep(userId, approval, currentStep) {
        const nextStep = this.getNextStep(currentStep);
        if (!nextStep || !nextStep.roleField) return false;
        return approval[nextStep.roleField] === userId;
    }

    /**
     * ⏮️ Mengecek apakah step sebelumnya sudah diselesaikan
     */
    static isPreviousStepCompleted(approval, currentStep) {
        const currentIndex = this.APPROVAL_WORKFLOW.findIndex(step => step.status === currentStep.status);

        // Jika ini adalah step pertama (Prepared), selalu return true
        if (currentIndex <= 0) return true;

        // Cek apakah step sebelumnya sudah diselesaikan
        const previousStep = this.APPROVAL_WORKFLOW[currentIndex - 1];
        return approval[previousStep.dateField] !== null && approval[previousStep.dateField] !== undefined;
    }

    /**
     * 🎯 Update UI berdasarkan permission check
     */
    static updateUIBasedOnPermissions(permissionResult, approval) {
        const { canApprove, currentStep, userRole, nextAction, isAssignedToCurrentStep } = permissionResult;

        // Update page title berdasarkan role dan status
        this.updatePageTitle(currentStep, userRole, isAssignedToCurrentStep);

        // Update button states
        this.updateButtonStates(canApprove, currentStep, nextAction);

        // Update status display
        this.updateStatusDisplay(currentStep, approval);

        // Update form readonly state
        this.updateFormState(canApprove);
    }

    /**
     * 📝 Update judul halaman berdasarkan role dan status (UPDATED STRICT LOGIC)
     */
    static updatePageTitle(currentStep, userRole, isAssignedToCurrentStep) {
        const titleElement = document.querySelector('h2');
        if (!titleElement) return;

        const currentUser = getCurrentUser();
        if (!currentUser || !receiveState.opReimData?.approval) {
            titleElement.textContent = 'Outgoing Payment Reimbursement';
            return;
        }

        const approval = receiveState.opReimData.approval;
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

    /**
     * 🔘 Update status tombol berdasarkan permission (UPDATED STRICT LOGIC)
     */
    static updateButtonStates(canApprove, currentStep, nextAction) {
        const receiveButton = document.getElementById('receiveButton');
        const rejectButton = document.getElementById('rejectButton');
        const printButton = document.getElementById('printButton');

        if (!receiveButton || !rejectButton) return;

        const currentUser = getCurrentUser();
        if (!currentUser || !receiveState.opReimData?.approval) {
            this.hideAllButtons(receiveButton, rejectButton);
            this.hidePrintButton(printButton);
            return;
        }

        const approval = receiveState.opReimData.approval;
        const currentUserId = currentUser.userId;
        const currentStatus = currentStep ? currentStep.status : 'Prepared';

        // UPDATED BUTTON LOGIC berdasarkan status dokumen dan user role

        // 1. Jika dokumen sudah Received atau Rejected = semua action buttons hidden
        if (currentStatus === 'Received' || currentStatus === 'Rejected') {
            this.hideAllButtons(receiveButton, rejectButton);

            // Print button hanya untuk ReceivedBy jika dokumen completed
            if (currentStatus === 'Received' && approval.receivedBy === currentUserId) {
                this.showPrintButton(printButton);
                console.log('🖨️ Print button enabled - ReceivedBy viewing completed document');
            } else {
                this.hidePrintButton(printButton);
            }

            console.log('📝 Action buttons hidden - Document completed/rejected');
            return;
        }

        // 2. Cek apakah user adalah PreparedBy yang melihat dokumen Prepared
        const isPreparedByViewingPrepared = (approval.preparedBy === currentUserId && currentStatus === 'Prepared');
        if (isPreparedByViewingPrepared) {
            this.hideAllButtons(receiveButton, rejectButton);
            this.hidePrintButton(printButton);
            console.log('📝 Buttons hidden - PreparedBy viewing Prepared document');
            return;
        }

        // 3. Cek apakah user sudah melakukan action mereka
        const hasUserAlreadyActed = this.hasUserCompletedTheirAction(currentUserId, approval);
        if (hasUserAlreadyActed) {
            this.hideAllButtons(receiveButton, rejectButton);
            this.hidePrintButton(printButton);
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

            this.hidePrintButton(printButton); // Hide print saat masih bisa approve

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

            this.hidePrintButton(printButton);

            console.log('❌ Action buttons disabled - No permission');
        }
    }

    /**
     * 🔍 Helper: Cek apakah user sudah melakukan action mereka
     */
    static hasUserCompletedTheirAction(userId, approval) {
        // Cek setiap role dan apakah user sudah melakukan action tersebut
        if (approval.checkedBy === userId && approval.checkedDate) return true;
        if (approval.acknowledgedBy === userId && approval.acknowledgedDate) return true;
        if (approval.approvedBy === userId && approval.approvedDate) return true;
        if (approval.receivedBy === userId && approval.receivedDate) return true;

        return false;
    }

    /**
     * 🙈 Helper method untuk hide semua action buttons
     */
    static hideAllButtons(receiveButton, rejectButton) {
        if (receiveButton) {
            receiveButton.style.display = 'none';
        }
        if (rejectButton) {
            rejectButton.style.display = 'none';
        }
    }

    /**
     * �️ Helper method untuk show print button
     */
    static showPrintButton(printButton) {
        if (printButton) {
            printButton.style.display = 'inline-block';
            printButton.disabled = false;
            printButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    /**
     * 🙈 Helper method untuk hide print button
     */
    static hidePrintButton(printButton) {
        if (printButton) {
            printButton.style.display = 'none';
        }
    }

    /**
     * 📊 Update tampilan status
     */
    static updateStatusDisplay(currentStep, approval) {
        const statusSelect = document.getElementById('status');
        if (!statusSelect) return;

        if (currentStep) {
            statusSelect.value = currentStep.status;
            console.log(`📊 Status display updated: ${currentStep.status}`);
        }
    }

    /**
     * 📝 Update state form (readonly/editable)
     */
    static updateFormState(canApprove) {
        // Semua field tetap readonly kecuali yang spesifik diizinkan untuk edit
        // Untuk saat ini, semua field tetap readonly
        console.log(`📝 Form state: ${canApprove ? 'Can approve' : 'Read-only'}`);
    }

    static determineCurrentStatus(approval) {
        const step = this.determineCurrentApprovalStep(approval);
        return step ? step.status : 'Prepared';
    }

    static validateDocumentStatus() {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            UIUtils.showError('Authentication Error', 'User not authenticated. Please login again.')
                .then(() => window.location.href = getLoginPagePath());
            return false;
        }

        if (!receiveState.opReimData || !receiveState.opReimData.approval) {
            UIUtils.showError('Error', 'Document data is incomplete. Please refresh the page.');
            return false;
        }

        const approval = receiveState.opReimData.approval;
        const permissionResult = this.checkUserPermissionsNew(receiveState.opReimData);

        if (!permissionResult.canApprove) {
            UIUtils.showWarning('Not Authorized', 'You are not authorized to perform this action.');
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

            const docId = documentId;
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

        const printUrl = this.buildPrintReimbursementUrl(opReimId, opReimData);
        const documentItem = this.createPrintDocumentItem(opReimId, printUrl);

        container.appendChild(documentItem);
    }

    static displayPrintVoucher(opReimData) {
        const container = document.getElementById('printVoucherList');
        if (!container) return;

        container.innerHTML = '';

        let opReimId = this.getOPReimId(opReimData);

        if (!opReimId) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Outgoing Payment Voucher ID not found</p>';
            return;
        }

        const printVoucherUrl = this.buildPrintVoucherUrl(opReimId, opReimData);
        const voucherItem = this.createPrintVoucherItem(opReimId, printVoucherUrl);

        container.appendChild(voucherItem);
    }

    static buildPrintVoucherUrl(opReimId, opReimData) {
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
                const preparedByName = UserManager.getUserNameById(approval.preparedBy);
                params.append('preparedBy', preparedByName);
            }
            if (approval.checkedBy) {
                const checkedByName = UserManager.getUserNameById(approval.checkedBy);
                params.append('checkedBy', checkedByName);
            }
            if (approval.acknowledgedBy) {
                const acknowledgedByName = UserManager.getUserNameById(approval.acknowledgedBy);
                params.append('acknowledgedBy', acknowledgedByName);
            }
            if (approval.approvedBy) {
                const approvedByName = UserManager.getUserNameById(approval.approvedBy);
                params.append('approvedBy', approvedByName);
            }
            if (approval.receivedBy) {
                const receivedByName = UserManager.getUserNameById(approval.receivedBy);
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

    static createPrintVoucherItem(opReimId, printUrl) {
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
        view
        viewBtn.onclick = () => this.viewPrintVoucher(printUrl);

        const openBtn = document.createElement('button');
        openBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
        openBtn.innerHTML = 'Open';
        openBtn.onclick = () => this.openPrintVoucher(printUrl);

        actions.appendChild(viewBtn);
        actions.appendChild(openBtn);

        voucherItem.appendChild(fileInfo);
        voucherItem.appendChild(actions);

        return voucherItem;
    }

    static async viewPrintVoucher(url) {
        try {
            UIUtils.showLoading('Loading Print Voucher document...');

            const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

            if (newWindow) {
                Swal.close();
                UIUtils.showSuccess('Success', 'Print Voucher document opened in new window');
            } else {
                throw new Error('Failed to open voucher window');
            }

        } catch (error) {
            console.error('Error viewing Print Voucher document:', error);
            UIUtils.showError('Error', `Failed to open Print Voucher document: ${error.message}`);
        }
    }

    static openPrintVoucher(url) {
        try {
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error opening Print Voucher document:', error);
            UIUtils.showError('Error', `Failed to open Print Voucher document: ${error.message}`);
        }
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

    static buildPrintReimbursementUrl(opReimId, opReimData) {
        const baseUrl = window.location.origin;
        // Use GetPrintReim.html for Print Reimbursement Document
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
            console.log('🚀 Initializing Receive Outgoing Payment Reimbursement page...');

            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');

            if (!id) {
                UIUtils.showError('Error', 'No document ID provided')
                    .then(() => this.goToMenu());
                return;
            }

            // Set global variables
            documentId = id;
            receiveState.setDocumentId(id);
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
            receiveState.setOPReimData(data);

            await this.loadUsersData();
            FormManager.populateFormFields(data);
            PermissionManager.checkUserPermissions(data);
            AttachmentManager.handleAttachments(data, id);
            PrintManager.displayPrintOutReimbursement(data);
            PrintManager.displayPrintVoucher(data);
            await this.handleReimbursementData(data); Swal.close();

        } catch (error) {
            console.error('❌ Error loading document:', error);
            UIUtils.showError('Error', `Failed to load document: ${error.message}`)
                .then(() => this.goToMenu());
        }
    }

    static async loadUsersData() {
        try {
            const usersData = await OPReimAPIService.fetchUsers();
            receiveState.setUsers(usersData.data || []);
        } catch (error) {
            console.error('❌ Error loading users:', error);
            receiveState.setUsers([]);
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
        window.location.href = '../../../dashboard/dashboardReceive/OPReim/menuOPReimReceive.html';
    }
}

// ===== 12. ACTION MANAGER =====
class ActionManager {
    /**
     * 🎯 Universal approval action - dapat menangani Checked, Acknowledged, Approved, atau Received
     */
    static async performApprovalAction() {
        try {
            if (!PermissionManager.validateDocumentStatus()) {
                return;
            }

            // Get current permission state to determine action
            const permissionResult = PermissionManager.checkUserPermissionsNew(receiveState.opReimData);

            if (!permissionResult.canApprove || !permissionResult.nextAction) {
                UIUtils.showWarning('Not Authorized', 'You are not authorized to perform this action.');
                return;
            }

            const actionType = permissionResult.nextAction;
            UIUtils.showLoading('Processing...', `Submitting ${actionType.toLowerCase()} confirmation`);

            const userId = UserManager.getCurrentUserId();
            if (!userId) {
                throw new Error('User ID not found. Please log in again.');
            }

            const currentUser = getCurrentUser();
            const currentUserName = currentUser ? currentUser.username : 'Unknown User';
            const currentDate = new Date().toISOString();

            const requestData = this.buildApprovalRequestData(userId, currentUserName, currentDate, actionType);

            // Use PUT method for all approval actions (consistent with API design)
            const response = await OPReimAPIService.approveDocument(receiveState.documentId, requestData);

            console.log(`✅ Document ${actionType.toLowerCase()} successfully:`, response);

            UIUtils.showSuccess('Success', `Document has been ${actionType.toLowerCase()} successfully`)
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

            UIUtils.showError('Error', `Failed to ${permissionResult?.nextAction?.toLowerCase() || 'process'} document: ${errorMessage}`);
        }
    }

    /**
     * 📝 Build approval request data based on action type
     */
    static buildApprovalRequestData(userId, currentUserName, currentDate, actionType) {
        const approval = receiveState.opReimData.approval || {};

        // Base request data structure
        const requestData = {
            stagingID: receiveState.documentId,
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

    // Legacy method - keep for backward compatibility but redirect to new method
    static async receiveOPReim() {
        return this.performApprovalAction();
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

            const response = await OPReimAPIService.rejectDocument(receiveState.documentId, requestData);

            console.log('✅ Document rejected successfully:', response);

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
        const approval = receiveState.opReimData.approval || {};
        const currentDate = new Date().toISOString();

        return {
            stagingID: receiveState.documentId,
            createdAt: receiveState.opReimData.createdAt || currentDate,
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
            UIUtils.showError('Error', 'No document ID provided')
                .then(() => goToMenuReceiveOPReim());
            return;
        }

        console.log('📋 Document ID:', documentId);
        await loadOPReimDetails(documentId);

    } catch (error) {
        console.error('❌ Initialization error:', error);
        UIUtils.showError('Error', 'Failed to initialize the system');
    }
}

// Load outgoing payment reimbursement details
async function loadOPReimDetails(id) {
    try {
        UIUtils.showLoading('Fetching document details');

        const data = await OPReimAPIService.fetchOPReimDetails(id);
        console.log('📋 Outgoing Payment API Response:', data);

        outgoingPaymentReimData = data;

        await loadUsersData();
        FormManager.populateFormFields(data);
        PermissionManager.checkUserPermissions(data);
        AttachmentManager.handleAttachments(data, id);
        PrintManager.displayPrintOutReimbursement(data);
        PrintManager.displayPrintVoucher(data);
        await handleReimbursementData(data);

        Swal.close();

    } catch (error) {
        console.error('❌ Error loading document:', error);
        UIUtils.showError('Error', `Failed to load document: ${error.message}`)
            .then(() => goToMenuReceiveOPReim());
    }
}

// Load users data
async function loadUsersData() {
    try {
        const usersData = await OPReimAPIService.fetchUsers();
        usersList = usersData.data || [];
    } catch (error) {
        console.error('❌ Error loading users:', error);
        usersList = [];
    }
}

// Handle reimbursement data
async function handleReimbursementData(result) {
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

// Receive/Approve the outgoing payment reimbursement
async function receiveOPReim() {
    await ActionManager.performApprovalAction();
}

// Legacy function alias for backward compatibility
async function approveOPReim() {
    await ActionManager.performApprovalAction();
}

// Reject the outgoing payment reimbursement
async function rejectOPReim() {
    await ActionManager.rejectOPReim();
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

// Get user name by ID
function getUserNameById(userId) {
    if (!usersList || !userId) return 'Unknown User';

    const user = usersList.find(u => u.id === userId);
    return user ? user.fullName : 'Unknown User';
}

// Initialize rejection prefix
function initializeWithRejectionPrefix(textarea) {
    const currentUser = getCurrentUser();
    const userName = currentUser ? currentUser.username : 'Unknown User';
    const prefix = `[${userName} - Receiver]: `;
    textarea.value = prefix;
    textarea.dataset.prefixLength = prefix.length;
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();
}

// Handle rejection input
function handleRejectionInput(event) {
    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');

    if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
        const currentUser = getCurrentUser();
        const userName = currentUser ? currentUser.username : 'Unknown User';
        const prefix = `[${userName} - Receiver]: `;

        if (!textarea.value.startsWith(prefix)) {
            const userText = textarea.value.substring(prefixLength);
            textarea.value = prefix + userText;
            textarea.setSelectionRange(prefixLength, prefixLength);
        } else {
            textarea.setSelectionRange(prefixLength, prefixLength);
        }
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);


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
// Legacy function for displaying print out reimbursement (kept for backward compatibility)
// Now uses the more detailed implementation below

// ===== 14. INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Acknowledge Outgoing Payment Reimbursement System...');
    DataManager.initialize();
    console.log('✅ Acknowledge Outgoing Payment Reimbursement System initialized successfully');
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

// ===== 15. PRINT REIMBURSEMENT FUNCTIONS =====
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

    // Get reimbursement ID from various possible sources
    let reimbursementId = null;

    // Try to get from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    reimbursementId = urlParams.get('reimbursement-id') || urlParams.get('id');
    console.log('🆔 Reimbursement ID from URL:', reimbursementId);

    // If not in URL, try to get from form data
    if (!reimbursementId) {
        const counterRefField = document.getElementById('CounterRef');
        if (counterRefField && counterRefField.value) {
            reimbursementId = counterRefField.value;
        }
    }

    // If still not found, try to get from reimbursement data
    if (!reimbursementId && reimbursementData && reimbursementData.id) {
        reimbursementId = reimbursementData.id;
    }

    if (!reimbursementId) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Reimbursement ID not found</p>';
        return;
    }

    // Build the Print Receive Reimbursement URL with parameters - DYNAMIC PATH RESOLUTION
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));

    // Construct relative path to GetPrintReim.html (same directory)
    const printReimUrl = `${baseUrl}${currentDir}/GetPrintReim.html?reim-id=${reimbursementId}`;

    console.log('🔗 Dynamic Print URL constructed:', printReimUrl);
    console.log('📂 Current directory:', currentDir);
    console.log('🏠 Base URL:', baseUrl);

    // Add additional parameters if available from reimbursement data
    let fullUrl = printReimUrl;
    if (reimbursementData) {
        const params = new URLSearchParams();

        // Add all available parameters from reimbursement data
        if (reimbursementData.cardName) params.append('payTo', encodeURIComponent(reimbursementData.cardName));
        if (reimbursementData.counterRef) params.append('voucherNo', encodeURIComponent(reimbursementData.counterRef));
        if (reimbursementData.docDate) params.append('submissionDate', reimbursementData.docDate);
        if (reimbursementData.requesterName) params.append('preparedBy', encodeURIComponent(reimbursementData.requesterName));
        if (reimbursementData.totalAmountDue) params.append('totalAmount', reimbursementData.totalAmountDue);
        if (reimbursementData.docCurr) params.append('currency', reimbursementData.docCurr);
        if (reimbursementData.comments) params.append('remarks', encodeURIComponent(reimbursementData.comments));

        // Add details if available
        if (reimbursementData.lines && reimbursementData.lines.length > 0) {
            const details = reimbursementData.lines.map(line => ({
                category: line.category || '',
                accountName: line.acctName || '',
                glAccount: line.acctCode || '',
                description: line.descrip || '',
                amount: line.sumApplied || 0
            }));
            params.append('details', encodeURIComponent(JSON.stringify(details)));
        }

        // If we have parameters, append them to the URL
        if (params.toString()) {
            fullUrl += '&' + params.toString();
        }
    }

    // Create the document item
    const documentItem = document.createElement('div');
    documentItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'flex items-center space-x-2';

    // Use a document icon for the print reimbursement
    fileInfo.innerHTML = `
        <span class="text-lg">📄</span>
        <div>
            <div class="font-medium text-sm text-blue-800">Print Receive Reimbursement</div>
            <div class="text-xs text-gray-500">Document • PDF</div>
            <div class="text-xs text-blue-600">Reimbursement ID: ${reimbursementId}</div>
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

// Function to view Print Reimbursement document
async function viewPrintReimbursement(url) {
    try {
        console.log('🚀 Attempting to open Print URL:', url);

        // Add cache busting parameter to ensure fresh load
        const cacheBustUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
        console.log('🔄 Cache-busted URL:', cacheBustUrl);

        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            text: 'Loading Print Receive Reimbursement document...',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Open the URL in a new window/tab with cache-busted URL
        const newWindow = window.open(cacheBustUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

        if (newWindow) {
            // Close loading indicator
            Swal.close();

            // Show success message
            Swal.fire({
                title: 'Success',
                text: 'Print Receive Reimbursement document opened in new window',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            throw new Error('Failed to open document window');
        }

    } catch (error) {
        console.error('Error viewing Print Reimbursement document:', error);

        Swal.fire({
            title: 'Error',
            text: `Failed to open Print Receive Reimbursement document: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to open Print Reimbursement document in new tab
function openPrintReimbursement(url) {
    try {
        console.log('🔗 Opening Print URL directly:', url);

        // Add cache busting parameter
        const cacheBustUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
        console.log('🔄 Cache-busted direct URL:', cacheBustUrl);

        window.open(cacheBustUrl, '_blank');
    } catch (error) {
        console.error('Error opening Print Reimbursement document:', error);

        Swal.fire({
            title: 'Error',
            text: `Failed to open Print Receive Reimbursement document: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// ===== 16. EVENT LISTENERS SETUP =====
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
    DataManager.initialize();

    console.log('✅ Receive Outgoing Payment Reimbursement System initialized successfully');
});