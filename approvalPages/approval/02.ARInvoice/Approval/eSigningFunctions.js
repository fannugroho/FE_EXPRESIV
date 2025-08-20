// E-Signing Functions for Invoice Item Receive Page
// Enhanced with Document Tracking API endpoints

// Global variables for enhanced e-signing
let selectedESignFile = null;
let currentJobId = null;
let stampJobId = null;
let signedDocumentUrl = null;
let stampedDocumentUrl = null;
let statusCheckInterval = null;
let documentTrackingData = [];

// Progress tracking variables
let currentProgress = 0;
let currentStep = 1;
let progressInterval = null;

// Kasbo service environment and base URL configuration (switchable at runtime)
const KASBO_KNOWN_ENV_URLS = {
    sandbox: 'https://dentsu-kansai-expressiv.idsdev.site',
    prod: 'https://dentsu-kansai-expressiv-prod.idsdev.site'
};

function getKasboEnvironment() {
    try {
        const explicitEnv = (window.KASBO_ENV || localStorage.getItem('KASBO_ENV') || '').toString().toLowerCase();
        if (explicitEnv === 'prod' || explicitEnv === 'production') return 'prod';
        if (explicitEnv === 'sandbox' || explicitEnv === 'sb') return 'sandbox';
    } catch (_) { }
    // Infer from explicit base URL if set
    const explicitBase = (window.KASBO_SERVICE_BASE_URL || window.KASBO_BASE_URL || (window.__CONFIG__ && window.__CONFIG__.kasboBaseUrl) || '').toString();
    if (/expressiv-prod/i.test(explicitBase)) return 'prod';
    return 'sandbox';
}

function getKasboBaseUrl() {
    const explicit = (window.KASBO_SERVICE_BASE_URL || window.KASBO_BASE_URL || (window.__CONFIG__ && window.__CONFIG__.kasboBaseUrl) || (function () { try { return localStorage.getItem('KASBO_SERVICE_BASE_URL'); } catch (_) { return null; } })());
    if (explicit) return explicit.toString().replace(/\/+$/, '');
    const env = getKasboEnvironment();
    const fallback = KASBO_KNOWN_ENV_URLS[env] || KASBO_KNOWN_ENV_URLS.sandbox;
    return fallback.replace(/\/+$/, '');
}

function setKasboEnvironment(envOrUrl) {
    try {
        // Accept either a key ("sandbox"|"prod") or a full URL
        if (typeof envOrUrl === 'string' && /^https?:\/\//i.test(envOrUrl)) {
            localStorage.setItem('KASBO_SERVICE_BASE_URL', envOrUrl);
            window.KASBO_SERVICE_BASE_URL = envOrUrl;
            const inferredEnv = /expressiv-prod/i.test(envOrUrl) ? 'prod' : 'sandbox';
            localStorage.setItem('KASBO_ENV', inferredEnv);
            window.KASBO_ENV = inferredEnv;
        } else {
            const envKey = (envOrUrl || '').toString().toLowerCase() === 'prod' ? 'prod' : 'sandbox';
            localStorage.setItem('KASBO_ENV', envKey);
            window.KASBO_ENV = envKey;
            const url = KASBO_KNOWN_ENV_URLS[envKey];
            localStorage.setItem('KASBO_SERVICE_BASE_URL', url);
            window.KASBO_SERVICE_BASE_URL = url;
        }
    } catch (_) { }
    // Best-effort refresh hook
    if (typeof refreshEnvironment === 'function') {
        try { refreshEnvironment(); } catch (_) { }
    }
}

function isProductionEnvironment() {
    try {
        const env = getKasboEnvironment();
        if (env === 'prod') return true;
        const base = getKasboBaseUrl();
        return /expressiv-prod/i.test(base);
    } catch (_) { return false; }
}

// Capture helper to get current user's email identifier
function getCaptureUserEmail() {
    try {
        if (typeof currentUser !== 'undefined' && currentUser) {
            return (currentUser.email || currentUser.username || currentUser.userId || 'unknown') + '';
        }
    } catch (_) { }
    try {
        if (typeof window.getCurrentUser === 'function') {
            const u = window.getCurrentUser();
            if (u) return (u.email || u.username || u.userId || 'unknown') + '';
        }
    } catch (_) { }
    return 'unknown';
}

// Helper to build Kasbo URLs
function kasboUrl(path) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${getKasboBaseUrl()}${normalizedPath}`;
}

// Environment UI helpers (optional)
function refreshEnvironment() {
    const env = getKasboEnvironment();
    let base = getKasboBaseUrl();
    // Ensure base URL aligns with selected environment
    try {
        const expected = (KASBO_KNOWN_ENV_URLS[env] || KASBO_KNOWN_ENV_URLS.sandbox).replace(/\/+$/, '');
        if (base !== expected) {
            try { localStorage.setItem('KASBO_SERVICE_BASE_URL', expected); } catch (_) { }
            window.KASBO_SERVICE_BASE_URL = expected;
            base = expected;
        }
    } catch (_) { }
    // Update select
    const select = document.getElementById('kasboEnvSelect');
    if (select && select.value !== env) {
        select.value = env;
    }
    // Update badge
    const badge = document.getElementById('kasboEnvBadge');
    if (badge) {
        const isProd = env === 'prod';
        badge.textContent = isProd ? 'Production' : 'Sandbox';
        badge.className = `text-xs px-2 py-1 rounded ${isProd ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`;
        badge.title = base;
    }
    // Reload lists to reflect environment
    try {
        if (typeof loadExistingSignedDocuments === 'function') loadExistingSignedDocuments();
        if (typeof loadExistingStampedDocuments === 'function') loadExistingStampedDocuments();
    } catch (_) { }
}

document.addEventListener('DOMContentLoaded', function () {
    // Force base URL to match the current environment on load
    try {
        const env = getKasboEnvironment();
        const expected = (KASBO_KNOWN_ENV_URLS[env] || KASBO_KNOWN_ENV_URLS.sandbox).replace(/\/+$/, '');
        const current = getKasboBaseUrl();
        if (current !== expected) {
            try { localStorage.setItem('KASBO_SERVICE_BASE_URL', expected); } catch (_) { }
            window.KASBO_SERVICE_BASE_URL = expected;
        }
    } catch (_) { }
    // Initialize select state and UI on load
    refreshEnvironment();
    const select = document.getElementById('kasboEnvSelect');
    if (select) {
        select.addEventListener('change', function () {
            const nextEnv = this.value === 'prod' ? 'prod' : 'sandbox';
            if (nextEnv === 'prod' && typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Switch to Production?',
                    text: 'You are switching to Production. Real charges may apply for e-sign and e-stamp.',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, switch to Production',
                    cancelButtonText: 'Cancel'
                }).then((res) => {
                    if (res.isConfirmed) {
                        setKasboEnvironment('prod');
                        refreshEnvironment();
                    } else {
                        this.value = 'sandbox';
                        setKasboEnvironment('sandbox');
                        refreshEnvironment();
                    }
                });
            } else {
                setKasboEnvironment(nextEnv);
                refreshEnvironment();
            }
        });
    }
});

async function confirmProductionAction(actionLabel) {
    if (!isProductionEnvironment()) return true;
    // Double-check URL base alignment to avoid false positives
    try {
        const env = getKasboEnvironment();
        const expected = (KASBO_KNOWN_ENV_URLS[env] || KASBO_KNOWN_ENV_URLS.sandbox).replace(/\/+$/, '');
        const current = getKasboBaseUrl();
        if (current !== expected) {
            try { localStorage.setItem('KASBO_SERVICE_BASE_URL', expected); } catch (_) { }
            window.KASBO_SERVICE_BASE_URL = expected;
        }
    } catch (_) { }
    const message = `You are about to perform ${actionLabel} in PRODUCTION. This will incur real costs. Do you want to proceed?`;
    if (typeof Swal !== 'undefined') {
        const res = await Swal.fire({
            icon: 'warning',
            title: 'Confirm Production Action',
            text: message,
            showCancelButton: true,
            confirmButtonText: 'Yes, proceed',
            cancelButtonText: 'Cancel'
        });
        return !!res.isConfirmed;
    }
    return window.confirm(message);
}

// UUID generation function for unique document references
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Progress tracking functions - Enhanced with modal overlay
function showProgressContainer() {
    const modal = document.getElementById('progressModalOverlay');
    const progressContainer = document.getElementById('eSignProgressContainer');

    // Show modal for better visibility
    if (modal) {
        modal.classList.remove('hidden');
    }
    // Also show original container for backward compatibility
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
    }

    // Reset progress state
    updateProgressBar(0);
    updateProgressStatus('Initializing process...');
}

function hideProgressContainer() {
    const modal = document.getElementById('progressModalOverlay');
    const progressContainer = document.getElementById('eSignProgressContainer');

    if (modal) {
        modal.classList.add('hidden');
    }
    if (progressContainer) {
        progressContainer.classList.add('hidden');
    }
}

function updateProgressBar(percentage) {
    // Update both original and modal progress bars
    const progressBar = document.getElementById('progressBar');
    const modalProgressBar = document.getElementById('modalProgressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const modalProgressPercentage = document.getElementById('modalProgressPercentage');

    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    if (modalProgressBar) {
        modalProgressBar.style.width = percentage + '%';
    }

    if (progressPercentage) {
        progressPercentage.textContent = Math.round(percentage) + '%';
    }
    if (modalProgressPercentage) {
        modalProgressPercentage.textContent = Math.round(percentage) + '%';
    }

    currentProgress = percentage;
}

function updateProgressStatus(message) {
    // Update both original and modal progress status
    const progressStatus = document.getElementById('progressStatus');
    const modalProgressStatus = document.getElementById('modalProgressStatus');

    if (progressStatus) {
        progressStatus.textContent = message;
    }
    if (modalProgressStatus) {
        modalProgressStatus.textContent = message;
    }
    console.log('Progress:', message);
}

function updateProgressStep(stepNumber) {
    currentStep = stepNumber;

    // Reset all steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            step.classList.remove('active', 'completed', 'processing');
            const circle = step.querySelector('.w-8');
            if (circle) {
                circle.classList.remove('bg-blue-600', 'bg-green-600', 'bg-yellow-500');
                circle.classList.add('bg-gray-300');
            }
        }
    }

    // Update steps based on current step
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        const circle = step?.querySelector('.w-8');

        if (i < stepNumber) {
            // Completed step
            step?.classList.add('completed');
            if (circle) {
                circle.classList.remove('bg-gray-300', 'bg-blue-600', 'bg-yellow-500');
                circle.classList.add('bg-green-600');
            }
        } else if (i === stepNumber) {
            // Current/active step
            step?.classList.add('processing');
            if (circle) {
                circle.classList.remove('bg-gray-300', 'bg-green-600', 'bg-blue-600');
                circle.classList.add('bg-yellow-500');
            }
        }
    }
}

function simulateProgressUpdate(targetPercentage, duration, callback) {
    const startPercentage = currentProgress;
    const progressDiff = targetPercentage - startPercentage;
    const updateInterval = 50; // Update every 50ms
    const steps = duration / updateInterval;
    const stepIncrement = progressDiff / steps;

    let currentUpdate = 0;

    if (progressInterval) {
        clearInterval(progressInterval);
    }

    progressInterval = setInterval(() => {
        currentUpdate++;
        const newProgress = startPercentage + (stepIncrement * currentUpdate);

        if (currentUpdate >= steps) {
            clearInterval(progressInterval);
            progressInterval = null;
            updateProgressBar(targetPercentage);
            if (callback) callback();
        } else {
            updateProgressBar(newProgress);
        }
    }, updateInterval);
}

function cancelESigningProcess() {
    // Clear any ongoing intervals
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }

    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }

    // Reset progress
    currentProgress = 0;
    currentStep = 1;

    // Hide progress container
    hideProgressContainer();

    // Reset UI
    updateProgressBar(0);
    updateProgressStatus('Process cancelled');
    updateProgressStep(1);

    // Show upload section again
    const uploadArea = document.getElementById('eSignUploadArea');
    if (uploadArea) {
        uploadArea.style.display = 'block';
    }

    console.log('🚫 E-signing process cancelled');

    // Show cancellation message
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'info',
            title: 'Process Cancelled',
            text: 'The e-signing process has been cancelled.',
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// Show success popup with download and view options
function showSuccessPopup(documentUrl, jobData) {
    console.log('Showing success popup for document:', documentUrl);

    const urlParams = new URLSearchParams(window.location.search);
    const stagingId = urlParams.get('stagingID');
    const docNum = document.getElementById('DocNum')?.value || 'Document';

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'E-Signing Completed',
            html: `
                <div class="text-left space-y-4">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex items-center space-x-2 mb-2">
                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="font-semibold text-green-800">Document Successfully Signed</span>
                        </div>
                        <p class="text-green-700 text-sm">Document: <strong>${docNum}</strong></p>
                        <p class="text-green-700 text-sm">Staging ID: <strong>${stagingId}</strong></p>
                        <p class="text-green-700 text-sm">Status: <strong>Signed & Ready</strong></p>
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="font-semibold text-blue-800 mb-3">Available Actions:</h4>
                        <div class="space-y-3">
                            <button onclick="viewSignedDocument('${documentUrl}', '${jobData?.id || currentJobId}')" 
                                    class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                <span> View Signed Document</span>
                            </button>
                            
                            <button onclick="downloadSignedDocumentFromPopup('${documentUrl}', 'signed_${docNum}.pdf')" 
                                    class="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <span> Download Document</span>
                            </button>
                            
                            <button onclick="refreshDocumentList()" 
                                    class="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                <span>Refresh Document List</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div class="flex items-start space-x-2">
                            <svg class="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div class="text-sm">
                                <p class="text-yellow-800 font-medium">Next Steps:</p>
                                <p class="text-yellow-700">• Document is now digitally signed</p>
                                <p class="text-yellow-700">• Available in the "Signed Documents" section</p>
                                <p class="text-yellow-700">• Consider applying E-Stamp if required</p>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            width: '600px',
            showCancelButton: false,
            confirmButtonText: '✅ Close',
            confirmButtonColor: '#059669',
            customClass: {
                popup: 'text-left'
            }
        });
    }
}

// View signed document function
function viewSignedDocument(documentUrl, jobId) {
    console.log('👁️ Viewing document:', documentUrl, 'Job ID:', jobId);

    if (!documentUrl) {
        // Fallback: try to get document from job ID
        if (jobId) {
            getDocumentByJobId(jobId).then(url => {
                if (url) {
                    openDocumentViewer(url);
                } else {
                    showDocumentNotFoundError('view');
                }
            }).catch(error => {
                console.error('Error getting document:', error);
                showDocumentNotFoundError('view');
            });
        } else {
            showDocumentNotFoundError('view');
        }
        return;
    }

    openDocumentViewer(documentUrl);
}

// Download signed document function
function downloadSignedDocumentFromPopup(documentUrl, fileName) {
    console.log('💾 Downloading document:', documentUrl, 'as:', fileName);

    if (!documentUrl) {
        showDocumentNotFoundError('download');
        return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = fileName || `signed_document_${Date.now()}.pdf`;
    link.target = '_blank';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'Download Started',
            text: 'Your signed document download has started.',
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// Get document by job ID
async function getDocumentByJobId(jobId) {
    try {
        const response = await fetch(kasboUrl(`/jobs/${jobId}/document`));
        if (response.ok) {
            const result = await response.json();
            return result.url || result.document_url || result.signed_url;
        }
        return null;
    } catch (error) {
        console.error('Error fetching document by job ID:', error);
        return null;
    }
}

// Open document viewer
function openDocumentViewer(url) {
    // Try to open in new window first
    const newWindow = window.open(url, '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');

    if (!newWindow) {
        // Fallback: show modal with iframe
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '📄 Signed Document Viewer',
                html: `
                    <div class="h-96">
                        <iframe src="${url}" 
                                class="w-full h-full border rounded" 
                                frameborder="0">
                        </iframe>
                    </div>
                `,
                width: '800px',
                showCancelButton: true,
                confirmButtonText: 'Open in New Tab',
                cancelButtonText: 'Close',
                confirmButtonColor: '#3b82f6'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.open(url, '_blank');
                }
            });
        } else {
            // Last resort: direct navigation
            window.location.href = url;
        }
    }
}

// Show document not found error
function showDocumentNotFoundError(action) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: `Cannot ${action} Document`,
            text: `The signed document URL is not available. Please check the document list or contact support.`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc2626'
        });
    }
}

// Initialize E-Signing features
function initializeESigningFeatures() {
    // Note: File upload event listeners are now handled in PartApprovalInvItem.html
    // to prevent duplicate event listener issues

    // Load existing signed documents for this staging ID
    loadExistingSignedDocuments();

    // Load existing stamped documents for this staging ID
    loadExistingStampedDocuments();
}

// Load existing signed documents for the current staging ID
async function loadExistingSignedDocuments() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const stagingId = urlParams.get('stagingID');

        if (!stagingId) {
            console.log('No staging ID found in URL parameters');
            return;
        }

        console.log('📄 Loading signed documents for staging ID:', stagingId);

        const apiUrl = kasboUrl(`/esign/staging/${stagingId}/documents`);
        console.log('📍 API URL:', apiUrl);

        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('📋 API Response:', result);

            if (result.success && result.data && result.data.length > 0) {
                documentTrackingData = result.data;
                console.log(`✅ Found ${result.data.length} signed documents`);
                displayExistingDocuments(result.data);

                // Show success notification
                if (result.count > 0) {
                    showDocumentLoadNotification(result.count, stagingId);
                }
            } else if (result.success && result.data && result.data.length === 0) {
                console.log('ℹ️ No signed documents found for this staging ID');
                showNoDocumentsMessage();
            } else {
                console.log('⚠️ Unexpected response format:', result);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ API Error:', response.status, errorText);

            // Handle 404 specifically - this means no documents exist yet
            if (response.status === 404) {
                console.log('ℹ️ No signed documents found (404 - endpoint not found or no documents)');
                showNoDocumentsMessage();
            } else {
                showDocumentLoadError(response.status, errorText);
            }
        }
    } catch (error) {
        console.error('❌ Error loading signed documents:', error);
        showDocumentLoadError('Network', error.message);
    }
}

// Show notification about loaded documents
function showDocumentLoadNotification(count, stagingId) {
    // Create a subtle notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg shadow-md z-50 transition-all duration-300';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm font-medium">Found ${count} signed document${count > 1 ? 's' : ''} for staging ID: ${stagingId}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Show message when no documents are found
function showNoDocumentsMessage() {
    // Only show this in the existing documents section if it doesn't already exist
    let existingDocsSection = document.getElementById('existingSignedDocs');
    if (!existingDocsSection) {
        existingDocsSection = document.createElement('div');
        existingDocsSection.id = 'existingSignedDocs';
        existingDocsSection.className = 'mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg';

        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection && uploadSection.parentNode) {
            uploadSection.parentNode.insertBefore(existingDocsSection, uploadSection);
        }
    }

    existingDocsSection.innerHTML = `
        <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            No Signed Documents Found
        </h4>
        <div class="text-center py-6">
            <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-gray-600 mb-2">No documents have been signed for this invoice yet.</p>
            <p class="text-sm text-gray-500">This is normal for new invoices. Upload and sign a document below to get started.</p>
        </div>
    `;
}

// Show error message when document loading fails
function showDocumentLoadError(statusOrType, message) {
    console.error('Failed to load signed documents:', statusOrType, message);

    // Don't show error notifications for 404s since we handle them gracefully
    if (statusOrType === 404 || statusOrType === '404') {
        return;
    }

    // Show error notification for other errors
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-md z-50 transition-all duration-300';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <div>
                <p class="text-sm font-medium">Failed to load signed documents</p>
                <p class="text-xs">Error: ${statusOrType} - ${message}</p>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 8 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 8000);
}

// Display existing signed documents
function displayExistingDocuments(documents) {
    // Find or create a section to display existing documents
    let existingDocsSection = document.getElementById('existingSignedDocs');
    if (!existingDocsSection) {
        // Create the section and insert it before the upload section
        existingDocsSection = document.createElement('div');
        existingDocsSection.id = 'existingSignedDocs';
        existingDocsSection.className = 'mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg';

        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection && uploadSection.parentNode) {
            uploadSection.parentNode.insertBefore(existingDocsSection, uploadSection);
        }
    }

    existingDocsSection.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Signed Documents (${documents.length})
            </h4>
            <div class="flex items-center space-x-2">
                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    ${documents.length} Document${documents.length !== 1 ? 's' : ''}
                </span>
                <button onclick="refreshDocumentList()" class="bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium py-1 px-3 rounded transition duration-200 flex items-center space-x-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    <span>Refresh</span>
                </button>
            </div>
        </div>
        <div class="existing-docs-container space-y-3">
            ${documents.map((doc, index) => `
                <div class="document-item bg-white p-4 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                    <div class="flex items-start justify-between">
                        <div class="flex items-start space-x-3 flex-1">
                            <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center space-x-2 mb-2">
                                    <p class="font-semibold text-gray-800 truncate">${doc.specific_document_ref || 'Main Document'}</p>
                                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                                        ID: ${doc.id}
                                    </span>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div class="flex items-center space-x-2">
                                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                        <span class="text-gray-600">Signer: <span class="font-medium">${doc.signer_name || 'Unknown'}</span></span>
                                    </div>
                                                                         <!-- Email display hidden -->
                                     ${doc.signer_email ? `
                                         <div class="flex items-center space-x-2 hidden">
                                             <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                                             </svg>
                                             <span class="text-gray-600 truncate">${doc.signer_email}</span>
                                         </div>
                                     ` : ''}
                                    <div class="flex items-center space-x-2">
                                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                                        </svg>
                                        <span class="text-gray-600 font-mono text-xs">${doc.transaction_id}</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span class="text-gray-600">${formatSignedDate(doc.signed_at)}</span>
                                    </div>
                                </div>
                                ${doc.partner_trx_id ? `
                                    <div class="mt-2 flex items-center space-x-2">
                                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                                        </svg>
                                        <span class="text-xs text-gray-500">Partner TRX: <span class="font-mono">${doc.partner_trx_id}</span></span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="flex flex-col space-y-2 ml-3">
                            <button onclick="startManualEStamping()" 
                                    class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center space-x-2 text-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                                </svg>
                                <span>Upload for E-Stamp</span>
                            </button>
                            <button onclick="downloadExistingDocument('${doc.signed_url}', '${(doc.specific_document_ref || 'document').replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf')" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center space-x-2 text-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <span>Download</span>
                            </button>
                            <button onclick="viewDocumentDetails('${doc.transaction_id}')" 
                                    class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded transition duration-200 text-xs">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Download existing signed document
function downloadExistingDocument(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
        icon: 'success',
        title: 'Download Started',
        text: 'Document download has been initiated.',
        timer: 2000,
        showConfirmButton: false
    });
}

// Show E-Signing section
function showESigningSection() {
    const eSigningSection = document.getElementById('eSigningSection');
    if (eSigningSection) {
        eSigningSection.style.display = 'block';
        eSigningSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Handle file selection
function handleFileSelection(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-blue-500', 'bg-blue-100');
}

// Handle drag leave
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
}

// Handle file drop
function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        validateAndSetFile(files[0]);
    }
}

// Validate and set file
function validateAndSetFile(file) {
    // Validate file type
    if (!file.type.includes('pdf')) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid File Type',
            text: 'Please upload a PDF file only.'
        });
        return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        Swal.fire({
            icon: 'error',
            title: 'File Too Large',
            text: 'Please upload a file smaller than 50MB.'
        });
        return;
    }

    selectedESignFile = file;
    displaySelectedFile(file);
    enableStartButton();
}

// Function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Display selected file
function displaySelectedFile(file) {
    const fileName = document.getElementById('selectedFileName');
    const fileSize = document.getElementById('selectedFileSize');
    const fileDisplay = document.getElementById('selectedFileDisplay');

    if (fileName && fileSize && fileDisplay) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileDisplay.classList.remove('hidden');
    }
}

// Remove selected file
function removeSelectedFile() {
    selectedESignFile = null;
    const fileDisplay = document.getElementById('selectedFileDisplay');
    const fileInput = document.getElementById('eSignFileInput');

    if (fileDisplay) {
        fileDisplay.classList.add('hidden');
    }
    if (fileInput) {
        fileInput.value = '';
    }

    disableStartButton();
}

// Enable start button
function enableStartButton() {
    const startBtn = document.getElementById('startESignBtn');
    const eStampCheckbox = document.getElementById('enableEStamp');
    if (startBtn) {
        startBtn.disabled = false;
    }
    // Enable e-stamp checkbox when file is selected
    if (eStampCheckbox) {
        eStampCheckbox.disabled = false;
    }
}

// Disable start button
function disableStartButton() {
    const startBtn = document.getElementById('startESignBtn');
    const eStampCheckbox = document.getElementById('enableEStamp');
    if (startBtn) {
        startBtn.disabled = true;
    }
    // Disable e-stamp checkbox when no file is selected
    if (eStampCheckbox) {
        eStampCheckbox.disabled = true;
        eStampCheckbox.checked = false;
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Start E-Signing process with enhanced API
async function startESigningProcess() {
    if (!selectedESignFile) {
        Swal.fire({
            icon: 'warning',
            title: 'No File Selected',
            text: 'Please select a PDF file to sign.'
        });
        return;
    }

    try {
        // Confirm when running in production
        const confirmed = await confirmProductionAction('an E-Sign operation');
        if (!confirmed) { return; }

        // Show progress container and start Step 1
        showProgressContainer();
        updateProgressStep(1);
        updateProgressStatus('Starting e-signing process...');
        updateProgressBar(0);

        // Hide upload area
        const uploadArea = document.getElementById('eSignUploadArea');
        if (uploadArea) {
            uploadArea.style.display = 'none';
        }

        // Step 1: File validation and preparation
        simulateProgressUpdate(15, 1000, () => {
            updateProgressStatus('Validating file...');
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Move to Step 2: Processing
        updateProgressStep(2);
        updateProgressStatus('Converting document to base64...');
        simulateProgressUpdate(35, 1500, () => {
            updateProgressStatus('Preparing document for signing...');
        });

        const documentBase64 = await fileToBase64(selectedESignFile);

        // Get document details
        const urlParams = new URLSearchParams(window.location.search);
        const stagingId = urlParams.get('stagingID');

        if (!stagingId) {
            throw new Error('Staging ID not found in URL');
        }

        // Get signer information
        let signerName = ""; // Default fallback
        let signerEmail = "";

        // Try to get current user information
        if (typeof currentUser !== 'undefined' && currentUser) {
            signerEmail = currentUser.email || currentUser.username + "@company.com";
        }

        // Try to get approvedByName from current invoice data - FIX: Use AppState
        const invData = (typeof AppState !== 'undefined' && AppState?.currentInvItemData) ||
            (typeof currentInvItemData !== 'undefined' && currentInvItemData);

        if (invData && invData.arInvoiceApprovalSummary) {
            signerName = invData.arInvoiceApprovalSummary.approvedByName || signerName;
            console.log('🔍 Found approvedByName from invoice data:', signerName);
        } else {
            // Fallback: try to get from HTML element if exists
            const approvedByNameElement = document.getElementById('approvedByName') || document.getElementById('approvedBySearch');
            if (approvedByNameElement && approvedByNameElement.value) {
                signerName = approvedByNameElement.value;
                console.log('🔍 Found approvedByName from HTML element:', signerName);
            } else {
                console.log('⚠️ No approvedByName found, using default:', signerName);
            }
        }

        // Create specific document reference
        const currentDateTime = new Date().toISOString().replace(/[:.]/g, '-');
        const specificDocRef = `receive_${currentDateTime}`;

        // Enhanced API payload with new fields
        const apiPayload = {
            document_base64: documentBase64,
            sign_image_name: signerName,
            document_type: "ARInvoices",
            document_id: stagingId,
            specific_document_ref: specificDocRef,
            signer_name: signerName,
            signer_email: signerEmail || undefined
        };

        // Move to Step 3: API Call and Signing
        updateProgressStep(3);
        updateProgressStatus('Sending document for e-signing...');
        simulateProgressUpdate(55, 2000, null);

        console.log('📝 Enhanced E-Sign API payload:', {
            ...apiPayload,
            document_base64: '[BASE64_DATA]' // Don't log the actual base64
        });
        console.log('📍 E-Sign URL:', kasboUrl('/esign/process'));

        const response = await fetch(kasboUrl('/esign/process'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiPayload)
        });

        console.log('📝 E-Sign response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ E-Sign API error:', errorText);
            throw new Error(`E-Sign API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('📝 E-Sign API result:', result);

        // Extract transaction information from enhanced response
        currentJobId = result.jobId || result.job_id || result.id || result.transaction_id || result.data?.jobId || result.data?.job_id || result.data?.id;

        if (!currentJobId) {
            console.error('❌ No job/transaction ID found in e-sign response:', result);
            throw new Error('No job ID returned from e-sign API');
        }

        console.log('📝 E-Sign Job/Transaction ID:', currentJobId);

        // Update progress to 70%
        simulateProgressUpdate(70, 1000, () => {
            updateProgressStatus('Document submitted for processing');
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Start checking job status
        updateProgressStatus('Processing document signature...');
        simulateProgressUpdate(85, 2000, null);
        await checkESignJobStatus();

    } catch (error) {
        console.error('E-Signing error:', error);
        showErrorState(error.message);
    }
}

// Check E-Sign job status with enhanced tracking
async function checkESignJobStatus() {
    if (!currentJobId) {
        throw new Error('No job ID available');
    }

    try {
        // Try both the job status endpoint and transaction status endpoint
        let statusUrl = kasboUrl(`/jobs/${currentJobId}/status`);
        let response = await fetch(statusUrl);

        // If job status fails, try transaction status endpoint
        if (!response.ok) {
            console.log('Job status endpoint failed, trying transaction status...');
            statusUrl = kasboUrl(`/esign/transaction/${currentJobId}/status`);
            response = await fetch(statusUrl);
        }

        const result = await response.json();
        console.log('📋 Status check result:', result);

        if (!response.ok) {
            // Extract detailed error information from the response
            let errorMessage = `e-sign request failed with status: ${response.status}`;
            if (result.errors && result.errors.length > 0) {
                errorMessage += `, response: ${JSON.stringify(result)}`;
            } else if (result.message) {
                errorMessage = `E-signing request failed: ${result.message}`;
            } else if (result.error) {
                errorMessage = `E-signing request failed: ${result.error}`;
            }

            console.error(`❌ E-signing API error (${response.status}):`, result);
            throw new Error(`E-signing request failed: ${errorMessage}`);
        }

        // Handle both job status and transaction status response formats
        let jobData = result.job || result.data || result;

        if (result.success !== false && jobData) {
            if (jobData.status === 'completed' || jobData.status === 'success') {
                // Move to Step 4: Complete
                updateProgressStep(4);
                updateProgressStatus('Digital signature completed');
                simulateProgressUpdate(100, 1000, () => {
                    // Hide spinner once complete
                    const spinner = document.getElementById('progressSpinner');
                    if (spinner) {
                        spinner.style.display = 'none';
                    }

                    // Show success message
                    updateProgressStatus('Document signed successfully');
                });

                // E-Signing completed
                signedDocumentUrl = extractSignedUrl(jobData.result || jobData.signed_url || jobData.message);

                // Refresh the existing documents list
                setTimeout(() => loadExistingSignedDocuments(), 2000);

                // Check if E-Stamp is requested
                const enableEStamp = document.getElementById('enableEStamp')?.checked;
                if (enableEStamp) {
                    await startEStampProcess();
                } else {
                    // Show success popup with download and view options
                    setTimeout(() => {
                        showSuccessPopup(signedDocumentUrl, jobData);
                        hideProgressContainer();
                        // Show upload area again
                        const uploadArea = document.getElementById('eSignUploadArea');
                        if (uploadArea) {
                            uploadArea.style.display = 'block';
                        }
                    }, 2000);
                }

            } else if (jobData.status === 'failed' || jobData.status === 'error') {
                throw new Error(jobData.error || jobData.message || 'E-signing failed');
            } else {
                // Still processing, check again immediately
                updateProgressStatus('E-signature in progress...');
                setTimeout(() => checkESignJobStatus(), 500);
            }
        } else {
            throw new Error('Invalid status response');
        }

    } catch (error) {
        console.error('Status check error:', error);

        // No retry - throw error immediately
        throw error;
    }
}

// Extract signed document URL from result
function extractSignedUrl(resultString) {
    if (!resultString) return null;

    // Look for URL pattern in the result string
    const urlMatch = resultString.match(/Signed URL: (https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : null;
}

// Start E-Stamp process
async function startEStampProcess() {
    try {
        // Confirm when running in production
        const confirmed = await confirmProductionAction('an E-Stamp operation');
        if (!confirmed) { return; }

        updateProcessStatus('Starting e-stamp process...', 80);

        const urlParams = new URLSearchParams(window.location.search);
        const stagingId = urlParams.get('stagingID');

        if (!stagingId) {
            throw new Error('Staging ID not found');
        }

        // Check if there's a QR code source from the invoice data - FIX: Use AppState
        let qrcodeSrc = '';
        let hasQrCode = false;

        // Try to get QR code from current invoice data
        const invDataForQR = (typeof AppState !== 'undefined' && AppState?.currentInvItemData) ||
            (typeof currentInvItemData !== 'undefined' && currentInvItemData);

        if (invDataForQR && invDataForQR.qrCodeSrc) {
            qrcodeSrc = invDataForQR.qrCodeSrc;
            console.log('🔍 QR Code from invoice data:', qrcodeSrc);
        } else {
            // Fallback to HTML element if exists
            const qrElement = document.getElementById('qrcodeSrc');
            if (qrElement) {
                qrcodeSrc = qrElement.value || '';
                console.log('🔍 QR Code from HTML element:', qrcodeSrc);
            } else {
                console.log('🔍 No QR Code element found, defaulting to empty');
            }
        }

        // Check if QR code is valid (not null, empty, or "null" string)
        hasQrCode = qrcodeSrc &&
            qrcodeSrc !== null &&
            qrcodeSrc.trim() !== '' &&
            qrcodeSrc !== 'null' &&
            qrcodeSrc.toLowerCase() !== 'null';

        console.log('🔍 QR Code source:', qrcodeSrc);
        console.log('🔍 Has QR Code:', hasQrCode);

        const stampPayload = {
            is_document_withqrcode: hasQrCode
        };

        console.log('🏷️ E-Stamp payload:', stampPayload);
        console.log('📍 E-Stamp URL:', kasboUrl(`/esign/stamp/ARInvoices/${stagingId}`));

        const stampUrl = kasboUrl(`/esign/stamp/ARInvoices/${stagingId}`);
        const response = await fetch(stampUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Email': getCaptureUserEmail()
            },
            body: JSON.stringify(stampPayload)
        });

        console.log('🏷️ E-Stamp response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ E-Stamp API error response:', errorText);
            throw new Error(`E-Stamp API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🏷️ E-Stamp API result:', result);

        // Try different possible job ID fields
        stampJobId = result.jobId || result.job_id || result.id || result.data?.jobId || result.data?.job_id || result.data?.id;

        if (!stampJobId) {
            console.error('❌ No stamp job ID found in response:', result);
            throw new Error('No stamp job ID returned from API');
        }

        console.log('🏷️ Stamp Job ID:', stampJobId);
        updateProcessStatus('E-stamp request submitted...', 85);

        // Start checking stamp job status immediately
        console.log('🚀 Starting e-stamp status checking immediately...');
        await checkEStampJobStatus();

    } catch (error) {
        console.error('❌ E-Stamp error:', error);
        // If e-stamp fails, still show the signed document
        showCompletionSection(false);
        Swal.fire({
            icon: 'warning',
            title: 'E-Stamp Failed',
            text: `E-signature completed successfully, but e-stamp failed: ${error.message}. You can download the signed document.`
        });
    }
}

// Check E-Stamp job status
async function checkEStampJobStatus() {
    if (!stampJobId) {
        throw new Error('No stamp job ID available');
    }

    try {
        const statusUrl = kasboUrl(`/jobs/${stampJobId}/status`);
        console.log('🔍 Checking e-stamp status at:', statusUrl);

        const response = await fetch(statusUrl, {
            headers: {
                'X-User-Email': getCaptureUserEmail()
            }
        });
        console.log('🔍 E-Stamp status response:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ E-Stamp status check error:', errorText);
            throw new Error(`Stamp status check failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🔍 E-Stamp status result:', result);

        if (result.success && result.job) {
            const job = result.job;
            console.log('🔍 E-Stamp job status:', job.status);

            if (job.status === 'completed') {
                // E-Stamp completed
                stampedDocumentUrl = extractStampedFileName(job.result);
                console.log('✅ E-Stamp completed, file:', stampedDocumentUrl);
                updateProcessStatus('E-stamp process completed', 100);
                showCompletionSection(true);

            } else if (job.status === 'failed' || job.status === 'error') {
                const errorMsg = job.error || job.result || 'E-stamping failed';
                console.error('❌ E-Stamp job failed:', errorMsg);
                throw new Error(errorMsg);
            } else {
                // Still processing, check again in 3 seconds
                console.log('⏳ E-Stamp still processing, will check again in 3 seconds...');
                updateProcessStatus('E-stamp in progress...', 95);
                setTimeout(() => checkEStampJobStatus(), 3000);
            }
        } else {
            console.error('❌ Invalid e-stamp status response:', result);
            throw new Error('Invalid stamp status response');
        }

    } catch (error) {
        console.error('❌ Stamp status check error:', error);

        // If e-stamp fails, still show the signed document
        showCompletionSection(false);
        Swal.fire({
            icon: 'warning',
            title: 'E-Stamp Failed',
            text: `E-signature completed successfully, but e-stamp failed: ${error.message}. You can download the signed document.`
        });
    }
}

// Extract stamped document filename from result
function extractStampedFileName(resultString) {
    if (!resultString) return null;

    // Look for stamped filename pattern in the result string
    const fileMatch = resultString.match(/stamped_ARInvoices_[^,\s]+\.pdf/);
    return fileMatch ? fileMatch[0] : null;
}

// Update step progress
function updateStepProgress(step) {
    const eSignStep = document.getElementById('eSignStep');
    if (eSignStep) {
        eSignStep.textContent = `${step} of 3`;
    }

    // Update step indicators
    for (let i = 1; i <= 3; i++) {
        const stepElement = document.getElementById(`step${i}`);
        const progressElement = document.getElementById(`progress${i}`);

        if (stepElement && progressElement) {
            if (i < step) {
                // Completed step
                stepElement.querySelector('div').className = 'w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold';
                stepElement.querySelector('span').className = 'text-sm font-medium text-green-600';
                progressElement.style.width = '100%';
            } else if (i === step) {
                // Current step
                stepElement.querySelector('div').className = 'w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold';
                stepElement.querySelector('span').className = 'text-sm font-medium text-blue-600';
                progressElement.style.width = '50%';
            } else {
                // Future step
                stepElement.querySelector('div').className = 'w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold';
                stepElement.querySelector('span').className = 'text-sm font-medium text-gray-500';
                progressElement.style.width = '0%';
            }
        }
    }
}

// Show processing section
function showProcessingSection() {
    const uploadSection = document.getElementById('uploadSection');
    const processingSection = document.getElementById('processingSection');
    const completionSection = document.getElementById('completionSection');

    if (uploadSection) uploadSection.classList.add('hidden');
    if (processingSection) processingSection.classList.remove('hidden');
    if (completionSection) completionSection.classList.add('hidden');
}

// Hide upload section
function hideUploadSection() {
    const uploadSection = document.getElementById('uploadSection');
    if (uploadSection) {
        uploadSection.classList.add('hidden');
    }
}

// Show completion section
function showCompletionSection(hasStamp) {
    updateStepProgress(3);

    const uploadSection = document.getElementById('uploadSection');
    const processingSection = document.getElementById('processingSection');
    const completionSection = document.getElementById('completionSection');
    const downloadStampedBtn = document.getElementById('downloadStampedBtn');
    const completionMessage = document.getElementById('completionMessage');

    if (uploadSection) uploadSection.classList.add('hidden');
    if (processingSection) processingSection.classList.add('hidden');
    if (completionSection) completionSection.classList.remove('hidden');

    if (hasStamp && downloadStampedBtn) {
        downloadStampedBtn.classList.remove('hidden');
        if (completionMessage) {
            completionMessage.textContent = 'Your document has been digitally signed and stamped, and is ready for download.';
        }
    } else {
        if (downloadStampedBtn) downloadStampedBtn.classList.add('hidden');
        if (completionMessage) {
            completionMessage.textContent = 'Your document has been digitally signed and is ready for download.';
        }
    }
}

// Update process status
function updateProcessStatus(status, percentage) {
    const processStatus = document.getElementById('processStatus');
    const processPercentage = document.getElementById('processPercentage');
    const processProgressBar = document.getElementById('processProgressBar');

    if (processStatus) processStatus.textContent = status;
    if (processPercentage) processPercentage.textContent = `${percentage}%`;
    if (processProgressBar) processProgressBar.style.width = `${percentage}%`;

    // Update time remaining estimate
    const timeRemaining = document.getElementById('timeRemaining');
    if (timeRemaining) {
        if (percentage < 50) {
            timeRemaining.textContent = '30-60 seconds';
        } else if (percentage < 80) {
            timeRemaining.textContent = '10-30 seconds';
        } else if (percentage < 95) {
            timeRemaining.textContent = '5-10 seconds';
        } else {
            timeRemaining.textContent = 'Almost done...';
        }
    }
}

// Show error state
function showErrorState(errorMessage) {
    // Stop any progress animations
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }

    // Update progress bar to show error state
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressStatus = document.getElementById('progressStatus');
    const progressSpinner = document.getElementById('progressSpinner');

    if (progressBar) {
        progressBar.style.backgroundColor = '#dc2626'; // Red color for error
        progressBar.style.width = '100%';
    }
    if (progressPercentage) {
        progressPercentage.textContent = 'Error';
        progressPercentage.style.color = '#dc2626';
    }
    if (progressStatus) {
        progressStatus.textContent = '❌ ' + (errorMessage || 'An error occurred');
        progressStatus.style.color = '#dc2626';
    }
    if (progressSpinner) {
        progressSpinner.style.display = 'none';
    }

    // Update current step to show error
    const currentStepElement = document.getElementById(`step${currentStep}`);
    if (currentStepElement) {
        const circle = currentStepElement.querySelector('.w-8');
        if (circle) {
            circle.classList.remove('bg-yellow-500', 'bg-blue-600', 'bg-green-600');
            circle.classList.add('bg-red-600');
        }
    }

    // Auto-hide progress after 5 seconds and show upload area
    setTimeout(() => {
        hideProgressContainer();
        // Reset progress bar color
        if (progressBar) {
            progressBar.style.backgroundColor = '#2563eb';
            progressBar.style.width = '0%';
        }
        if (progressPercentage) {
            progressPercentage.style.color = '#2563eb';
        }
        if (progressStatus) {
            progressStatus.style.color = '#374151';
        }
        // Show upload area again
        const uploadArea = document.getElementById('eSignUploadArea');
        if (uploadArea) {
            uploadArea.style.display = 'block';
        }
    }, 5000);

    Swal.fire({
        icon: 'error',
        title: 'E-Signing Failed',
        text: errorMessage || 'An error occurred during the e-signing process. Please try again.',
        confirmButtonText: 'Try Again'
    });
}

// Download original document (placeholder function)
function downloadOriginalDocument() {
    // This function should generate/download the original PDF
    // Implementation depends on your existing document generation logic
    Swal.fire({
        icon: 'info',
        title: 'Download Original Document',
        text: 'This feature will download the original document for signing.'
    });
}

// Download signed document with enhanced tracking
async function downloadSignedDocument() {
    if (!signedDocumentUrl) {
        // Try to get the latest signed document from tracking data
        if (documentTrackingData && documentTrackingData.length > 0) {
            const latestDoc = documentTrackingData[documentTrackingData.length - 1];
            if (latestDoc.signed_url) {
                signedDocumentUrl = latestDoc.signed_url;
            }
        }

        if (!signedDocumentUrl) {
            Swal.fire({
                icon: 'error',
                title: 'No Signed Document',
                text: 'No signed document URL available. Please check the existing documents section above.'
            });
            return;
        }
    }

    try {
        // Create download link (use absolute URL; if relative, prefix with current environment base)
        const link = document.createElement('a');
        const isAbsolute = /^https?:\/\//i.test(signedDocumentUrl);
        link.href = isAbsolute ? signedDocumentUrl : `${getKasboBaseUrl().replace(/\/+$/, '')}/${signedDocumentUrl.replace(/^\/+/, '')}`;

        // Generate filename with staging ID and timestamp
        const urlParams = new URLSearchParams(window.location.search);
        const stagingId = urlParams.get('stagingID') || 'document';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        link.download = `signed_invoice_${stagingId}_${timestamp}.pdf`;
        link.target = '_blank';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
            icon: 'success',
            title: 'Download Started',
            text: 'Your signed document download has started.',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Download error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: 'Failed to download the signed document. Please try again.'
        });
    }
}

// Download stamped document with enhanced tracking
async function downloadStampedDocument() {
    if (!stampedDocumentUrl) {
        Swal.fire({
            icon: 'error',
            title: 'No Stamped Document',
            text: 'No stamped document available. E-stamp may not have been applied or may still be processing.'
        });
        return;
    }

    try {
        // Build download URL respecting current environment
        const isAbsolute = /^https?:\/\//i.test(stampedDocumentUrl);
        const downloadUrl = isAbsolute ? stampedDocumentUrl : kasboUrl(`/esign/download/stamped/ARInvoices/${stampedDocumentUrl}`);

        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;

        // Generate filename with staging ID and timestamp
        const urlParams = new URLSearchParams(window.location.search);
        const stagingId = urlParams.get('stagingID') || 'document';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        link.download = `stamped_invoice_${stagingId}_${timestamp}.pdf`;
        link.target = '_blank';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
            icon: 'success',
            title: 'Download Started',
            text: 'Your signed and stamped document download has started.',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Download error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: 'Failed to download the stamped document. Please try again.'
        });
    }
}

// Enhanced function to get document by transaction ID
async function getDocumentByTransactionId(transactionId) {
    try {
        const response = await fetch(kasboUrl(`/esign/transaction/${transactionId}/document`));

        if (response.ok) {
            const result = await response.json();
            return result;
        }

        return null;
    } catch (error) {
        console.error('Error fetching document by transaction ID:', error);
        return null;
    }
}

// Enhanced function to refresh document list
async function refreshDocumentList() {
    updateProcessStatus('Refreshing document list...', 95);
    await loadExistingSignedDocuments();

    Swal.fire({
        icon: 'info',
        title: 'Documents Refreshed',
        text: 'The document list has been updated with the latest signed documents.',
        timer: 3000,
        showConfirmButton: false
    });
}

// Helper function to format signed date
function formatSignedDate(dateString) {
    if (!dateString) return 'Unknown';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

// View document details function
async function viewDocumentDetails(transactionId) {
    try {
        const result = await getDocumentByTransactionId(transactionId);

        if (result && result.success && result.data) {
            const doc = result.data;

            Swal.fire({
                title: 'Document Details',
                html: `
                    <div class="text-left space-y-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-2">Basic Information</h4>
                            <div class="space-y-2 text-sm">
                                <div><strong>Document ID:</strong> ${doc.id}</div>
                                <div><strong>Document Type:</strong> ${doc.document_type}</div>
                                <div><strong>Staging ID:</strong> ${doc.document_id}</div>
                                <div><strong>Document Reference:</strong> ${doc.specific_document_ref || 'N/A'}</div>
                                <div><strong>Transaction ID:</strong> <span class="font-mono text-blue-600">${doc.transaction_id}</span></div>
                                ${doc.partner_trx_id ? `<div><strong>Partner Transaction ID:</strong> <span class="font-mono">${doc.partner_trx_id}</span></div>` : ''}
                            </div>
                        </div>
                        
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-2">Signer Information</h4>
                            <div class="space-y-2 text-sm">
                                <div><strong>Signer Name:</strong> ${doc.signer_name || 'Unknown'}</div>
                                ${doc.signer_email ? `<div><strong>Signer Email:</strong> ${doc.signer_email}</div>` : ''}
                            </div>
                        </div>
                        
                        <div class="bg-green-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-2">Timestamps</h4>
                            <div class="space-y-2 text-sm">
                                <div><strong>Signed At:</strong> ${new Date(doc.signed_at).toLocaleString()}</div>
                                <div><strong>Created At:</strong> ${new Date(doc.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                `,
                width: '600px',
                showCancelButton: true,
                confirmButtonText: 'Download Document',
                cancelButtonText: 'Close',
                confirmButtonColor: '#3B82F6'
            }).then((result) => {
                if (result.isConfirmed) {
                    downloadExistingDocument(doc.signed_url, `${(doc.specific_document_ref || 'document').replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`);
                }
            });
        } else {
            throw new Error('Document details not found');
        }
    } catch (error) {
        console.error('Error fetching document details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load document details. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

// ================== E-STAMPING FUNCTIONS ==================

// Load existing stamped documents for the current staging ID
async function loadExistingStampedDocuments() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const stagingId = urlParams.get('stagingID');

        if (!stagingId) {
            console.log('No staging ID found for stamped documents');
            return;
        }

        console.log('📄 Loading stamped documents for staging ID:', stagingId);

        const apiUrl = kasboUrl(`/emeterai/staging/${stagingId}/stamped`);
        console.log('📍 Stamped Documents API URL:', apiUrl);

        const response = await fetch(apiUrl);
        console.log('📡 Stamped Documents Response status:', response.status);

        if (response.status === 404) {
            // No stamped documents found - this is normal
            console.log('ℹ️ No stamped documents found for this staging ID (404)');
            showNoStampedDocumentsMessage();
            return;
        }

        if (!response.ok) {
            showStampedDocumentLoadError(response.status, `HTTP Error: ${response.status}`);
            return;
        }

        const result = await response.json();
        console.log('📋 Stamped Documents API Response:', result);

        if (result.success && result.data && result.data.length > 0) {
            displayExistingStampedDocuments(result.data);
            showStampedDocumentLoadNotification(result.data.length, stagingId);
        } else {
            showNoStampedDocumentsMessage();
        }

    } catch (error) {
        console.error('❌ Error loading stamped documents:', error);
        showStampedDocumentLoadError('network', error.message);
    }
}

// Display stamped document load notification
function showStampedDocumentLoadNotification(count, stagingId) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-purple-100 border border-purple-200 text-purple-800 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="font-medium">Loaded ${count} stamped document${count > 1 ? 's' : ''}</span>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Show message when no stamped documents are found
function showNoStampedDocumentsMessage() {
    const container = document.getElementById('existingStampedDocs');
    if (!container) return;

    container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
            <div class="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            </div>
            <p class="text-lg font-medium text-gray-600 mb-2">No E-Stamped Documents</p>
            <p class="text-sm text-gray-500">No documents have been e-stamped for this invoice yet.</p>
            <p class="text-xs text-gray-400 mt-2">This is normal for new invoices or those that haven't undergone e-stamping.</p>
        </div>
    `;
}

// Show error notification for stamped document loading failures
function showStampedDocumentLoadError(statusOrType, message) {
    // Skip 404 errors as they're handled separately
    if (statusOrType === 404) return;

    console.error('❌ Stamped Document Load Error:', statusOrType, message);

    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="font-medium">Failed to load stamped documents</span>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
}

// Display existing stamped documents
function displayExistingStampedDocuments(documents) {
    const container = document.getElementById('existingStampedDocs');
    if (!container) return;

    const documentsHtml = documents.map(doc => `
        <div class="bg-white border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow document-item">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-800">${doc.specific_document_ref || 'Stamped Document'}</h4>
                        <p class="text-sm text-gray-600">${formatSignedDate(doc.stamped_at)}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                        ID: ${doc.id}
                    </span>
                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                        ✓ E-Stamped
                    </span>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                    <span class="text-gray-600">Ref: <span class="font-medium font-mono">${doc.ref_num}</span></span>
                </div>
                <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    <span class="text-gray-600">Serial: <span class="font-medium font-mono">${doc.serial_number}</span></span>
                </div>
                <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-gray-600">${formatSignedDate(doc.stamped_at)}</span>
                </div>
            </div>
            <div class="mt-3 flex justify-end space-x-2">
                <button onclick="downloadStampedDocument('${doc.ref_num}', '${(doc.specific_document_ref || 'stamped_document').replace(/[^a-zA-Z0-9]/g, '_')}_stamped.pdf')" class="text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors">
                    <div class="flex items-center space-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>Download</span>
                    </div>
                </button>
                <button onclick="viewStampedDocumentDetails('${doc.ref_num}')" class="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors">
                    <div class="flex items-center space-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Details</span>
                    </div>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="existing-docs-container space-y-4">
            ${documentsHtml}
        </div>
    `;
}

// Download stamped document
async function downloadStampedDocument(refNum, filename) {
    try {
        console.log('📥 Downloading stamped document:', refNum, filename);

        const response = await fetch(kasboUrl(`/emeterai/stamped/${refNum}`));

        if (!response.ok) {
            throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data || !result.data.document) {
            throw new Error('Invalid response format or missing document data');
        }

        // Convert base64 to blob and download
        const binaryString = atob(result.data.document);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ Stamped document downloaded successfully');

    } catch (error) {
        console.error('❌ Error downloading stamped document:', error);
        Swal.fire({
            icon: 'error',
            title: 'Download Error',
            text: `Failed to download stamped document: ${error.message}`,
            confirmButtonText: 'OK'
        });
    }
}

// View stamped document details
async function viewStampedDocumentDetails(refNum) {
    try {
        const response = await fetch(kasboUrl(`/emeterai/stamped/${refNum}`));

        if (!response.ok) {
            throw new Error(`Failed to fetch document details: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
            const doc = result.data;
            Swal.fire({
                title: 'E-Stamped Document Details',
                html: `
                    <div class="text-left space-y-4">
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-2">Document Information</h4>
                            <div class="space-y-2 text-sm">
                                <div><strong>Reference Number:</strong> <span class="font-mono">${doc.ref_num}</span></div>
                            </div>
                        </div>
                    </div>
                `,
                width: '500px',
                showCancelButton: true,
                confirmButtonText: 'Download Document',
                cancelButtonText: 'Close',
                confirmButtonColor: '#8B5CF6'
            }).then((result) => {
                if (result.isConfirmed) {
                    downloadStampedDocument(doc.ref_num, `${doc.ref_num}_stamped.pdf`);
                }
            });
        } else {
            throw new Error('Document details not found');
        }
    } catch (error) {
        console.error('Error fetching stamped document details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load document details. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

// Start e-stamping process
async function startEStampingProcess() {
    try {
        if (!signedDocumentUrl) {
            throw new Error('No signed document available for stamping');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const stagingId = urlParams.get('stagingID');

        if (!stagingId) {
            throw new Error('No staging ID found');
        }

        // Show stamping section
        const completionSection = document.getElementById('completionSection');
        const stampingSection = document.getElementById('stampingSection');

        if (completionSection) completionSection.classList.add('hidden');
        if (stampingSection) stampingSection.classList.remove('hidden');

        updateStampStatus('Preparing document for e-stamping...', 10);

        // Try multiple methods to get the signed document base64
        let signedBase64;

        try {
            // Method 1: Try direct fetch (might work with CORS)
            const signedResponse = await fetch(signedDocumentUrl);
            if (!signedResponse.ok) {
                throw new Error('Direct fetch failed');
            }

            const signedBlob = await signedResponse.blob();
            signedBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(signedBlob);
            });
            console.log('✅ Direct fetch successful');

        } catch (fetchError) {
            console.log('⚠️ Direct fetch failed due to CORS, trying proxy method...');

            // Method 2: Use backend proxy to fetch the document
            try {
                const proxyResponse = await fetch(kasboUrl('/proxy/download'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: signedDocumentUrl,
                        type: 'signed_document'
                    })
                });

                if (!proxyResponse.ok) {
                    throw new Error('Proxy fetch failed');
                }

                const proxyResult = await proxyResponse.json();
                if (proxyResult.success && proxyResult.base64) {
                    signedBase64 = proxyResult.base64;
                    console.log('✅ Proxy fetch successful');
                } else {
                    throw new Error('Invalid proxy response');
                }

            } catch (proxyError) {
                console.log('⚠️ Proxy method failed, trying alternative approach...');

                // Method 3: Use the original uploaded file if available
                if (selectedESignFile) {
                    console.log('📄 Using original uploaded file for e-stamping');
                    signedBase64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64 = reader.result.split(',')[1];
                            resolve(base64);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(selectedESignFile);
                    });
                    console.log('✅ Original file used successfully');
                } else {
                    throw new Error('No alternative method available. Please ensure the signed document is accessible or try uploading the document again.');
                }
            }
        }

        updateStampStatus('Sending document for e-stamping...', 30);

        // Detect QR code presence to inform stamping API
        let qrcodeSrcForStamp = '';
        let hasQrCodeForStamp = false;
        try {
            if (typeof currentInvItemData !== 'undefined' && currentInvItemData && currentInvItemData.qrCodeSrc) {
                qrcodeSrcForStamp = currentInvItemData.qrCodeSrc;
            } else {
                const qrElement = document.getElementById('qrcodeSrc');
                if (qrElement) {
                    qrcodeSrcForStamp = qrElement.value || '';
                }
            }
            hasQrCodeForStamp = !!(qrcodeSrcForStamp && qrcodeSrcForStamp !== null &&
                String(qrcodeSrcForStamp).trim() !== '' && String(qrcodeSrcForStamp).toLowerCase() !== 'null');
            console.log('🔍 [E-Stamp] Has QR Code (auto):', hasQrCodeForStamp);
        } catch (e) {
            console.warn('⚠️ [E-Stamp] QR code detection failed:', e);
        }

        // Generate unique UUID for document reference
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        const specificDocRef = generateUUID();

        // Create e-stamp API payload
        const stampPayload = {
            document_base64: signedBase64,
            document_type: "ARInvoices",
            document_id: stagingId,
            specific_document_ref: specificDocRef,
            is_document_withqrcode: hasQrCodeForStamp
        };

        console.log('📝 E-Stamp API payload:', {
            ...stampPayload,
            document_base64: '[BASE64_DATA]' // Don't log the actual base64
        });

        const stampResponse = await fetch(kasboUrl('/emeterai/stamp-document'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Email': getCaptureUserEmail()
            },
            body: JSON.stringify(stampPayload)
        });

        if (!stampResponse.ok) {
            const errorText = await stampResponse.text();
            throw new Error(`E-stamp API error: ${stampResponse.status} - ${errorText}`);
        }

        const stampResult = await stampResponse.json();
        console.log('📋 E-Stamp API Response:', stampResult);

        if (!stampResult.success || !stampResult.job_id) {
            throw new Error('Invalid e-stamp API response');
        }

        stampJobId = stampResult.job_id;
        console.log('🆔 E-Stamp Job ID:', stampJobId);

        // Start checking job status immediately
        updateStampStatus('E-stamping process started...', 60);
        await checkEStampJobStatus();

    } catch (error) {
        console.error('❌ E-Stamping process failed:', error);
        updateStampStatus('E-stamping failed', 0);

        // Check if it's a CORS/network error and offer alternative
        const isCorsError = error.message.includes('Failed to fetch') ||
            error.message.includes('CORS') ||
            error.message.includes('No alternative method available');

        if (isCorsError) {
            Swal.fire({
                icon: 'warning',
                title: 'Network Restriction Detected',
                html: `
                    <div class="text-left">
                        <p class="mb-4">Unable to access the signed document due to network restrictions.</p>
                        <p class="mb-4"><strong>Would you like to try manual e-stamping instead?</strong></p>
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                            <p class="text-blue-800">Manual e-stamping allows you to upload your signed document directly for stamping, bypassing network restrictions.</p>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Try Manual E-Stamping',
                cancelButtonText: 'Close',
                confirmButtonColor: '#8B5CF6',
                cancelButtonColor: '#6B7280',
                width: '500px'
            }).then((result) => {
                if (result.isConfirmed) {
                    startManualEStamping();
                }
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'E-Stamping Failed',
                text: error.message,
                confirmButtonText: 'OK'
            });
        }

        // Show completion section again
        const stampingSection = document.getElementById('stampingSection');
        const completionSection = document.getElementById('completionSection');

        if (stampingSection) stampingSection.classList.add('hidden');
        if (completionSection) completionSection.classList.remove('hidden');
    }
}

// Check e-stamp job status
async function checkEStampJobStatus() {
    try {
        if (!stampJobId) {
            throw new Error('No stamp job ID available');
        }

        console.log('📊 Checking e-stamp job status (5 seconds after response):', stampJobId);

        const response = await fetch(kasboUrl(`/jobs/${stampJobId}/status`));

        if (!response.ok) {
            throw new Error(`Status check failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('📈 E-Stamp Status Response:', result);

        if (!result.success || !result.job) {
            throw new Error('Invalid status response');
        }

        const job = result.job;

        if (job.status === 'completed') {
            console.log('✅ E-stamping completed successfully!');
            updateStampStatus('E-stamping completed', 100);

            if (job.ref_num) {
                // Download the stamped document
                setTimeout(async () => {
                    try {
                        await downloadStampedDocument(job.ref_num, `${job.ref_num}_stamped.pdf`);

                        // Show final completion
                        const stampingSection = document.getElementById('stampingSection');
                        if (stampingSection) stampingSection.classList.add('hidden');
                        showStampingCompleted(job.ref_num);

                        // Refresh the stamped documents list
                        setTimeout(() => {
                            loadExistingStampedDocuments();
                        }, 1000);

                    } catch (downloadError) {
                        console.error('Error downloading stamped document:', downloadError);
                    }
                }, 1000);
            }
        } else if (job.status === 'failed') {
            throw new Error(`E-stamping job failed: ${job.error || 'Unknown error'}`);
        } else {
            // Still processing, check again in 2 seconds
            updateStampStatus('E-stamping in progress...', 75);
            setTimeout(() => checkEStampJobStatus(), 2000);
        }

    } catch (error) {
        console.error('E-stamp status check error:', error);
        throw error;
    }
}

// Update stamp progress status
function updateStampStatus(message, percentage) {
    const statusElement = document.getElementById('stampStatus');
    const percentageElement = document.getElementById('stampPercentage');
    const progressBar = document.getElementById('stampProgressBar');
    const timeRemaining = document.getElementById('stampTimeRemaining');

    if (statusElement) statusElement.textContent = message;
    if (percentageElement) percentageElement.textContent = `${percentage}%`;
    if (progressBar) progressBar.style.width = `${percentage}%`;

    if (timeRemaining) {
        if (percentage < 50) {
            timeRemaining.textContent = '20-40 seconds';
        } else if (percentage < 80) {
            timeRemaining.textContent = '10-20 seconds';
        } else if (percentage < 95) {
            timeRemaining.textContent = '5-10 seconds';
        } else {
            timeRemaining.textContent = 'Almost done...';
        }
    }
}

// Show stamping completed section
function showStampingCompleted(refNum) {
    const completionHtml = `
        <div id="stampCompletionSection" class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
            <div class="text-center">
                <div class="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h4 class="text-xl font-semibold text-gray-800 mb-2">Document Successfully E-Stamped!</h4>
                <p class="text-gray-600 mb-4">Your document has been digitally signed and e-stamped with reference: <span class="font-mono font-medium">${refNum}</span></p>
                
                <div class="space-y-3">
                    <button onclick="downloadStampedDocument('${refNum}', '${refNum}_stamped.pdf')" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition transform hover:scale-105 duration-200">
                        <div class="flex items-center justify-center space-x-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span>Download E-Stamped Document</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Find the e-signing section and append the completion section
    const eSigningSection = document.getElementById('eSigningSection');
    if (eSigningSection) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = completionHtml;
        eSigningSection.appendChild(tempDiv.firstElementChild);
    }
}

// Show e-stamping option after e-signing completion
function showEStampingOption() {
    Swal.fire({
        title: 'E-Signing Completed',
        html: `
            <div class="text-left">
                <p class="mb-4">Your document has been successfully signed.</p>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p class="text-blue-800 font-medium">Next step to apply E-Stamp:</p>
                    <ol class="list-decimal list-inside space-y-1 text-blue-800">
                        <li>Download the signed document</li>
                        <li>Click \"Upload for E-Stamp\" and upload the signed PDF</li>
                    </ol>
                </div>
            </div>
        `,
        icon: 'info',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Download Signed Document',
        denyButtonText: 'Upload for E-Stamp',
        cancelButtonText: 'Close',
        confirmButtonColor: '#3B82F6',
        denyButtonColor: '#8B5CF6',
        cancelButtonColor: '#6B7280',
        width: '500px'
    }).then((result) => {
        if (result.isConfirmed) {
            downloadSignedDocument();
        } else if (result.isDenied) {
            startManualEStamping();
        }
    });
}

// Standalone e-stamping function for manual document upload
function startManualEStamping() {
    Swal.fire({
        title: 'Upload Document for E-Stamping',
        html: `
            <div class="text-left">
                <p class="mb-4">Upload your signed PDF document to apply an electronic stamp (E-meterai).</p>
                <input type="file" id="manualStampFileInput" accept=".pdf" class="w-full p-2 border border-gray-300 rounded-lg">
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 text-sm">
                    <div class="flex items-start space-x-2">
                        <svg class="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <div>
                            <p class="text-yellow-800 font-medium">Note:</p>
                            <p class="text-yellow-700">This method bypasses network restrictions and works reliably for e-stamping.</p>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Apply E-Stamp',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#8B5CF6',
        cancelButtonColor: '#6B7280',
        width: '500px',
        preConfirm: () => {
            const fileInput = document.getElementById('manualStampFileInput');
            const file = fileInput.files[0];

            if (!file) {
                Swal.showValidationMessage('Please select a PDF file');
                return false;
            }

            if (file.type !== 'application/pdf') {
                Swal.showValidationMessage('Please select a PDF file');
                return false;
            }

            return file;
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            processManualEStamping(result.value);
        }
    });
}

// Process manual e-stamping with uploaded file
async function processManualEStamping(file) {
    try {
        // Confirm when running in production
        const confirmed = await confirmProductionAction('an E-Stamp operation');
        if (!confirmed) { return; }

        const urlParams = new URLSearchParams(window.location.search);
        const stagingId = urlParams.get('stagingID');

        console.log('🔍 Validating e-stamp prerequisites...');
        console.log('📋 URL Params:', Object.fromEntries(urlParams));
        console.log('🆔 Staging ID:', stagingId);
        console.log('📁 File:', file ? `${file.name} (${file.size} bytes)` : 'No file');

        if (!stagingId) {
            console.error('❌ Missing staging ID from URL');
            throw new Error('Staging ID not found in URL parameters. Please refresh the page and try again.');
        }

        if (!file) {
            console.error('❌ No file provided');
            throw new Error('No file provided for e-stamping');
        }

        if (file.type !== 'application/pdf') {
            console.error('❌ Invalid file type:', file.type);
            throw new Error('Only PDF files are supported for e-stamping');
        }

        console.log('✅ Prerequisites validation passed');

        // Show stamping section
        const completionSection = document.getElementById('completionSection');
        const stampingSection = document.getElementById('stampingSection');

        if (completionSection) completionSection.classList.add('hidden');
        if (stampingSection) stampingSection.classList.remove('hidden');

        updateStampStatus('Preparing document for e-stamping...', 10);

        // Convert file to base64 with error handling
        console.log('📄 Converting file to base64...');
        let signedBase64;
        try {
            signedBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const result = reader.result;
                        if (!result || typeof result !== 'string') {
                            reject(new Error('Failed to read file: Invalid result'));
                            return;
                        }

                        const base64Parts = result.split(',');
                        if (base64Parts.length !== 2) {
                            reject(new Error('Failed to read file: Invalid data URL format'));
                            return;
                        }

                        const base64 = base64Parts[1];
                        if (!base64) {
                            reject(new Error('Failed to read file: No base64 data'));
                            return;
                        }

                        console.log('✅ File converted to base64 successfully');
                        resolve(base64);
                    } catch (e) {
                        reject(new Error(`Failed to process file: ${e.message}`));
                    }
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read file: FileReader error'));
                };
                reader.onabort = () => {
                    reject(new Error('File reading was aborted'));
                };
                reader.readAsDataURL(file);
            });
        } catch (fileError) {
            console.error('❌ File conversion failed:', fileError);
            throw new Error(`File processing failed: ${fileError.message}`);
        }

        updateStampStatus('Sending document for e-stamping...', 30);

        // Detect QR code presence to inform stamping API - FIX: Use AppState
        let qrcodeSrcManual = '';
        let hasQrCodeManual = false;
        try {
            const invDataManual = (typeof AppState !== 'undefined' && AppState?.currentInvItemData) ||
                (typeof currentInvItemData !== 'undefined' && currentInvItemData);

            if (invDataManual && invDataManual.qrCodeSrc) {
                qrcodeSrcManual = invDataManual.qrCodeSrc;
            } else {
                const qrElement = document.getElementById('qrcodeSrc');
                if (qrElement) {
                    qrcodeSrcManual = qrElement.value || '';
                }
            }
            hasQrCodeManual = !!(qrcodeSrcManual && qrcodeSrcManual !== null &&
                String(qrcodeSrcManual).trim() !== '' && String(qrcodeSrcManual).toLowerCase() !== 'null');
            console.log('🔍 [E-Stamp] Has QR Code (manual):', hasQrCodeManual);
        } catch (e) {
            console.warn('⚠️ [E-Stamp] QR code detection (manual) failed:', e);
        }

        // Generate unique UUID for document reference
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        const specificDocRef = generateUUID();

        // Create e-stamp API payload
        const stampPayload = {
            document_base64: signedBase64,
            document_type: "ARInvoices",
            document_id: stagingId,
            specific_document_ref: specificDocRef,
            is_document_withqrcode: hasQrCodeManual
        };

        console.log('📝 Manual E-Stamp API payload:', {
            ...stampPayload,
            document_base64: '[BASE64_DATA]'
        });

        const apiUrl = kasboUrl('/emeterai/stamp-document');
        const userEmail = getCaptureUserEmail();

        console.log('🔗 E-Stamp API URL:', apiUrl);
        console.log('👤 User Email:', userEmail);
        console.log('📤 Making API request...');

        const stampResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Email': userEmail
            },
            body: JSON.stringify(stampPayload)
        });

        console.log('📡 API Response Status:', stampResponse.status);
        console.log('📡 API Response Headers:', Object.fromEntries(stampResponse.headers.entries()));

        if (!stampResponse.ok) {
            const errorText = await stampResponse.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`E-stamp API error: ${stampResponse.status} - ${errorText}`);
        }

        const stampResult = await stampResponse.json();
        console.log('📋 Manual E-Stamp API Response:', stampResult);

        if (!stampResult.success || !stampResult.job_id) {
            throw new Error('Invalid e-stamp API response');
        }

        stampJobId = stampResult.job_id;
        console.log('🆔 Manual E-Stamp Job ID:', stampJobId);

        // Start checking job status immediately
        updateStampStatus('E-stamping process started...', 60);
        await checkEStampJobStatus();

    } catch (error) {
        console.error('❌ Manual E-Stamping process failed:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error type:', error.constructor.name);
        console.error('❌ Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        updateStampStatus('E-stamping failed', 0);

        // More detailed error message
        let errorMessage = 'An unexpected error occurred during e-stamping.';

        if (error.message.includes('fetch')) {
            errorMessage = 'Network error: Unable to connect to e-stamp service. Please check your internet connection.';
        } else if (error.message.includes('API error')) {
            errorMessage = `API Error: ${error.message}`;
        } else if (error.message.includes('staging ID')) {
            errorMessage = 'Missing staging ID. Please refresh the page and try again.';
        } else if (error.message.includes('JSON')) {
            errorMessage = 'Invalid server response. Please try again or contact support.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        console.error('🚨 Final error message:', errorMessage);

        Swal.fire({
            icon: 'error',
            title: 'E-Stamping Failed',
            html: `
                <div class="text-left">
                    <p class="mb-3">${errorMessage}</p>
                    <div class="bg-gray-100 p-3 rounded text-xs font-mono">
                        <strong>Technical Details:</strong><br>
                        ${error.message || 'Unknown error'}<br>
                        <strong>Error Type:</strong> ${error.constructor.name}
                    </div>
                </div>
            `,
            confirmButtonText: 'OK',
            width: '500px'
        });

        // Show completion section again
        const stampingSection = document.getElementById('stampingSection');
        const completionSection = document.getElementById('completionSection');

        if (stampingSection) stampingSection.classList.add('hidden');
        if (completionSection) completionSection.classList.remove('hidden');
    }
}

// Apply e-stamp to a previously signed document
async function applyEStampToSignedDocument(signedUrl, docRef) {
    try {
        const safeName = (docRef || 'document').replace(/[^a-zA-Z0-9]/g, '_');
        const result = await Swal.fire({
            title: 'E-Stamping via Manual Upload',
            html: `
                <div class="text-left">
                    <p class="mb-3">Automatic e-stamping is disabled.</p>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <p class="text-blue-800 font-medium">To apply E-Stamp:</p>
                        <ol class="list-decimal list-inside space-y-1 text-blue-800">
                            <li>Download this signed document</li>
                            <li>Click \"Upload for E-Stamp\" and upload the file</li>
                        </ol>
                    </div>
                </div>
            `,
            icon: 'info',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Download Document',
            denyButtonText: 'Upload for E-Stamp',
            cancelButtonText: 'Close',
            confirmButtonColor: '#3B82F6',
            denyButtonColor: '#8B5CF6',
            cancelButtonColor: '#6B7280',
            width: '500px'
        });
        if (result.isConfirmed) {
            downloadExistingDocument(signedUrl, `${safeName}_signed.pdf`);
        } else if (result.isDenied) {
            startManualEStamping();
        }
    } catch (error) {
        console.error('E-Stamp instruction dialog error:', error);
    }
}

// Refresh stamped document list
function refreshStampedDocumentList() {
    loadExistingStampedDocuments();
}

// ================== END E-STAMPING FUNCTIONS ==================

// Debug function to show current e-signing state
function showDebugInfo() {
    const debugInfo = {
        'Selected File': selectedESignFile ? selectedESignFile.name : 'None',
        'Current Job ID': currentJobId || 'None',
        'Stamp Job ID': stampJobId || 'None',
        'Signed Document URL': signedDocumentUrl || 'None',
        'Stamped Document URL': stampedDocumentUrl || 'None',
        'Document Tracking Data': documentTrackingData.length + ' documents',
        'Status Check Interval': statusCheckInterval ? 'Running' : 'Stopped'
    };

    let debugText = 'E-Signing Debug Information:\n\n';
    for (const [key, value] of Object.entries(debugInfo)) {
        debugText += `${key}: ${value}\n`;
    }

    // Add document details if available
    if (documentTrackingData.length > 0) {
        debugText += '\nDocument Details:\n';
        documentTrackingData.forEach((doc, index) => {
            debugText += `${index + 1}. ${doc.document_type} - ${doc.specific_document_ref || 'N/A'} (${doc.transaction_id})\n`;
        });
    }

    console.log('🐛 Debug Info:', debugInfo);
    alert(debugText);
}

// Export functions for global access
window.initializeESigningFeatures = initializeESigningFeatures;
window.loadExistingSignedDocuments = loadExistingSignedDocuments;
window.displayExistingDocuments = displayExistingDocuments;
window.downloadExistingDocument = downloadExistingDocument;
window.formatSignedDate = formatSignedDate;
window.viewDocumentDetails = viewDocumentDetails;
window.showESigningSection = showESigningSection;
window.handleFileSelection = handleFileSelection;
window.validateAndSetFile = validateAndSetFile;
window.removeSelectedFile = removeSelectedFile;
window.startESigningProcess = startESigningProcess;
window.cancelESigningProcess = cancelESigningProcess;
window.showProgressContainer = showProgressContainer;
window.hideProgressContainer = hideProgressContainer;
window.updateProgressBar = updateProgressBar;
window.updateProgressStatus = updateProgressStatus;
window.updateProgressStep = updateProgressStep;
window.showSuccessPopup = showSuccessPopup;
window.viewSignedDocument = viewSignedDocument;
window.downloadSignedDocumentFromPopup = downloadSignedDocumentFromPopup;
window.openDocumentViewer = openDocumentViewer;
window.downloadSignedDocument = downloadSignedDocument;
window.downloadStampedDocument = downloadStampedDocument;
window.getDocumentByTransactionId = getDocumentByTransactionId;
window.refreshDocumentList = refreshDocumentList;
window.showDebugInfo = showDebugInfo;
window.selectedESignFile = selectedESignFile;

// E-Stamping function exports
window.loadExistingStampedDocuments = loadExistingStampedDocuments;
window.displayExistingStampedDocuments = displayExistingStampedDocuments;
window.viewStampedDocumentDetails = viewStampedDocumentDetails;
window.startEStampingProcess = startEStampingProcess;
window.startManualEStamping = startManualEStamping;
window.processManualEStamping = processManualEStamping;
window.applyEStampToSignedDocument = applyEStampToSignedDocument;
window.showEStampingOption = showEStampingOption;
window.refreshStampedDocumentList = refreshStampedDocumentList;

// PDF Optimization and Flattening Functions
// These functions help eliminate unwanted boxes and form fields in PDFs

// Optimize PDF before e-signing to remove form fields and unwanted elements
async function optimizePDFBeforeSigning(file) {
    try {
        console.log('🔧 Optimizing PDF before e-signing...');

        // Create a canvas to render the PDF and convert back to PDF
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Load PDF using PDF.js if available
        if (typeof pdfjsLib !== 'undefined') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            // Set canvas size
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Render PDF page to canvas
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            // Convert canvas to blob
            const optimizedBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'application/pdf', 0.95);
            });

            console.log('✅ PDF optimized successfully');
            return new File([optimizedBlob], file.name, { type: 'application/pdf' });
        }

        // Fallback: return original file if PDF.js is not available
        console.log('⚠️ PDF.js not available, using original file');
        return file;

    } catch (error) {
        console.error('❌ PDF optimization failed:', error);
        // Return original file if optimization fails
        return file;
    }
}

// Flatten PDF after e-signing to remove any remaining form fields
async function flattenSignedPDF(pdfUrl) {
    try {
        console.log('🔧 Flattening signed PDF to remove form fields...');

        // Fetch the signed PDF
        const response = await fetch(pdfUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status}`);
        }

        const pdfBlob = await response.blob();

        // If we have access to a PDF processing library, use it
        if (typeof window.PDFLib !== 'undefined') {
            const pdfBytes = await pdfBlob.arrayBuffer();
            const pdfDoc = await window.PDFLib.PDFDocument.load(pdfBytes);

            // Flatten all form fields
            const pages = pdfDoc.getPages();
            pages.forEach(page => {
                // Remove any form fields
                const formFields = page.getFormFields();
                Object.keys(formFields).forEach(fieldName => {
                    page.removeFormField(fieldName);
                });
            });

            // Save the flattened PDF
            const flattenedBytes = await pdfDoc.save();
            const flattenedBlob = new Blob([flattenedBytes], { type: 'application/pdf' });

            console.log('✅ PDF flattened successfully');
            return URL.createObjectURL(flattenedBlob);
        }

        // Fallback: return original URL if PDFLib is not available
        console.log('⚠️ PDFLib not available, using original PDF');
        return pdfUrl;

    } catch (error) {
        console.error('❌ PDF flattening failed:', error);
        // Return original URL if flattening fails
        return pdfUrl;
    }
}

// Enhanced download function with PDF optimization
async function downloadOptimizedSignedDocument(documentUrl, filename) {
    try {
        console.log('📥 Downloading optimized signed document...');

        // First, try to flatten the PDF to remove form fields
        const optimizedUrl = await flattenSignedPDF(documentUrl);

        // Create download link
        const link = document.createElement('a');
        link.href = optimizedUrl;
        link.download = filename || `optimized_signed_document_${Date.now()}.pdf`;
        link.target = '_blank';

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up object URL if it was created
        if (optimizedUrl !== documentUrl && optimizedUrl.startsWith('blob:')) {
            setTimeout(() => URL.revokeObjectURL(optimizedUrl), 1000);
        }

        console.log('✅ Optimized document download started');

        // Show success message
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Optimized Download Started',
                text: 'Your optimized signed document download has started.',
                timer: 2000,
                showConfirmButton: false
            });
        }

    } catch (error) {
        console.error('❌ Optimized download failed:', error);

        // Fallback to regular download
        console.log('🔄 Falling back to regular download...');
        downloadExistingDocument(documentUrl, filename);
    }
}

// Enhanced e-signing process with PDF optimization
async function startOptimizedESigningProcess() {
    if (!selectedESignFile) {
        Swal.fire({
            icon: 'warning',
            title: 'No File Selected',
            text: 'Please select a PDF file to sign.'
        });
        return;
    }

    try {
        // Confirm when running in production
        const confirmed = await confirmProductionAction('an optimized E-Sign operation');
        if (!confirmed) { return; }

        // Show progress container and start Step 1
        showProgressContainer();
        updateProgressStep(1);
        updateProgressStatus('Starting optimized e-signing process...');
        updateProgressBar(0);

        // Hide upload area
        const uploadArea = document.getElementById('eSignUploadArea');
        if (uploadArea) {
            uploadArea.style.display = 'none';
        }

        // Step 1: PDF Optimization
        updateProgressStatus('Optimizing PDF to remove form fields...');
        simulateProgressUpdate(15, 1000, () => {
            updateProgressStatus('PDF optimization in progress...');
        });

        const optimizedFile = await optimizePDFBeforeSigning(selectedESignFile);
        console.log('✅ PDF optimization completed');

        // Step 2: File validation and preparation
        updateProgressStatus('Validating optimized file...');
        simulateProgressUpdate(25, 1000, () => {
            updateProgressStatus('File validation completed');
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Move to Step 3: Processing
        updateProgressStep(2);
        updateProgressStatus('Converting optimized document to base64...');
        simulateProgressUpdate(35, 1500, () => {
            updateProgressStatus('Preparing document for signing...');
        });

        const documentBase64 = await fileToBase64(optimizedFile);

        // Get document details
        const urlParams = new URLSearchParams(window.location.search);
        const stagingId = urlParams.get('stagingID');

        if (!stagingId) {
            throw new Error('Staging ID not found in URL');
        }

        // Get signer information
        let signerName = ""; // Default fallback
        let signerEmail = "";

        // Try to get current user information
        if (typeof currentUser !== 'undefined' && currentUser) {
            signerEmail = currentUser.email || currentUser.username + "@company.com";
        }

        // Try to get approvedByName from current invoice data
        const invData = (typeof AppState !== 'undefined' && AppState?.currentInvItemData) ||
            (typeof currentInvItemData !== 'undefined' && currentInvItemData);

        if (invData && invData.arInvoiceApprovalSummary) {
            signerName = invData.arInvoiceApprovalSummary.approvedByName || signerName;
            console.log('🔍 Found approvedByName from invoice data:', signerName);
        } else {
            // Fallback: try to get from HTML element if exists
            const approvedByNameElement = document.getElementById('approvedByName') || document.getElementById('approvedBySearch');
            if (approvedByNameElement && approvedByNameElement.value) {
                signerName = approvedByNameElement.value;
                console.log('🔍 Found approvedByName from HTML element:', signerName);
            } else {
                console.log('⚠️ No approvedByName found, using default:', signerName);
            }
        }

        // Create specific document reference
        const currentDateTime = new Date().toISOString().replace(/[:.]/g, '-');
        const specificDocRef = `optimized_receive_${currentDateTime}`;

        // Enhanced API payload with optimization flag
        const apiPayload = {
            document_base64: documentBase64,
            sign_image_name: signerName,
            document_type: "ARInvoices",
            document_id: stagingId,
            specific_document_ref: specificDocRef,
            signer_name: signerName,
            signer_email: signerEmail || undefined,
            optimize_pdf: true, // Flag to indicate PDF optimization
            flatten_form_fields: true // Flag to flatten form fields
        };

        // Move to Step 4: API Call and Signing
        updateProgressStep(3);
        updateProgressStatus('Sending optimized document for e-signing...');
        simulateProgressUpdate(55, 2000, null);

        console.log('📝 Enhanced Optimized E-Sign API payload:', {
            ...apiPayload,
            document_base64: '[BASE64_DATA]' // Don't log the actual base64
        });
        console.log('📍 E-Sign URL:', kasboUrl('/esign/process'));

        const response = await fetch(kasboUrl('/esign/process'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiPayload)
        });

        console.log('📝 E-Sign response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ E-Sign API error:', errorText);
            throw new Error(`E-Sign API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('📝 E-Sign API result:', result);

        // Extract transaction information from enhanced response
        currentJobId = result.jobId || result.job_id || result.id || result.transaction_id || result.data?.jobId || result.data?.job_id || result.data?.id;

        if (!currentJobId) {
            console.error('❌ No job/transaction ID found in e-sign response:', result);
            throw new Error('No job ID returned from e-sign API');
        }

        console.log('📝 E-Sign Job/Transaction ID:', currentJobId);

        // Update progress to 70%
        simulateProgressUpdate(70, 1000, () => {
            updateProgressStatus('Optimized document submitted for processing');
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Start checking job status
        updateProgressStatus('Processing optimized document signature...');
        simulateProgressUpdate(85, 2000, null);
        await checkESignJobStatus();

    } catch (error) {
        console.error('Optimized E-Signing error:', error);
        showErrorState(error.message);
    }
}