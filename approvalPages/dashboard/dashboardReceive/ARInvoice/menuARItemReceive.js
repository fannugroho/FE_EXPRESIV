// Current tab state
let currentTab = 'approved'; // Default tab
let currentSearchTerm = '';
let currentSearchType = 'invoice';
let allInvoices = [];
let filteredInvoices = [];
let currentPage = 1;
const itemsPerPage = 10;

// Override authentication check for development
if (typeof isAuthenticated === 'function') {
    const originalIsAuthenticated = isAuthenticated;
    window.isAuthenticated = function() {
        console.log('Development mode: Authentication check bypassed');
        return true;
    };
}

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadDashboard();
    
    // Add event listener for search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 500);
        });
    }
    
    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', function() {
            const searchInput = document.getElementById('searchInput');
            
            if (this.value === 'date') {
                searchInput.type = 'date';
                searchInput.placeholder = 'Select date...';
            } else {
                searchInput.type = 'text';
                searchInput.placeholder = `Search by ${this.options[this.selectedIndex].text}...`;
            }
            
            searchInput.value = '';
            currentSearchTerm = '';
            currentSearchType = this.value;
            loadDashboard();
        });
    }
});

// Function to load user data
function loadUserData() {
    console.log('Development mode: Bypassing authentication check');
    
    const dummyUserData = {
        name: 'Development User',
        avatar: '../../../../image/profil.png'
    };
    
    try {
        if (dummyUserData.name) {
            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) {
                userNameDisplay.textContent = dummyUserData.name;
            }
        }
        
        if (dummyUserData.avatar) {
            const dashboardUserIcon = document.getElementById('dashboardUserIcon');
            if (dashboardUserIcon) {
                dashboardUserIcon.src = dummyUserData.avatar;
            }
        }
        
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Function to get user ID from token
function getUserId() {
    return 'dev-user-001';
}

// Main function to load dashboard data
async function loadDashboard() {
    try {
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        // Build base URL and params
        let baseUrl;
        const params = new URLSearchParams();
        params.append('ReceiverId', userId);
        params.append('ReceiverRole', 'receive');
        
        // Build URL based on current tab
        if (currentTab === 'approved') {
            baseUrl = `${BASE_URL}/api/invoice/dashboard/receive`;
            params.append('isReceived', 'false');
            params.append('isApproved', 'true');
        } else if (currentTab === 'received') {
            baseUrl = `${BASE_URL}/api/invoice/dashboard/receive`;
            params.append('isReceived', 'true');
        } else if (currentTab === 'rejected') {
            baseUrl = `${BASE_URL}/api/invoice/dashboard/rejected`;
        }
        
        // Add search parameters if available
        if (currentSearchTerm) {
            switch (currentSearchType) {
                case 'invoice':
                    params.append('invoiceNo', currentSearchTerm);
                    break;
                case 'customer':
                    params.append('customerName', currentSearchTerm);
                    break;
                case 'status':
                    params.append('status', currentSearchTerm);
                    break;
                case 'date':
                    const dateValue = new Date(currentSearchTerm);
                    if (!isNaN(dateValue.getTime())) {
                        params.append('invoiceDateFrom', dateValue.toISOString().split('T')[0]);
                        params.append('invoiceDateTo', dateValue.toISOString().split('T')[0]);
                    }
                    break;
            }
        }
        
        const url = `${baseUrl}?${params.toString()}`;
        console.log('Fetching data from:', url);

        // For development, use mock data
        const mockData = getMockInvoiceData();
        allInvoices = mockData;
        filteredInvoices = mockData;
        
        // Update counters and table
        updateCounters();
        updateTable(filteredInvoices);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard data. Please try again.');
    }
}

// Mock data for development
function getMockInvoiceData() {
    const mockInvoices = [
        {
            id: 1,
            invoiceNo: 'INV-2024-001',
            customerName: 'PT Maju Bersama',
            salesEmployee: 'John Doe',
            invoiceDate: '2024-01-15',
            dueDate: '2024-02-15',
            status: currentTab === 'approved' ? 'Approved' : currentTab === 'received' ? 'Received' : 'Rejected',
            totalAmount: 15000000,
            invoiceType: 'Regular',
            remarks: currentTab === 'rejected' ? 'Document incomplete' : '',
            isReceived: currentTab === 'received',
            isApproved: currentTab === 'approved' || currentTab === 'received'
        },
        {
            id: 2,
            invoiceNo: 'INV-2024-002',
            customerName: 'PT Sukses Mandiri',
            salesEmployee: 'Jane Smith',
            invoiceDate: '2024-01-16',
            dueDate: '2024-02-16',
            status: currentTab === 'approved' ? 'Approved' : currentTab === 'received' ? 'Received' : 'Rejected',
            totalAmount: 25000000,
            invoiceType: 'Regular',
            remarks: currentTab === 'rejected' ? 'Amount exceeds limit' : '',
            isReceived: currentTab === 'received',
            isApproved: currentTab === 'approved' || currentTab === 'received'
        },
        {
            id: 3,
            invoiceNo: 'INV-2024-003',
            customerName: 'PT Berkah Abadi',
            salesEmployee: 'Mike Johnson',
            invoiceDate: '2024-01-17',
            dueDate: '2024-02-17',
            status: currentTab === 'approved' ? 'Approved' : currentTab === 'received' ? 'Received' : 'Rejected',
            totalAmount: 8500000,
            invoiceType: 'Special',
            remarks: currentTab === 'rejected' ? 'Customer credit limit exceeded' : '',
            isReceived: currentTab === 'received',
            isApproved: currentTab === 'approved' || currentTab === 'received'
        }
    ];
    
    return mockInvoices;
}

// Function to update counters
async function updateCounters() {
    try {
        const totalCount = allInvoices.length;
        const approvedCount = allInvoices.filter(inv => inv.isApproved && !inv.isReceived).length;
        const receivedCount = allInvoices.filter(inv => inv.isReceived).length;
        const rejectedCount = allInvoices.filter(inv => inv.status === 'Rejected').length;
        
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('approvedCount').textContent = approvedCount;
        document.getElementById('receivedCount').textContent = receivedCount;
        document.getElementById('rejectedCount').textContent = rejectedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
    }
}

// Function to update table with invoice data
function updateTable(invoices) {
    const tbody = document.getElementById('recentDocs');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!invoices || invoices.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="11" class="text-center py-4 text-gray-500">No documents found</td>`;
        tbody.appendChild(row);
        updatePaginationInfo(0);
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedInvoices = invoices.slice(startIndex, endIndex);
    
    paginatedInvoices.forEach((invoice, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 border-b';
        
        const rowNumber = startIndex + index + 1;
        
        row.innerHTML = `
            <td class="p-2">${rowNumber}</td>
            <td class="p-2 scrollable-cell">${invoice.invoiceNo}</td>
            <td class="p-2 scrollable-cell">${invoice.customerName}</td>
            <td class="p-2 scrollable-cell">${invoice.salesEmployee}</td>
            <td class="p-2">${formatDate(invoice.invoiceDate)}</td>
            <td class="p-2">${formatDate(invoice.dueDate)}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                    invoice.status === 'Approved' ? 'bg-yellow-100 text-yellow-800' :
                    invoice.status === 'Received' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                }">
                    ${invoice.status}
                </span>
            </td>
            <td class="p-2 text-right">${formatCurrency(invoice.totalAmount)}</td>
            <td class="p-2">${invoice.invoiceType}</td>
            <td class="p-2 scrollable-cell">${invoice.remarks || '-'}</td>
            <td class="p-2">
                <div class="flex space-x-1">
                    <button onclick="viewInvoiceDetails(${invoice.id})" class="text-blue-600 hover:text-blue-800" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${currentTab === 'approved' ? `
                        <button onclick="receiveInvoice(${invoice.id})" class="text-green-600 hover:text-green-800" title="Receive">
                            <i class="fas fa-truck-loading"></i>
                        </button>
                    ` : ''}
                    <button onclick="printInvoice(${invoice.id})" class="text-gray-600 hover:text-gray-800" title="Print">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    updatePaginationInfo(invoices.length);
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}

// Helper function to format currency
function formatCurrency(amount) {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Function to update pagination information
function updatePaginationInfo(totalItems) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    document.getElementById('startItem').textContent = totalItems > 0 ? startItem : 0;
    document.getElementById('endItem').textContent = endItem;
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('currentPage').textContent = currentPage;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.classList.toggle('disabled', currentPage <= 1);
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.classList.toggle('disabled', currentPage >= totalPages);
    }
}

// Function to switch tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1;
    
    document.querySelectorAll('[id$="TabBtn"]').forEach(btn => {
        btn.classList.remove('tab-active');
    });
    
    const tabBtn = document.getElementById(tabName + 'TabBtn');
    if (tabBtn) {
        tabBtn.classList.add('tab-active');
    }
    
    loadDashboard();
}

// Function to handle search
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    currentSearchTerm = searchInput.value.trim();
    currentPage = 1;
    loadDashboard();
}

// Function to change page
function changePage(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable(filteredInvoices);
    }
}

// Function to go to total documents
function goToTotalDocs() {
    console.log('Navigate to total documents');
}

// Function to view invoice details
function viewInvoiceDetails(id) {
    console.log('View invoice details for ID:', id);
}

// Function to receive invoice
function receiveInvoice(id) {
    console.log('Receive invoice for ID:', id);
    if (confirm('Are you sure you want to receive this invoice?')) {
        alert('Invoice received successfully!');
        loadDashboard();
    }
}

// Function to print invoice
function printInvoice(id) {
    console.log('Print invoice for ID:', id);
    window.open(`/api/invoice/${id}/print`, '_blank');
}

// Function to toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

// Function to go to profile
function goToProfile() {
    console.log('Navigate to profile');
}

// Export functions for Excel and PDF
function downloadExcel() {
    try {
        const worksheet = XLSX.utils.json_to_sheet(filteredInvoices.map(invoice => ({
            'Invoice No': invoice.invoiceNo,
            'Customer': invoice.customerName,
            'Sales Employee': invoice.salesEmployee,
            'Date': formatDate(invoice.invoiceDate),
            'Due Date': formatDate(invoice.dueDate),
            'Status': invoice.status,
            'Total (IDR)': invoice.totalAmount,
            'Type': invoice.invoiceType,
            'Remarks': invoice.remarks || ''
        })));
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AR Invoice Receive');
        
        XLSX.writeFile(workbook, `AR_Invoice_Receive_${currentTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
        console.error('Error downloading Excel:', error);
        alert('Error downloading Excel file. Please try again.');
    }
}

function downloadPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text('AR Invoice Receive Report', 14, 20);
        doc.setFontSize(12);
        doc.text(`Status: ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString('id-ID')}`, 14, 40);
        
        const tableData = filteredInvoices.map(invoice => [
            invoice.invoiceNo,
            invoice.customerName,
            invoice.salesEmployee,
            formatDate(invoice.invoiceDate),
            formatDate(invoice.dueDate),
            invoice.status,
            formatCurrency(invoice.totalAmount),
            invoice.invoiceType,
            invoice.remarks || ''
        ]);
        
        doc.autoTable({
            head: [['Invoice No', 'Customer', 'Sales Employee', 'Date', 'Due Date', 'Status', 'Total (IDR)', 'Type', 'Remarks']],
            body: tableData,
            startY: 50,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: 255
            }
        });
        
        doc.save(`AR_Invoice_Receive_${currentTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Error downloading PDF file. Please try again.');
    }
} 