// ========================= CONFIGURATION =========================
const CONFIG = {
    CACHE_EXPIRY: 5 * 60 * 1000, // 5 minutes
    ITEMS_PER_PAGE: 10,
    DEBOUNCE_DELAY: 300,
    POLLING_INTERVAL: 30000, // 30 seconds
    ANIMATION_DELAY: 200,
    FADE_IN_DELAY: 50
};

// ========================= STATE MANAGEMENT =========================
const state = {
    currentPage: 1,
    filteredData: [],
    allReimbursements: [],
    currentTab: 'prepared',
    isLoading: false,
    searchInputListener: null,
    dataCache: {
        reimbursements: null,
        lastFetch: null
    }
};

// ========================= UTILITY FUNCTIONS =========================
const utils = {
    debounce(func, wait) {
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

    formatDateWithLocalTimezone(dateString) {
        const date = new Date(dateString);
        return isNaN(date) ? '' : date.toLocaleDateString();
    },

    formatDateYYYYMMDD(dateString) {
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },

    getStatusColorClass(status) {
        const statusColors = {
            'Prepared': 'bg-yellow-200 text-yellow-800',
            'Draft': 'bg-yellow-200 text-yellow-800',
            'Checked': 'bg-green-200 text-green-800',
            'Acknowledged': 'bg-blue-200 text-blue-800',
            'Approved': 'bg-purple-200 text-purple-800',
            'Received': 'bg-indigo-200 text-indigo-800',
            'Rejected': 'bg-red-200 text-red-800',
            'Closed': 'bg-gray-200 text-gray-800'
        };
        return statusColors[status] || 'bg-gray-200 text-gray-800';
    },

    isValidCache() {
        return state.dataCache.reimbursements && 
               state.dataCache.lastFetch && 
               (Date.now() - state.dataCache.lastFetch) < CONFIG.CACHE_EXPIRY;
    }
};

// ========================= DATA SERVICE =========================
const dataService = {
    async fetchReimbursements() {
        const userId = getUserId();
        if (!userId) throw new Error('User ID not found');

        // Check cache first
        if (utils.isValidCache()) {
            state.allReimbursements = state.dataCache.reimbursements;
            statusCountService.calculateAndUpdateStatusCounts(state.allReimbursements);
            tabService.switchTab('prepared');
            return;
        }

        if (state.isLoading) return;
        
        state.isLoading = true;
        const endpoint = `/api/reimbursements/checker/${userId}`;
        
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status && data.code === 200) {
                // Update cache
                state.dataCache.reimbursements = data.data;
                state.dataCache.lastFetch = Date.now();
                
                state.allReimbursements = data.data;
                statusCountService.calculateAndUpdateStatusCounts(state.allReimbursements);
                tabService.switchTab('prepared');
            } else {
                throw new Error(data.message || 'API returned an error');
            }
        } catch (error) {
            console.error('Error fetching reimbursements:', error);
            uiService.displayErrorMessage('Failed to fetch reimbursements');
        } finally {
            state.isLoading = false;
        }
    },

    async fetchReimbursementsByStatus(status) {
        const userId = getUserId();
        const endpoint = `/api/reimbursements/checker/${userId}/${status}`;
        
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status && data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || 'API returned an error');
            }
        } catch (error) {
            console.error(`Error fetching ${status} reimbursements:`, error);
            return [];
        }
    }
};

// ========================= STATUS COUNT SERVICE =========================
const statusCountService = {
    calculateAndUpdateStatusCounts(reimbursements) {
        const userId = getUserId();
        let preparedCount = 0;
        let checkedCount = 0;
        let rejectedCount = 0;
        let totalCount = 0;
        
        reimbursements.forEach(item => {
            // Prepared: dokumen dengan status "Prepared" yang menunggu checker
            if (item.status === 'Prepared' && item.checkedBy === userId) {
                preparedCount++;
                totalCount++;
            }
            
            // Checked: dokumen yang sudah di-check oleh checker ini
            if (item.status === 'Checked' && 
                item.checkedBy === userId && 
                item.checkedDate) {
                checkedCount++;
                totalCount++;
            }
            
            // Rejected: dokumen yang di-reject oleh checker ini
            if (item.status === 'Rejected' && 
                item.rejectedDateByChecker && 
                item.checkedBy === userId) {
                rejectedCount++;
                totalCount++;
            }
        });
        
        // Update UI
        this.updateUI(totalCount, preparedCount, checkedCount, rejectedCount);
    },

    updateUI(totalCount, preparedCount, checkedCount, rejectedCount) {
        const elements = {
            totalCount: document.getElementById("totalCount"),
            preparedCount: document.getElementById("preparedCount"),
            checkedCount: document.getElementById("checkedCount"),
            rejectedCount: document.getElementById("rejectedCount")
        };

        // Safely update each element
        Object.entries({
            totalCount,
            preparedCount,
            checkedCount,
            rejectedCount
        }).forEach(([key, value]) => {
            if (elements[key]) {
                elements[key].textContent = value;
            }
        });
    }
};

// ========================= FILTER SERVICE =========================
const filterService = {
    filterReimbursements(searchTerm = '', tab = 'prepared', searchType = 'pr') {
        const userId = getUserId();
        
        state.filteredData = state.allReimbursements.filter(item => {
            // Filter berdasarkan tab (status untuk checker)
            let tabMatch = false;
            if (tab === 'prepared') {
                tabMatch = item.status === 'Prepared' && item.checkedBy === userId;
            } else if (tab === 'checked') {
                tabMatch = item.status === 'Checked' && 
                          item.checkedBy === userId && 
                          item.checkedDate;
            } else if (tab === 'rejected') {
                tabMatch = item.status === 'Rejected' && 
                          item.rejectedDateByChecker && 
                          item.checkedBy === userId;
            }
            
            // Filter berdasarkan search term
            let searchMatch = true;
            if (searchTerm && tabMatch) {
                switch (searchType) {
                    case 'pr':
                        searchMatch = item.voucherNo.toLowerCase().includes(searchTerm);
                        break;
                    case 'requester':
                        searchMatch = item.requesterName.toLowerCase().includes(searchTerm);
                        break;
                    case 'date':
                        const formattedDate = utils.formatDateYYYYMMDD(item.submissionDate);
                        searchMatch = formattedDate === searchTerm;
                        break;
                    case 'status':
                        searchMatch = item.status && item.status.toLowerCase().includes(searchTerm);
                        break;
                }
            }
            
            return tabMatch && searchMatch;
        });
        
        tableService.updateTable();
        paginationService.updatePagination();
    }
};

// ========================= TABLE SERVICE =========================
const tableService = {
    updateTable() {
        const tableBody = document.getElementById('recentDocs');
        if (!tableBody) return;

        const startIndex = (state.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + CONFIG.ITEMS_PER_PAGE, state.filteredData.length);
        
        // Use DocumentFragment for batch DOM updates
        const fragment = document.createDocumentFragment();
        
        for (let i = startIndex; i < endIndex; i++) {
            const item = state.filteredData[i];
            const row = this.createTableRow(item, startIndex + i + 1);
            fragment.appendChild(row);
        }
        
        // Clear and append
        tableBody.innerHTML = '';
        tableBody.appendChild(fragment);
        
        // Update item count display
        this.updateItemCountDisplay(startIndex, endIndex);
    },

    createTableRow(item, index) {
        const formattedDate = item.submissionDate ? 
            utils.formatDateWithLocalTimezone(item.submissionDate) : '';
        
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        row.innerHTML = `
            <td class="p-2">${index}</td>
            <td class="p-2">${item.voucherNo || ''}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${item.department || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${utils.getStatusColorClass(item.status)}">
                    ${item.status}
                </span>
            </td>
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailReim('${item.id}')">
                    Detail
                </button>
            </td>
        `;
        
        return row;
    },

    updateItemCountDisplay(startIndex, endIndex) {
        const elements = {
            startItem: document.getElementById('startItem'),
            endItem: document.getElementById('endItem'),
            totalItems: document.getElementById('totalItems')
        };

        if (elements.startItem) {
            elements.startItem.textContent = state.filteredData.length > 0 ? startIndex + 1 : 0;
        }
        if (elements.endItem) {
            elements.endItem.textContent = endIndex;
        }
        if (elements.totalItems) {
            elements.totalItems.textContent = state.filteredData.length;
        }
    }
};

// ========================= PAGINATION SERVICE =========================
const paginationService = {
    updatePagination() {
        const totalPages = Math.ceil(state.filteredData.length / CONFIG.ITEMS_PER_PAGE);
        const currentPageElement = document.getElementById('currentPage');
        if (currentPageElement) {
            currentPageElement.textContent = state.currentPage;
        }
        
        // Update prev/next button states
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            if (state.currentPage <= 1) {
                prevBtn.classList.add('disabled');
            } else {
                prevBtn.classList.remove('disabled');
            }
        }
        
        if (nextBtn) {
            if (state.currentPage >= totalPages) {
                nextBtn.classList.add('disabled');
            } else {
                nextBtn.classList.remove('disabled');
            }
        }
    },

    changePage(direction) {
        const totalPages = Math.ceil(state.filteredData.length / CONFIG.ITEMS_PER_PAGE);
        
        if (direction === -1 && state.currentPage > 1) {
            state.currentPage--;
        } else if (direction === 1 && state.currentPage < totalPages) {
            state.currentPage++;
        }
        
        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(() => {
            tableService.updateTable();
            this.updatePagination();
        });
    }
};

// ========================= TAB SERVICE =========================
const tabService = {
    async switchTab(tabName) {
        state.currentTab = tabName;
        state.currentPage = 1; // Reset to first page
        
        // Update tab button styling
        this.updateTabStyling(tabName);
        
        // Add fade-out effect
        const tableBody = document.getElementById('recentDocs');
        if (tableBody) {
            tableBody.style.opacity = '0';
            tableBody.style.transform = 'translateY(10px)';
            tableBody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        }
        
        // Fetch and display data
        setTimeout(async () => {
            try {
                const userId = getUserId();
                const documents = await dataService.fetchReimbursementsByStatus(tabName);
                this.updateTableWithDocuments(documents);
                
                // Add fade-in effect
                setTimeout(() => {
                    if (tableBody) {
                        tableBody.style.opacity = '1';
                        tableBody.style.transform = 'translateY(0)';
                    }
                }, CONFIG.FADE_IN_DELAY);
            } catch (error) {
                console.error(`Error switching to ${tabName} tab:`, error);
                this.updateTableWithDocuments([]);
            }
        }, CONFIG.ANIMATION_DELAY);
    },

    updateTabStyling(tabName) {
        const tabs = ['prepared', 'checked', 'rejected'];
        tabs.forEach(tab => {
            const btn = document.getElementById(`${tab}TabBtn`);
            if (btn) {
                btn.classList.remove('tab-active');
                if (tab === tabName) {
                    btn.classList.add('tab-active');
                }
            }
        });
    },

    updateTableWithDocuments(documents) {
        state.allReimbursements = documents;
        
        // Apply search filter if there's an active search
        const searchInput = document.getElementById('searchInput');
        const searchType = document.getElementById('searchType');
        
        if (searchInput && searchType) {
            const searchTerm = searchInput.value.toLowerCase();
            const searchTypeValue = searchType.value;
            
            if (searchTerm) {
                filterService.filterReimbursements(searchTerm, state.currentTab, searchTypeValue);
            } else {
                state.filteredData = state.allReimbursements;
                tableService.updateTable();
                paginationService.updatePagination();
            }
        }
    }
};

// ========================= EVENT SERVICE =========================
const eventService = {
    setupEventListeners() {
        // Remove existing listeners if any
        if (state.searchInputListener) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.removeEventListener('input', state.searchInputListener);
            }
        }
        
        // Add new listeners
        const debouncedSearch = utils.debounce(this.handleSearch, CONFIG.DEBOUNCE_DELAY);
        state.searchInputListener = debouncedSearch;
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', state.searchInputListener);
        }
        
        // Add event listener for search type dropdown
        const searchType = document.getElementById('searchType');
        if (searchType) {
            searchType.addEventListener('change', this.handleSearchTypeChange.bind(this));
        }
    },

    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const searchType = document.getElementById('searchType');
        filterService.filterReimbursements(
            searchTerm, 
            state.currentTab, 
            searchType ? searchType.value : 'pr'
        );
    },

    handleSearchTypeChange() {
        const searchInput = document.getElementById('searchInput');
        const searchType = document.getElementById('searchType');
        
        if (!searchInput || !searchType) return;
        
        // Change input type based on search type
        if (searchType.value === 'date') {
            searchInput.type = 'date';
            searchInput.placeholder = 'Select date...';
        } else {
            searchInput.type = 'text';
            searchInput.placeholder = 'Search...';
        }
        
        // Clear the search input when changing search type
        searchInput.value = '';
        
        // Trigger search again when dropdown changes
        this.handleSearch({target: {value: ''}});
    }
};

// ========================= UI SERVICE =========================
const uiService = {
    displayErrorMessage(message) {
        // Reset counts to zero
        statusCountService.updateUI(0, 0, 0, 0);
        
        // Clear table data
        state.allReimbursements = [];
        state.filteredData = [];
        tableService.updateTable();
        paginationService.updatePagination();
        
        console.error(message);
    }
};

// ========================= EXPORT SERVICE =========================
const exportService = {
    downloadExcel() {
        const statusText = state.currentTab.charAt(0).toUpperCase() + state.currentTab.slice(1);
        const fileName = `Reimbursement_${statusText}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        
        const data = state.filteredData.map((item, index) => ({
            'No.': index + 1,
            'Reimbursement Number': item.voucherNo || '',
            'Requester': item.requesterName || '',
            'Department': item.department || '',
            'Submission Date': item.submissionDate ? utils.formatDateWithLocalTimezone(item.submissionDate) : '',
            'Status': item.status
        }));
        
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reimbursements');
        XLSX.writeFile(wb, fileName);
    },

    downloadPDF() {
        const statusText = state.currentTab.charAt(0).toUpperCase() + state.currentTab.slice(1);
        const fileName = `Reimbursement_${statusText}_${new Date().toISOString().slice(0, 10)}.pdf`;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Reimbursement ${statusText} Documents`, 14, 22);
        
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
        
        const tableColumn = ['No.', 'Reimbursement Number', 'Requester', 'Department', 'Submission Date', 'Status'];
        const tableRows = state.filteredData.map((item, index) => [
            index + 1,
            item.voucherNo || '',
            item.requesterName || '',
            item.department || '',
            item.submissionDate ? utils.formatDateWithLocalTimezone(item.submissionDate) : '',
            item.status
        ]);
        
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [66, 153, 225], textColor: 255 },
            alternateRowStyles: { fillColor: [240, 240, 240] }
        });
        
        doc.save(fileName);
    }
};

// ========================= MAIN DASHBOARD =========================
async function loadDashboard() {
    try {
        await dataService.fetchReimbursements();
        eventService.setupEventListeners();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        uiService.displayErrorMessage('Failed to load dashboard');
    }
}

// ========================= GLOBAL FUNCTIONS =========================
// These functions need to be global for HTML onclick handlers
function switchTab(tabName) {
    tabService.switchTab(tabName);
}

function changePage(direction) {
    paginationService.changePage(direction);
}

function goToTotalDocs() {
    const userId = getUserId();
    state.filteredData = state.allReimbursements.filter(item => {
        return (item.status === 'Prepared' && item.checkedBy === userId) || 
               (item.status === 'Checked' && item.checkedBy === userId && item.checkedDate) ||
               (item.status === 'Rejected' && item.rejectedDateByChecker && item.checkedBy === userId);
    });
    
    state.currentPage = 1;
    tableService.updateTable();
    paginationService.updatePagination();
}

function downloadExcel() {
    exportService.downloadExcel();
}

function downloadPDF() {
    exportService.downloadPDF();
}

function detailReim(reimId) {
    window.location.href = `../../../approval/check/reimbursement/checkedReim.html?reim-id=${reimId}`;
}

// Navigation functions - keeping existing ones
function goToMenu() { window.location.href = "../../../../pages/dashboard.html"; }
function goToAddReim() { window.location.href = "../../../../addPages/addReim.html"; }
function goToMenuReim() { window.location.href = "../../../../pages/menuReim.html"; }
function logout() { 
    localStorage.removeItem("loggedInUser"); 
    window.location.href = "../../../../pages/login.html"; 
}
function toggleSidebar() { return; }
function toggleSubMenu(menuId) { 
    const element = document.getElementById(menuId);
    if (element) element.classList.toggle("hidden");
}
function goToProfile() { return; }

// ========================= INITIALIZATION =========================
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
    // Set user avatar and name if available
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const dashboardUserIcon = document.getElementById('dashboardUserIcon');
    
    if (userNameDisplay && userInfo.name) {
        userNameDisplay.textContent = userInfo.name;
    }
    if (dashboardUserIcon) {
        dashboardUserIcon.src = userInfo.avatar || "../../../../image/profil.png";
    }
});

window.onload = loadDashboard;