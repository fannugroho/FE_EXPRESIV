// Page-specific overrides for Outgoing Payment Cash Advance (OPCA)
// This page should be viewable without authentication.

(function () {
    // 1) Disable auth checks used by addOPReim.js
    window.checkAuthentication = function () {
        return true;
    };

    // 2) Provide a non-authenticated fetch wrapper that always succeeds with empty data
    //    to avoid redirects or errors when some features try to call the API.
    window.makeAuthenticatedRequest = async function (url, options = {}) {
        try {
            const fullUrl = url.startsWith('http') ? url : `${window.BASE_URL || ''}${url.startsWith('/') ? url : '/' + url}`;
            // Attempt plain fetch without Authorization; if it fails (CORS/401), fall back to mock response
            const response = await fetch(fullUrl, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
            if (response && response.ok) return response;
        } catch (e) {
            // ignore and return mock below
        }

        // Mock success response with empty data shape commonly expected by callers
        const payload = { status: true, data: [] };
        return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    // 3) Override initializePage to avoid any API calls and just set up the UI
    window.initializePage = async function () {
        try {
            const jrnlMemoField = document.getElementById('jrnlMemo');
            if (jrnlMemoField && !jrnlMemoField.value.trim()) {
                jrnlMemoField.value = 'CASH ADVANCE';
            }

            // Clear remarks for a clean preview
            const remarksField = document.getElementById('remarks');
            if (remarksField) remarksField.value = '';
            const journalRemarksField = document.getElementById('journalRemarks');
            if (journalRemarksField) journalRemarksField.value = '';

            // Initialize simple totals and input handlers only
            if (typeof initializeInputValidations === 'function') initializeInputValidations();
            if (typeof initializeCurrencyDropdownHandlers === 'function') initializeCurrencyDropdownHandlers();

            // Ensure totals are computed for initial render
            if (typeof updateTotalAmountDue === 'function') updateTotalAmountDue();
            if (typeof setInitialRemittanceRequestAmount === 'function') setInitialRemittanceRequestAmount();
        } catch (e) {
            console.error('OPCA preview initialize error:', e);
        }
    };

    // Ensure our initialize runs after DOM is ready
    window.addEventListener('load', function () {
        if (typeof window.initializePage === 'function') {
            window.initializePage();
        }
    });
})();


