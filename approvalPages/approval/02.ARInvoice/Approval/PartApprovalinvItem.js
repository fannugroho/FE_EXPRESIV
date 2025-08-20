// ===== ENHANCED AR INVOICE JAVASCRIPT =====
// Supports both Item (I) and Service (S) document types with multi-approval functionality
// 
// ✨ IMPROVED MAINTAINABILITY FEATURES:
// 
// 🔧 CONFIGURATION-BASED SYSTEM:
// - BUTTON_CONFIG: Centralized button behavior and visibility rules
// - STATUS_CONFIG: Enhanced with order property for flexible status management  
// - UI_CONFIG: Flexible templates for titles, status boxes, and progress indicators
// - DOC_TYPE_CONFIG: Document type specific configurations
//
// 📋 ENHANCED MANAGERS:
// - TitleManager: Handles all title-related operations with templates
// - StatusBoxManager: Manages status display and progress indicators
// - ButtonManager: Centralized button visibility logic using configurations
//
// 🎯 BUTTON VISIBILITY SYSTEM:
// - Configuration-driven visibility rules
// - Special logic handling for print, eSign, and reject buttons
// - Standard approval workflow buttons with reusable conditions
// - Easy to modify by updating BUTTON_CONFIG without touching logic
//
// 🏷️ TITLE MANAGEMENT:
// - Template-based title generation
// - Flexible source and status mapping
// - Centralized browser and main title updates
// - Backward compatibility maintained
//
// 📊 STATUS BOX & PROGRESS:
// - Template-driven status box styling
// - Configurable progress step visualization
// - Consistent status indicator management
// 
// 💡 USAGE EXAMPLES:
// - Add new button: Update BUTTON_CONFIG with visibility rules
// - Change title format: Modify UI_CONFIG.title.templates
// - Add status: Update STATUS_CONFIG with color and description
// - Modify progress: Update UI_CONFIG.progress.templates
//
// 🔄 BACKWARD COMPATIBILITY:
// All existing function calls continue to work through delegation to new managers

// Global variables - Application State
const AppState = {
    currentInvItemData: null,
    currentUser: null,
    allUsers: [],
    initialized: false,
    docType: 'I', // Default to Item, will be set from URL parameter
    currentStatus: 'Draft',
    // New properties for URL parameters
    urlStatus: null,
    urlSource: null
};

// Function to get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramValue = urlParams.get(name);
    console.log(`🔍 URL Parameter '${name}':`, paramValue);
    console.log(`🔍 Full URL:`, window.location.href);
    console.log(`🔍 Search params:`, window.location.search);
    console.log(`🔍 All params:`, Object.fromEntries(urlParams));
    return paramValue;
}

// =========================
// === ENHANCED TITLE MANAGEMENT ===
// =========================

// Enhanced Title Manager using configuration
const TitleManager = {
    // Source and status mapping for user-friendly text
    sourceMap: {
        'check': 'Check',
        'acknowledge': 'Acknowledge',
        'approve': 'Approve',
        'receive': 'Receive'
    },

    statusMap: {
        'checked': 'Checked',
        'acknowledged': 'Acknowledged',
        'approved': 'Approved',
        'received': 'Received',
        'prepared': 'Prepared',
        'draft': 'Draft',
        'rejected': 'Rejected'
    },

    // Main title setup function using UI_CONFIG
    setupTitle: ({ status, source, docType } = {}) => {
        // Get parameters from URL if not provided
        if (!status) status = getUrlParameter('status');
        if (!source) source = getUrlParameter('source');
        if (!docType) docType = AppState.docType;

        const sourceText = TitleManager.sourceMap[source] || source || '';
        const statusText = TitleManager.statusMap[(status || '').toLowerCase()] || status || '';

        // Save pending title for later updates
        AppState.pendingTitle = statusText ? `${statusText} AR Invoice` : 'AR Invoice';

        // Update browser title using template
        document.title = UI_CONFIG.title.templates.browserTitle(statusText, sourceText);

        // Update main title using template
        TitleManager.updateMainTitle(statusText, docType);

        // Update status badge and description
        TitleManager.updateStatusElements(statusText, sourceText);
    },

    // Update main title with flexible template
    updateMainTitle: (status, docType) => {
        const mainTitle = OptimizedUtils.safeGetElement(UI_CONFIG.title.elements.mainTitle);
        if (mainTitle && docType) {
            mainTitle.textContent = UI_CONFIG.title.templates.mainTitle(AppState.pendingTitle, docType);
        }
    },

    // Update status-related elements
    updateStatusElements: (statusText, sourceText) => {
        // Update status badge
        const statusBadge = OptimizedUtils.safeGetElement(UI_CONFIG.title.elements.statusBadge);
        if (statusBadge) {
            statusBadge.textContent = statusText;
            TitleManager.updateStatusBadgeClass(statusText);
        }

        // Update current status text
        const currentStatusText = OptimizedUtils.safeGetElement(UI_CONFIG.title.elements.currentStatusText);
        if (currentStatusText) {
            currentStatusText.textContent = statusText;
        }

        // Update status description using template
        const statusDescription = OptimizedUtils.safeGetElement(UI_CONFIG.title.elements.statusDescription);
        if (statusDescription) {
            statusDescription.textContent = UI_CONFIG.title.templates.statusDescription(statusText, sourceText);
        }
    },

    // Update status badge CSS classes using STATUS_CONFIG
    updateStatusBadgeClass: (status) => {
        const statusBadge = OptimizedUtils.safeGetElement(UI_CONFIG.title.elements.statusBadge);
        if (!statusBadge) return;

        // Remove all existing status classes
        Object.values(STATUS_CONFIG).forEach(config => {
            statusBadge.classList.remove(config.className);
        });

        // Add appropriate class based on status
        const statusConfig = STATUS_CONFIG[status];
        if (statusConfig) {
            statusBadge.classList.add(statusConfig.className);
        } else {
            statusBadge.classList.add(STATUS_CONFIG['Draft'].className);
        }
    },

    // Update final title after docType is determined
    updateFinalTitleWithDocType: () => {
        console.log('🔧 updateFinalTitleWithDocType called with:', {
            pendingTitle: AppState.pendingTitle,
            docType: AppState.docType
        });

        if (AppState.pendingTitle && AppState.docType) {
            TitleManager.updateMainTitle(AppState.pendingTitle, AppState.docType);
            console.log('✅ Final title updated using TitleManager');
        } else {
            console.log('⚠️ Missing data for final title:', {
                pendingTitle: AppState.pendingTitle,
                docType: AppState.docType
            });
        }
    },

    // Dynamic title update when status changes
    updateMainTitleWithStatus: (status) => {
        const config = DOC_TYPE_CONFIG[AppState.docType];
        const mainTitle = OptimizedUtils.safeGetElement(UI_CONFIG.title.elements.mainTitle);
        if (mainTitle && config) {
            mainTitle.textContent = `${status} AR Invoice ${config.name}`;
        }
    }
};

// Backward compatibility functions
function setupARInvoiceTitle(params = {}) {
    return TitleManager.setupTitle(params);
}

// Backward compatibility functions
function updatePageTitleFromURL() {
    return TitleManager.setupTitle();
}

function updateFinalTitleWithDocType() {
    return TitleManager.updateFinalTitleWithDocType();
}

function updateMainTitleWithStatus(status) {
    return TitleManager.updateMainTitleWithStatus(status);
}

function updateStatusBadgeClass(status) {
    return TitleManager.updateStatusBadgeClass(status);
}

// API Configuration
const API_CONFIG = {
    BASE_URL: `${BASE_URL}/api`,
    ENDPOINTS: {
        users: '/users',
        invoices: '/ar-invoices',
        attachments: '/attachments'
    }
};

// Document Type Configuration
const DOC_TYPE_CONFIG = {
    'I': {
        name: 'Item',
        tableTitle: 'Item Details',
        className: 'item-mode'
    },
    'S': {
        name: 'Service',
        tableTitle: 'Service Details',
        className: 'service-mode'
    }
};

// Status Configuration
const STATUS_CONFIG = {
    'Draft': {
        color: 'bg-gray-500',
        className: 'status-draft',
        description: 'Document is in draft state',
        order: 0
    },
    'Prepared': {
        color: 'bg-yellow-500',
        className: 'status-prepared',
        description: 'Document has been prepared and ready for checking',
        order: 1
    },
    'Checked': {
        color: 'bg-blue-500',
        className: 'status-checked',
        description: 'Document has been checked and ready for acknowledgment',
        order: 2
    },
    'Acknowledged': {
        color: 'bg-purple-500',
        className: 'status-acknowledged',
        description: 'Document has been acknowledged and ready for approval',
        order: 3
    },
    'Approved': {
        color: 'bg-green-500',
        className: 'status-approved',
        description: 'Document has been approved and ready to be received',
        order: 4
    },
    'Received': {
        color: 'bg-green-600',
        className: 'status-received',
        description: 'Document has been received and processed',
        order: 5
    },
    'Rejected': {
        color: 'bg-red-500',
        className: 'status-rejected',
        description: 'Document has been rejected',
        order: -1
    }
};

// Enhanced Button Configuration for better maintainability
const BUTTON_CONFIG = {
    checkButton: {
        id: 'checkButton',
        label: 'Check',
        requiredStatus: 'Prepared',
        nextStatus: 'Checked',
        kansaiIdField: 'checkedByKansaiId',
        fallbackIdField: 'checkedBy',
        dateField: 'checkedDate',
        previousDateField: 'preparedDate',
        visibilityRules: {
            hideOnStatus: ['Received', 'Rejected'],
            showConditions: ['previousStepCompleted', 'currentStepNotCompleted', 'userAuthorized']
        }
    },
    acknowledgeButton: {
        id: 'acknowledgeButton',
        label: 'Acknowledge',
        requiredStatus: 'Checked',
        nextStatus: 'Acknowledged',
        kansaiIdField: 'acknowledgedByKansaiId',
        fallbackIdField: 'acknowledgedBy',
        dateField: 'acknowledgedDate',
        previousDateField: 'checkedDate',
        visibilityRules: {
            hideOnStatus: ['Received', 'Rejected'],
            showConditions: ['previousStepCompleted', 'currentStepNotCompleted', 'userAuthorized']
        }
    },
    approveButton: {
        id: 'approveButton',
        label: 'Approve',
        requiredStatus: 'Acknowledged',
        nextStatus: 'Approved',
        kansaiIdField: 'approvedByKansaiId',
        fallbackIdField: 'approvedBy',
        dateField: 'approvedDate',
        previousDateField: 'acknowledgedDate',
        visibilityRules: {
            hideOnStatus: ['Received', 'Rejected'],
            showConditions: ['previousStepCompleted', 'currentStepNotCompleted', 'userAuthorized']
        }
    },
    receiveButton: {
        id: 'receiveButton',
        label: 'Receive',
        requiredStatus: 'Approved',
        nextStatus: 'Received',
        kansaiIdField: 'receivedByKansaiId',
        fallbackIdField: 'receivedBy',
        dateField: 'receivedDate',
        previousDateField: 'approvedDate',
        visibilityRules: {
            hideOnStatus: ['Received', 'Rejected'],
            showConditions: ['previousStepCompleted', 'currentStepNotCompleted', 'userAuthorized']
        }
    },
    rejectButton: {
        id: 'rejectButton',
        label: 'Reject',
        visibilityRules: {
            hideOnStatus: ['Received', 'Rejected'],
            showConditions: ['userAuthorized', 'currentStepNotCompleted'],
            specialLogic: true
        }
    },
    printButton: {
        id: 'printButton',
        label: 'Print',
        visibilityRules: {
            showOnUrlStatus: ['approved', 'received'],
            specialLogic: true
        }
    },
    eSignButton: {
        id: 'eSignButton',
        label: 'E-Sign',
        visibilityRules: {
            showOnApiAndUrlStatus: 'received',
            specialLogic: true
        }
    }
};

// Enhanced UI Configuration for flexible title and status box management
const UI_CONFIG = {
    title: {
        elements: {
            mainTitle: 'mainTitle',
            statusBadge: 'statusBadge',
            currentStatusText: 'currentStatusText',
            statusDescription: 'statusDescription'
        },
        templates: {
            mainTitle: (status, docType) => `${status} AR Invoice (${DOC_TYPE_CONFIG[docType]?.name || 'Unknown'})`,
            browserTitle: (status, source) => status ? `${status} AR Invoice - ${source || ''}` : 'AR Invoice',
            statusDescription: (status, source) => status ? `This document is currently in ${status} status and requires your ${source?.toLowerCase() || ''} action.` : ''
        }
    },
    statusBox: {
        elements: {
            statusIndicator: 'statusIndicator',
            currentStatusDisplay: 'currentStatusDisplay'
        },
        templates: {
            statusText: (apiStatus) => `Current Status: ${apiStatus}`,
            statusClass: (statusConfig) => `mb-6 p-4 rounded-lg ${statusConfig.className}`,
            indicatorClass: (statusConfig) => `w-3 h-3 rounded-full ${statusConfig.color}`
        }
    },
    progress: {
        steps: ['Prepared', 'Checked', 'Acknowledged', 'Approved', 'Received'],
        templates: {
            completedStep: 'w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold',
            futureStep: 'w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold',
            completedText: 'text-sm font-medium text-green-600',
            futureText: 'text-sm font-medium text-gray-500'
        }
    }
};

// Optimized utilities
const OptimizedUtils = {
    // Efficient safe element access with caching
    elementCache: new Map(),

    safeGetElement: function (id) {
        if (this.elementCache.has(id)) {
            return this.elementCache.get(id);
        }
        const element = document.getElementById(id);
        if (element) {
            this.elementCache.set(id, element);
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
        return element;
    },

    safeSetValue: function (elementId, value) {
        const element = this.safeGetElement(elementId);
        if (element) {
            element.value = value || '';
        }
    },

    safeSetStyle: function (elementId, property, value) {
        const element = this.safeGetElement(elementId);
        if (element) {
            element.style[property] = value;
        }
    },

    // Optimized date formatting
    formatDate: function (dateString) {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';

            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    },

    // Efficient currency formatting
    formatCurrencyIDR: function (number) {
        if (number === null || number === undefined || number === '') return '0.00';

        const num = typeof number === 'string' ?
            parseFloat(number.replace(/,/g, '')) :
            Number(number);

        if (isNaN(num)) return '0.00';

        const maxAmount = 100000000000000;
        if (num > maxAmount) {
            this.showNotification('Amount exceeds limit', 'warning');
            return this.formatCurrencyIDR(maxAmount);
        }

        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    // Optimized notification system
    showNotification: function (message, type = 'info', duration = 3000) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: duration,
                timerProgressBar: true,
                icon: type,
                title: message
            });
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },

    // Debounced function creator
    debounce: function (func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Helper function to normalize U_BSI* fields according to specification
function normalizeUBSIField(data, fieldName, altName) {
    const variations = [
        `u_bsi_${fieldName.toLowerCase()}`,
        `u_BSI_${fieldName}`,
        `U_BSI_${altName || fieldName}`,
        `U_BSI_${fieldName}`,
        fieldName,
        altName
    ].filter(Boolean);

    for (const variation of variations) {
        if (data[variation] !== undefined && data[variation] !== null) {
            return data[variation];
        }
    }
    return '';
}

// Helper function to normalize field mappings according to specification
function normalizeFieldMapping(data, primaryField, fallbackFields = []) {
    // Check primary field first
    if (data.hasOwnProperty(primaryField) && data[primaryField] != null) {
        return data[primaryField];
    }

    // Check fallback fields
    for (const fallback of fallbackFields) {
        if (data.hasOwnProperty(fallback) && data[fallback] != null) {
            return data[fallback];
        }
    }

    return '';
}

// Helper function to format dates for local input (Indonesian format)
OptimizedUtils.formatDateToLocalInput = function (dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        // Format as YYYY-MM-DD for HTML date inputs
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
};

// Helper function to format currency with symbol
OptimizedUtils.formatCurrencyWithSymbol = function (amount, currency) {
    if (amount === null || amount === undefined || isNaN(amount)) return '';

    const formattedAmount = new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);

    return `${currency} ${formattedAmount}`;
};

// Initialize the page - Optimized and flexible
async function initializePage() {
    if (AppState.initialized) return;
    try {
        // Update page title from URL parameters first
        updatePageTitleFromURL();

        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const stagingId = urlParams.get('stagingID');
        if (!stagingId) {
            OptimizedUtils.showNotification('No staging ID provided', 'error');
            setTimeout(() => goToMenuReceiveInvItem(), 2000);
            return;
        }

        // 1. Fetch invoice data terlebih dahulu
        let invoiceResult = null;
        Swal.fire({
            title: 'Loading Invoice Data...',
            html: 'Please wait while we fetch your invoice details.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        try {
            const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.invoices}/${stagingId}/details`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'accept': 'text/plain',
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            invoiceResult = await response.json();
        } catch (error) {
            Swal.close();
            console.error('❌ Initialization error (invoice fetch):', error);
            OptimizedUtils.showNotification('Gagal mengambil data invoice. Silakan refresh halaman.', 'error');
            return;
        }

        if (!invoiceResult || !invoiceResult.status || !invoiceResult.data) {
            Swal.close();
            OptimizedUtils.showNotification('Data invoice tidak valid.', 'error');
            return;
        }
        AppState.currentInvItemData = invoiceResult.data;
        // Debug: tampilkan seluruh data invoice yang diambil dari API
        console.log('==== FULL INVOICE DATA (AppState.currentInvItemData) ====');
        console.log(JSON.stringify(AppState.currentInvItemData, null, 2));
        console.log('========================================================');

        // 2. Set docType dari data invoice (prioritas field docType, fallback ke URL jika tidak ada)
        let docTypeFromApi = invoiceResult.data.docType;
        if (!docTypeFromApi) {
            // fallback: cek URL param docType
            docTypeFromApi = urlParams.get('docType') === 'service' ? 'S' : 'I';
        }
        AppState.docType = docTypeFromApi === 'S' ? 'S' : 'I';
        console.log('📋 Document type set:', AppState.docType);

        // 3. Setup page sesuai docType (this will handle title updates)
        setupPageForDocType();

        // 4. Get current user
        if (typeof window.getCurrentUser !== 'function') {
            window.getCurrentUser = function () {
                // Ambil kansaiEmployeeId dari localStorage/tokenstorage
                const kansaiEmployeeId = localStorage.getItem('kansaiEmployeeId') || sessionStorage.getItem('kansaiEmployeeId');
                // Bisa tambahkan field lain jika perlu
                return kansaiEmployeeId ? { kansaiEmployeeId } : null;
            };
        }
        AppState.currentUser = window.getCurrentUser();
        if (!AppState.currentUser) {
            Swal.close();
            await OptimizedUtils.showNotification('Please login to continue', 'error');
            window.location.href = '../../../../pages/login.html';
            return;
        }

        // Ambil status dokumen
        const approvalSummary = AppState.currentInvItemData?.arInvoiceApprovalSummary || {};
        const currentStatus = getStatusFromInvoice(AppState.currentInvItemData);
        // Ambil langsung dari localStorage, bukan dari AppState
        const userId = localStorage.getItem('kansaiEmployeeId') || sessionStorage.getItem('kansaiEmployeeId');
        console.log('[DEBUG] kansaiEmployeeId (langsung dari localStorage/sessionStorage):', userId);

        // Tentukan tindakan yang harus dilakukan user
        let action = '-';
        if (currentStatus === 'Prepared' && (userId === approvalSummary.checkedByKansaiId || userId === approvalSummary.checkedBy)) {
            action = 'CHECK (verifikasi/cek dokumen)';
        } else if (currentStatus === 'Checked' && (userId === approvalSummary.acknowledgedByKansaiId || userId === approvalSummary.acknowledgedBy)) {
            action = 'ACKNOWLEDGE (mengetahui dokumen)';
        } else if (currentStatus === 'Acknowledged' && (userId === approvalSummary.approvedByKansaiId || userId === approvalSummary.approvedBy)) {
            action = 'APPROVE (menyetujui dokumen)';
        } else if (currentStatus === 'Approved' && (userId === approvalSummary.receivedByKansaiId || userId === approvalSummary.receivedBy)) {
            action = 'RECEIVE (menerima dokumen)';
        } else if (currentStatus === 'Draft' && (userId === approvalSummary.preparedByKansaiId || userId === approvalSummary.preparedBy)) {
            action = 'PREPARE (menyusun dokumen)';
        } else if (currentStatus === 'Rejected') {
            action = 'Tidak ada tindakan, dokumen sudah ditolak.';
        } else if (currentStatus === 'Received') {
            action = 'Tidak ada tindakan, dokumen sudah selesai.';
        } else {
            action = 'Menunggu proses oleh user lain atau tidak ada tindakan.';
        }

        console.log('=== LOGIN & APPROVAL INFO ===');
        console.log(`Login sebagai Employee ID (dari tokenstorage/localStorage): ${userId}`);
        console.log(`Status dokumen sekarang: ${currentStatus}`);
        console.log(`Tindakan yang harus dilakukan user ini: ${action}`);
        console.log('==============================');


        // 5. Inisialisasi lain (users, event, summary, populate data, attachment)
        await Promise.allSettled([
            fetchUsers(),
            setupEventListeners(),
            initializeSummaryFields(),
            populateInvItemData(AppState.currentInvItemData),
            loadAttachments(stagingId)
        ]);

        // Hide status box under the title
        const statusBadge = OptimizedUtils.safeGetElement('statusBadge');
        if (statusBadge) {
            statusBadge.style.display = 'none';
        }

        // 6. Ensure print button is properly hidden initially
        const printBtn = OptimizedUtils.safeGetElement('printButton');
        if (printBtn) {
            printBtn.classList.add('hidden');
            printBtn.disabled = true;
            console.log('🔒 Print button initially hidden during initialization');
        }

        AppState.initialized = true;
        Swal.close();
        console.log('✅ Page initialized successfully for docType:', AppState.docType);

        // CRITICAL: Force print button check after initialization
        console.log('🔧 Post-initialization - Force checking print button');
        setTimeout(() => {
            handlePrintButtonVisibility();
        }, 200);
    } catch (error) {
        Swal.close();
        console.error('❌ Initialization error:', error);
        OptimizedUtils.showNotification('Initialization failed. Please refresh the page.', 'error');
    }
}

// Setup page based on document type
function setupPageForDocType() {
    console.log('🔧 setupPageForDocType called with docType:', AppState.docType);

    const config = DOC_TYPE_CONFIG[AppState.docType];
    if (!config) {
        console.error('❌ Invalid document type:', AppState.docType);
        return;
    }

    console.log('📋 Config found:', config);

    // Setup judul utama (khusus judul)
    updateFinalTitleWithDocType();

    // Setup judul tabel
    const tableTitle = OptimizedUtils.safeGetElement('tableTitle');
    if (tableTitle) {
        tableTitle.textContent = config.tableTitle;
        console.log('📊 Table title set:', config.tableTitle);
    }

    // Apply CSS class for showing/hiding columns - FORCE CLEAN REMOVAL
    document.body.classList.remove('item-mode', 'service-mode');
    document.body.className = document.body.className.replace(/\b(item-mode|service-mode)\b/g, '').trim();
    document.body.classList.add(config.className);

    console.log('🎨 CSS classes applied:', config.className);
    console.log('🔍 Body classes after setup:', document.body.className);

    // Debug: Check if freetext column should be visible
    console.log('🔍 Freetext column visibility check:', {
        docType: AppState.docType,
        isService: AppState.docType === 'S',
        cssClass: config.className,
        bodyClasses: document.body.className,
        freetextShouldBeVisible: AppState.docType === 'S',
        hasServiceMode: document.body.classList.contains('service-mode'),
        hasItemMode: document.body.classList.contains('item-mode')
    });

    // Force immediate check of freetext visibility
    setTimeout(() => {
        const freetextCols = document.querySelectorAll('.freetext-column');
        console.log('📊 Freetext columns found:', freetextCols.length);
        freetextCols.forEach((col, index) => {
            const computedStyle = window.getComputedStyle(col);
            console.log(`Column ${index + 1} display:`, computedStyle.display);
        });
    }, 100);

    console.log(`✅ Page configured for ${config.name} mode`);

    // Debug field visibility after mode setup
    debugFieldVisibility();
}

// Debug function to check field visibility
function debugFieldVisibility() {
    setTimeout(() => {
        console.log('🔍 FIELD VISIBILITY DEBUG:');
        console.log('Current docType:', AppState.docType);
        console.log('Body classes:', document.body.className);

        // Check service fields visibility
        const serviceFields = document.querySelector('.service-fields');
        const itemFields = document.querySelector('.item-fields');

        console.log('Service fields display:', serviceFields ? window.getComputedStyle(serviceFields).display : 'not found');
        console.log('Item fields display:', itemFields ? window.getComputedStyle(itemFields).display : 'not found');

        // Check specific field examples
        const sampleFields = AppState.docType === 'S' ?
            ['DocNum', 'CardCode', 'u_BSI_ShippingType', 'u_bsi_udf1'] :
            ['itemDocNum', 'itemCardCode', 'itemShippingType', 'itemUDF1'];

        sampleFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                console.log(`Field ${fieldId}: exists, value="${field.value}", visible=${field.offsetParent !== null}`);
            } else {
                console.log(`Field ${fieldId}: NOT FOUND`);
            }
        });
    }, 200);
}

// Update page title and status based on current status
function updatePageTitleAndStatus(status) {
    // Jangan update judul utama di sini, biarkan tetap dari URL param

    const config = DOC_TYPE_CONFIG[AppState.docType];
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG['Draft'];

    // Update status badge
    const statusBadge = OptimizedUtils.safeGetElement('statusBadge');
    const statusText = OptimizedUtils.safeGetElement('statusText');

    if (statusBadge && statusText) {
        statusBadge.className = `mt-2 inline-block px-4 py-2 rounded-full text-sm font-medium text-white ${statusConfig.color}`;
        statusText.textContent = status;
    }

    // Update approval progress
    updateApprovalProgress(status);

    // Update action buttons
    updateActionButtons(status);

    AppState.currentStatus = status;
}
// =========================
// === END KHUSUS JUDUL ===
// =========================

// Backward compatibility function for approval progress
function updateApprovalProgress(status) {
    return StatusBoxManager.updateApprovalProgress(status);
}



// Enhanced Status Box Manager using UI_CONFIG
const StatusBoxManager = {
    // Update current status display using configuration
    updateCurrentStatusDisplay: (status) => {
        // Always use API status for current status display
        let apiStatus = 'Draft';
        if (AppState.currentInvItemData) {
            apiStatus = getStatusFromInvoice(AppState.currentInvItemData);
        }

        const statusConfig = STATUS_CONFIG[apiStatus] || STATUS_CONFIG['Draft'];

        // Get elements using UI_CONFIG
        const statusIndicator = OptimizedUtils.safeGetElement(UI_CONFIG.statusBox.elements.statusIndicator);
        const currentStatusText = OptimizedUtils.safeGetElement(UI_CONFIG.title.elements.currentStatusText);
        const statusDescription = OptimizedUtils.safeGetElement(UI_CONFIG.title.elements.statusDescription);
        const currentStatusDisplay = OptimizedUtils.safeGetElement(UI_CONFIG.statusBox.elements.currentStatusDisplay);

        // Update elements using templates
        if (statusIndicator) {
            statusIndicator.className = UI_CONFIG.statusBox.templates.indicatorClass(statusConfig);
        }

        if (currentStatusText) {
            currentStatusText.textContent = UI_CONFIG.statusBox.templates.statusText(apiStatus);
        }

        if (statusDescription) {
            statusDescription.textContent = statusConfig.description;
        }

        if (currentStatusDisplay) {
            currentStatusDisplay.className = UI_CONFIG.statusBox.templates.statusClass(statusConfig);
        }
    },

    // Update approval progress with enhanced configuration
    updateApprovalProgress: (status) => {
        const steps = UI_CONFIG.progress.steps;
        const currentIndex = steps.indexOf(status);

        steps.forEach((step, index) => {
            const stepElement = OptimizedUtils.safeGetElement(`step-${step.toLowerCase()}`);
            const progressElement = OptimizedUtils.safeGetElement(`progress-${index + 1}`);

            if (stepElement) {
                const circle = stepElement.querySelector('.w-8');
                const text = stepElement.querySelector('span');

                if (circle && text) {
                    if (index <= currentIndex) {
                        // Completed or current step
                        circle.className = UI_CONFIG.progress.templates.completedStep;
                        text.className = UI_CONFIG.progress.templates.completedText;
                        stepElement.classList.add('completed');
                    } else {
                        // Future step
                        circle.className = UI_CONFIG.progress.templates.futureStep;
                        text.className = UI_CONFIG.progress.templates.futureText;
                        stepElement.classList.remove('completed');
                    }
                }
            }

            if (progressElement) {
                progressElement.style.width = index <= currentIndex ? '100%' : '0%';
            }
        });
    }
};

// Backward compatibility function
function updateCurrentStatusDisplay(status) {
    return StatusBoxManager.updateCurrentStatusDisplay(status);
}

// Optimized user fetching
async function fetchUsers() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.users}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.data) {
            AppState.allUsers = result.data;
            console.log('✅ Users loaded from API:', AppState.allUsers.length);
        }
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        // Non-critical error, don't show to user
    }
}



function getCurrentUserRole() {
    const status = AppState.currentStatus;

    // Map status to role for rejection prefix
    const roleMap = {
        'Prepared': 'Checker',
        'Checked': 'Acknowledger',
        'Acknowledged': 'Approver',
        'Approved': 'Receiver'
    };

    return roleMap[status] || 'User';
}

// Optimized summary fields initialization
function initializeSummaryFields() {
    const summaryFields = ['docTotal', 'discSum', 'netPriceAfterDiscount', 'dpp1112', 'vatSum', 'grandTotal'];

    summaryFields.forEach(fieldId => {
        const field = OptimizedUtils.safeGetElement(fieldId);
        if (field) {
            field.value = '0.00';
            field.classList.add('currency-input-idr');
        }
    });
}

// Function to update currency labels throughout the UI
function updateCurrencyLabels(currency) {
    const currencyLabelIds = [
        'docCurLabel', 'discCurLabel', 'salesCurLabel',
        'dppCurLabel', 'vatCurLabel', 'wtCurLabel', 'grandCurLabel'
    ];

    currencyLabelIds.forEach(labelId => {
        const label = document.getElementById(labelId);
        if (label) {
            label.textContent = currency;
        }
    });

    console.log(`✅ Currency labels updated to: ${currency}`);
}

// Load invoice item data - Optimized
function loadInvItemData() {
    const urlParams = new URLSearchParams(window.location.search);
    const stagingId = urlParams.get('stagingID');

    if (!stagingId) {
        OptimizedUtils.showNotification('No staging ID provided', 'error');
        setTimeout(() => goToMenuReceiveInvItem(), 2000);
        return;
    }

    return loadInvItemFromAPI(stagingId);
}

// Optimized API loading
async function loadInvItemFromAPI(stagingId) {
    try {
        console.log('🔄 Loading invoice item data for stagingId:', stagingId);

        // Show loading with better UX
        Swal.fire({
            title: 'Loading Invoice Data...',
            html: 'Please wait while we fetch your invoice details.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.invoices}/${stagingId}/details`;
        console.log('🔗 API URL AR Invoices:', apiUrl);
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status && result.data) {
            AppState.currentInvItemData = result.data;
            console.log('✅ Invoice item data loaded');
            console.log('🔍 FULL API RESPONSE DATA:', JSON.stringify(result.data, null, 2));

            // CRITICAL: Force print button check after data load
            console.log('🔧 Post-data-load - Force checking print button');
            setTimeout(() => {
                handlePrintButtonVisibility();
            }, 100);

            // Process data in parallel
            await Promise.allSettled([
                populateInvItemData(AppState.currentInvItemData),
                loadAttachments(stagingId)
            ]);

            Swal.close();
        } else {
            throw new Error('Invalid response format from API');
        }

    } catch (error) {
        console.error('❌ Error loading invoice item data:', error);

        const errorMessages = {
            '404': 'Invoice item not found. Please check the staging ID.',
            '500': 'Server error. Please try again later.',
            'NetworkError': 'Network error. Please check your connection.'
        };

        let errorMessage = 'Failed to load invoice item data';
        for (const [key, value] of Object.entries(errorMessages)) {
            if (error.message.includes(key)) {
                errorMessage = value;
                break;
            }
        }

        Swal.fire({
            icon: 'error',
            title: 'Loading Error',
            text: errorMessage
        }).then(() => goToMenuReceiveInvItem());
    }
}

// Optimized data population
function populateInvItemData(data) {
    console.log('🔄 Populating invoice item data');

    try {
        // Populate header fields efficiently with fallbacks
        // Service mode: specific field order and data mapping
        const statusFromApproval = data.arInvoiceApprovalSummary?.approvalStatus || getStatusFromInvoice(data);

        // Debug log for ALL API fields to understand data structure
        console.log('=== DEBUG: ALL API FIELD VALUES ===');
        console.log('stagingID:', data.stagingID);
        console.log('docNum:', data.docNum);
        console.log('cardCode:', data.cardCode);
        console.log('cardName:', data.cardName);
        console.log('address:', data.address);
        console.log('numAtCard:', data.numAtCard);
        console.log('docCur:', data.docCur);
        console.log('docRate:', data.docRate);
        console.log('docDate:', data.docDate);
        console.log('docDueDate:', data.docDueDate);
        console.log('licTradNum:', data.licTradNum);
        console.log('u_BSI_ShippingType:', data.u_BSI_ShippingType);
        console.log('U_BSI_PaymentGroup:', data.U_BSI_PaymentGroup);
        console.log('u_bsi_udf1:', data.u_bsi_udf1);
        console.log('u_bsi_udf2:', data.u_bsi_udf2);
        console.log('u_bsi_udf3:', data.u_bsi_udf3);
        console.log('account:', data.account);
        console.log('acctName:', data.acctName);
        console.log('u_BSI_Expressiv_IsTransfered:', data.u_BSI_Expressiv_IsTransfered);
        console.log('==============================');

        // Shared fields - both modes need these
        const sharedFields = {
            'DocEntry': data.stagingID || '',
            'comments': data.comments || ''
        };

        // Service Mode fields (original IDs)
        const serviceModeFields = {
            'DocNum': data.docNum || '',
            'CardCode': data.cardCode || '',
            'CardName': data.cardName || '',
            'Status': statusFromApproval,
            'address': data.address || '',
            'NumAtCard': data.numAtCard || '',
            'DocCur': data.docCur || 'IDR',
            'docRate': data.docRate || 1,
            'DocDate': OptimizedUtils.formatDateToLocalInput(data.docDate),
            'DocDueDate': OptimizedUtils.formatDateToLocalInput(data.docDueDate),
            'TaxNo': data.licTradNum || '',
            'u_BSI_ShippingType': data.u_BSI_ShippingType || '',
            'u_BSI_PaymentGroup': data.u_BSI_PaymentGroup || '',
            'u_bsi_udf1': data.u_bsi_invnum || '',  // Service mode uses u_bsi_invnum
            'u_bsi_udf2': data.u_bsi_udf2 || '',
            'u_bsi_udf3': data.u_bsi_udf3 || '',
            'account': data.account || '',
            'acctName': data.acctName || ''
        };

        // Item Mode fields (new unique IDs)
        const itemModeFields = {
            'itemDocNum': data.docNum || '',
            'itemCardCode': data.cardCode || '',
            'itemCardName': data.cardName || '',
            'itemStatus': statusFromApproval,
            'itemAddress': data.address || '',
            'itemNumAtCard': data.numAtCard || '',
            'itemDocCur': data.docCur || 'IDR',
            'itemDocRate': data.docRate || 1,
            'itemDocDate': OptimizedUtils.formatDateToLocalInput(data.docDate),
            'itemDocDueDate': OptimizedUtils.formatDateToLocalInput(data.docDueDate),
            'itemTaxNo': data.licTradNum || '',
            'itemShippingType': data.u_BSI_ShippingType || '',
            'itemPaymentGroup': data.u_BSI_PaymentGroup || '',
            'itemUDF1': data.u_bsi_sjnum || data.u_bsi_udf1 || '',  // Item mode uses u_bsi_sjnum
            'itemUDF2': data.u_bsi_pono || data.u_bsi_udf2 || '',   // Item mode uses u_bsi_pono
            'itemIsTransfered': data.u_BSI_Expressiv_IsTransfered || 'N',
            'itemAccount': data.account || '',
            'itemAcctName': data.acctName || ''

        };

        // Combine fields based on current mode
        const headerFields = { ...sharedFields };
        if (AppState.docType === 'S') {
            Object.assign(headerFields, serviceModeFields);
        } else {
            Object.assign(headerFields, itemModeFields);
        }

        console.log('📋 HEADER FIELDS TO POPULATE:', headerFields);

        // Debug: specifically check fields for current mode
        console.log('🔍 DEBUG MODE FIELDS:', {
            docType: AppState.docType,
            mode: AppState.docType === 'S' ? 'SERVICE' : 'ITEM',
            fieldsPopulated: Object.keys(headerFields).length,
            sampleFields: AppState.docType === 'S' ?
                {
                    u_bsi_udf3: data.u_bsi_udf3,
                    u_bsi_invnum: data.u_bsi_invnum
                } :
                {
                    u_bsi_sjnum: data.u_bsi_sjnum,
                    u_bsi_pono: data.u_bsi_pono
                }
        });

        // Batch update fields for better performance
        Object.entries(headerFields).forEach(([id, value]) => {
            console.log(`Setting ${AppState.docType === 'S' ? 'SERVICE' : 'ITEM'} field ${id} = "${value}"`);
            OptimizedUtils.safeSetValue(id, value);
        });

        // Status already populated in headerFields, update page title
        updatePageTitleAndStatus(statusFromApproval);

        // Debug: log summary data
        console.log('🔄 Summary Data:', {
            netPrice: data.netPrice,
            totalAmount: data.totalAmount,
            docTotal: data.docTotal,
            discSum: data.discSum,
            discountAmount: data.discountAmount,
            netPriceAfterDiscount: data.netPriceAfterDiscount,
            salesAmount: data.salesAmount,
            dpp1112: data.dpp1112,
            taxBase: data.taxBase,
            docTax: data.docTax,
            vatAmount: data.vatAmount,
            vatSum: data.vatSum,
            grandTotal: data.grandTotal
        });

        // Populate summary fields with currency formatting according to specification
        const currency = data.docCur || 'IDR';

        // Update currency labels in the UI
        updateCurrencyLabels(currency);

        const summaryFields = {
            'docTotal': OptimizedUtils.formatCurrencyIDR(data.netPrice || 0),
            'discSum': OptimizedUtils.formatCurrencyIDR(data.discSum || 0),
            'netPriceAfterDiscount': OptimizedUtils.formatCurrencyIDR(data.netPriceAfterDiscount || 0),
            'dpp1112': OptimizedUtils.formatCurrencyIDR(data.dpp1112 || 0),
            'vatSum': OptimizedUtils.formatCurrencyIDR(data.vatSum || 0),
            'wtSum': OptimizedUtils.formatCurrencyIDR(data.wtSum || 0),
            'grandTotal': OptimizedUtils.formatCurrencyIDR(data.grandTotal || 0)
        };

        console.log('💰 SUMMARY FIELDS TO POPULATE:', summaryFields);

        Object.entries(summaryFields).forEach(([id, value]) => {
            console.log(`Setting summary field ${id} = "${value}"`);
            OptimizedUtils.safeSetValue(id, value);
        });

        // Populate comments
        console.log('💬 Comments field:', data.comments);
        OptimizedUtils.safeSetValue('comments', data.comments);

        // Handle approval information efficiently
        if (data.arInvoiceApprovalSummary) {
            console.log('✅ Found approval summary, populating approval data...');
            populateApprovalData(data.arInvoiceApprovalSummary);

            // Validate approval workflow
            console.log('\n🔍 Validating approval workflow...');
            const workflowValidation = validateApprovalWorkflow(data.arInvoiceApprovalSummary);
            console.log('Workflow validation result:', workflowValidation);
        } else {
            console.log('⚠️ No approval summary found in data');
        }

        // Debug: log invoice details data
        console.log('🔄 Invoice Details Data:', {
            docType: AppState.docType,
            arInvoiceDetails: data.arInvoiceDetails,
            detailsCount: data.arInvoiceDetails ? data.arInvoiceDetails.length : 0,
            sampleDetail: data.arInvoiceDetails ? data.arInvoiceDetails[0] : null
        });

        // Debug: Check for freetext fields in sample detail
        if (data.arInvoiceDetails && data.arInvoiceDetails[0]) {
            const sampleItem = data.arInvoiceDetails[0];
            const freetextFields = {};
            ['text', 'freeTxt', 'freeText', 'remarks', 'comments', 'free_text'].forEach(field => {
                if (sampleItem.hasOwnProperty(field)) {
                    freetextFields[field] = sampleItem[field];
                }
            });
            console.log('🔍 Available freetext fields in sample item:', freetextFields);
            console.log('📋 All fields in sample item:', Object.keys(sampleItem));
        }

        // Populate items table based on doc type
        const invoiceDetails = data.arInvoiceDetails || data.invoiceDetails || data.details || [];
        console.log('🔍 Invoice Details to populate:', {
            arInvoiceDetails: data.arInvoiceDetails,
            invoiceDetails: data.invoiceDetails,
            details: data.details,
            fallback: invoiceDetails,
            finalData: invoiceDetails
        });

        console.log('📊 FINAL INVOICE DETAILS FOR TABLE:', invoiceDetails);
        populateItemsTable(invoiceDetails);

        // Apply formatting and make fields read-only
        setTimeout(() => {
            applyCurrencyFormattingToTable();
            makeAllFieldsReadOnly();
            if (typeof refreshTextWrapping === 'function') {
                refreshTextWrapping();
            }

            // Debug: check all fields after population
            if (typeof window.debugAllFieldsAfterPopulation === 'function') {
                console.log('🔍 Calling debug function after population...');
                window.debugAllFieldsAfterPopulation();
            }
        }, 100);

        // Save data for print functionality
        if (data.stagingID) {
            saveInvoiceDataToStorage(data.stagingID, data);
        }

        console.log('✅ Invoice item data populated successfully');

    } catch (error) {
        console.error('❌ Error populating invoice data:', error);
        OptimizedUtils.showNotification('Error displaying invoice data', 'error');
    }
}

// Optimized approval data population
function populateApprovalData(approvalSummary) {
    console.log('🔄 Populating approval data:', approvalSummary);

    const approvalFields = {
        'preparedBySearch': approvalSummary.preparedByName,
        'checkedBySearch': approvalSummary.checkedByName,
        'acknowledgeBySearch': approvalSummary.acknowledgedByName,
        'approvedBySearch': approvalSummary.approvedByName,
        'receivedBySearch': approvalSummary.receivedByName
    };

    console.log('📋 Approval fields to populate:', approvalFields);

    Object.entries(approvalFields).forEach(([id, value]) => {
        console.log(`Setting ${id} = "${value}"`);
        OptimizedUtils.safeSetValue(id, value || '');
    });

    // Handle rejection remarks efficiently
    const remarks = approvalSummary.revisionRemarks || approvalSummary.rejectionRemarks;
    if (remarks && remarks.trim() && remarks !== 'null' && remarks !== 'undefined') {
        OptimizedUtils.safeSetValue('rejectionRemarks', remarks);
        OptimizedUtils.safeSetValue('rejectedByName', approvalSummary.rejectedByName || '');

        // Format rejection date
        if (approvalSummary.rejectedDate) {
            try {
                const rejectedDate = new Date(approvalSummary.rejectedDate);
                if (!isNaN(rejectedDate.getTime())) {
                    OptimizedUtils.safeSetValue('rejectedDate', rejectedDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }));
                }
            } catch (error) {
                OptimizedUtils.safeSetValue('rejectedDate', approvalSummary.rejectedDate);
            }
        }

        OptimizedUtils.safeSetStyle('rejectionRemarksSection', 'display', 'block');
    } else {
        OptimizedUtils.safeSetStyle('rejectionRemarksSection', 'display', 'none');
    }
}

// Optimized attachment section visibility
function toggleAttachmentSectionVisibility(approvalStatus) {
    console.log('🔄 Toggle attachment section visibility for status:', approvalStatus);

    const attachmentSection = document.querySelector('.attachment-section');
    if (attachmentSection) {
        const shouldShow = approvalStatus === 'Received';
        attachmentSection.style.display = shouldShow ? 'block' : 'none';
        console.log(shouldShow ? '✅ Showing attachment section' : '❌ Hiding attachment section');
    }
}

// Optimized status determination with proper workflow validation
function getStatusFromInvoice(invoice) {
    // Early returns for better performance
    if (!invoice.arInvoiceApprovalSummary) return 'Draft';

    const summary = invoice.arInvoiceApprovalSummary;

    console.log('🔍 Analyzing approval workflow:', {
        approvalStatus: summary.approvalStatus,
        preparedDate: summary.preparedDate,
        checkedDate: summary.checkedDate,
        acknowledgedDate: summary.acknowledgedDate,
        approvedDate: summary.approvedDate,
        receivedDate: summary.receivedDate,
        isRejected: summary.isRejected
    });

    // Check if document is rejected
    if (summary.isRejected || summary.rejectedDate) return 'Rejected';

    // Check if document is transferred (auto-received)
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';

    // Check if document is in draft stage
    if (invoice.stagingID?.startsWith('STG') || !summary.preparedDate) return 'Draft';

    // Validate approval workflow step by step
    if (summary.preparedDate && !summary.checkedDate) {
        console.log('✅ Status: Prepared (waiting for check)');
        return 'Prepared';
    }

    if (summary.checkedDate && !summary.acknowledgedDate) {
        console.log('✅ Status: Checked (waiting for acknowledgment)');
        return 'Checked';
    }

    if (summary.acknowledgedDate && !summary.approvedDate) {
        console.log('✅ Status: Acknowledged (waiting for approval)');
        return 'Acknowledged';
    }

    if (summary.approvedDate && !summary.receivedDate) {
        console.log('✅ Status: Approved (waiting for receive)');
        return 'Approved';
    }

    if (summary.receivedDate) {
        console.log('✅ Status: Received (workflow completed)');
        return 'Received';
    }

    // Fallback: use approvalStatus if workflow validation fails
    if (summary.approvalStatus?.trim()) {
        console.log('⚠️ Using fallback approvalStatus:', summary.approvalStatus);
        return summary.approvalStatus;
    }

    console.log('⚠️ No valid status found, defaulting to Draft');
    return 'Draft';
}

// Optimized items table population - handles both Item and Service
function populateItemsTable(items) {
    console.log('🔄 Populating items table:', {
        itemsCount: items.length,
        docType: AppState.docType,
        firstItem: items[0],
        allItems: items,
        itemsType: typeof items,
        isArray: Array.isArray(items)
    });

    const tableBody = OptimizedUtils.safeGetElement('tableBody');
    if (!tableBody) {
        console.error('❌ Table body element not found');
        return;
    }

    // Clear existing content
    tableBody.innerHTML = '';

    // Handle null/undefined items
    if (!items || items === null || items === undefined) {
        const colSpan = AppState.docType === 'S' ? '10' : '13'; // Updated colspan for service mode
        tableBody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" class="p-4 text-center text-gray-500">
                    No ${AppState.docType === 'S' ? 'service' : 'item'} details found (items is null/undefined)
                </td>
            </tr>
        `;
        console.log('⚠️ Items is null/undefined');
        return;
    }

    // Handle empty array
    if (items.length === 0) {
        const colSpan = AppState.docType === 'S' ? '10' : '13'; // Updated colspan for service mode
        tableBody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" class="p-4 text-center text-gray-500">
                    No ${AppState.docType === 'S' ? 'service' : 'item'} details found (empty array)
                </td>
            </tr>
        `;
        console.log('⚠️ No items to display (empty array)');
        return;
    }

    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();

    // Service row creation for docType 'S' with updated mapping according to requirements
    function createServiceRow(item, index) {
        console.log(`🔍 [Service Row ${index + 1}] All keys/values:`, item);

        // Map fields according to requirements:
        // - dscription → description
        // - vatgroup → vatGroup (normalized)
        // - wtLiable → WTLiable (normalized) and show Y/N
        // - invQty (normalized)
        // - u_bsi_salprice for price

        const lineNum = item.lineNum || (index + 1);
        const description = item.dscription || item.description || '';
        const glAccount = item.acctCode || '';
        const accountName = item.freeTxt || item.freeText || item.text || ''; // freeTxt is Account Name for service
        const vatCode = item.vatgroup || item.vatGroup || '';
        const wtax = (item.wtLiable || item.WTLiable) ? 'Y' : 'N';
        const unit = item.unitMsr || '';
        const qty = item.invQty != null ? item.invQty : '';
        const price = item.u_bsi_salprice || item.priceBefDi || 0;
        const amount = item.lineTotal || 0;

        // Format numbers with proper currency display for service mode
        const currency = AppState.currentInvItemData?.docCur || 'IDR';
        const formattedPrice = OptimizedUtils.formatCurrencyIDR(price);
        const formattedAmount = OptimizedUtils.formatCurrencyIDR(amount);
        const formattedQty = qty;

        const row = document.createElement('tr');
        row.className = 'border-b';
        row.innerHTML = `
            <td class="p-2 no-column">${lineNum}</td>
            <td class="p-2 description-column service-only">${description}</td>
            <td class="p-2 account-code-column service-only">${glAccount}</td>
            <td class="p-2 account-name-column service-only">${accountName}</td>
            <td class="p-2 tax-code-column service-only">${vatCode}</td>
            <td class="p-2 wtax-column service-only">${wtax}</td>
            <td class="p-2 uom-column service-only">${unit}</td>
            <td class="p-2 quantity-column service-only">${formattedQty}</td>
            <td class="p-2 price-column service-only">${formattedPrice}</td>
            <td class="p-2 line-total-column service-only">${formattedAmount}</td>
        `;

        return row;
    }

    items.forEach((item, index) => {
        let row;
        if (AppState.docType === 'S') {
            row = createServiceRow(item, index);
            fragment.appendChild(row);
        } else {
            row = createOptimizedItemRow(item, index);
            fragment.appendChild(row);
        }
    });

    tableBody.appendChild(fragment);
}

// Optimized item row creation - handles both Item and Service
function createOptimizedItemRow(item, index) {
    console.log(`🔄 Creating row ${index + 1}:`, {
        itemCode: item.itemCode,
        dscription: item.dscription,
        quantity: item.quantity,
        invQty: item.invQty,
        priceBefDi: item.priceBefDi,
        u_bsi_salprice: item.u_bsi_salprice,
        lineTotal: item.lineTotal,
        fullItem: item
    });

    const row = document.createElement('tr');
    row.className = 'border-b';

    // Item mode structure - match the exact HTML header structure
    const cellData = [
        // No. column (always visible)
        { class: 'no-column', content: `<input type="number" class="line-num-input no-input p-2 border rounded bg-gray-100 cursor-not-allowed text-center" value="${index + 1}" disabled readonly />` },

        // Item Only Columns - matching HTML header order exactly
        { class: 'item-code-column item-only', content: `<input type="text" class="item-code-input p-2 border rounded bg-gray-100" value="${item.itemCode || ''}" disabled />` },
        { class: 'bp-catalog-column item-only', content: `<input type="text" class="bp-catalog-input p-2 border rounded bg-gray-100" value="${item.catalogNo || ''}" disabled />` },
        { class: 'description-column item-only', content: `<textarea class="w-full item-description bg-gray-100 resize-none overflow-visible" disabled style="height: 40px;">${item.dscription || ''}</textarea>` },
        { class: 'uom-column item-only', content: `<textarea class="w-full item-uom bg-gray-100 resize-none overflow-visible" disabled style="height: 40px;">${item.unitMsr || ''}</textarea>` },
        { class: 'packing-size-column item-only', content: `<textarea class="w-full item-packing-size bg-gray-100 resize-none overflow-visible" disabled style="height: 40px;">${item.unitMsr2 || ''}</textarea>` },
        { class: 'quantity-column item-only', content: `<textarea class="quantity-input item-sls-qty bg-gray-100 text-left currency-value" disabled style="height: 40px;">${OptimizedUtils.formatCurrencyIDR(item.quantity) || ''}</textarea>` },
        { class: 'quantity-column item-only', content: `<textarea class="quantity-input item-quantity bg-gray-100 text-left currency-value" disabled style="height: 40px;">${OptimizedUtils.formatCurrencyIDR(item.invQty) || ''}</textarea>` },
        { class: 'price-column item-only', content: `<textarea class="price-input item-sls-price bg-gray-100 text-left currency-value" disabled style="height: 40px;">${OptimizedUtils.formatCurrencyIDR(item.u_bsi_salprice) || ''}</textarea>` },
        { class: 'price-column item-only', content: `<textarea class="price-input item-price bg-gray-100 text-left currency-value" disabled style="height: 40px;">${OptimizedUtils.formatCurrencyIDR(item.priceBefDi) || ''}</textarea>` },
        { class: 'tax-code-column item-only', content: `<input type="text" class="w-full p-2 border rounded bg-gray-100" disabled value="${item.vatgroup || ''}" />` },
        { class: 'line-total-column item-only', content: `<textarea class="line-total-input item-line-total bg-gray-100 text-left currency-value" disabled style="height: 40px;">${OptimizedUtils.formatCurrencyIDR(item.lineTotal) || ''}</textarea>` },

        // Service Only Columns (hidden in item mode)
        { class: 'description-column service-only', content: `<textarea class="w-full item-description bg-gray-100 resize-none overflow-auto" disabled style="height: 40px;">${item.dscription || ''}</textarea>` },
        { class: 'account-code-column service-only', content: `<input type="text" class="w-full p-2 border rounded bg-gray-100" disabled value="${item.acctCode || ''}" />` },
        { class: 'account-name-column service-only', content: `<textarea class="w-full bg-gray-100 resize-none overflow-auto" disabled style="height: 40px;">${item.text || item.freeTxt || item.freeText || item.remarks || ''}</textarea>` },
        { class: 'tax-code-column service-only', content: `<input type="text" class="w-full p-2 border rounded bg-gray-100" disabled value="${item.vatgroup || ''}" />` },
        { class: 'wtax-column service-only', content: `<input type="text" class="w-full p-2 border rounded bg-gray-100" disabled value="${item.wtLiable || 'N'}" />` },
        { class: 'uom-column service-only', content: `<input type="text" class="w-full p-2 border rounded bg-gray-100" disabled value="${item.unitMsr || ''}" />` },
        { class: 'quantity-column service-only', content: `<input type="text" class="w-full p-2 border rounded bg-gray-100 text-left" disabled value="${OptimizedUtils.formatCurrencyIDR(item.invQty) || ''}" />` },
        { class: 'price-column service-only', content: `<input type="text" class="w-full p-2 border rounded bg-gray-100 text-left" disabled value="${OptimizedUtils.formatCurrencyIDR(item.u_bsi_salprice) || ''}" />` },
        { class: 'line-total-column service-only', content: `<input type="text" class="w-full p-2 border rounded bg-gray-100 text-left" disabled value="${OptimizedUtils.formatCurrencyIDR(item.lineTotal) || ''}" />` }
    ];

    // Hidden columns for backward compatibility
    const hiddenColumns = [
        { class: 'base-column hidden', content: `<input type="number" class="w-full p-2 border rounded bg-gray-100" disabled value="${item.baseType || 0}" />` },
        { class: 'base-column hidden', content: `<input type="number" class="w-full p-2 border rounded bg-gray-100" disabled value="${item.baseEntry || 0}" />` },
        { class: 'base-column hidden', content: `<input type="number" class="w-full p-2 border rounded bg-gray-100" disabled value="${item.baseLine || 0}" />` },
        { class: 'base-column hidden', content: `<input type="number" class="w-full p-2 border rounded bg-gray-100" disabled value="${item.lineType || 0}" />` }
    ];

    // Combine all cell data
    const allCellData = [...cellData, ...hiddenColumns];

    allCellData.forEach(({ class: className, content }) => {
        const cell = document.createElement('td');
        cell.className = `p-2 border ${className}`;
        cell.innerHTML = content;
        row.appendChild(cell);
    });

    return row;
}

// Optimized event listeners setup
function setupEventListeners() {
    // Minimal setup since most functionality is in external files
    console.log('✅ Event listeners setup completed');
}

// ===== MULTI-APPROVAL FUNCTIONS =====

// Check document function
async function checkDocument() {
    await updateInvItemStatus('Checked');
}

// Acknowledge document function
async function acknowledgeDocument() {
    await updateInvItemStatus('Acknowledged');
}

// Approve document function
async function approveDocument() {
    await updateInvItemStatus('Approved');
}

// Receive function (updated from original)
async function receiveInvItem() {
    await updateInvItemStatus('Received');
}


// Optimized reject function with multi-approval support
async function rejectInvItem() {
    try {
        if (!AppState.currentInvItemData) {
            OptimizedUtils.showNotification('No invoice item data available', 'error');
            return;
        }

        const status = getStatusFromInvoice(AppState.currentInvItemData);
        if (status === 'Received') {
            OptimizedUtils.showNotification('Cannot reject a received document.', 'error');
            return;
        }

        const rejectionReason = await showRejectionDialog();
        if (!rejectionReason) return;

        await updateInvItemStatus('Rejected', rejectionReason);
    } catch (error) {
        console.error('❌ Error rejecting document:', error);
        OptimizedUtils.showNotification(`Failed to reject document: ${error.message}`, 'error');
    }
}

// Show rejection dialog with user prefix
async function showRejectionDialog() {
    const { value: rejectionReason } = await Swal.fire({
        title: `Reject AR Invoice ${DOC_TYPE_CONFIG[AppState.docType].name}`,
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
            const prefixLength = parseInt(field?.dataset.prefixLength || '0');
            const contentAfterPrefix = remarks.substring(prefixLength).trim();

            if (!contentAfterPrefix) {
                Swal.showValidationMessage('Please enter a rejection reason');
                return false;
            }
            return remarks;
        }
    });

    return rejectionReason;
}

// Build rejection request data
function buildRejectionRequestData(userId, rejectionReason) {
    const approval = AppState.currentInvItemData?.arInvoiceApprovalSummary || {};
    const currentDate = new Date().toISOString();
    const currentUserName = getCurrentUserFullName();

    return {
        stagingID: AppState.currentInvItemData?.stagingID,
        createdAt: AppState.currentInvItemData?.createdAt || currentDate,
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
        rejectedBy: userId,
        rejectionRemarks: rejectionReason,
        revisionNumber: approval.revisionNumber || null,
        revisionDate: approval.revisionDate || null,
        revisionRemarks: approval.revisionRemarks || null
    };
}

// Initialize rejection prefix
function initializeWithRejectionPrefix(textarea) {
    const userInfo = getCurrentUserFullName();
    const role = getCurrentUserRole();
    const prefix = `[${userInfo} - ${role}]: `;
    textarea.value = prefix;
    textarea.dataset.prefixLength = prefix.length;
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();
}

// Handle rejection input to maintain prefix
function handleRejectionInput(event) {
    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
    const userInfo = getCurrentUserFullName();
    const role = getCurrentUserRole();
    const expectedPrefix = `[${userInfo} - ${role}]: `;

    if (!textarea.value.startsWith(expectedPrefix)) {
        const userText = textarea.value.substring(prefixLength);
        textarea.value = expectedPrefix + userText;
        textarea.setSelectionRange(prefixLength, prefixLength);
    } else if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
        textarea.setSelectionRange(prefixLength, prefixLength);
    }
}


// ===== PRINT AND EXPORT FUNCTIONS =====

// Optimized print function
function printInvItem() {
    try {
        console.log("🔄 Starting print function");

        if (!AppState.currentInvItemData) {
            OptimizedUtils.showNotification('No invoice data available for printing', 'error');
            return;
        }

        const stagingID = AppState.currentInvItemData.stagingID || 'STG-UNKNOWN';

        // Prepare invoice data efficiently
        const invData = {
            stagingID,
            docType: AppState.docType,
            ...extractFormData(),
            arInvoiceDetails: extractTableData()
        };

        // Save and open print page
        if (saveInvoiceDataToStorage(stagingID, invData)) {
            // Get URL parameters to pass to print page
            const urlStatus = getUrlParameter('status');
            const urlSource = getUrlParameter('source');
            const statusParam = urlStatus ? `&status=${urlStatus}` : '';
            const sourceParam = urlSource ? `&source=${urlSource}` : '';

            console.log('🖨️ =================================');
            console.log('🖨️ PRINT FUNCTION DEBUG');
            console.log('🖨️ =================================');
            console.log('🖨️ URL Status from parameter:', urlStatus);
            console.log('🖨️ URL Source from parameter:', urlSource);
            console.log('🖨️ Status param for print URL:', statusParam);
            console.log('🖨️ Source param for print URL:', sourceParam);
            console.log('🖨️ Current window URL:', window.location.href);
            console.log('🖨️ =================================');

            const printURL = `printARItem.html?stagingID=${stagingID}&docType=${AppState.docType}${statusParam}${sourceParam}`;
            console.log('🖨️ Opening print window with URL:', printURL);

            const printWindow = window.open(printURL, '_blank');

            if (printWindow) {
                printWindow.onload = function () {
                    try {
                        if (printWindow.populateInvoiceData) {
                            printWindow.populateInvoiceData(invData);
                        }
                    } catch (e) {
                        console.error("❌ Error passing data to print window:", e);
                    }
                };
            }
        }

        console.log("✅ Print function completed");

    } catch (error) {
        console.error("❌ Error in printInvItem function:", error);
        OptimizedUtils.showNotification('Error occurred while printing: ' + error.message, 'error');
    }
}

// Extract form data efficiently
function extractFormData() {
    const formFields = [
        'DocNum', 'CardName', 'CardCode', 'NumAtCard', 'DocDate', 'DocCur',
        'GroupNum', 'TrnspCode', 'U_BSI_ShippingType', 'U_BSI_PaymentGroup',
        'U_BSI_UDF1', 'U_BSI_UDF2', 'account', 'acctName', 'DocTotal',
        'VatSum', 'PriceBefDi', 'comments', 'preparedBySearch',
        'checkedBySearch', 'acknowledgeBySearch', 'approvedBySearch', 'receivedBySearch'
    ];

    // Add service-specific fields
    if (AppState.docType === 'S') {
        formFields.push('u_bsi_udf3', 'WTSum', 'WTSumFC');
    }

    const data = {};
    formFields.forEach(field => {
        const element = OptimizedUtils.safeGetElement(field);
        if (element) {
            data[field] = element.value || '';
        }
    });

    return data;
}

// Extract table data efficiently - handles both Item and Service
function extractTableData() {
    const tableBody = OptimizedUtils.safeGetElement('tableBody');
    if (!tableBody) return [];

    const rows = tableBody.querySelectorAll('tr');
    const items = [];

    rows.forEach((row, index) => {
        const getRowValue = (selector, defaultValue = '') => {
            const element = row.querySelector(selector);
            return element ? (element.value || defaultValue) : defaultValue;
        };

        const getRowNumber = (selector, defaultValue = 0) => {
            return parseFloat(getRowValue(selector)) || defaultValue;
        };

        const item = {
            lineNum: index + 1,
            dscription: getRowValue('.item-description'),
            invQty: getRowNumber('.item-quantity'),
            unitMsr: getRowValue('.item-uom', 'PCS'),
            priceBefDi: getRowNumber('.item-price'),
            vatgroup: getRowValue('.item-tax-code', 'VAT'),
            lineTotal: getRowNumber('.item-line-total'),
            acctCode: getRowValue('.item-account-code', '4000'),
            baseType: getRowNumber('.item-base-type'),
            baseEntry: getRowNumber('.item-base-entry'),
            baseLine: getRowNumber('.item-base-line'),
            lineType: getRowNumber('.item-line-type')
        };

        // Add item-specific fields
        if (AppState.docType === 'I') {
            item.itemCode = getRowValue('.item-code-input');
            item.catalogNo = getRowValue('.bp-catalog-input');
            item.quantity = getRowNumber('.item-sls-qty');
            item.unitMsr2 = getRowValue('.item-packing-size');
            item.u_bsi_salprice = getRowNumber('.item-sls-price');
        }

        // Add service-specific fields
        if (AppState.docType === 'S') {
            item.wtLiable = getRowValue('.wtax-input', 'N');
            item.freeTxt = getRowValue('.account-name-input');
        }

        items.push(item);
    });

    return items;
}

// ===== UTILITY AND HELPER FUNCTIONS =====

// Optimized field read-only function
function makeAllFieldsReadOnly() {
    // Use efficient selectors
    const selectors = [
        'input[type="text"]:not([id$="Search"])',
        'input[type="date"]',
        'input[type="number"]',
        'textarea'
    ];

    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(field => {
            field.readOnly = true;
            field.classList.add('bg-gray-100', 'cursor-not-allowed');
            field.classList.remove('bg-white');
        });
    });

    // Handle search inputs
    document.querySelectorAll('input[id$="Search"]').forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100');
        field.removeAttribute('onkeyup');
    });

    // Handle select fields (exclude environment switcher)
    document.querySelectorAll('select:not(#kasboEnvSelect)').forEach(field => {
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });

    // Handle checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(field => {
        field.disabled = true;
        field.classList.add('cursor-not-allowed');
    });

    // Ensure environment switcher remains interactive
    const envSelect = OptimizedUtils.safeGetElement('kasboEnvSelect');
    if (envSelect) {
        envSelect.disabled = false;
        envSelect.classList.remove('cursor-not-allowed', 'bg-gray-100');
    }

    console.log('✅ All fields set to read-only');
}

// Navigation function
function goToMenuReceiveInvItem() {
    // Prefer back if possible, else go to menuARItemCheck.html
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/approvalPages/dashboard/dashboardCheck/ARInvoice/menuARItemCheck.html';
    }
}

// Storage functions
function saveInvoiceDataToStorage(stagingID, invoiceData) {
    try {
        const jsonData = JSON.stringify(invoiceData);
        localStorage.setItem(`invoice_${stagingID}`, jsonData);
        sessionStorage.setItem(`invoice_${stagingID}`, jsonData);
        console.log('✅ Invoice data saved to storage for stagingID:', stagingID);
        return true;
    } catch (error) {
        console.error('❌ Error saving invoice data to storage:', error);
        return false;
    }
}

function clearInvoiceDataFromStorage(stagingID) {
    try {
        localStorage.removeItem(`invoice_${stagingID}`);
        sessionStorage.removeItem(`invoice_${stagingID}`);
        console.log('✅ Invoice data cleared from storage for stagingID:', stagingID);
        return true;
    } catch (error) {
        console.error('❌ Error clearing invoice data from storage:', error);
        return false;
    }
}

// Optimized currency formatting for table
function applyCurrencyFormattingToTable() {
    // Format semua cell dengan class 'currency-value' di seluruh tabel agar tampil dengan pemisah ribuan
    document.querySelectorAll('.currency-value').forEach(cell => {
        // Untuk textarea/input, gunakan value, untuk td gunakan textContent
        if (cell.tagName === 'TEXTAREA' || cell.tagName === 'INPUT') {
            cell.value = OptimizedUtils.formatCurrencyIDR(cell.value);
        } else {
            cell.textContent = OptimizedUtils.formatCurrencyIDR(cell.textContent);
        }
        cell.classList.add('currency-input-idr');
    });
    console.log('✅ Currency formatting applied to table');
}

// ===== ATTACHMENT FUNCTIONS =====

// Optimized attachment loading
async function loadAttachments(stagingId) {
    try {
        console.log('🔄 Loading attachments for stagingId:', stagingId);

        const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.invoices}/${stagingId}/attachments`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'accept': '*/*' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status && result.data) {
            console.log('✅ Attachments loaded:', result.data.length);
            displayAttachments(result.data);
        } else {
            throw new Error('Invalid response format from attachments API');
        }

    } catch (error) {
        console.error('❌ Error loading attachments:', error);
        displayNoAttachments();
    }
}

// Optimized attachment display
function displayAttachments(attachments) {
    // Get the appropriate containers based on current mode
    const attachmentListService = OptimizedUtils.safeGetElement('attachmentsContainer');
    const attachmentListItem = OptimizedUtils.safeGetElement('itemAttachmentsContainer');
    const noAttachmentsService = OptimizedUtils.safeGetElement('noAttachments');
    const noAttachmentsItem = OptimizedUtils.safeGetElement('itemNoAttachments');

    const attachmentList = AppState.docType === 'S' ? attachmentListService : attachmentListItem;
    const noAttachmentsDiv = AppState.docType === 'S' ? noAttachmentsService : noAttachmentsItem;

    if (!attachmentList) {
        console.error(`❌ Attachment list container not found for mode: ${AppState.docType}`);
        return;
    }

    // Clear loading content
    attachmentList.innerHTML = '';

    if (!attachments || attachments.length === 0) {
        displayNoAttachments();
        return;
    }

    // Filter valid attachments efficiently
    const validAttachments = attachments.filter(attachment =>
        attachment.fileName &&
        attachment.fileName !== 'string' &&
        attachment.fileName.trim() !== '' &&
        attachment.fileUrl &&
        attachment.fileUrl !== 'string' &&
        attachment.fileUrl.trim() !== '' &&
        attachment.id
    );

    if (validAttachments.length === 0) {
        displayNoAttachments();
        return;
    }

    // Hide no attachments message
    if (noAttachmentsDiv) {
        noAttachmentsDiv.classList.add('hidden');
    }

    // Create attachment list efficiently
    const fragment = document.createDocumentFragment();
    validAttachments.forEach((attachment, index) => {
        const attachmentItem = createAttachmentItem(attachment, index);
        fragment.appendChild(attachmentItem);
    });

    attachmentList.appendChild(fragment);
    console.log(`✅ Displayed ${validAttachments.length} valid attachments`);
}

// Optimized attachment item creation
function createAttachmentItem(attachment, index) {
    const attachmentDiv = document.createElement('div');
    attachmentDiv.className = 'attachment-item border rounded-lg p-3 mb-2 bg-gray-50 hover:bg-gray-100 transition-colors';

    const fileName = attachment.fileName || 'Unknown file';
    const description = attachment.description || '';
    const fileSize = formatAttachmentDate(attachment.createdAt);
    const fileIcon = getFileIcon(fileName.split('.').pop()?.toLowerCase() || '');

    attachmentDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1">
                <div class="file-icon text-2xl">${fileIcon}</div>
                <div class="flex-1 min-w-0">
                    <div class="file-name font-medium text-gray-900 truncate" title="${fileName}">
                        ${fileName}
                    </div>
                    <div class="file-info text-sm text-gray-500">
                        <span>Uploaded: ${fileSize}</span>
                        ${description ? `<span class="ml-2">• ${description}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button type="button" 
                        class="view-btn px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        onclick="viewAttachment('${attachment.stagingID}', '${attachment.fileUrl}', '${fileName.replace(/'/g, "\\'")}')"
                        title="View ${fileName}">
                    <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
                    </svg>
                    View
                </button>
            </div>
        </div>
    `;

    return attachmentDiv;
}

function displayNoAttachments() {
    // Get the appropriate containers based on current mode
    const attachmentListService = OptimizedUtils.safeGetElement('attachmentsContainer');
    const attachmentListItem = OptimizedUtils.safeGetElement('itemAttachmentsContainer');
    const noAttachmentsService = OptimizedUtils.safeGetElement('noAttachments');
    const noAttachmentsItem = OptimizedUtils.safeGetElement('itemNoAttachments');

    const attachmentList = AppState.docType === 'S' ? attachmentListService : attachmentListItem;
    const noAttachmentsDiv = AppState.docType === 'S' ? noAttachmentsService : noAttachmentsItem;

    if (attachmentList) {
        attachmentList.innerHTML = '';
    }

    if (noAttachmentsDiv) {
        noAttachmentsDiv.classList.remove('hidden');
        console.log(`📎 No attachments to display for mode: ${AppState.docType}`);
    }
}

// Utility functions for attachments
function getFileIcon(extension) {
    const iconMap = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'xls': '📊',
        'xlsx': '📊',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'zip': '🗜️',
        'rar': '🗜️'
    };

    return iconMap[extension] || '📎';
}

function formatAttachmentDate(dateString) {
    if (!dateString) return 'Unknown date';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Unknown date';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('❌ Error formatting date:', error);
        return 'Unknown date';
    }
}

// Optimized attachment viewing - Always open in new tab
async function viewAttachment(stagingId, fileUrl, fileName) {
    try {
        console.log('🔄 Viewing attachment:', { stagingId, fileUrl, fileName });

        // Construct full view URL efficiently
        const viewUrl = fileUrl.startsWith('http') ?
            fileUrl :
            `${API_CONFIG.BASE_URL}${fileUrl.replace('/api', '')}`;

        // Always open in new tab regardless of file type
        openInNewTab(viewUrl, fileName);

    } catch (error) {
        console.error('❌ Error viewing attachment:', error);
        OptimizedUtils.showNotification(`Failed to open ${fileName}. Please try again.`, 'error');
    }
}

// Optimized PDF viewer
async function showPDFViewer(pdfUrl, fileName) {
    try {
        Swal.fire({
            title: 'Loading PDF...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const response = await fetch(pdfUrl, {
            method: 'GET',
            headers: { 'accept': 'application/pdf,*/*' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        Swal.fire({
            title: fileName,
            html: `
                <div style="width: 100%; height: 70vh; margin: 10px 0;">
                    <iframe 
                        src="${blobUrl}" 
                        style="width: 100%; height: 100%; border: none;"
                        type="application/pdf">
                        <p>Your browser doesn't support PDF viewing. 
                           <a href="${blobUrl}" target="_blank">Click here to open the PDF</a>
                        </p>
                    </iframe>
                </div>
            `,
            width: '90%',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Close',
            willClose: () => URL.revokeObjectURL(blobUrl)
        });

    } catch (error) {
        console.error('❌ Error loading PDF:', error);

        // Fallback to Google Docs viewer
        Swal.fire({
            title: fileName,
            html: `
                <div style="width: 100%; height: 70vh; margin: 10px 0;">
                    <iframe 
                        src="https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true" 
                        style="width: 100%; height: 100%; border: none;">
                    </iframe>
                </div>
            `,
            width: '90%',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Close'
        });
    }
}

async function openInNewTab(fileUrl, fileName) {
    try {
        OptimizedUtils.showNotification(`Opening ${fileName}...`, 'info', 1500);

        // Fetch the file and create blob URL
        const response = await fetch(fileUrl, {
            method: 'GET',
            headers: { 'accept': '*/*' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Open blob URL in new tab
        const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');

        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Fallback: create download link
            const link = document.createElement('a');
            link.href = blobUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Clean up blob URL after some time
        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 60000); // 1 minute

    } catch (error) {
        console.error('❌ Error opening file in new tab:', error);
        OptimizedUtils.showNotification(`Failed to open ${fileName}. Please try again.`, 'error');
    }
}

// Download PDF Document function
function downloadPdfDocument() {
    printInvItem();

    OptimizedUtils.showNotification('Use your browser\'s print dialog to save as PDF', 'info', 5000);
}

// ===== E-SIGNING FUNCTIONS =====

// Show E-Signing section
function showESigningSection() {
    const eSigningSection = OptimizedUtils.safeGetElement('eSigningSection');
    if (eSigningSection) {
        eSigningSection.style.display = 'block';
        eSigningSection.scrollIntoView({ behavior: 'smooth' });

        // Initialize E-Signing if available
        if (typeof initializeESigningFeatures === 'function') {
            try {
                initializeESigningFeatures();
                console.log('✅ E-signing features initialized');
            } catch (error) {
                console.warn('⚠️ E-signing initialization failed:', error);
            }
        }
    }
}

// ===== INITIALIZATION AND EXPORTS =====

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM Content Loaded - initializing page');
    initializePage();

    // CRITICAL: Force print button check on DOM ready
    setTimeout(() => {
        console.log('🔧 DOM Ready - Force checking print button');
        handlePrintButtonVisibility();
    }, 500);
});

// Backup: Window onload event
window.addEventListener('load', function () {
    console.log('🚀 Window fully loaded - final print button check');
    setTimeout(() => {
        handlePrintButtonVisibility();
    }, 1000);
});

// Global function exports for backward compatibility
window.receiveInvItem = receiveInvItem;
window.rejectInvItem = rejectInvItem;
window.checkDocument = checkDocument;
window.acknowledgeDocument = acknowledgeDocument;
window.approveDocument = approveDocument;
window.printInvItem = printInvItem;
window.downloadPdfDocument = downloadPdfDocument;
window.goToMenuReceiveInvItem = goToMenuReceiveInvItem;
window.saveInvoiceDataToStorage = saveInvoiceDataToStorage;
window.clearInvoiceDataFromStorage = clearInvoiceDataFromStorage;
window.showESigningSection = showESigningSection;

// Debug functions for print button
window.handlePrintButtonVisibility = handlePrintButtonVisibility;
window.debugPrintButton = () => {
    console.log('🔧 DEBUG: Manual print button check');
    handlePrintButtonVisibility();
};
window.forcePrintButton = () => {
    console.log('🔧 FORCE: Forcing print button to show');
    const printBtn = document.getElementById('printButton');
    if (printBtn) {
        printBtn.classList.remove('hidden');
        printBtn.disabled = false;
        printBtn.style.display = 'inline-block';
        console.log('✅ Print button forced to show');
    } else {
        console.error('❌ Print button not found');
    }
};

// Export attachment functions
window.loadAttachments = loadAttachments;
window.displayAttachments = displayAttachments;
window.createAttachmentItem = createAttachmentItem;
window.displayNoAttachments = displayNoAttachments;
window.getFileIcon = getFileIcon;
window.formatAttachmentDate = formatAttachmentDate;
window.viewAttachment = viewAttachment;
window.showPDFViewer = showPDFViewer;
window.openInNewTab = openInNewTab;

// Export utility functions
window.OptimizedUtils = OptimizedUtils;
window.AppState = AppState;
window.updatePageTitleAndStatus = updatePageTitleAndStatus;
window.updateApprovalProgress = updateApprovalProgress;
window.updateActionButtons = updateActionButtons;
window.debugCheckButtonVisibility = debugCheckButtonVisibility;
window.debugDataPopulation = debugDataPopulation;
window.validateApprovalWorkflow = validateApprovalWorkflow;
window.getNextActionRequired = getNextActionRequired;
window.getCurrentUserActionInfo = getCurrentUserActionInfo;
window.displayApprovalWorkflowInfo = displayApprovalWorkflowInfo;

// Debug function to test print button visibility
// Debug function to test print button visibility
window.debugPrintButtonVisibility = function () {
    console.log('🔍 DEBUGGING PRINT BUTTON VISIBILITY');

    const printBtn = document.getElementById('printButton');
    if (!printBtn) {
        console.log('❌ Print button element not found');
        return;
    }

    // Get URL parameters using existing function
    const urlStatus = getUrlParameter('status');
    const urlSource = getUrlParameter('source');

    const isHidden = printBtn.classList.contains('hidden');
    const isDisabled = printBtn.disabled;

    console.log('📊 Print Button Status:');
    console.log('   Element exists:', true);
    console.log('   Has hidden class:', isHidden);
    console.log('   Is disabled:', isDisabled);
    console.log('   URL status:', urlStatus);
    console.log('   URL source:', urlSource);

    // Check URL conditions for print button
    const statusIsReceived = urlStatus && urlStatus.toLowerCase() === 'received';
    const statusIsApproved = urlStatus && urlStatus.toLowerCase() === 'approved';
    const shouldBeVisible = statusIsReceived || statusIsApproved;

    console.log('🔍 URL Conditions Check:');
    console.log('   Status is Received:', statusIsReceived);
    console.log('   Status is Approved:', statusIsApproved);
    console.log('   Should be visible:', shouldBeVisible);

    // Test visibility logic based on URL
    if (shouldBeVisible) {
        console.log('✅ Print button SHOULD be visible');
        if (isHidden) {
            console.log('⚠️ But it\'s currently hidden - forcing visibility');
            printBtn.classList.remove('hidden');
            printBtn.disabled = false;
        }
    } else {
        console.log('❌ Print button SHOULD be hidden');
        console.log('   Reason: URL status is not Received or Approved');
        if (!isHidden) {
            console.log('⚠️ But it\'s currently visible - forcing hidden');
            printBtn.classList.add('hidden');
            printBtn.disabled = true;
        }
    }

    console.log('=== END PRINT BUTTON DEBUG ===');
};


// Debug utility: check all fields after population
window.debugAllFieldsAfterPopulation = function () {
    console.log('🔍 DEBUGGING ALL FIELDS AFTER POPULATION');

    // Check header fields
    const headerFieldIds = [
        'DocEntry', 'DocNum', 'CardCode', 'CardName', 'Status', 'address', 'NumAtCard',
        'DocCur', 'docRate', 'DocDate', 'DocDueDate', 'GroupNum', 'TrnspCode', 'TaxNo',
        'U_BSI_ShippingType', 'U_BSI_PaymentGroup', 'U_BSI_Expressiv_IsTransfered',
        'U_BSI_UDF1', 'U_BSI_UDF2', 'account', 'acctName'
    ];

    console.log('📋 HEADER FIELDS:');
    headerFieldIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`  ${id}: "${element.value}" (exists: true)`);
        } else {
            console.log(`  ${id}: NOT FOUND (exists: false)`);
        }
    });

    // Check summary fields
    const summaryFieldIds = ['docTotal', 'discSum', 'netPriceAfterDiscount', 'dpp1112', 'vatSum', 'grandTotal'];
    console.log('💰 SUMMARY FIELDS:');
    summaryFieldIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`  ${id}: "${element.value}" (exists: true)`);
        } else {
            console.log(`  ${id}: NOT FOUND (exists: false)`);
        }
    });

    // Check approval fields
    const approvalFieldIds = ['preparedBySearch', 'checkedBySearch', 'acknowledgeBySearch', 'approvedBySearch', 'receivedBySearch'];
    console.log('👥 APPROVAL FIELDS:');
    approvalFieldIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`  ${id}: "${element.value}" (exists: true)`);
        } else {
            console.log(`  ${id}: NOT FOUND (exists: false)`);
        }
    });

    // Check comments field
    const commentsElement = document.getElementById('comments');
    console.log('💬 COMMENTS FIELD:');
    if (commentsElement) {
        console.log(`  comments: "${commentsElement.value}" (exists: true)`);
    } else {
        console.log(`  comments: NOT FOUND (exists: false)`);
    }

    // Check table
    const tableBody = document.getElementById('tableBody');
    console.log('📊 TABLE STATUS:');
    if (tableBody) {
        const rows = tableBody.querySelectorAll('tr');
        console.log(`  tableBody exists: true, rows count: ${rows.length}`);
        if (rows.length > 0) {
            console.log(`  First row content: ${rows[0].innerHTML.substring(0, 200)}...`);
        }
    } else {
        console.log(`  tableBody: NOT FOUND (exists: false)`);
    }

    console.log('=== END FIELD DEBUG ===');
};

console.log('✅ Flexible AR Invoice JavaScript loaded successfully');

// Performance-optimized utilities (keeping existing utilities from original code)
const Utils = {
    // Debounce function for performance
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle: (func, limit) => {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    // Safe element access
    safeGetElement: (id) => {
        const element = document.getElementById(id);
        if (!element) console.warn(`Element with id '${id}' not found`);
        return element;
    },

    // Safe value setting
    safeSetValue: (elementId, value) => {
        const element = Utils.safeGetElement(elementId);
        if (element) element.value = value || '';
    },

    // Safe style setting
    safeSetStyle: (elementId, property, value) => {
        const element = Utils.safeGetElement(elementId);
        if (element) element.style[property] = value;
    },

    // Sanitize input
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    },

    // Format currency efficiently
    formatCurrencyIDR: (number) => {
        if (number === null || number === undefined || number === '') return '0.00';

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
        if (num > maxAmount) {
            Utils.showNotification('Amount exceeds limit', 'warning');
            num = maxAmount;
        }

        return num >= 1e12 ?
            Utils.formatLargeNumber(num) :
            num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatLargeNumber: (num) => {
        let strNum = num.toString();
        let result = '';
        let count = 0;

        for (let i = strNum.length - 1; i >= 0; i--) {
            result = strNum[i] + result;
            count++;
            if (count % 3 === 0 && i > 0) {
                result = ',' + result;
            }
        }
        return result + '.00';
    },

    // Optimized notification system
    showNotification: (message, type = 'info', duration = 3000) => {
        if (typeof Swal !== 'undefined') {
            const config = {
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: duration,
                timerProgressBar: true,
                icon: type,
                title: message
            };
            Swal.fire(config);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },

    // Efficient DOM manipulation
    addClass: (element, className) => {
        if (element && !element.classList.contains(className)) {
            element.classList.add(className);
        }
    },

    removeClass: (element, className) => {
        if (element && element.classList.contains(className)) {
            element.classList.remove(className);
        }
    },

    // Optimized event listener management
    addEventListenerOnce: (element, event, handler) => {
        if (element && !element.hasAttribute(`data-${event}-bound`)) {
            element.addEventListener(event, handler);
            element.setAttribute(`data-${event}-bound`, 'true');
        }
    }
};

// Optimized text wrapping functionality
const TextWrapping = {
    // Cache for performance
    wrappingCache: new Map(),

    handleTextWrapping: (element) => {
        if (!element) return;

        const text = element.value || element.textContent || '';
        const charLength = text.length;
        const cacheKey = `${element.id || element.className}-${charLength}`;

        // Use cache if available
        if (TextWrapping.wrappingCache.has(cacheKey)) {
            const cached = TextWrapping.wrappingCache.get(cacheKey);
            element.className = cached.className;
            element.style.height = cached.height;
            return;
        }

        // Remove existing classes efficiently
        element.classList.remove('wrap-text', 'no-wrap', 'auto-resize');

        let className, height;
        if (charLength > 15) {
            className = 'wrap-text auto-resize';
            if (element.tagName === 'TEXTAREA') {
                const lineHeight = 20;
                const lines = Math.ceil(charLength / 20);
                height = Math.min(Math.max(40, lines * lineHeight), 80) + 'px';
            } else {
                height = '50px';
            }
        } else {
            className = 'no-wrap';
            height = element.tagName === 'TEXTAREA' ? '40px' : '50px';
        }

        // Apply changes
        element.className += ' ' + className;
        element.style.height = height;

        // Cache result
        TextWrapping.wrappingCache.set(cacheKey, { className: element.className, height });
    },

    // Debounced version for performance
    debouncedApplyTextWrapping: Utils.debounce(() => {
        const textElements = document.querySelectorAll('.description-column textarea, .item-code-column input, .bp-catalog-column input, .quantity-column textarea, .price-column textarea, .line-total-column textarea, .packing-size-column textarea, .account-name-column textarea');
        textElements.forEach(TextWrapping.handleTextWrapping);
    }, 100),

    setupTextWrapping: () => {
        const textElements = document.querySelectorAll('.description-column textarea, .item-code-column input, .bp-catalog-column input, .quantity-column textarea, .price-column textarea, .line-total-column textarea, .packing-size-column textarea, .account-name-column textarea');

        textElements.forEach(element => {
            TextWrapping.handleTextWrapping(element);

            // Add optimized event listeners
            Utils.addEventListenerOnce(element, 'input', () => TextWrapping.handleTextWrapping(element));
            Utils.addEventListenerOnce(element, 'blur', () => TextWrapping.handleTextWrapping(element));
        });
    }
};

// Optimized currency formatting
const CurrencyFormatter = {
    formatCurrencyInputIDR: (input) => {
        if (!input) return;

        if (input.type === 'number') input.type = 'text';

        const cursorPos = input.selectionStart;
        const originalLength = input.value.length;

        let value = input.value.replace(/[^\d,.]/g, '');
        let parts = value.split('.');
        if (parts.length > 1) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }

        const numValue = parseFloat(value.replace(/,/g, '')) || 0;
        const formattedValue = Utils.formatCurrencyIDR(numValue);

        input.value = formattedValue;

        // Restore cursor position
        const newLength = input.value.length;
        const newCursorPos = cursorPos + (newLength - originalLength);
        input.setSelectionRange(Math.max(0, newCursorPos), Math.max(0, newCursorPos));
    },

    applyCurrencyFormatting: () => {
        const currencySelectors = [
            '.item-sls-price',
            '.item-price',
            '.item-line-total',
            '#docTotal',
            '#discSum',
            '#netPriceAfterDiscount',
            '#dpp1112',
            '#vatSum',
            '#grandTotal',
            '#WTSum',
            '#WTSumFC'
        ];

        currencySelectors.forEach(selector => {
            const inputs = document.querySelectorAll(selector);
            inputs.forEach(input => {
                Utils.addClass(input, 'currency-input-idr');
                Utils.addEventListenerOnce(input, 'input', () => CurrencyFormatter.formatCurrencyInputIDR(input));

                if (input.value && input.value !== '0.00') {
                    CurrencyFormatter.formatCurrencyInputIDR(input);
                } else {
                    input.value = '0.00';
                }
            });
        });
    }
};

// Optimized responsive design handler
const ResponsiveHandler = {
    currentBreakpoint: null,

    getBreakpoint: () => {
        const width = window.innerWidth;
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    },

    adjustLayoutForScreenSize: () => {
        const newBreakpoint = ResponsiveHandler.getBreakpoint();

        // Only adjust if breakpoint changed
        if (ResponsiveHandler.currentBreakpoint === newBreakpoint) return;
        ResponsiveHandler.currentBreakpoint = newBreakpoint;

        const tableContainer = document.querySelector('.table-container');
        const formGrids = document.querySelectorAll('.form-section .grid, .approval-section .grid');

        if (tableContainer) {
            switch (newBreakpoint) {
                case 'mobile':
                    tableContainer.style.fontSize = '0.75rem';
                    break;
                case 'tablet':
                    tableContainer.style.fontSize = '0.875rem';
                    break;
                default:
                    tableContainer.style.fontSize = '0.875rem';
            }
        }

        formGrids.forEach(grid => {
            grid.style.gridTemplateColumns = newBreakpoint === 'mobile' ? '1fr' : '1fr 1fr';
        });
    },

    setupMobileOptimizations: () => {
        if (ResponsiveHandler.getBreakpoint() === 'mobile') {
            // Mobile-specific optimizations
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (['text', 'email', 'tel'].includes(input.type)) {
                    input.style.fontSize = '16px'; // Prevent zoom on iOS
                }
            });

            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                button.style.minHeight = '44px';
                button.style.touchAction = 'manipulation';
            });
        }
    }
};

// Optimized error handling
const ErrorHandler = {
    handleError: (error, context = 'Unknown') => {
        console.error(`Error in ${context}:`, error);

        let errorMessage = 'An unexpected error occurred.';
        if (error.message?.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection.';
        } else if (error.message?.includes('404')) {
            errorMessage = 'Resource not found.';
        } else if (error.message?.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        }

        Utils.showNotification(errorMessage, 'error');
    },

    setupErrorBoundary: () => {
        window.addEventListener('error', (event) => {
            ErrorHandler.handleError(event.error, 'Global');
        });

        window.addEventListener('unhandledrejection', (event) => {
            ErrorHandler.handleError(event.reason, 'Promise');
        });
    }
};

// Optimized initialization
const AppInitializer = {
    initialized: false,

    init: () => {
        if (AppInitializer.initialized) return;
        AppInitializer.initialized = true;

        // Setup error handling first
        ErrorHandler.setupErrorBoundary();

        // Setup responsive handling
        const debouncedResize = Utils.debounce(ResponsiveHandler.adjustLayoutForScreenSize, 250);
        window.addEventListener('resize', debouncedResize);
        ResponsiveHandler.adjustLayoutForScreenSize();
        ResponsiveHandler.setupMobileOptimizations();

        // Setup text wrapping
        TextWrapping.setupTextWrapping();

        // Setup currency formatting with delay to ensure DOM is ready
        setTimeout(() => {
            CurrencyFormatter.applyCurrencyFormatting();
        }, 500);

        // Setup network monitoring
        window.addEventListener('online', () => Utils.showNotification('Connection restored', 'success'));
        window.addEventListener('offline', () => Utils.showNotification('Connection lost', 'warning'));

        // Setup orientation change handling
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                ResponsiveHandler.adjustLayoutForScreenSize();
                ResponsiveHandler.setupMobileOptimizations();
            }, 500);
        });

        // Initialize E-Signing if available
        if (typeof initializeESigningFeatures === 'function') {
            try {
                initializeESigningFeatures();
                window.fileUploadInitialized = true;
                console.log('✅ E-signing features initialized');
            } catch (error) {
                console.warn('⚠️ E-signing initialization failed:', error);
            }
        } else {
            console.warn('⚠️ initializeESigningFeatures function not found');
        }
    }
};

// Global function exports for backward compatibility
window.refreshTextWrapping = TextWrapping.debouncedApplyTextWrapping;
window.formatCurrencyIDR = Utils.formatCurrencyIDR;
window.showErrorNotification = (message, title) => Utils.showNotification(message, 'error');
window.showSuccessNotification = (message, title) => Utils.showNotification(message, 'success');
window.showWarningNotification = (message, title) => Utils.showNotification(message, 'warning');

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AppInitializer.init);
} else {
    AppInitializer.init();
}

// Additional optimized re-initialization after data load
setTimeout(() => {
    TextWrapping.debouncedApplyTextWrapping();
    CurrencyFormatter.applyCurrencyFormatting();
    ResponsiveHandler.adjustLayoutForScreenSize();
}, 1000);






// ===== FIXED APPROVAL BUTTON LOGIC =====

// Get current user's kansaiEmployeeId from localStorage
function getCurrentUserKansaiEmployeeId() {
    try {
        // Try multiple sources for kansaiEmployeeId
        let kansaiEmployeeId = null;

        // First, try direct kansaiEmployeeId key
        kansaiEmployeeId = localStorage.getItem('kansaiEmployeeId');
        if (kansaiEmployeeId) {
            console.log('Found kansaiEmployeeId from direct key:', kansaiEmployeeId);
            return kansaiEmployeeId;
        }

        // Second, try userData key
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                if (userData.kansaiEmployeeId) {
                    console.log('Found kansaiEmployeeId from userData:', userData.kansaiEmployeeId);
                    return userData.kansaiEmployeeId;
                }
            } catch (parseError) {
                console.warn('Error parsing userData:', parseError);
            }
        }

        // Third, try currentUser key (fallback)
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            try {
                const currentUser = JSON.parse(currentUserStr);
                if (currentUser.kansaiEmployeeId) {
                    console.log('Found kansaiEmployeeId from currentUser:', currentUser.kansaiEmployeeId);
                    return currentUser.kansaiEmployeeId;
                }
            } catch (parseError) {
                console.warn('Error parsing currentUser:', parseError);
            }
        }

        console.warn('No kansaiEmployeeId found in any localStorage source');
        return null;
    } catch (error) {
        console.error('Error getting current user kansaiEmployeeId:', error);
        return null;
    }
}

// Get current user's full name from localStorage
function getCurrentUserFullName() {
    try {
        let fullName = null;

        // First, try userData key
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                fullName = userData.fullName || userData.firstName + ' ' + userData.lastName || userData.username;
                if (fullName) {
                    console.log('Found fullName from userData:', fullName);
                    return fullName;
                }
            } catch (parseError) {
                console.warn('Error parsing userData:', parseError);
            }
        }

        // Second, try currentUser key (fallback)
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            try {
                const currentUser = JSON.parse(currentUserStr);
                fullName = currentUser.fullName || currentUser.firstName + ' ' + currentUser.lastName || currentUser.username;
                if (fullName) {
                    console.log('Found fullName from currentUser:', fullName);
                    return fullName;
                }
            } catch (parseError) {
                console.warn('Error parsing currentUser:', parseError);
            }
        }

        console.warn('No fullName found in any localStorage source');
        return 'Unknown User';
    } catch (error) {
        console.error('Error getting current user fullName:', error);
        return 'Unknown User';
    }
}

// Fixed update action buttons based on status and user permissions
function normalizeKansaiId(val) {
    if (val === undefined || val === null) return '';
    return String(val).trim();
}

// Debug utility: log approval summary to console
function logApprovalSummary() {
    const approvalSummary = AppState.currentInvItemData?.arInvoiceApprovalSummary;
    console.log('===== arInvoiceApprovalSummary =====');
    if (approvalSummary) {
        console.log(JSON.stringify(approvalSummary, null, 2));
    } else {
        console.log('No approval summary found.');
    }
    console.log('====================================');
}

// Debug utility: check data population issues
function debugDataPopulation() {
    console.log('🔍 DEBUGGING DATA POPULATION');

    const data = AppState.currentInvItemData;
    if (!data) {
        console.log('❌ No currentInvItemData available');
        return;
    }

    console.log('📊 Current Invoice Data:', data);
    console.log('�� Header Fields:', {
        stagingID: data.stagingID,
        docNum: data.docNum,
        cardCode: data.cardCode,
        cardName: data.cardName,
        address: data.address,
        numAtCard: data.numAtCard,
        docCur: data.docCur,
        docRate: data.docRate,
        docDate: data.docDate,
        docDueDate: data.docDueDate
    });

    console.log('💰 Summary Fields:', {
        netPrice: data.netPrice,
        totalAmount: data.totalAmount,
        docTotal: data.docTotal,
        discSum: data.discSum,
        discountAmount: data.discountAmount,
        netPriceAfterDiscount: data.netPriceAfterDiscount,
        salesAmount: data.salesAmount,
        dpp1112: data.dpp1112,
        taxBase: data.taxBase,
        docTax: data.docTax,
        vatAmount: data.vatAmount,
        vatSum: data.vatSum,
        grandTotal: data.grandTotal
    });

    console.log('📋 Invoice Details:', {
        arInvoiceDetails: data.arInvoiceDetails,
        invoiceDetails: data.invoiceDetails,
        details: data.details,
        detailsType: typeof data.arInvoiceDetails,
        isArray: Array.isArray(data.arInvoiceDetails),
        length: data.arInvoiceDetails ? data.arInvoiceDetails.length : 'N/A'
    });

    console.log('✅ Approval Summary:', data.arInvoiceApprovalSummary);
    console.log('=== END DATA DEBUG ===');
}

// Debug utility: check why Check button is not showing
function debugCheckButtonVisibility() {
    console.log('🔍 DEBUGGING CHECK BUTTON VISIBILITY');

    const currentKansaiId = getCurrentUserKansaiEmployeeId();
    const approval = AppState.currentInvItemData?.arInvoiceApprovalSummary || {};
    const status = AppState.currentStatus;

    console.log('Current User KansaiId:', currentKansaiId);
    console.log('Document Status:', status);
    console.log('Approval Summary:', approval);

    if (status === 'Prepared') {
        const checkedByKansaiId = approval.checkedByKansaiId || approval.checkedBy;
        const preparedDate = approval.preparedDate;
        const checkedDate = approval.checkedDate;

        console.log('Checker KansaiId:', checkedByKansaiId);
        console.log('Prepared Date:', preparedDate);
        console.log('Checked Date:', checkedDate);

        const previousDateFilled = !!preparedDate;
        const currentDateNotFilled = !checkedDate;
        const userAuthorized = checkedByKansaiId && String(checkedByKansaiId).trim() === String(currentKansaiId).trim();

        console.log('Previous step completed (preparedDate exists):', previousDateFilled);
        console.log('Current step not completed (checkedDate empty):', currentDateNotFilled);
        console.log('User authorized (IDs match):', userAuthorized);
        console.log('ALL CONDITIONS MET:', previousDateFilled && currentDateNotFilled && userAuthorized);

        if (!previousDateFilled) {
            console.log('❌ Check button hidden: Previous step not completed');
        }
        if (!currentDateNotFilled) {
            console.log('❌ Check button hidden: Current step already completed');
        }
        if (!userAuthorized) {
            console.log('❌ Check button hidden: User not authorized');
        }
        if (previousDateFilled && currentDateNotFilled && userAuthorized) {
            console.log('✅ Check button should be visible');
        }
    }

    console.log('=== END DEBUG ===');
}

// Enhanced Button Manager using BUTTON_CONFIG for better maintainability
const ButtonManager = {
    // Hide all buttons first
    hideAllButtons: () => {
        Object.values(BUTTON_CONFIG).forEach(config => {
            // Exclude print button from auto-hide - it has special logic
            if (config.id !== 'printButton') {
                const button = OptimizedUtils.safeGetElement(config.id);
                if (button) {
                    button.classList.add('hidden');
                    button.disabled = true;
                }
            }
        });
    },

    // Check if button should be visible based on its configuration
    shouldShowButton: (buttonConfig, context) => {
        const { status, apiStatus, urlStatus, approval, currentKansaiId } = context;

        // Handle special logic buttons separately
        if (buttonConfig.visibilityRules?.specialLogic) {
            return ButtonManager.handleSpecialLogic(buttonConfig, context);
        }

        // Check hide conditions
        if (buttonConfig.visibilityRules?.hideOnStatus?.includes(apiStatus)) {
            return false;
        }

        // Check standard approval buttons
        if (buttonConfig.requiredStatus && buttonConfig.requiredStatus === status) {
            return ButtonManager.checkApprovalConditions(buttonConfig, approval, currentKansaiId);
        }

        return false;
    },

    // Check approval conditions for standard buttons
    checkApprovalConditions: (buttonConfig, approval, currentKansaiId) => {
        const previousDateFilled = !!approval[buttonConfig.previousDateField];
        const currentDateNotFilled = !approval[buttonConfig.dateField];

        let requiredKansaiId = approval[buttonConfig.kansaiIdField] || approval[buttonConfig.fallbackIdField];
        requiredKansaiId = normalizeKansaiId(requiredKansaiId);

        const userAuthorized = requiredKansaiId && requiredKansaiId === currentKansaiId;

        console.log(`🔍 ${buttonConfig.label} Button Analysis:`, {
            previousDateFilled,
            currentDateNotFilled,
            userAuthorized,
            requiredKansaiId,
            currentKansaiId
        });

        return previousDateFilled && currentDateNotFilled && userAuthorized;
    },

    // Handle special logic for print, eSign, and reject buttons
    handleSpecialLogic: (buttonConfig, context) => {
        const { apiStatus, urlStatus, approval, currentKansaiId, status } = context;

        switch (buttonConfig.id) {
            case 'printButton':
                const urlStatusLower = urlStatus ? urlStatus.toLowerCase() : '';
                return buttonConfig.visibilityRules.showOnUrlStatus.includes(urlStatusLower);

            case 'eSignButton':
                return apiStatus === 'Received' &&
                    urlStatus && urlStatus.toLowerCase() === 'received';

            case 'rejectButton':
                if (buttonConfig.visibilityRules.hideOnStatus.includes(apiStatus)) {
                    return false;
                }

                // Find current step for reject button
                const approvalSteps = Object.values(BUTTON_CONFIG).filter(config =>
                    config.requiredStatus && !config.visibilityRules?.specialLogic
                );

                const currentStep = approvalSteps.find(step => step.requiredStatus === status);
                if (currentStep) {
                    let requiredKansaiId = approval[currentStep.kansaiIdField] || approval[currentStep.fallbackIdField];
                    requiredKansaiId = normalizeKansaiId(requiredKansaiId);
                    const currentDateNotFilled = !approval[currentStep.dateField];
                    const userAuthorized = requiredKansaiId && requiredKansaiId === currentKansaiId;
                    return userAuthorized && currentDateNotFilled;
                }
                return false;

            default:
                return false;
        }
    },

    // Main function to update button visibility
    updateButtons: (status) => {
        console.log('🔄 ButtonManager: Updating action buttons for status:', status);

        // Hide all buttons first
        ButtonManager.hideAllButtons();

        // Get current user and approval data
        const currentKansaiId = normalizeKansaiId(getCurrentUserKansaiEmployeeId());
        if (!currentKansaiId) {
            console.warn('ButtonManager: Cannot determine current user kansaiEmployeeId');
            StatusBoxManager.updateCurrentStatusDisplay(status);
            ButtonManager.handlePrintButton();
            return;
        }

        const approval = AppState.currentInvItemData?.arInvoiceApprovalSummary || {};
        const urlStatus = getUrlParameter('status');

        // Get API status
        let apiStatus = 'Draft';
        if (AppState.currentInvItemData) {
            apiStatus = getStatusFromInvoice(AppState.currentInvItemData);
        }

        // Create context for button visibility decisions
        const context = {
            status,
            apiStatus,
            urlStatus,
            approval,
            currentKansaiId
        };

        // Check each button and show if conditions are met
        Object.values(BUTTON_CONFIG).forEach(buttonConfig => {
            if (ButtonManager.shouldShowButton(buttonConfig, context)) {
                const button = OptimizedUtils.safeGetElement(buttonConfig.id);
                if (button) {
                    button.classList.remove('hidden');
                    button.disabled = false;
                    console.log(`✅ ButtonManager: Showing ${buttonConfig.label} button`);
                }
            }
        });

        // CRITICAL: Handle print button FIRST and ALWAYS
        console.log('🖨️ ButtonManager: Handling print button...');
        ButtonManager.handlePrintButton();

        // Update current status display
        StatusBoxManager.updateCurrentStatusDisplay(apiStatus);
    },

    // Handle print button with existing logic
    handlePrintButton: () => {
        return handlePrintButtonVisibility();
    }
};

// Legacy function for backward compatibility - now uses ButtonManager
function updateActionButtons(status) {
    console.log('🔄 Legacy updateActionButtons called, delegating to ButtonManager');
    return ButtonManager.updateButtons(status);
}

// Separate function to handle print button visibility
function handlePrintButtonVisibility() {
    console.log('🔍 handlePrintButtonVisibility() called');

    const printBtn = OptimizedUtils.safeGetElement('printButton');
    if (!printBtn) {
        console.error('❌ CRITICAL: Print button element not found!');
        // Try direct getElementById as backup
        const printBtnDirect = document.getElementById('printButton');
        console.log('🔍 Direct getElementById result:', printBtnDirect);
        return;
    }

    console.log('✅ Print button element found:', printBtn);

    // Get API status (status sebenarnya dari dokumen)
    let apiStatus = 'Draft';
    if (AppState.currentInvItemData) {
        apiStatus = getStatusFromInvoice(AppState.currentInvItemData);
    }

    // Get URL parameter status
    const urlStatus = getUrlParameter('status');
    const urlStatusLower = urlStatus ? urlStatus.toLowerCase() : '';

    // Show print button if BOTH conditions are met:
    // 1. URL status is 'received' or 'approve' 
    // 2. API status is 'Received' or 'Approved'
    const urlCondition = urlStatusLower === 'received' || urlStatusLower === 'approve';
    const apiCondition = apiStatus === 'Received' || apiStatus === 'Approved';
    const showPrintButton = urlCondition && apiCondition;

    console.log('🖨️ ===== PRINT BUTTON LOGIC DEBUGGING =====');
    console.log('- API Status (dari dokumen):', apiStatus);
    console.log('- URL Status (dari parameter):', urlStatus);
    console.log('- URL Condition (received/approve):', urlCondition);
    console.log('- API Condition (Received/Approved):', apiCondition);
    console.log('- Should show print button:', showPrintButton);
    console.log('- Current button classes:', printBtn.className);
    console.log('- Current button disabled:', printBtn.disabled);

    if (showPrintButton) {
        console.log('🎯 EXECUTING: Show print button - BOTH conditions met');
        printBtn.classList.remove('hidden');
        printBtn.disabled = false;
        printBtn.style.display = ''; // Remove any inline display:none
        console.log('✅ PRINT BUTTON SHOWN - URL:', urlStatus, 'API:', apiStatus);
        console.log('✅ New button classes:', printBtn.className);
        console.log('✅ New button disabled:', printBtn.disabled);
    } else {
        console.log('🎯 EXECUTING: Hide print button - conditions not met');
        if (!urlCondition) {
            console.log('❌ URL condition failed - expected received/approve, got:', urlStatus);
        }
        if (!apiCondition) {
            console.log('❌ API condition failed - expected Received/Approved, got:', apiStatus);
        }
        printBtn.classList.add('hidden');
        printBtn.disabled = true;
        console.log('❌ PRINT BUTTON HIDDEN');
    }

    console.log('🖨️ ===== END PRINT BUTTON LOGIC =====');

    // Force refresh button visibility after short delay
    setTimeout(() => {
        const currentlyHidden = printBtn.classList.contains('hidden');
        console.log('🔍 Print button status after timeout - Hidden:', currentlyHidden);
        if (showPrintButton && currentlyHidden) {
            console.log('⚠️ FORCING print button visibility');
            printBtn.classList.remove('hidden');
            printBtn.disabled = false;
            printBtn.style.display = 'inline-block';
        }
    }, 100);

    // Log final state
    console.log('- Final print button state - hidden:', printBtn.classList.contains('hidden'));
    console.log('- Final print button state - disabled:', printBtn.disabled);
}

// Fixed build approval request data function
function buildApprovalRequestData(userId, currentUserName, currentDate, actionType) {
    const approval = AppState.currentInvItemData?.arInvoiceApprovalSummary || {};

    // Base request data structure - preserve existing data
    const requestData = {
        stagingID: AppState.currentInvItemData?.stagingID,
        createdAt: approval.createdAt || currentDate,
        updatedAt: currentDate,

        // Preserve existing approval data
        preparedBy: approval.preparedBy || null,
        checkedBy: approval.checkedBy || null,
        acknowledgedBy: approval.acknowledgedBy || null,
        approvedBy: approval.approvedBy || null,
        receivedBy: approval.receivedBy || null,

        preparedDate: approval.preparedDate || null,
        checkedDate: approval.checkedDate || null,
        acknowledgedDate: approval.acknowledgedDate || null,
        approvedDate: approval.approvedDate || null,
        receivedDate: approval.receivedDate || null,

        preparedByName: approval.preparedByName || null,
        checkedByName: approval.checkedByName || null,
        acknowledgedByName: approval.acknowledgedByName || null,
        approvedByName: approval.approvedByName || null,
        receivedByName: approval.receivedByName || null,

        // Preserve kansaiEmployeeId fields
        preparedByKansaiId: approval.preparedByKansaiId || null,
        checkedByKansaiId: approval.checkedByKansaiId || null,
        acknowledgedByKansaiId: approval.acknowledgedByKansaiId || null,
        approvedByKansaiId: approval.approvedByKansaiId || null,
        receivedByKansaiId: approval.receivedByKansaiId || null,

        rejectedDate: approval.rejectedDate || null,
        rejectedBy: approval.rejectedBy || null,
        rejectionRemarks: approval.rejectionRemarks || "",
        revisionNumber: approval.revisionNumber || null,
        revisionDate: approval.revisionDate || null,
        revisionRemarks: approval.revisionRemarks || null
    };

    // Update fields based on action type
    switch (actionType) {
        case 'Checked':
            requestData.approvalStatus = 'Checked';
            requestData.checkedBy = userId;
            requestData.checkedDate = currentDate;
            requestData.checkedByName = currentUserName;
            requestData.checkedByKansaiId = userId;
            break;

        case 'Acknowledged':
            requestData.approvalStatus = 'Acknowledged';
            requestData.acknowledgedBy = userId;
            requestData.acknowledgedDate = currentDate;
            requestData.acknowledgedByName = currentUserName;
            requestData.acknowledgedByKansaiId = userId;
            break;

        case 'Approved':
            requestData.approvalStatus = 'Approved';
            requestData.approvedBy = userId;
            requestData.approvedDate = currentDate;
            requestData.approvedByName = currentUserName;
            requestData.approvedByKansaiId = userId;
            break;

        case 'Received':
            requestData.approvalStatus = 'Received';
            requestData.receivedBy = userId;
            requestData.receivedDate = currentDate;
            requestData.receivedByName = currentUserName;
            requestData.receivedByKansaiId = userId;
            break;

        default:
            throw new Error(`Unsupported action type: ${actionType}`);
    }

    console.log('📤 Built approval request data:', requestData);
    return requestData;
}

// Fixed status update function
async function updateInvItemStatus(status, remarks = '') {
    if (!AppState.currentInvItemData) {
        OptimizedUtils.showNotification('No invoice item data available', 'error');
        return;
    }

    try {
        const userId = getCurrentUserKansaiEmployeeId();
        const currentUserName = getCurrentUserFullName();

        if (!userId) {
            OptimizedUtils.showNotification('Unable to determine current user', 'error');
            return;
        }

        const now = new Date().toISOString();
        const approval = AppState.currentInvItemData?.arInvoiceApprovalSummary || {};

        // Validation for sequential approval
        if (status !== 'Rejected') {
            const steps = [
                { status: 'Prepared', next: 'Checked', prevDate: 'preparedDate' },
                { status: 'Checked', next: 'Acknowledged', prevDate: 'checkedDate' },
                { status: 'Acknowledged', next: 'Approved', prevDate: 'acknowledgedDate' },
                { status: 'Approved', next: 'Received', prevDate: 'approvedDate' }
            ];

            const currentStepIndex = steps.findIndex(step => step.status === AppState.currentStatus);
            const targetStepIndex = steps.findIndex(step => step.next === status);

            if (targetStepIndex >= 0 && currentStepIndex >= 0) {
                const targetStep = steps[targetStepIndex];
                if (!approval[targetStep.prevDate]) {
                    OptimizedUtils.showNotification(
                        `Previous step (${targetStep.status}) must be completed first`,
                        'error'
                    );
                    return;
                }
            }
        }

        const actionText = status === 'Rejected' ? 'Rejecting' : `${status.slice(0, -2)}ing`;
        Swal.fire({
            title: `${actionText} Document...`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const stagingID = AppState.currentInvItemData.stagingID;
        if (!stagingID) {
            throw new Error('Staging ID is required for submission');
        }

        let payload;
        if (status === 'Rejected') {
            payload = buildRejectionRequestData(userId, remarks);
        } else {
            payload = buildApprovalRequestData(userId, currentUserName, now, status);
        }

        console.log('📤 Sending approval request:', payload);

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.invoices}/approval/${stagingID}`, {
            method: 'PATCH',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = errorJson.message || errorJson.error || errorText;
            } catch (parseError) {
                // Use original error text
            }
            throw new Error(`API Error: ${response.status} - ${errorDetails}`);
        }

        const result = await response.json();
        console.log('✅ Status update successful:', result);

        // Update local state efficiently
        if (AppState.currentInvItemData?.arInvoiceApprovalSummary) {
            Object.assign(AppState.currentInvItemData.arInvoiceApprovalSummary, payload);
        }

        // Update UI
        updatePageTitleAndStatus(status);
        populateApprovalData(AppState.currentInvItemData.arInvoiceApprovalSummary);

        const actionPastTense = {
            'Checked': 'checked',
            'Acknowledged': 'acknowledged',
            'Approved': 'approved',
            'Received': 'received',
            'Rejected': 'rejected'
        }[status] || 'processed';

        const confirmResult = await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `AR Invoice ${DOC_TYPE_CONFIG[AppState.docType].name} has been ${actionPastTense} successfully. Do you want to return to the menu?`,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Return to Menu',
            cancelButtonText: 'Stay Here'
        });

        if (confirmResult.isConfirmed) {
            goToMenuReceiveInvItem();
        }

    } catch (error) {
        console.error('❌ Error updating invoice item status:', error);
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: error.message || 'Failed to update invoice item status. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

// Update the global exports to use the fixed functions
window.getCurrentUserKansaiEmployeeId = getCurrentUserKansaiEmployeeId;
window.getCurrentUserFullName = getCurrentUserFullName;
window.updateActionButtons = updateActionButtons;
window.buildApprovalRequestData = buildApprovalRequestData;
window.updateInvItemStatus = updateInvItemStatus;

// DEBUG SCRIPT - Paste this in browser console to diagnose Check button issue

console.log('=== DEBUG CHECK BUTTON VISIBILITY ===');

// 1. Check current user data
const currentUserStr = localStorage.getItem('currentUser');
let currentUser = null;
try {
    if (currentUserStr) {
        currentUser = JSON.parse(currentUserStr);
    }
} catch (e) {
    console.error('Error parsing currentUser:', e);
}

const currentKansaiId = currentUser?.kansaiEmployeeId || localStorage.getItem('kansaiEmployeeId') || sessionStorage.getItem('kansaiEmployeeId');

console.log('1. CURRENT USER INFO:');
console.log('   localStorage currentUser:', currentUser);
console.log('   Extracted kansaiEmployeeId:', currentKansaiId);
console.log('   Type:', typeof currentKansaiId);

// 2. Check invoice data
const invoiceData = window.AppState?.currentInvItemData;
console.log('\n2. INVOICE DATA:');
console.log('   Full invoice data:', invoiceData);

// 3. Check approval summary
const approval = invoiceData?.arInvoiceApprovalSummary;
console.log('\n3. APPROVAL SUMMARY:');
console.log('   Full approval summary:', approval);

if (approval) {
    console.log('   checkedByKansaiId:', approval.checkedByKansaiId, '(type:', typeof approval.checkedByKansaiId, ')');
    console.log('   checkedBy:', approval.checkedBy, '(type:', typeof approval.checkedBy, ')');
    console.log('   checkedByName:', approval.checkedByName);
    console.log('   preparedDate:', approval.preparedDate);
    console.log('   checkedDate:', approval.checkedDate);
}

// 4. Check status
const status = window.AppState?.currentStatus;
console.log('\n4. CURRENT STATUS:', status);

// 5. Check step validation
if (approval) {
    const previousDateFilled = !!approval.preparedDate;
    const currentDateNotFilled = !approval.checkedDate;
    const requiredKansaiId = approval.checkedByKansaiId || approval.checkedBy;
    const normalizedRequiredId = requiredKansaiId ? String(requiredKansaiId).trim() : '';
    const normalizedCurrentId = currentKansaiId ? String(currentKansaiId).trim() : '';
    const userAuthorized = normalizedRequiredId && normalizedRequiredId === normalizedCurrentId;

    console.log('\n5. STEP VALIDATION:');
    console.log('   previousDateFilled (preparedDate exists):', previousDateFilled);
    console.log('   currentDateNotFilled (checkedDate empty):', currentDateNotFilled);
    console.log('   requiredKansaiId (raw):', requiredKansaiId);
    console.log('   normalizedRequiredId:', normalizedRequiredId);
    console.log('   normalizedCurrentId:', normalizedCurrentId);
    console.log('   userAuthorized (IDs match):', userAuthorized);

    console.log('\n6. CONDITIONS SUMMARY:');
    console.log('   Status is Prepared:', status === 'Prepared');
    console.log('   Previous step completed:', previousDateFilled);
    console.log('   Current step not completed:', currentDateNotFilled);
    console.log('   User authorized:', userAuthorized);
    console.log('   ALL CONDITIONS MET:', status === 'Prepared' && previousDateFilled && currentDateNotFilled && userAuthorized);
}

// 6. Check button element
const checkButton = document.getElementById('checkButton');
console.log('\n7. BUTTON ELEMENT:');
console.log('   Button exists:', !!checkButton);
if (checkButton) {
    console.log('   Button classes:', checkButton.className);
    console.log('   Button disabled:', checkButton.disabled);
    console.log('   Button hidden (has hidden class):', checkButton.classList.contains('hidden'));
}

// 7. Manual button visibility test
console.log('\n8. MANUAL BUTTON TEST:');
if (checkButton) {
    console.log('   Removing hidden class...');
    checkButton.classList.remove('hidden');
    checkButton.disabled = false;
    console.log('   Button should now be visible');
}

console.log('\n=== END DEBUG ===');

// Provide recommendations
console.log('\n=== RECOMMENDATIONS ===');
if (!approval) {
    console.log('❌ No approval summary found - check API response');
} else if (!approval.preparedDate) {
    console.log('❌ preparedDate is empty - previous step not completed');
} else if (approval.checkedDate) {
    console.log('❌ checkedDate already filled - step already completed');
} else if (!approval.checkedByKansaiId && !approval.checkedBy) {
    console.log('❌ No checker assigned - check approval setup');
} else if (String(approval.checkedByKansaiId || approval.checkedBy).trim() !== String(currentKansaiId).trim()) {
    console.log('❌ User ID mismatch - current user not authorized as checker');
    console.log('   Expected:', approval.checkedByKansaiId || approval.checkedBy);
    console.log('   Current:', currentKansaiId);
} else {
    console.log('✅ All conditions should be met - check updateActionButtons function');
}

// Validate approval workflow step by step
function validateApprovalWorkflow(approvalSummary) {
    console.log('🔍 Validating approval workflow...');

    const workflow = {
        prepared: {
            date: approvalSummary.preparedDate,
            by: approvalSummary.preparedBy,
            byName: approvalSummary.preparedByName,
            required: true,
            step: 1
        },
        checked: {
            date: approvalSummary.checkedDate,
            by: approvalSummary.checkedBy,
            byName: approvalSummary.checkedByName,
            required: true,
            step: 2,
            dependsOn: 'prepared'
        },
        acknowledged: {
            date: approvalSummary.acknowledgedDate,
            by: approvalSummary.acknowledgedBy,
            byName: approvalSummary.acknowledgedByName,
            required: true,
            step: 3,
            dependsOn: 'checked'
        },
        approved: {
            date: approvalSummary.approvedDate,
            by: approvalSummary.approvedBy,
            byName: approvalSummary.approvedByName,
            required: true,
            step: 4,
            dependsOn: 'acknowledged'
        },
        received: {
            date: approvalSummary.receivedDate,
            by: approvalSummary.receivedBy,
            byName: approvalSummary.receivedByName,
            required: true,
            step: 5,
            dependsOn: 'approved'
        }
    };

    let currentStep = 'prepared';
    let workflowStatus = 'Draft';

    // Check each step in sequence
    for (const [stepName, stepData] of Object.entries(workflow)) {
        console.log(`\n📋 Checking step: ${stepName.toUpperCase()}`);
        console.log(`   Date: ${stepData.date || 'Not set'}`);
        console.log(`   By: ${stepData.byName || stepData.by || 'Not assigned'}`);

        // Check if this step depends on a previous step
        if (stepData.dependsOn) {
            const previousStep = workflow[stepData.dependsOn];
            if (!previousStep.date) {
                console.log(`   ❌ Cannot proceed: Previous step '${stepData.dependsOn}' not completed`);
                break;
            }
        }

        // Check if current step is completed
        if (stepData.date) {
            console.log(`   ✅ Step completed on: ${stepData.date}`);
            currentStep = stepName;

            // Map step to status
            switch (stepName) {
                case 'prepared': workflowStatus = 'Prepared'; break;
                case 'checked': workflowStatus = 'Checked'; break;
                case 'acknowledged': workflowStatus = 'Acknowledged'; break;
                case 'approved': workflowStatus = 'Approved'; break;
                case 'received': workflowStatus = 'Received'; break;
            }
        } else {
            console.log(`   ⏳ Step pending - waiting for ${stepData.byName || stepData.by || 'assignment'}`);
            break;
        }
    }

    console.log(`\n🎯 Workflow Analysis Result:`);
    console.log(`   Current Step: ${currentStep.toUpperCase()}`);
    console.log(`   Workflow Status: ${workflowStatus}`);
    console.log(`   Next Action Required: ${getNextActionRequired(workflowStatus)}`);

    return {
        currentStep,
        workflowStatus,
        nextAction: getNextActionRequired(workflowStatus),
        workflow
    };
}

// Get next action required based on current status
function getNextActionRequired(status) {
    const actionMap = {
        'Draft': 'Document needs to be prepared',
        'Prepared': 'Document needs to be checked',
        'Checked': 'Document needs to be acknowledged',
        'Acknowledged': 'Document needs to be approved',
        'Approved': 'Document needs to be received',
        'Received': 'Workflow completed',
        'Rejected': 'Document rejected - needs revision'
    };

    return actionMap[status] || 'Unknown action required';
}

// Get detailed action information for current user
function getCurrentUserActionInfo() {
    const currentKansaiId = getCurrentUserKansaiEmployeeId();
    const approval = AppState.currentInvItemData?.arInvoiceApprovalSummary || {};
    const status = AppState.currentStatus;

    console.log('🔍 Getting current user action info:', {
        currentKansaiId,
        status,
        approval
    });

    const actionInfo = {
        canCheck: false,
        canAcknowledge: false,
        canApprove: false,
        canReceive: false,
        canReject: false,
        currentRole: '',
        nextAction: '',
        reason: ''
    };

    // Check based on current status
    switch (status) {
        case 'Prepared':
            actionInfo.canCheck = (approval.checkedByKansaiId === currentKansaiId || approval.checkedBy === currentKansaiId);
            actionInfo.canReject = actionInfo.canCheck;
            actionInfo.currentRole = 'Checker';
            actionInfo.nextAction = actionInfo.canCheck ? 'Check document' : 'Wait for checker assignment';
            actionInfo.reason = actionInfo.canCheck ?
                'You are assigned as checker for this document' :
                'You are not assigned as checker for this document';
            break;

        case 'Checked':
            actionInfo.canAcknowledge = (approval.acknowledgedByKansaiId === currentKansaiId || approval.acknowledgedBy === currentKansaiId);
            actionInfo.canReject = actionInfo.canAcknowledge;
            actionInfo.currentRole = 'Acknowledger';
            actionInfo.nextAction = actionInfo.canAcknowledge ? 'Acknowledge document' : 'Wait for acknowledger assignment';
            actionInfo.reason = actionInfo.canAcknowledge ?
                'You are assigned as acknowledger for this document' :
                'You are not assigned as acknowledger for this document';
            break;

        case 'Acknowledged':
            actionInfo.canApprove = (approval.approvedByKansaiId === currentKansaiId || approval.approvedBy === currentKansaiId);
            actionInfo.canReject = actionInfo.canApprove;
            actionInfo.currentRole = 'Approver';
            actionInfo.nextAction = actionInfo.canApprove ? 'Approve document' : 'Wait for approver assignment';
            actionInfo.reason = actionInfo.canApprove ?
                'You are assigned as approver for this document' :
                'You are not assigned as approver for this document';
            break;

        case 'Approved':
            actionInfo.canReceive = (approval.receivedByKansaiId === currentKansaiId || approval.receivedBy === currentKansaiId);
            actionInfo.canReject = actionInfo.canReceive;
            actionInfo.currentRole = 'Receiver';
            actionInfo.nextAction = actionInfo.canReceive ? 'Receive document' : 'Wait for receiver assignment';
            actionInfo.reason = actionInfo.canReceive ?
                'You are assigned as receiver for this document' :
                'You are not assigned as receiver for this document';
            break;

        case 'Received':
            actionInfo.currentRole = 'Viewer';
            actionInfo.nextAction = 'Document completed - no actions available';
            actionInfo.reason = 'Document has been received and workflow is complete';
            break;

        case 'Rejected':
            actionInfo.currentRole = 'Viewer';
            actionInfo.nextAction = 'Document rejected - needs revision';
            actionInfo.reason = 'Document has been rejected and cannot be processed further';
            break;

        default:
            actionInfo.currentRole = 'Unknown';
            actionInfo.nextAction = 'Status unknown';
            actionInfo.reason = 'Document status is not recognized';
            break;
    }

    console.log('📋 Current user action info:', actionInfo);
    return actionInfo;
}

// Display detailed approval workflow information
function displayApprovalWorkflowInfo() {
    const approval = AppState.currentInvItemData?.arInvoiceApprovalSummary || {};
    const userActionInfo = getCurrentUserActionInfo();

    console.log('📊 Displaying approval workflow info:', userActionInfo);

    // Create workflow info display
    const workflowInfo = `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 class="text-lg font-semibold text-blue-800 mb-3">📋 Approval Workflow Information</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <p class="font-medium text-blue-700">Current Status:</p>
                    <p class="text-blue-600">${AppState.currentStatus}</p>
                </div>
                <div>
                    <p class="font-medium text-blue-700">Your Role:</p>
                    <p class="text-blue-600">${userActionInfo.currentRole}</p>
                </div>
                <div>
                    <p class="font-medium text-blue-700">Next Action:</p>
                    <p class="text-blue-600">${userActionInfo.nextAction}</p>
                </div>
                <div>
                    <p class="font-medium text-blue-700">Reason:</p>
                    <p class="text-blue-600">${userActionInfo.reason}</p>
                </div>
            </div>
            
            <div class="mt-3 p-3 bg-white rounded border border-blue-100">
                <p class="font-medium text-blue-700 mb-2">Workflow Progress:</p>
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Prepared:</span>
                        <span class="text-sm ${approval.preparedDate ? 'text-green-600' : 'text-gray-400'}">
                            ${approval.preparedDate ? '✅ ' + approval.preparedByName : '⏳ Pending'}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Checked:</span>
                        <span class="text-sm ${approval.checkedDate ? 'text-green-600' : 'text-gray-400'}">
                            ${approval.checkedDate ? '✅ ' + approval.checkedByName : '⏳ Pending'}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Acknowledged:</span>
                        <span class="text-sm ${approval.acknowledgedDate ? 'text-green-600' : 'text-gray-400'}">
                            ${approval.acknowledgedDate ? '✅ ' + approval.acknowledgedByName : '⏳ Pending'}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Approved:</span>
                        <span class="text-sm ${approval.approvedDate ? 'text-green-600' : 'text-gray-400'}">
                            ${approval.approvedDate ? '✅ ' + approval.approvedByName : '⏳ Pending'}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Received:</span>
                        <span class="text-sm ${approval.receivedDate ? 'text-green-600' : 'text-gray-400'}">
                            ${approval.receivedDate ? '✅ ' + approval.receivedByName : '⏳ Pending'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Insert workflow info before the action buttons section
    const multiApprovalSection = document.getElementById('multiApprovalSection');
    if (multiApprovalSection) {
        // Check if workflow info already exists
        let existingWorkflowInfo = multiApprovalSection.querySelector('.workflow-info-container');
        if (existingWorkflowInfo) {
            existingWorkflowInfo.remove();
        }

        // Create new workflow info container
        const workflowInfoContainer = document.createElement('div');
        workflowInfoContainer.className = 'workflow-info-container';
        workflowInfoContainer.innerHTML = workflowInfo;

        // Insert before the action buttons
        multiApprovalSection.insertBefore(workflowInfoContainer, multiApprovalSection.firstChild);
    }
}