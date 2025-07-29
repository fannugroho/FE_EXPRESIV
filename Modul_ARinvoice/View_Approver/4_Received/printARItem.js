// AR Invoice Print JavaScript
// This file handles the print functionality and data population for AR Invoice

// Global variables to store current invoice data
let currentInvoiceData = {};

// Function to get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Function to get data from localStorage
function getLocalStorageData(key) {
    return localStorage.getItem(key);
}

// Function to set data to localStorage
function setLocalStorageData(key, value) {
    localStorage.setItem(key, value);
}

// Function to populate data from receiveARVendor.html
function populatePrintData() {
    // Get data from URL parameters or localStorage
    const invoiceNo = getUrlParameter('invoiceNo') || getLocalStorageData('currentInvoiceNo');
    const employeeId = getUrlParameter('employeeId') || getLocalStorageData('currentEmployeeId');
    const employeeName = getUrlParameter('employeeName') || getLocalStorageData('currentEmployeeName');
    const purpose = getUrlParameter('purpose') || getLocalStorageData('currentPurpose');
    const paidTo = getUrlParameter('paidTo') || getLocalStorageData('currentPaidTo');
    const requesterName = getUrlParameter('requesterName') || getLocalStorageData('currentRequesterName');
    const department = getUrlParameter('department') || getLocalStorageData('currentDepartment');
    const dueDate = getUrlParameter('dueDate') || getLocalStorageData('currentDueDate');
    const documentDate = getUrlParameter('documentDate') || getLocalStorageData('currentDocumentDate');
    const status = getUrlParameter('status') || getLocalStorageData('currentStatus');
    const transactionType = getUrlParameter('transactionType') || getLocalStorageData('currentTransactionType');

    // Store current data for reference
    currentInvoiceData = {
        invoiceNo,
        employeeId,
        employeeName,
        purpose,
        paidTo,
        requesterName,
        department,
        dueDate,
        documentDate,
        status,
        transactionType
    };

    // Populate invoice details
    populateInvoiceDetails();
    
    // Populate recipient information
    populateRecipientInfo();
    
    // Populate order numbers
    populateOrderNumbers();
    
    // Populate financial summary
    populateFinancialSummary();
    
    // Populate signature information
    populateSignatureInfo();
    
    // Populate items table
    populateItemsTable();
}

// Function to populate invoice details
function populateInvoiceDetails() {
    const invoiceNo = currentInvoiceData.invoiceNo || 'AR-INV-001';
    const documentDate = currentInvoiceData.documentDate || new Date().toLocaleDateString();
    const dueDate = currentInvoiceData.dueDate || new Date().toLocaleDateString();

    document.getElementById('invoiceNumber').textContent = invoiceNo;
    document.getElementById('visionInvoiceNumber').textContent = 'VISION-' + (invoiceNo || '001');
    document.getElementById('invoiceDate').textContent = documentDate;
    document.getElementById('dueDate').textContent = dueDate;
    document.getElementById('npwp').textContent = '01.123.456.7-123.000';
}

// Function to populate recipient information
function populateRecipientInfo() {
    const paidTo = currentInvoiceData.paidTo || 'Business Partner Name';
    
    document.getElementById('recipientName').textContent = paidTo;
    document.getElementById('recipientAddress').textContent = 'Business Partner Address';
    document.getElementById('recipientCity').textContent = 'Business Partner City';
}

// Function to populate order numbers
function populateOrderNumbers() {
    const invoiceNo = currentInvoiceData.invoiceNo || '001';
    
    document.getElementById('doNumbers').textContent = 'DO-' + invoiceNo;
    document.getElementById('poNumbers').textContent = 'PO-' + invoiceNo;
}

// Function to populate financial summary
function populateFinancialSummary() {
    // Get financial data from URL parameters or localStorage
    const totalAmount = getUrlParameter('totalAmount') || getLocalStorageData('currentTotalAmount') || '1,000,000.00';
    const wTaxAmount = getUrlParameter('wTaxAmount') || getLocalStorageData('currentWTaxAmount') || '100,000.00';
    const openBalance = getUrlParameter('openBalance') || getLocalStorageData('currentOpenBalance') || '900,000.00';

    document.getElementById('totalAmount').textContent = 'Rp ' + totalAmount;
    document.getElementById('discountAmount').textContent = 'Rp 0.00';
    document.getElementById('salesAmount').textContent = 'Rp ' + totalAmount;
    document.getElementById('taxBase').textContent = 'Rp ' + totalAmount;
    document.getElementById('vatAmount').textContent = 'Rp ' + wTaxAmount;
    document.getElementById('grandTotal').textContent = 'Rp ' + openBalance;
}

// Function to populate signature information
function populateSignatureInfo() {
    const employeeName = currentInvoiceData.employeeName || 'Employee Name';
    
    document.getElementById('signatureName').textContent = employeeName;
    document.getElementById('signatureTitle').textContent = 'Authorized Signatory';
}

// Function to populate items table
function populateItemsTable() {
    const tableBody = document.getElementById('itemsTableBody');
    
    // Get items data from localStorage or use sample data
    const itemsData = getLocalStorageData('currentItemsData');
    let items = [];
    
    if (itemsData) {
        try {
            items = JSON.parse(itemsData);
        } catch (e) {
            console.error('Error parsing items data:', e);
            items = getSampleItems();
        }
    } else {
        items = getSampleItems();
    }

    tableBody.innerHTML = '';
    items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="number-col">${index + 1}</td>
            <td class="code-col">${item.code || 'ITEM-' + (index + 1).toString().padStart(3, '0')}</td>
            <td class="description-col">${item.description || 'Sample Product Description'}</td>
            <td class="quantity-col">${item.quantity || '100.00'}</td>
            <td class="unit-col">${item.unit || 'KG'}</td>
            <td class="price-col">Rp ${item.unitPrice || '10,000.00'}</td>
            <td class="amount-col">Rp ${item.amount || '1,000,000.00'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to get sample items data
function getSampleItems() {
    return [
        {
            number: 1,
            code: 'ITEM-001',
            description: 'Sample Product Description',
            quantity: '100.00',
            unit: 'KG',
            unitPrice: '10,000.00',
            amount: '1,000,000.00'
        }
    ];
}

// Function to print the document
function printDocument() {
    // Hide print controls before printing
    const printControls = document.querySelector('.print-controls');
    if (printControls) {
        printControls.style.display = 'none';
    }
    
    // Print the document
    window.print();
    
    // Show print controls after printing
    setTimeout(() => {
        if (printControls) {
            printControls.style.display = 'block';
        }
    }, 1000);
}

// Function to go back to the previous page
function goBack() {
    window.history.back();
}

// Function to export as PDF
function exportToPDF() {
    // This function can be implemented using html2pdf.js or similar library
    console.log('Export to PDF functionality can be implemented here');
}

// Function to save current data to localStorage
function saveCurrentData() {
    if (currentInvoiceData) {
        Object.keys(currentInvoiceData).forEach(key => {
            if (currentInvoiceData[key]) {
                setLocalStorageData('current' + key.charAt(0).toUpperCase() + key.slice(1), currentInvoiceData[key]);
            }
        });
    }
}

// Function to load data from receiveARVendor.html
function loadDataFromReceivePage() {
    // This function can be called when navigating from receiveARVendor.html
    // It will populate the print page with data from the receive page
    populatePrintData();
}

// Function to update page info
function updatePageInfo() {
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        const totalPages = document.querySelectorAll('.page-container').length;
        pageInfo.textContent = `Page 1 of ${totalPages}`;
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Populate data
    populatePrintData();
    
    // Update page info
    updatePageInfo();
    
    // Add print controls to the page
    addPrintControls();
    
    // Save current data
    saveCurrentData();
});

// Function to add print controls
function addPrintControls() {
    const printControls = document.createElement('div');
    printControls.className = 'print-controls no-print';
    printControls.innerHTML = `
        <button onclick="printDocument()" class="print-btn">Print</button>
        <button onclick="goBack()" class="print-btn" style="background-color: #6b7280; margin-left: 10px;">Back</button>
        <button onclick="exportToPDF()" class="print-btn" style="background-color: #059669; margin-left: 10px;">Export PDF</button>
    `;
    document.body.appendChild(printControls);
}

// Export functions for external use
window.printARItem = {
    populatePrintData,
    printDocument,
    goBack,
    exportToPDF,
    loadDataFromReceivePage,
    saveCurrentData
}; 