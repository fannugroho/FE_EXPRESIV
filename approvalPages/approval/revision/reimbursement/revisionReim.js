// ===== COMPLETE REVISION REIMBURSEMENT SYSTEM =====
// File: revisionReim.js

// ===== 1. GLOBAL STATE MANAGEMENT =====
class ReimbursementState {
    constructor() {
        this.reimbursementId = '';
        this.data = null;
        this.users = [];
        this.departments = [];
        this.transactionTypes = [];
        this.categories = [];
        this.accountNames = [];
        this.isLoading = false;
        this.categoryCache = new Map();
        this.accountNameCache = new Map();
    }

    setReimbursementId(id) {
        this.reimbursementId = id;
    }

    setData(data) {
        this.data = data;
    }

    setUsers(users) {
        this.users = users;
    }
}

const state = new ReimbursementState();

// ===== 2. API SERVICE =====
class APIService {
    static async fetchReimbursement(id) {
        const response = await fetch(`${BASE_URL}/api/reimbursements/${id}`);
        return await response.json();
    }

    static async updateReimbursement(id, data) {
        const response = await fetch(`${BASE_URL}/api/reimbursements/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    static async addReimbursementDetails(id, details) {
        const response = await fetch(`${BASE_URL}/api/reimbursements/detail/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(details)
        });
        return await response.json();
    }

    static async submitReimbursement(id) {
        const response = await fetch(`${BASE_URL}/api/reimbursements/prepared/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
    }

    static async fetchUsers() {
        const response = await fetch(`${BASE_URL}/api/users`);
        return await response.json();
    }

    static async fetchDepartments() {
        const response = await fetch(`${BASE_URL}/api/department`);
        return await response.json();
    }

    static async fetchTransactionTypes() {
        const response = await fetch(`${BASE_URL}/api/transactiontypes/filter?category=Reimbursement`);
        return await response.json();
    }

    static async fetchCategories(departmentName, transactionType) {
        const response = await fetch(`${BASE_URL}/api/expenses-coa/filter?departmentName=${encodeURIComponent(departmentName)}&menu=Reimbursement&transaction=${encodeURIComponent(transactionType)}`);
        return await response.json();
    }

    static async uploadAttachments(id, files) {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));

        const response = await fetch(`${BASE_URL}/api/reimbursements/${id}/attachments/upload`, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    }

    static async deleteAttachment(reimbursementId, attachmentId) {
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/${attachmentId}`, {
            method: 'DELETE'
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

    static formatCurrency(amount) {
        if (!amount && amount !== 0) return '0.00';
        let num;
        if (typeof amount === 'string') {
            num = parseFloat(amount.replace(/,/g, ''));
        } else {
            num = Number(amount);
        }

        if (isNaN(num)) return '0.00';

        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    static parseCurrency(formattedValue) {
        if (!formattedValue) return 0;
        return parseFloat(formattedValue.toString().replace(/,/g, '')) || 0;
    }

    static setElementValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value || '';
    }

    static getElementValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : '';
    }

    static formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    static formatDateDisplay(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    }
}

// ===== 4. FORM MANAGER =====
class FormManager {
    static populateBasicFields(data) {
        const basicFields = {
            'voucherNo': data.voucherNo,
            'currency': data.currency,
            'submissionDate': data.submissionDate ? UIUtils.formatDateForInput(data.submissionDate) : '',
            'status': data.status,
            'referenceDoc': data.referenceDoc,
            'typeOfTransaction': data.typeOfTransaction,
            'remarks': data.remarks
        };

        Object.entries(basicFields).forEach(([id, value]) => {
            UIUtils.setElementValue(id, value);
        });

        // Set department value
        if (data.department) {
            this.setDepartmentValue(data.department);
        }
    }

    static populateSearchableFields(data) {
        // Requester Name
        this.setSearchableField('requesterNameSearch', 'requesterNameSelect', data.requesterName, data.requesterName);

        // Pay To (will be populated after users are loaded)
        if (data.payTo) {
            setTimeout(() => {
                this.populatePayToField(data.payTo);
            }, 500);
        }

        // Approval fields
        setTimeout(() => {
            this.setApprovalField('preparedBy', data.preparedBy);
            this.setApprovalField('acknowledgeBy', data.acknowledgedBy);
            this.setApprovalField('checkedBy', data.checkedBy);
            this.setApprovalField('approvedBy', data.approvedBy);
            this.setApprovalField('receivedBy', data.receivedBy);
        }, 300);
    }

    static setSearchableField(searchId, selectId, displayValue, selectValue) {
        UIUtils.setElementValue(searchId, displayValue);

        const selectElement = document.getElementById(selectId);
        if (selectElement && selectValue) {
            // Create option if it doesn't exist
            let optionExists = Array.from(selectElement.options).some(opt => opt.value === selectValue);
            if (!optionExists) {
                const option = document.createElement('option');
                option.value = selectValue;
                option.textContent = displayValue;
                selectElement.appendChild(option);
            }
            selectElement.value = selectValue;
        }
    }

    static setApprovalField(fieldPrefix, userId) {
        if (!userId || !state.users.length) return;

        const user = state.users.find(u => u.id.toString() === userId.toString());
        if (user) {
            this.setSearchableField(`${fieldPrefix}Search`, `${fieldPrefix}Select`, user.fullName, userId);
        }
    }

    static populatePayToField(payToId) {
        if (!payToId || !state.users.length) return;

        const user = state.users.find(u => u.id.toString() === payToId.toString());
        if (user) {
            this.setSearchableField('payToSearch', 'payToSelect', user.fullName, payToId);
        }
    }

    static setDepartmentValue(departmentName) {
        const departmentSelect = document.getElementById('department');
        if (!departmentSelect || !departmentName) return;

        // Try to find existing option
        let optionExists = false;
        for (let i = 0; i < departmentSelect.options.length; i++) {
            if (departmentSelect.options[i].value === departmentName) {
                departmentSelect.selectedIndex = i;
                optionExists = true;
                break;
            }
        }

        // If option doesn't exist, create and add it
        if (!optionExists) {
            const newOption = document.createElement('option');
            newOption.value = departmentName;
            newOption.textContent = departmentName;
            newOption.selected = true;
            departmentSelect.appendChild(newOption);
        }
    }

    static populateTable(details) {
        const tableBody = document.getElementById('reimbursementDetails');
        tableBody.innerHTML = '';

        if (!details || details.length === 0) {
            TableManager.addRow();
            return;
        }

        details.forEach(detail => {
            const row = TableManager.createRow(detail);
            tableBody.appendChild(row);
            TableManager.setupRowEventListeners(row);
        });

        TableManager.updateTotalAmount();
    }
}

// ===== 5. TABLE MANAGER =====
class TableManager {
    static createRow(detail = {}) {
        const row = document.createElement('tr');
        const status = UIUtils.getElementValue('status');
        const isDisabled = status === 'Prepared';

        row.innerHTML = `
            <td class="p-2 border">
                <div class="relative">
                    <input type="text" value="${detail.category || ''}" 
                           placeholder="Search category..." 
                           class="w-full p-1 border rounded search-input category-search ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}" 
                           ${isDisabled ? 'disabled' : ''} />
                    <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden category-dropdown"></div>
                    <select class="hidden category-select">
                        <option value="" disabled selected>Choose Category</option>
                    </select>
                </div>
            </td>
            <td class="p-2 border">
                <div class="relative">
                    <input type="text" value="${detail.accountName || ''}" 
                           placeholder="Search account name..." 
                           class="w-full p-1 border rounded search-input account-name-search ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}" 
                           ${isDisabled ? 'disabled' : ''} />
                    <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden account-name-dropdown"></div>
                    <select class="hidden account-name-select">
                        <option value="" disabled selected>Choose Account Name</option>
                    </select>
                </div>
            </td>
            <td class="p-2 border">
                <input type="text" value="${detail.glAccount || ''}" 
                       class="w-full p-1 border rounded bg-gray-200 cursor-not-allowed gl-account" disabled />
            </td>
            <td class="p-2 border">
                <input type="text" value="${detail.description || ''}" maxlength="200" 
                       class="w-full p-1 border rounded ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}" 
                       ${isDisabled ? 'disabled' : ''} required />
            </td>
            <td class="p-2 border">
                <input type="text" value="${UIUtils.formatCurrency(detail.amount) || '0.00'}" 
                       class="w-full p-1 border rounded currency-input-idr ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}" 
                       ${isDisabled ? 'disabled' : ''} required />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="TableManager.deleteRow(this)" 
                        ${detail.id ? `data-id="${detail.id}"` : ''} 
                        class="text-red-500 hover:text-red-700 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}" 
                        ${isDisabled ? 'disabled' : ''}>🗑</button>
            </td>
        `;

        return row;
    }

    static addRow() {
        const tableBody = document.getElementById('reimbursementDetails');
        const newRow = this.createRow();
        tableBody.appendChild(newRow);
        this.setupRowEventListeners(newRow);
        this.populateCategoriesForNewRow(newRow);
    }

    static deleteRow(button) {
        button.closest('tr').remove();
        this.updateTotalAmount();
    }

    static updateTotalAmount() {
        const amountInputs = document.querySelectorAll('#reimbursementDetails tr td:nth-child(5) input');
        let total = 0;

        amountInputs.forEach(input => {
            const numericValue = UIUtils.parseCurrency(input.value);
            total += numericValue;
        });

        UIUtils.setElementValue('totalAmount', UIUtils.formatCurrency(total));
    }

    static setupRowEventListeners(row) {
        const categorySearch = row.querySelector('.category-search');
        const accountNameSearch = row.querySelector('.account-name-search');
        const currencyInput = row.querySelector('.currency-input-idr');

        if (categorySearch) {
            categorySearch.addEventListener('focus', function () {
                CategoryManager.filterCategories(this);
            });
            categorySearch.addEventListener('input', function () {
                CategoryManager.filterCategories(this);
            });
        }

        if (accountNameSearch) {
            accountNameSearch.addEventListener('focus', function () {
                CategoryManager.filterAccountNames(this);
            });
            accountNameSearch.addEventListener('input', function () {
                CategoryManager.filterAccountNames(this);
            });
        }

        if (currencyInput) {
            currencyInput.addEventListener('input', function () {
                TableManager.formatCurrencyInput(this);
            });
        }
    }

    static formatCurrencyInput(input) {
        const cursorPos = input.selectionStart;
        const originalLength = input.value.length;

        // Get value and remove all non-digit, period and comma characters
        let value = input.value.replace(/[^\d,.]/g, '');

        // Parse value to number for calculation
        const numValue = UIUtils.parseCurrency(value);

        // Format with currency format
        const formattedValue = UIUtils.formatCurrency(numValue);

        // Update input value
        input.value = formattedValue;

        // Update total
        this.updateTotalAmount();

        // Adjust cursor position
        const newLength = input.value.length;
        const newCursorPos = cursorPos + (newLength - originalLength);
        input.setSelectionRange(Math.max(0, newCursorPos), Math.max(0, newCursorPos));
    }

    static populateCategoriesForNewRow(row) {
        const categorySearch = row.querySelector('.category-search');

        if (categorySearch && state.categories.length > 0) {
            categorySearch.dataset.categories = JSON.stringify(state.categories);
        } else if (categorySearch) {
            const departmentName = UIUtils.getElementValue('department');
            const transactionType = UIUtils.getElementValue('typeOfTransaction');

            if (departmentName && transactionType) {
                CategoryManager.handleDependencyChange().then(() => {
                    if (state.categories.length > 0) {
                        categorySearch.dataset.categories = JSON.stringify(state.categories);
                    }
                });
            }
        }
    }

    static getTableData() {
        const rows = document.querySelectorAll('#reimbursementDetails tr');
        const existingDetails = [];
        const newDetails = [];

        rows.forEach(row => {
            const categoryInput = row.querySelector('.category-search');
            const accountNameInput = row.querySelector('.account-name-search');
            const glAccountInput = row.querySelector('.gl-account');
            const descriptionInput = row.querySelector('td:nth-child(4) input[type="text"]');
            const amountInput = row.querySelector('.currency-input-idr');
            const deleteButton = row.querySelector('button[onclick="TableManager.deleteRow(this)"]');
            const detailId = deleteButton ? deleteButton.getAttribute('data-id') : null;

            if (categoryInput && accountNameInput && glAccountInput && descriptionInput && amountInput) {
                const detail = {
                    category: categoryInput.value || '',
                    accountName: accountNameInput.value || '',
                    glAccount: glAccountInput.value || '',
                    description: descriptionInput.value || '',
                    amount: UIUtils.parseCurrency(amountInput.value)
                };

                if (detailId) {
                    detail.id = detailId;
                    existingDetails.push(detail);
                } else {
                    newDetails.push(detail);
                }
            }
        });

        return { existingDetails, newDetails };
    }
}

// ===== 6. CATEGORY MANAGER =====
class CategoryManager {
    static async fetchCategories(departmentName, transactionType) {
        const cacheKey = `${departmentName}-${transactionType}`;
        if (state.categoryCache.has(cacheKey)) {
            state.categories = state.categoryCache.get(cacheKey);
            this.updateAllCategoryDropdowns();
            return;
        }

        try {
            const result = await APIService.fetchCategories(departmentName, transactionType);
            if (result.status && result.code === 200 && result.data) {
                const categories = [...new Set(result.data.map(item => item.category).filter(category => category))];
                state.categories = categories;
                state.categoryCache.set(cacheKey, categories);
                this.updateAllCategoryDropdowns();
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            state.categories = [];
            this.updateAllCategoryDropdowns();
        }
    }

    static async fetchAccountNames(category, departmentName, transactionType) {
        const cacheKey = `${category}-${departmentName}-${transactionType}`;
        if (state.accountNameCache.has(cacheKey)) {
            return state.accountNameCache.get(cacheKey);
        }

        try {
            const result = await APIService.fetchCategories(departmentName, transactionType);
            if (result.status && result.code === 200 && result.data) {
                const filteredData = result.data.filter(item => item.category === category);
                const accountNames = filteredData.map(item => ({
                    accountName: item.accountName,
                    coa: item.coa,
                    category: item.category
                }));

                state.accountNameCache.set(cacheKey, accountNames);
                return accountNames;
            }
        } catch (error) {
            console.error('Error fetching account names:', error);
        }

        return [];
    }

    static updateAllCategoryDropdowns() {
        const categorySearchInputs = document.querySelectorAll('.category-search');
        categorySearchInputs.forEach(input => {
            input.dataset.categories = JSON.stringify(state.categories);
        });
    }

    static filterCategories(input) {
        const searchText = input.value.toLowerCase();
        const dropdown = input.parentElement.querySelector('.category-dropdown');

        if (!dropdown) return;

        dropdown.innerHTML = '';

        try {
            const categories = JSON.parse(input.dataset.categories || '[]');
            const filtered = categories.filter(category =>
                category && category.toLowerCase().includes(searchText)
            );

            filtered.forEach(category => {
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.innerText = category;
                option.onclick = function () {
                    input.value = category;
                    dropdown.classList.add('hidden');

                    // Clear account name and GL account when category changes
                    const row = input.closest('tr');
                    const accountNameSearch = row.querySelector('.account-name-search');
                    const glAccount = row.querySelector('.gl-account');
                    if (accountNameSearch) accountNameSearch.value = '';
                    if (glAccount) glAccount.value = '';

                    // Load account names for this category
                    CategoryManager.loadAccountNamesForRow(row);
                };
                dropdown.appendChild(option);
            });

            if (filtered.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No Categories Found';
                dropdown.appendChild(noResults);
            }

            dropdown.classList.remove('hidden');
        } catch (error) {
            console.error('Error filtering categories:', error);
        }
    }

    static filterAccountNames(input) {
        const searchText = input.value.toLowerCase();
        const dropdown = input.parentElement.querySelector('.account-name-dropdown');

        if (!dropdown) return;

        dropdown.innerHTML = '';

        try {
            const accountNames = JSON.parse(input.dataset.accountNames || '[]');
            const filtered = accountNames.filter(account =>
                account.accountName && account.accountName.toLowerCase().includes(searchText)
            );

            filtered.forEach(account => {
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.innerText = account.accountName;
                option.onclick = function () {
                    input.value = account.accountName;
                    dropdown.classList.add('hidden');

                    // Auto-fill GL Account
                    const row = input.closest('tr');
                    const glAccount = row.querySelector('.gl-account');
                    if (glAccount) {
                        glAccount.value = account.coa;
                    }
                };
                dropdown.appendChild(option);
            });

            if (filtered.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No Account Names Found';
                dropdown.appendChild(noResults);
            }

            dropdown.classList.remove('hidden');
        } catch (error) {
            console.error('Error filtering account names:', error);
        }
    }

    static async loadAccountNamesForRow(row) {
        const categoryInput = row.querySelector('.category-search');
        const accountNameInput = row.querySelector('.account-name-search');

        if (!categoryInput || !accountNameInput) return;

        const category = categoryInput.value;
        if (!category) return;

        const departmentName = UIUtils.getElementValue('department');
        const transactionType = UIUtils.getElementValue('typeOfTransaction');

        if (!departmentName || !transactionType) return;

        try {
            const accountNames = await this.fetchAccountNames(category, departmentName, transactionType);
            accountNameInput.dataset.accountNames = JSON.stringify(accountNames);
        } catch (error) {
            console.error('Error loading account names for row:', error);
        }
    }

    static async handleDependencyChange() {
        console.log('CategoryManager.handleDependencyChange triggered');
        const departmentName = UIUtils.getElementValue('department');
        const transactionType = UIUtils.getElementValue('typeOfTransaction');

        // Clear all caches when type changes
        state.categoryCache.clear();
        state.accountNameCache.clear();
        state.categories = [];

        console.log('Current Department:', departmentName);
        console.log('Current Transaction Type:', transactionType);

        if (!departmentName || !transactionType) {
            state.categories = [];
            this.updateAllCategoryDropdowns();
            return;
        }

        try {
            await this.fetchCategories(departmentName, transactionType);
        } catch (error) {
            console.error('Error handling dependency change:', error);
        }
    }
}

// ===== 7. SEARCH MANAGER =====
class SearchManager {
    static filterUsers(fieldId) {
        const searchInput = document.getElementById(`${fieldId.replace('Select', '')}Search`);
        if (!searchInput) return;

        const searchText = searchInput.value.toLowerCase();
        const dropdown = document.getElementById(`${fieldId}Dropdown`);
        if (!dropdown) return;

        dropdown.innerHTML = '';

        if (!state.users || state.users.length === 0) {
            const loading = document.createElement('div');
            loading.className = 'p-2 text-gray-500';
            loading.innerText = 'Loading users...';
            dropdown.appendChild(loading);
            dropdown.classList.remove('hidden');
            return;
        }

        const filtered = state.users.filter(user =>
            user.fullName && user.fullName.toLowerCase().includes(searchText)
        );

        filtered.forEach(user => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.innerText = user.fullName;
            option.onclick = function () {
                searchInput.value = user.fullName;
                const selectElement = document.getElementById(fieldId);
                if (selectElement) {
                    const useNameAsValue = fieldId === 'requesterNameSelect';
                    const value = useNameAsValue ? user.fullName : user.id;

                    let optionExists = false;
                    for (let i = 0; i < selectElement.options.length; i++) {
                        if (selectElement.options[i].value === value.toString()) {
                            selectElement.selectedIndex = i;
                            optionExists = true;
                            break;
                        }
                    }

                    if (!optionExists) {
                        const newOption = document.createElement('option');
                        newOption.value = value;
                        newOption.textContent = user.fullName;
                        selectElement.appendChild(newOption);
                        selectElement.value = value;
                    }
                }

                dropdown.classList.add('hidden');

                // Handle special cases
                if (fieldId === 'requesterNameSelect') {
                    SearchManager.handleRequesterSelection(user);
                }
            };
            dropdown.appendChild(option);
        });

        if (filtered.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'p-2 text-gray-500';
            noResults.innerText = 'Name Not Found';
            dropdown.appendChild(noResults);
        }

        dropdown.classList.remove('hidden');
    }

    static handleRequesterSelection(user) {
        // Auto-fill Pay To with the same user
        FormManager.setSearchableField('payToSearch', 'payToSelect', user.fullName, user.id);

        // Auto-fill department if available
        if (user.department) {
            FormManager.setDepartmentValue(user.department);
        }
    }
}

// ===== 8. ATTACHMENT MANAGER =====
class AttachmentManager {
    static async uploadFiles(files) {
        if (!state.reimbursementId) {
            UIUtils.showError('Error', 'Reimbursement ID not found');
            return;
        }

        // Validate PDF files
        const invalidFiles = Array.from(files).filter(file => file.type !== 'application/pdf');
        if (invalidFiles.length > 0) {
            UIUtils.showError('Invalid File Type', 'Only PDF files are allowed');
            return;
        }

        if (files.length > 5) {
            UIUtils.showError('Too Many Files', 'Maximum 5 PDF files are allowed');
            return;
        }

        try {
            UIUtils.showLoading('Uploading Attachments');
            const result = await APIService.uploadAttachments(state.reimbursementId, files);

            if (result.status && result.code === 200) {
                await DataManager.loadReimbursementData();
                UIUtils.showSuccess('Upload Successful', 'Attachments uploaded successfully');
            } else {
                UIUtils.showError('Upload Failed', result.message || 'Failed to upload attachments');
            }
        } catch (error) {
            console.error('Upload error:', error);
            UIUtils.showError('Upload Error', 'An error occurred while uploading files');
        }
    }

    static displayAttachments(attachments) {
        const container = document.getElementById('attachmentsList');
        container.innerHTML = '';

        if (!attachments || attachments.length === 0) return;

        attachments.forEach(attachment => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
            item.innerHTML = `
                <span>${attachment.fileName}</span>
                <div class="flex items-center space-x-2">
                    <a href="${BASE_URL}/${attachment.filePath}" target="_blank" class="text-blue-500 hover:text-blue-700">View</a>
                    <button type="button" class="text-red-500 hover:text-red-700 font-bold text-lg" 
                            onclick="AttachmentManager.deleteAttachment('${attachment.id}', '${attachment.fileName}')">×</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    static async deleteAttachment(attachmentId, fileName) {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Delete attachment: ${fileName}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await APIService.deleteAttachment(state.reimbursementId, attachmentId);
                if (response.status && response.code === 200) {
                    UIUtils.showSuccess('Deleted!', 'Attachment deleted successfully');
                    await DataManager.loadReimbursementData();
                } else {
                    UIUtils.showError('Error', response.message || 'Failed to delete attachment');
                }
            } catch (error) {
                console.error('Delete error:', error);
                UIUtils.showError('Error', 'An error occurred while deleting the attachment');
            }
        }
    }
}

// ===== 9. DATA MANAGER =====
class DataManager {
    static async initialize() {
        try {
            state.setReimbursementId(this.getReimbursementIdFromUrl());
            if (!state.reimbursementId) {
                UIUtils.showError('Error', 'No reimbursement ID found');
                return;
            }

            // Load all required data
            await Promise.all([
                this.loadUsers(),
                this.loadDepartments(),
                this.loadTransactionTypes()
            ]);

            // Load reimbursement data
            await this.loadReimbursementData();

        } catch (error) {
            console.error('Initialization error:', error);
            UIUtils.showError('Error', 'Failed to initialize the system');
        }
    }

    static async loadUsers() {
        try {
            const result = await APIService.fetchUsers();
            if (result.status && result.code === 200) {
                state.setUsers(result.data);
                this.populateUserDropdowns(result.data);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    static async loadDepartments() {
        try {
            const result = await APIService.fetchDepartments();
            if (result.status && result.code === 200) {
                state.departments = result.data;
                this.populateDepartmentDropdown(result.data);
            }
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    }

    static async loadTransactionTypes() {
        try {
            const result = await APIService.fetchTransactionTypes();
            if (result.status && result.code === 200) {
                state.transactionTypes = result.data;
                this.populateTransactionTypeDropdown(result.data);
            }
        } catch (error) {
            console.error('Error loading transaction types:', error);
        }
    }

    static async loadReimbursementData() {
        try {
            const result = await APIService.fetchReimbursement(state.reimbursementId);
            if (result.status && result.code === 200) {
                state.setData(result.data);
                this.populateForm(result.data);
            }
        } catch (error) {
            console.error('Error loading reimbursement data:', error);
        }
    }

    static populateForm(data) {
        FormManager.populateBasicFields(data);
        FormManager.populateSearchableFields(data);
        FormManager.populateTable(data.reimbursementDetails);
        AttachmentManager.displayAttachments(data.reimbursementAttachments);
        this.renderRevisionHistory(data.revisions);
        this.updateSubmitButtonState(data.preparedDate);
        this.controlButtonVisibility();
    }

    static populateUserDropdowns(users) {
        const dropdowns = [
            { id: 'requesterNameSelect', useNameAsValue: true },
            { id: 'payToSelect', useNameAsValue: false },
            { id: 'preparedBySelect', useNameAsValue: false },
            { id: 'acknowledgeBySelect', useNameAsValue: false },
            { id: 'checkedBySelect', useNameAsValue: false },
            { id: 'approvedBySelect', useNameAsValue: false },
            { id: 'receivedBySelect', useNameAsValue: false }
        ];

        dropdowns.forEach(({ id, useNameAsValue }) => {
            const dropdown = document.getElementById(id);
            if (!dropdown) return;

            dropdown.innerHTML = '<option value="" disabled selected>Choose Name</option>';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = useNameAsValue ? user.fullName : user.id;
                option.textContent = user.fullName;
                dropdown.appendChild(option);
            });

            // Store users data for searching
            const searchInput = document.getElementById(id.replace('Select', 'Search'));
            if (searchInput) {
                searchInput.dataset.users = JSON.stringify(users.map(user => ({
                    id: user.id,
                    name: user.fullName
                })));
            }
        });

        // Auto-fill prepared by with current user
        this.autofillPreparedBy(users);
    }

    static populateDepartmentDropdown(departments) {
        const dropdown = document.getElementById('department');
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="" disabled>Select Department</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.name;
            option.textContent = dept.name;
            dropdown.appendChild(option);
        });

        // Disable department selection since it will be auto-filled
        dropdown.disabled = true;
        dropdown.classList.add('bg-gray-200', 'cursor-not-allowed');
    }

    static populateTransactionTypeDropdown(types) {
        const dropdown = document.getElementById('typeOfTransaction');
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="" disabled selected>Select Transaction Type</option>';
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name;
            option.textContent = type.name;
            dropdown.appendChild(option);
        });
    }

    static autofillPreparedBy(users) {
        try {
            const currentUser = getCurrentUser(); // From auth.js
            if (!currentUser) return;

            const matchingUser = users.find(user => user.id.toString() === currentUser.userId.toString());
            if (matchingUser) {
                FormManager.setSearchableField('preparedBySearch', 'preparedBySelect', matchingUser.fullName, matchingUser.id);

                // Disable prepared by field
                const preparedBySearch = document.getElementById('preparedBySearch');
                if (preparedBySearch) {
                    preparedBySearch.disabled = true;
                    preparedBySearch.classList.add('bg-gray-200', 'cursor-not-allowed');
                }
            }
        } catch (error) {
            console.error('Error auto-filling prepared by:', error);
        }
    }

    static renderRevisionHistory(revisions) {
        const section = document.getElementById('revisedRemarksSection');
        if (!section) return;

        if (!revisions || revisions.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        const grouped = {};
        revisions.forEach(rev => {
            if (!grouped[rev.stage]) grouped[rev.stage] = [];
            grouped[rev.stage].push(rev);
        });

        let html = '<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>';
        html += `<div class="bg-gray-50 p-4 rounded-lg border mb-4"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;

        Object.entries(grouped).forEach(([stage, items]) => {
            html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
            items.forEach((rev, idx) => {
                html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${UIUtils.formatDateDisplay(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
            });
        });

        section.innerHTML = html;
    }

    static updateSubmitButtonState(preparedDate) {
        const submitButton = document.querySelector('button[onclick="submitReim()"]');
        if (!submitButton) return;

        if (preparedDate === null) {
            submitButton.disabled = false;
            submitButton.classList.remove('bg-gray-400', 'hover:bg-gray-400', 'cursor-not-allowed');
            submitButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
        } else {
            submitButton.disabled = true;
            submitButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            submitButton.classList.add('bg-gray-400', 'hover:bg-gray-400', 'cursor-not-allowed');
        }
    }

    static controlButtonVisibility() {
        const status = UIUtils.getElementValue('status');
        const addRowButton = document.querySelector("button[onclick='addRow()']");
        const submitButton = document.querySelector("button[onclick='submitReim()']");

        // Get all form fields that should be controlled
        const inputFields = document.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea');
        const fileInput = document.getElementById('filePath');

        // If status is not Draft and Revised, hide buttons and disable fields
        if (status !== "Draft" && status !== "Revised") {
            // Hide buttons
            if (addRowButton) addRowButton.style.display = "none";
            if (submitButton) submitButton.style.display = "none";

            // Disable all input fields
            inputFields.forEach(field => {
                if (field.id === 'voucherNo' || field.id === 'status' || field.classList.contains('gl-account')) {
                    return; // Skip fields that should remain disabled
                }
                field.disabled = true;
                field.classList.add('bg-gray-100', 'cursor-not-allowed');
            });

            // Disable file input
            if (fileInput) {
                fileInput.disabled = true;
                fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
            }
        } else {
            // Show buttons
            if (addRowButton) addRowButton.style.display = "block";
            if (submitButton) submitButton.style.display = "block";

            // Enable input fields (except those that should remain disabled)
            inputFields.forEach(field => {
                if (field.id === 'voucherNo' || field.id === 'status' ||
                    field.classList.contains('gl-account') || field.id === 'preparedBySearch') {
                    return; // Skip fields that should remain disabled
                }
                field.disabled = false;
                field.classList.remove('bg-gray-100', 'cursor-not-allowed');
            });

            // Enable file input
            if (fileInput) {
                fileInput.disabled = false;
                fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
            }
        }
    }

    static getReimbursementIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('reim-id');
    }
}

// ===== 10. SUBMISSION MANAGER =====
class SubmissionManager {
    static async submitRevision() {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You are about to submit this reimbursement revision",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, submit it!'
        });

        if (result.isConfirmed) {
            try {
                await this.updateReimbursement();
                await this.submitForApproval();

                UIUtils.showSuccess('Submitted!', 'Reimbursement revision submitted successfully').then(() => {
                    window.location.href = '../../../dashboard/dashboardRevision/reimbursement/menuReimRevision.html';
                });
            } catch (error) {
                console.error('Submission error:', error);
                UIUtils.showError('Error', error.message || 'Failed to submit reimbursement');
            }
        }
    }

    static async updateReimbursement() {
        const formData = this.collectFormData();
        const { existingDetails, newDetails } = TableManager.getTableData();

        // Validate required fields
        this.validateFormData(formData);

        if (existingDetails.length === 0 && newDetails.length === 0) {
            throw new Error('At least one reimbursement detail is required');
        }

        // Update main reimbursement data
        const updateData = { ...formData, reimbursementDetails: existingDetails };
        const result = await APIService.updateReimbursement(state.reimbursementId, updateData);

        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to update reimbursement');
        }

        // Add new details if any
        if (newDetails.length > 0) {
            const addResult = await APIService.addReimbursementDetails(state.reimbursementId, newDetails);
            if (!addResult.status || addResult.code !== 200) {
                throw new Error(addResult.message || 'Failed to add new details');
            }
        }
    }

    static async submitForApproval() {
        const result = await APIService.submitReimbursement(state.reimbursementId);
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to submit for approval');
        }
    }

    static collectFormData() {
        return {
            // Tidak menyertakan voucherNo karena seharusnya tidak berubah saat revision
            requesterName: UIUtils.getElementValue('requesterNameSearch'),
            department: UIUtils.getElementValue('department'),
            currency: UIUtils.getElementValue('currency'),
            referenceDoc: UIUtils.getElementValue('referenceDoc'),
            typeOfTransaction: UIUtils.getElementValue('typeOfTransaction'),
            remarks: UIUtils.getElementValue('remarks'),
            payTo: UIUtils.getElementValue('payToSelect'),
            preparedBy: UIUtils.getElementValue('preparedBySelect') || null,
            acknowledgedBy: UIUtils.getElementValue('acknowledgeBySelect') || null,
            checkedBy: UIUtils.getElementValue('checkedBySelect') || null,
            approvedBy: UIUtils.getElementValue('approvedBySelect') || null,
            receivedBy: UIUtils.getElementValue('receivedBySelect') || null
        };
    }

    static validateFormData(formData) {
        const requiredFields = [
            { field: 'requesterName', message: 'Requester name is required' },
            { field: 'department', message: 'Department is required' },
            { field: 'currency', message: 'Currency is required' },
            { field: 'payTo', message: 'Pay To is required' }
        ];

        for (const { field, message } of requiredFields) {
            if (!formData[field]) {
                throw new Error(message);
            }
        }
    }
}

// ===== 11. EVENT LISTENERS SETUP =====
class EventManager {
    static setupEventListeners() {
        // Setup search field event listeners
        const searchFields = [
            'requesterNameSearch',
            'payToSearch',
            'preparedBySearch',
            'acknowledgeBySearch',
            'checkedBySearch',
            'approvedBySearch',
            'receivedBySearch'
        ];

        searchFields.forEach(fieldId => {
            const searchInput = document.getElementById(fieldId);
            if (searchInput) {
                searchInput.addEventListener('focus', function () {
                    const actualFieldId = fieldId.replace('Search', 'Select');
                    SearchManager.filterUsers(actualFieldId);
                });

                searchInput.addEventListener('input', function () {
                    const actualFieldId = fieldId.replace('Search', 'Select');
                    SearchManager.filterUsers(actualFieldId);
                });
            }
        });

        // Setup department and transaction type change listeners
        const departmentSelect = document.getElementById('department');
        const transactionTypeSelect = document.getElementById('typeOfTransaction');

        if (departmentSelect) {
            departmentSelect.addEventListener('change', CategoryManager.handleDependencyChange);
        }

        if (transactionTypeSelect) {
            transactionTypeSelect.addEventListener('change', async (event) => {
                console.log('Transaction type changed to:', event.target.value);
                // Clear all dropdowns first
                const categoryInputs = document.querySelectorAll('.category-search');
                categoryInputs.forEach(input => {
                    input.value = '';
                    const dropdown = input.parentElement.querySelector('.category-dropdown');
                    if (dropdown) dropdown.innerHTML = '';
                });
                await CategoryManager.handleDependencyChange();
            });
        }

        // Setup click outside to hide dropdowns
        document.addEventListener('click', this.handleClickOutside);
    }

    static handleClickOutside(event) {
        const dropdowns = [
            'requesterNameSelectDropdown',
            'payToSelectDropdown',
            'preparedBySelectDropdown',
            'acknowledgeBySelectDropdown',
            'checkedBySelectDropdown',
            'approvedBySelectDropdown',
            'receivedBySelectDropdown'
        ];

        const searchInputs = [
            'requesterNameSearch',
            'payToSearch',
            'preparedBySearch',
            'acknowledgeBySearch',
            'checkedBySearch',
            'approvedBySearch',
            'receivedBySearch'
        ];

        dropdowns.forEach((dropdownId, index) => {
            const dropdown = document.getElementById(dropdownId);
            const input = document.getElementById(searchInputs[index]);

            if (dropdown && input) {
                if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });

        // Handle table row dropdowns
        const categoryDropdowns = document.querySelectorAll('.category-dropdown');
        const accountNameDropdowns = document.querySelectorAll('.account-name-dropdown');

        categoryDropdowns.forEach(dropdown => {
            const input = dropdown.parentElement.querySelector('.category-search');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });

        accountNameDropdowns.forEach(dropdown => {
            const input = dropdown.parentElement.querySelector('.account-name-search');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
}

// ===== 12. GLOBAL FUNCTIONS (Required by HTML) =====
function addRow() {
    TableManager.addRow();
}

function deleteRow(button) {
    TableManager.deleteRow(button);
}

function submitReim() {
    SubmissionManager.submitRevision();
}

function goToMenuReim() {
    window.location.href = '../../../dashboard/dashboardRevision/reimbursement/menuReimRevision.html';
}

function previewPDF(event) {
    AttachmentManager.uploadFiles(event.target.files);
    event.target.value = ''; // Clear the file input
}

// Global function for currency input formatting (called from HTML oninput)
function formatCurrencyInputIDR(input) {
    TableManager.formatCurrencyInput(input);
}

// ===== 13. INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Revision Reimbursement System...');

    // Setup event listeners
    EventManager.setupEventListeners();

    // Initialize the system
    DataManager.initialize();

    console.log('Revision Reimbursement System initialized successfully');
});