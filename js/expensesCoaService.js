// Expenses COA Service - Unified API for fetching expenses COA data
// This service provides a centralized way to fetch COA data for Cash Advance and Settlement modules
// 
// IMPORTANT: API calls now use the actual transaction parameter passed, or 'all' if not specified,
// allowing for both specific transaction type queries and combined data queries as needed.
// 
// MENU MAPPING:
// - Cash Advance -> "Cash Advance"
// - Settlement -> "Settlement"
// 
// DEPARTMENT HANDLING:
// - Function prioritizes the Department field value from the page
// - Falls back to parameter conversion if no field value found
// - Accepts both department IDs and department names as fallback

// Cache for storing API responses to reduce redundant calls
const expensesCoaCache = new Map();

// Cache expiration time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Track ongoing requests to prevent duplicate calls
const ongoingRequests = new Map();

// Track last known values to detect actual changes
let lastKnownValues = {
    requesterId: null,
    transactionType: null,
    departmentId: null
};

// Debounce tracking to prevent rapid successive calls
const lastCallTime = new Map();
const DEBOUNCE_DELAY = 100; // 100ms debounce delay

/**
 * Check if a call should be debounced
 * @param {string} functionName - Name of the function being called
 * @param {string} cacheKey - Cache key for the request
 * @returns {boolean} True if the call should be debounced
 */
function shouldDebounceCall(functionName, cacheKey) {
    const now = Date.now();
    const key = `${functionName}-${cacheKey}`;
    
    if (lastCallTime.has(key)) {
        const timeSinceLastCall = now - lastCallTime.get(key);
        if (timeSinceLastCall < DEBOUNCE_DELAY) {
            console.log(`⏱️ Debouncing ${functionName} call (${timeSinceLastCall}ms < ${DEBOUNCE_DELAY}ms)`);
            return true;
        }
    }
    
    lastCallTime.set(key, now);
    return false;
}

/**
 * Check if the key parameters have actually changed
 * @param {string} requesterId - Current requester ID
 * @param {string} transactionType - Current transaction type
 * @param {string} departmentId - Current department ID
 * @returns {boolean} True if any key parameter has changed
 */
function hasKeyParametersChanged(requesterId, transactionType, departmentId) {
    const hasChanged = (
        lastKnownValues.requesterId !== requesterId ||
        lastKnownValues.transactionType !== transactionType ||
        lastKnownValues.departmentId !== departmentId
    );
    
    if (hasChanged) {
        console.log('🔄 Key parameters changed:', {
            old: lastKnownValues,
            new: { requesterId, transactionType, departmentId }
        });
        
        // Update last known values
        lastKnownValues = { requesterId, transactionType, departmentId };
    } else {
        console.log('✅ No key parameter changes detected, using cached data');
    }
    
    return hasChanged;
}

/**
 * Get current key parameters from the page
 * @returns {Object} Object with requesterId, transactionType, and departmentId
 */
function getCurrentKeyParameters() {
    try {
        // Try to find requester field (could be input or select)
        const requesterField = document.querySelector('input[id*="requester"], select[id*="requester"], input[id*="Requester"], select[id*="Requester"]');
        const requesterId = requesterField ? requesterField.value : null;
        
        // Try to find transaction type field
        const transactionField = document.querySelector('select[id*="transaction"], select[id*="Transaction"], select[id="typeTransaction"], select[id="TransactionType"]');
        const transactionType = transactionField ? transactionField.value : null;
        
        // Try to find department field
        const departmentField = document.querySelector('select[id="department"], select[name="department"], select[id*="department"], select[name*="department"]');
        const departmentId = departmentField ? departmentField.value : null;
        
        return { requesterId, transactionType, departmentId };
    } catch (error) {
        console.warn('⚠️ Error getting current key parameters:', error);
        return { requesterId: null, transactionType: null, departmentId: null };
    }
}

/**
 * Check if we should fetch new data based on key parameter changes
 * @param {string} menu - Menu type
 * @param {string} transaction - Transaction type
 * @param {string} departmentId - Department ID (used as fallback if Department field is empty)
 * @returns {boolean} True if we should fetch new data
 */
function shouldFetchNewData(menu, transaction, departmentId) {
    const currentParams = getCurrentKeyParameters();
    
    // Check if we have cached data for this combination first
    // Use Department field value for consistency with the main API call
    // Use the actual transaction parameter for cache key
    const departmentName = getCurrentDepartmentValue() || getDepartmentNameFromId(departmentId);
    const normalizedMenu = normalizeMenuValue(menu);
    const cacheKey = `${departmentName}-${normalizedMenu}-${transaction || 'all'}`;
    
    if (expensesCoaCache.has(cacheKey)) {
        const cachedData = expensesCoaCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
            console.log('✅ Using cached data, no API call needed');
            return false;
        } else {
            console.log('🗑️ Cache expired, will fetch new data');
            expensesCoaCache.delete(cacheKey);
        }
    }
    
    // Only check for key parameter changes if we don't have cached data
    if (hasKeyParametersChanged(currentParams.requesterId, currentParams.transactionType, currentParams.departmentId)) {
        console.log('🔄 Key parameters changed, will fetch new data');
        return true;
    }
    
    console.log('🆕 No cached data available, will fetch new data');
    return true;
}

/**
 * Debug function to show current page state and available fields
 * This helps troubleshoot issues with field lookups
 */
function debugPageState() {
    console.log('🔍 === PAGE STATE DEBUG ===');
    
    // Check for department field
    const departmentSelect = document.querySelector('select[id="department"], select[name="department"], select[id*="department"], select[name*="department"]');
    if (departmentSelect) {
        console.log('✅ Department field found:', {
            id: departmentSelect.id,
            name: departmentSelect.name,
            value: departmentSelect.value,
            optionsCount: departmentSelect.options.length,
            options: Array.from(departmentSelect.options).map(opt => ({ value: opt.value, text: opt.textContent }))
        });
    } else {
        console.log('❌ Department field not found');
    }
    
    // Check for transaction type field
    const transactionSelect = document.querySelector('select[id="transactionType"], select[name="transactionType"], select[id*="transaction"], select[name*="transaction"]');
    if (transactionSelect) {
        console.log('✅ Transaction type field found:', {
            id: transactionSelect.id,
            name: transactionSelect.name,
            value: transactionSelect.value,
            optionsCount: transactionSelect.options.length
        });
    } else {
        console.log('❌ Transaction type field not found');
    }
    
    // Check for requester field
    const requesterField = document.querySelector('input[id*="requester"], select[id*="requester"]');
    if (requesterField) {
        console.log('✅ Requester field found:', {
            id: requesterField.id,
            name: requesterField.name,
            value: requesterField.value,
            type: requesterField.type
        });
    } else {
        console.log('❌ Requester field not found');
    }
    
    // Check current URL
    console.log('🌐 Current URL:', window.location.href);
    
    // Check if BASE_URL is available
    console.log('🔗 BASE_URL:', window.BASE_URL);
    
    console.log('🔍 === END PAGE STATE DEBUG ===');
}

/**
 * Refresh department field options to ensure they are populated
 * This should be called when the requester changes
 */
async function refreshDepartmentField() {
    try {
        console.log('🔄 Refreshing department field...');
        
        // Try to find the department select field
        const departmentSelect = document.querySelector('select[id="department"], select[name="department"], select[id*="department"], select[name*="department"]');
        
        if (departmentSelect && departmentSelect.options.length <= 1) {
            console.log('🔄 Department field has few options, attempting to refresh...');
            
            // If this is a Cash Advance page, try to fetch departments
            if (window.location.href.includes('cash-advance') || window.location.href.includes('Cash') || window.location.href.includes('cash')) {
                try {
                    const baseUrl = window.BASE_URL || 'https://expressiv.idsdev.site';
                    const response = await fetch(`${baseUrl}/api/department`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.data && Array.isArray(data.data)) {
                            // Clear existing options
                            departmentSelect.innerHTML = '';
                            
                            // Add default option
                            const defaultOption = document.createElement('option');
                            defaultOption.value = '';
                            defaultOption.textContent = 'Select Department';
                            departmentSelect.appendChild(defaultOption);
                            
                            // Add department options
                            data.data.forEach(dept => {
                                const option = document.createElement('option');
                                option.value = dept.id || dept.departmentId || dept.name;
                                option.textContent = dept.name || dept.departmentName;
                                departmentSelect.appendChild(option);
                            });
                            
                            console.log('✅ Department field refreshed with', data.data.length, 'departments');
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Could not refresh department field:', error);
                }
            }
        }
    } catch (error) {
        console.warn('⚠️ Error refreshing department field:', error);
    }
}

/**
 * Get the current department value directly from the Department field on the page
 * @returns {string} Current department value or empty string if not found
 */
function getCurrentDepartmentValue() {
    try {
        // Try multiple possible selectors for department field
        const selectors = [
            'select[id="department"]',
            'select[name="department"]',
            'select[id="departmentId"]',
            'select[name="departmentId"]',
            'select[id*="department"]',
            'select[name*="department"]',
            'select[id*="Department"]',
            'select[name*="Department"]',
            'input[id="department"]',
            'input[name="department"]',
            'input[id="departmentId"]',
            'input[name="departmentId"]',
            'input[id*="department"]',
            'input[name*="Department"]'
        ];
        
        for (const selector of selectors) {
            const field = document.querySelector(selector);
            if (field) {
                if (field.tagName === 'SELECT') {
                    // For select elements, get the text of the selected option
                    const selectedOption = field.options[field.selectedIndex];
                    if (selectedOption && selectedOption.textContent.trim()) {
                        const value = selectedOption.textContent.trim();
                        console.log('✅ Found current department value from select:', value, 'from field:', selector);
                        return value;
                    }
                } else {
                    // For input elements, get the value directly
                    const value = field.value || field.textContent || '';
                    if (value.trim()) {
                        console.log('✅ Found current department value from input:', value.trim(), 'from field:', selector);
                        return value.trim();
                    }
                }
            }
        }
        
        console.warn('⚠️ No department field found or department field is empty');
        return '';
    } catch (error) {
        console.warn('⚠️ Error getting current department value:', error);
        return '';
    }
}

/**
 * Get department name from department ID or name by looking up the department select field
 * @param {string} departmentId - Department ID or department name (used as fallback if Department field is empty)
 * @returns {string} Department name
 */
function getDepartmentNameFromId(departmentId) {
    try {
        console.log('🔍 Looking up department name for:', departmentId);
        
        // If the input looks like a department name (not a numeric ID), return it directly
        if (typeof departmentId === 'string' && !/^\d+$/.test(departmentId) && departmentId.trim() !== '') {
            console.log('✅ Input appears to be a department name, returning directly:', departmentId);
            return departmentId.trim();
        }
        
        // First, try to get the current selected value from the Department field
        const departmentSelect = document.querySelector('select[id="department"], select[name="department"], select[id="departmentId"], select[name="departmentId"], select[id*="department"], select[name*="department"]');
        if (departmentSelect && departmentSelect.value && departmentSelect.value.trim() !== '') {
            // If the Department field has a value, try to find the corresponding text
            const selectedOption = departmentSelect.options[departmentSelect.selectedIndex];
            if (selectedOption && selectedOption.textContent.trim() !== '') {
                const departmentName = selectedOption.textContent.trim();
                console.log('✅ Found department name from selected option:', departmentName);
                return departmentName;
            }
        }
        
        // If no selected value, try to find by matching the ID with options
        if (departmentSelect) {
            console.log('🔍 Department select options:', Array.from(departmentSelect.options).map(opt => ({ value: opt.value, text: opt.textContent })));
            
            for (let i = 0; i < departmentSelect.options.length; i++) {
                const option = departmentSelect.options[i];
                if (option.value === departmentId) {
                    const departmentName = option.textContent.trim();
                    console.log('✅ Found department name:', departmentName, 'for ID:', departmentId);
                    return departmentName;
                }
            }
            
            console.warn('⚠️ Department ID not found in options:', departmentId);
        } else {
            console.warn('⚠️ No department select field found');
        }
        
        // Fallback: try to find by data attributes or other selectors
        const departmentSelectAlt = document.querySelector('select[data-field="department"], select[data-name="department"]');
        if (departmentSelectAlt) {
            console.log('🔍 Trying alternative department select');
            for (let i = 0; i < departmentSelectAlt.options.length; i++) {
                if (departmentSelectAlt.options[i].value === departmentId) {
                    const departmentName = departmentSelectAlt.options[i].textContent.trim();
                    console.log('✅ Found department name (alternative):', departmentName, 'for ID:', departmentId);
                    return departmentName;
                }
            }
        }
        
        console.warn('⚠️ Department name not found for ID:', departmentId, 'using ID as fallback');
        return departmentId;
    } catch (error) {
        console.warn('⚠️ Error getting department name:', error, 'using ID as fallback');
        return departmentId;
    }
}

/**
 * Normalize menu value to match API expectations
 * @param {string} menu - Menu type from the application
 * @returns {string} Normalized menu value for API
 */
function normalizeMenuValue(menu) {
    const menuMap = {
        'Cash Advance': 'Cash Advance',
        'Cash Advance Settlement': 'Settlement',
        'Settlement': 'Settlement'
    };
    
    return menuMap[menu] || menu;
}

/**
 * Fetch expenses COA data from the unified API
 * @param {string} departmentId - Department ID or department name (used as fallback if Department field is empty)
 * @param {string} menu - Menu type (e.g., "Cash Advance", "Settlement")
 * @param {string} transaction - Transaction type (e.g., "Others", "Travel", etc.)
 * @returns {Promise<Array>} Array of COA data
 */
async function fetchExpensesCoa(departmentId, menu, transaction) {
    console.log('🚀 fetchExpensesCoa called with:', { departmentId, menu, transaction });
    console.log('🚀 Parameter types:', { 
        departmentIdType: typeof departmentId, 
        menuType: typeof menu, 
        transactionType: typeof transaction 
    });
    
    // Check if we should fetch new data or use cached data
    if (!shouldFetchNewData(menu, transaction, departmentId)) {
        // Use Department field value for consistency with the main API call
        const departmentName = getCurrentDepartmentValue() || getDepartmentNameFromId(departmentId);
        const normalizedMenu = normalizeMenuValue(menu);
        const cacheKey = `${departmentName}-${normalizedMenu}-${transaction}`;
        
        if (expensesCoaCache.has(cacheKey)) {
            const cachedData = expensesCoaCache.get(cacheKey);
            console.log('✅ Returning cached data for:', cacheKey);
            return cachedData.data;
        }
    }
    
    // Get department name - prioritize current page value, fallback to parameter conversion
    let departmentName = getCurrentDepartmentValue();
    if (!departmentName) {
        // Fallback to the parameter if no current field value found
        console.log('⚠️ No department value found in Department field, using parameter:', departmentId);
        departmentName = getDepartmentNameFromId(departmentId);
    }
    console.log('📍 Using department name:', departmentName);
    
    // Normalize menu value
    const normalizedMenu = normalizeMenuValue(menu);
    console.log('📋 Normalized menu value:', normalizedMenu);
    
            // Build cache key using the actual transaction parameter
        const cacheKey = `${departmentName}-${normalizedMenu}-${transaction || 'all'}`;
        console.log('🔑 Cache key:', cacheKey);
    
    // Check if there's already an ongoing request for this combination
    if (ongoingRequests.has(cacheKey)) {
        console.log('⏳ Request already in progress for:', cacheKey, 'waiting for result...');
        return await ongoingRequests.get(cacheKey);
    }
    
    try {
        // Create a promise for this request and store it
        const requestPromise = (async () => {
            try {
                // Use window.BASE_URL directly instead of declaring a new constant
                const baseUrl = window.BASE_URL || 'https://expressiv.idsdev.site';
                console.log('🌐 Using base URL:', baseUrl);
                
                // Construct the API URL with query parameters
                // Use the actual transaction parameter passed, or 'all' if not specified
                const url = new URL('/api/expenses-coa/filter', baseUrl);
                url.searchParams.append('departmentName', departmentName);
                url.searchParams.append('menu', normalizedMenu);
                url.searchParams.append('transaction', transaction || 'all');

                console.log('🔗 Final API URL:', url.toString());
                console.log('📊 API Parameters:', { 
                    departmentName, 
                    menu: normalizedMenu, 
                    transaction: transaction || 'all',
                    fullUrl: url.toString()
                });

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                console.log('📡 API Response status:', response.status, response.statusText);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                }

                const data = await response.json();
                console.log('📦 API Response data:', data);

                if (data.status && data.data) {
                    // Cache the result with timestamp
                    expensesCoaCache.set(cacheKey, {
                        data: data.data,
                        timestamp: Date.now()
                    });
                    console.log('💾 Cached expenses COA data for:', cacheKey, 'Count:', data.data.length);
                    return data.data;
                } else {
                    console.warn('⚠️ Expenses COA API returned no data or invalid status');
                    console.warn('⚠️ Response structure:', data);
                    return [];
                }
            } catch (error) {
                console.error('❌ Error fetching expenses COA:', error);
                console.error('❌ Error details:', {
                    message: error.message,
                    stack: error.stack,
                    departmentId,
                    menu,
                    transaction,
                    departmentName: getDepartmentNameFromId(departmentId),
                    normalizedMenu: normalizeMenuValue(menu)
                });
                return [];
            } finally {
                // Remove the request from ongoing requests
                ongoingRequests.delete(cacheKey);
                console.log('✅ Request completed and removed from ongoing requests:', cacheKey);
            }
        })();
        
        // Store the promise in ongoing requests
        ongoingRequests.set(cacheKey, requestPromise);
        console.log('📝 Request stored in ongoing requests:', cacheKey);
        
        // Wait for the request to complete
        return await requestPromise;
        
    } catch (error) {
        // Remove the request from ongoing requests on error
        ongoingRequests.delete(cacheKey);
        console.error('❌ Error in fetchExpensesCoa:', error);
        return [];
    }
}

/**
 * Get available categories for a given menu and transaction type
 * @param {string} menu - Menu type (e.g., "Cash Advance", "Settlement")
 * @param {string} transaction - Transaction type (e.g., "Others", "Travel", etc.)
 * @param {string} departmentId - Department ID or department name (used as fallback if Department field is empty)
 * @returns {Promise<Array>} Array of unique categories
 */
async function getAvailableCategories(menu, transaction, departmentId = null) {
    if (!departmentId) {
        console.warn('Department ID is required for getAvailableCategories');
        return [];
    }
    
            // Create a cache key for debouncing
        // Note: Cache key includes the actual transaction parameter
        const departmentName = getDepartmentNameFromId(departmentId);
        const normalizedMenu = normalizeMenuValue(menu);
        const cacheKey = `${departmentName}-${normalizedMenu}-${transaction || 'all'}`;
    
    // Check if this call should be debounced
    if (shouldDebounceCall('getAvailableCategories', cacheKey)) {
        console.log('⏱️ Returning cached result due to debouncing');
        const cachedData = expensesCoaCache.get(cacheKey);
        if (cachedData) {
            const categories = new Set();
            cachedData.data.forEach(item => {
                if (item.category) {
                    categories.add(item.category);
                }
            });
            return Array.from(categories).sort();
        }
        return [];
    }
    
    console.log('🚀 getAvailableCategories called (not debounced)');
    
    console.log('🔍 getAvailableCategories called with:', { menu, transaction, departmentId });
    
    const expensesCoaData = await fetchExpensesCoa(departmentId, menu, transaction);
    console.log('📊 Raw expenses COA data for categories:', expensesCoaData);
    console.log('📊 Data type:', typeof expensesCoaData, 'Length:', Array.isArray(expensesCoaData) ? expensesCoaData.length : 'Not an array');
    
    if (!Array.isArray(expensesCoaData)) {
        console.error('❌ expensesCoaData is not an array for categories:', expensesCoaData);
        return [];
    }
    
    // Extract unique categories from the data
    const categories = new Set();
    expensesCoaData.forEach(item => {
        console.log('🔍 Processing item for categories:', item);
        if (item.category) {
            categories.add(item.category);
            console.log('✅ Added category:', item.category);
        } else {
            console.log('⚠️ Item has no category:', item);
        }
    });
    
    const uniqueCategories = Array.from(categories).sort();
    console.log('✅ Final categories result:', uniqueCategories);
    return uniqueCategories;
}

/**
 * Get available account names for a given category, menu, and transaction type
 * @param {string} category - Selected category
 * @param {string} menu - Menu type (e.g., "Cash Advance", "Settlement")
 * @param {string} transaction - Transaction type (e.g., "Others", "Travel", etc.)
 * @param {string} departmentId - Department ID or department name (used as fallback if Department field is empty)
 * @returns {Promise<Array>} Array of account names with COA
 */
async function getAvailableAccountNames(category, menu, transaction, departmentId = null) {
    if (!departmentId) {
        console.warn('Department ID is required for getAvailableAccountNames');
        return [];
    }
    
    console.log('🔍 getAvailableAccountNames called with:', { category, menu, transaction, departmentId });
    console.log('🔍 Parameter types:', { 
        categoryType: typeof category, 
        menuType: typeof menu, 
        transactionType: typeof transaction, 
        departmentIdType: typeof departmentId 
    });
    
    const expensesCoaData = await fetchExpensesCoa(departmentId, menu, transaction);
    console.log('📊 Raw expenses COA data received:', expensesCoaData);
    console.log('📊 Data type:', typeof expensesCoaData, 'Length:', Array.isArray(expensesCoaData) ? expensesCoaData.length : 'Not an array');
    
    if (!Array.isArray(expensesCoaData)) {
        console.error('❌ expensesCoaData is not an array:', expensesCoaData);
        return [];
    }
    
    // Filter data by selected category and extract account names with COA
    const filteredData = expensesCoaData.filter(item => {
        console.log('🔍 Checking item:', item);
        const hasCategory = item.category === category;
        const hasAccountName = item.accountName;
        const hasCoa = item.coa;
        console.log('🔍 Item check:', { hasCategory, hasAccountName, hasCoa, itemCategory: item.category, itemAccountName: item.accountName, itemCoa: item.coa });
        return hasCategory && hasAccountName && hasCoa;
    });
    
    console.log('🔍 Filtered data by category:', filteredData);
    
    const accountNames = filteredData
        .map(item => ({
            accountName: item.accountName,
            coa: item.coa
        }))
        .sort((a, b) => a.accountName.localeCompare(b.accountName));
    
    console.log('✅ Final account names result:', accountNames);
    return accountNames;
}

/**
 * Get COA for a specific category and account name
 * @param {string} category - Selected category
 * @param {string} accountName - Selected account name
 * @param {string} menu - Menu type (e.g., "Cash Advance", "Settlement")
 * @param {string} transaction - Transaction type (e.g., "Others", "Travel", etc.)
 * @param {string} departmentId - Department ID or department name (used as fallback if Department field is empty)
 * @returns {Promise<string>} COA value or empty string if not found
 */
async function getCOA(category, accountName, menu, transaction, departmentId = null) {
    if (!departmentId) {
        console.warn('Department ID is required for getCOA');
        return '';
    }
    
    const expensesCoaData = await fetchExpensesCoa(departmentId, menu, transaction);
    
    // Find the matching item
    const matchingItem = expensesCoaData.find(item => 
        item.category === category && item.accountName === accountName
    );
    
    if (matchingItem && matchingItem.coa) {
        console.log('Found COA for', category, '-', accountName, ':', matchingItem.coa);
        return matchingItem.coa;
    } else {
        console.warn('No COA found for', category, '-', accountName);
        return '';
    }
}

/**
 * Clear the cache for specific or all entries
 * @param {string} cacheKey - Specific cache key to clear, or null to clear all
 */
function clearCache(cacheKey = null) {
    if (cacheKey) {
        expensesCoaCache.delete(cacheKey);
        console.log('Cleared cache for:', cacheKey);
    } else {
        expensesCoaCache.clear();
        console.log('Cleared all expenses COA cache');
    }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
    return {
        size: expensesCoaCache.size,
        keys: Array.from(expensesCoaCache.keys())
    };
}

/**
 * Manually refresh the cache when requester or transaction type changes
 * This should be called by the application when these fields change
 * @param {string} requesterId - New requester ID
 * @param {string} transactionType - New transaction type
 * @param {string} departmentId - New department ID
 */
function refreshCacheOnChange(requesterId, transactionType, departmentId) {
    console.log('🔄 Manually refreshing cache due to change:', { requesterId, transactionType, departmentId });
    
    // Update last known values to trigger cache refresh
    lastKnownValues = { requesterId, transactionType, departmentId };
    
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, value] of expensesCoaCache.entries()) {
        if (now - value.timestamp >= CACHE_EXPIRY) {
            expensesCoaCache.delete(key);
            console.log('🗑️ Cleared expired cache entry:', key);
        }
    }
    
    console.log('✅ Cache refreshed, next API call will fetch new data');
}

/**
 * Force refresh all cache data
 * This can be used for debugging or when cache becomes stale
 */
function forceRefreshCache() {
    console.log('🔄 Force refreshing all cache data');
    expensesCoaCache.clear();
    ongoingRequests.clear();
    lastKnownValues = { requesterId: null, transactionType: null, departmentId: null };
    console.log('✅ All cache data and ongoing requests cleared');
}

/**
 * Get current ongoing requests status
 * This helps with debugging multiple API calls
 * @returns {Object} Status of ongoing requests
 */
function getOngoingRequestsStatus() {
    const status = {
        count: ongoingRequests.size,
        keys: Array.from(ongoingRequests.keys()),
        cacheSize: expensesCoaCache.size,
        cacheKeys: Array.from(expensesCoaCache.keys()),
        lastKnownValues
    };
    console.log('📊 Ongoing requests status:', status);
    return status;
}

// Export functions for use in other modules
window.expensesCoaService = {
    fetchExpensesCoa,
    getAvailableCategories,
    getAvailableAccountNames,
    getCOA,
    clearCache,
    getCacheStats,
    refreshDepartmentField,
    getDepartmentNameFromId,
    getCurrentDepartmentValue,
    debugPageState,
    shouldFetchNewData,
    getCurrentKeyParameters,
    hasKeyParametersChanged,
    refreshCacheOnChange,
    forceRefreshCache,
    getOngoingRequestsStatus,
    shouldDebounceCall
};

console.log('Expenses COA Service loaded successfully');
