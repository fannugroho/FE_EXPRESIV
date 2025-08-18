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
            // Initialize new fields for Cash Advance
            initializeCashAdvanceFields();
            
            // Clear remarks for a clean preview
            const remarksField = document.getElementById('remarks');
            if (remarksField) remarksField.value = '';
            const journalRemarksField = document.getElementById('journalRemarks');
            if (journalRemarksField) journalRemarksField.value = '';

            // Initialize simple totals and input handlers only
            if (typeof initializeInputValidations === 'function') initializeInputValidations();
            if (typeof initializeDivisionDropdownHandlers === 'function') initializeDivisionDropdownHandlers();
            if (typeof initializeAccountDropdownHandlers === 'function') initializeAccountDropdownHandlers();

            // Ensure totals are computed for initial render
            if (typeof updateTotalAmountDue === 'function') updateTotalAmountDue();
            if (typeof setInitialRemittanceRequestAmount === 'function') setInitialRemittanceRequestAmount();
        } catch (e) {
            console.error('OPCA preview initialize error:', e);
        }
    };

    // 4) Initialize Cash Advance specific fields
    function initializeCashAdvanceFields() {
        // Set default values for new fields
        const referenceCashAdvanceField = document.getElementById('ReferenceCashAdvance');
        if (referenceCashAdvanceField && !referenceCashAdvanceField.value.trim()) {
            referenceCashAdvanceField.value = '';
        }

        const transactionField = document.getElementById('Transaction');
        if (transactionField && !transactionField.value.trim()) {
            transactionField.value = '';
        }

        const controlAccountField = document.getElementById('ControlAccount');
        if (controlAccountField && !controlAccountField.value.trim()) {
            controlAccountField.value = '';
        }

        const paymentCurrencyField = document.getElementById('PaymentCurrency');
        if (paymentCurrencyField && !paymentCurrencyField.value.trim()) {
            paymentCurrencyField.value = 'IDR';
        }

        // Set default date for Receive Date Cash Advance (today)
        const docDateField = document.getElementById('DocDate');
        if (docDateField && !docDateField.value) {
            const today = new Date().toISOString().split('T')[0];
            docDateField.value = today;
        }

        // Set default due date (30 days from today)
        const docDueDateField = document.getElementById('DocDueDate');
        if (docDueDateField && !docDueDateField.value) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            const dueDateString = dueDate.toISOString().split('T')[0];
            docDueDateField.value = dueDateString;
        }
    }

    // 5) Initialize Division Dropdown Handlers
    function initializeDivisionDropdownHandlers() {
        // Add event listeners for division search functionality
        const divisionInputs = document.querySelectorAll('input[id^="Division_"]');
        divisionInputs.forEach(input => {
            input.addEventListener('keyup', function() {
                searchDivisions(this);
            });
            input.addEventListener('focus', function() {
                showDivisionDropdown(this);
            });
        });
    }

    // 6) Initialize Account Dropdown Handlers
    function initializeAccountDropdownHandlers() {
        // Add event listeners for account name and GL account search functionality
        const accountNameInputs = document.querySelectorAll('input[id^="AcctName_"]');
        const glAccountInputs = document.querySelectorAll('input[id^="AcctCode_"]');
        
        accountNameInputs.forEach(input => {
            input.addEventListener('keyup', function() {
                searchAccountName(this);
            });
            input.addEventListener('focus', function() {
                showAccountNameDropdown(this);
            });
        });

        glAccountInputs.forEach(input => {
            input.addEventListener('keyup', function() {
                searchGLAccount(this);
            });
            input.addEventListener('focus', function() {
                showGLAccountDropdown(this);
            });
        });
    }

    // 7) Mock functions for division and account searches (since we're not authenticated)
    window.searchDivisions = function(input) {
        // Mock division search - in real implementation this would call API
        const dropdown = document.getElementById(input.id + 'Dropdown');
        if (dropdown) {
            dropdown.innerHTML = `
                <div class="dropdown-item" onclick="selectDivision('${input.id}', 'DIV001', 'Division 1')">Division 1</div>
                <div class="dropdown-item" onclick="selectDivision('${input.id}', 'DIV002', 'Division 2')">Division 2</div>
                <div class="dropdown-item" onclick="selectDivision('${input.id}', 'DIV003', 'Division 3')">Division 3</div>
            `;
            dropdown.classList.remove('hidden');
        }
    };

    window.showDivisionDropdown = function(input) {
        const dropdown = document.getElementById(input.id + 'Dropdown');
        if (dropdown) {
            dropdown.classList.remove('hidden');
        }
    };

    window.selectDivision = function(inputId, code, name) {
        const input = document.getElementById(inputId);
        const codeInput = document.getElementById(inputId.replace('Division_', 'DivisionCode_'));
        const dropdown = document.getElementById(inputId + 'Dropdown');
        
        if (input) input.value = name;
        if (codeInput) codeInput.value = code;
        if (dropdown) dropdown.classList.add('hidden');
    };

    window.searchAccountName = function(input) {
        // Mock account name search
        const dropdown = document.getElementById(input.id + 'Dropdown');
        if (dropdown) {
            dropdown.innerHTML = `
                <div class="dropdown-item" onclick="selectAccountName('${input.id}', 'Account 1')">Account 1</div>
                <div class="dropdown-item" onclick="selectAccountName('${input.id}', 'Account 2')">Account 2</div>
                <div class="dropdown-item" onclick="selectAccountName('${input.id}', 'Account 3')">Account 3</div>
            `;
            dropdown.classList.remove('hidden');
        }
    };

    window.showAccountNameDropdown = function(input) {
        const dropdown = document.getElementById(input.id + 'Dropdown');
        if (dropdown) {
            dropdown.classList.remove('hidden');
        }
    };

    window.selectAccountName = function(inputId, name) {
        const input = document.getElementById(inputId);
        const dropdown = document.getElementById(inputId + 'Dropdown');
        
        if (input) input.value = name;
        if (dropdown) dropdown.classList.add('hidden');
    };

    window.searchGLAccount = function(input) {
        // Mock GL account search
        const dropdown = document.getElementById(input.id + 'Dropdown');
        if (dropdown) {
            dropdown.innerHTML = `
                <div class="dropdown-item" onclick="selectGLAccount('${input.id}', 'GL001')">GL001 - General Ledger Account 1</div>
                <div class="dropdown-item" onclick="selectGLAccount('${input.id}', 'GL002')">GL002 - General Ledger Account 2</div>
                <div class="dropdown-item" onclick="selectGLAccount('${input.id}', 'GL003')">GL003 - General Ledger Account 3</div>
            `;
            dropdown.classList.remove('hidden');
        }
    };

    window.showGLAccountDropdown = function(input) {
        const dropdown = document.getElementById(input.id + 'Dropdown');
        if (dropdown) {
            dropdown.classList.remove('hidden');
        }
    };

    window.selectGLAccount = function(inputId, code) {
        const input = document.getElementById(inputId);
        const dropdown = document.getElementById(inputId + 'Dropdown');
        
        if (input) input.value = code;
        if (dropdown) dropdown.classList.add('hidden');
    };

    // 8) Hide dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('[id*="Dropdown"]');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target) && !event.target.closest('[id*="Dropdown"]')) {
                dropdown.classList.add('hidden');
            }
        });
    });

    // Ensure our initialize runs after DOM is ready
    window.addEventListener('load', function () {
        if (typeof window.initializePage === 'function') {
            window.initializePage();
        }
    });
})();


