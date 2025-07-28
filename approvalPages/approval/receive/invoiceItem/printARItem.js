// AR Invoice Print Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get invoice data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const docEntry = urlParams.get('docEntry');
    
    if (docEntry) {
        loadInvoiceDataFromReceivePage(docEntry);
    } else {
        // Load sample data for demonstration if no docEntry provided
        loadSampleData();
    }
});

// Function to load invoice data from receive page
async function loadInvoiceDataFromReceivePage(docEntry) {
    try {
        // Get data from localStorage or sessionStorage that was set by receiveInvItem.html
        const invoiceData = getInvoiceDataFromStorage(docEntry);
        
        if (invoiceData) {
            populateInvoiceData(invoiceData);
        } else {
            console.error('No invoice data found for docEntry:', docEntry);
            loadSampleData();
        }
    } catch (error) {
        console.error('Error loading invoice data:', error);
        loadSampleData();
    }
}

// Function to get invoice data from storage
function getInvoiceDataFromStorage(docEntry) {
    // Try to get data from localStorage first
    const storedData = localStorage.getItem(`invoice_${docEntry}`);
    if (storedData) {
        return JSON.parse(storedData);
    }
    
    // Try to get data from sessionStorage
    const sessionData = sessionStorage.getItem(`invoice_${docEntry}`);
    if (sessionData) {
        return JSON.parse(sessionData);
    }
    
    // If no stored data, try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceData = {
        DocEntry: docEntry,
        DocNum: urlParams.get('DocNum') || 'INV-2024-001',
        CardCode: urlParams.get('CardCode') || 'C001',
        CardName: urlParams.get('CardName') || 'PT Sample Customer',
        NumAtCard: urlParams.get('NumAtCard') || 'EXT-REF-001',
        DocCur: urlParams.get('DocCur') || 'IDR',
        DocDate: urlParams.get('DocDate') || '2024-01-15',
        GroupNum: urlParams.get('GroupNum') || 1,
        TrnspCode: urlParams.get('TrnspCode') || 1,
        U_BSI_ShippingType: urlParams.get('U_BSI_ShippingType') || 'Standard',
        U_BSI_PaymentGroup: urlParams.get('U_BSI_PaymentGroup') || 'Group A',
        U_BSI_UDF1: urlParams.get('U_BSI_UDF1') || 'Custom Field 1',
        U_BSI_UDF2: urlParams.get('U_BSI_UDF2') || 'Custom Field 2',
        PriceBefDi: parseFloat(urlParams.get('PriceBefDi')) || 1000000,
        VatSum: parseFloat(urlParams.get('VatSum')) || 100000,
        DocTotal: parseFloat(urlParams.get('DocTotal')) || 1100000,
        Comments: urlParams.get('Comments') || 'Sample invoice item for receiving',
        Items: []
    };
    
    return invoiceData;
}

// Function to save invoice data to storage (to be called from receiveInvItem.html)
function saveInvoiceDataToStorage(docEntry, invoiceData) {
    try {
        localStorage.setItem(`invoice_${docEntry}`, JSON.stringify(invoiceData));
        sessionStorage.setItem(`invoice_${docEntry}`, JSON.stringify(invoiceData));
        console.log('Invoice data saved to storage for docEntry:', docEntry);
        return true;
    } catch (error) {
        console.error('Error saving invoice data to storage:', error);
        return false;
    }
}

// Function to clear invoice data from storage
function clearInvoiceDataFromStorage(docEntry) {
    try {
        localStorage.removeItem(`invoice_${docEntry}`);
        sessionStorage.removeItem(`invoice_${docEntry}`);
        console.log('Invoice data cleared from storage for docEntry:', docEntry);
        return true;
    } catch (error) {
        console.error('Error clearing invoice data from storage:', error);
        return false;
    }
}

// Function to load invoice data from API (kept for backward compatibility)
async function loadInvoiceData(invoiceId) {
    try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/invoice/${invoiceId}`);
        const data = await response.json();
        
        if (data.success) {
            populateInvoiceData(data.invoice);
        } else {
            console.error('Failed to load invoice data:', data.message);
            loadSampleData();
        }
    } catch (error) {
        console.error('Error loading invoice data:', error);
        loadSampleData();
    }
}

// Function to populate invoice data
function populateInvoiceData(invoice) {
    // Invoice details - map from receive page structure to print page structure
    document.getElementById('invoiceNumber').textContent = invoice.DocNum || '';
    document.getElementById('visionInvoiceNumber').textContent = invoice.DocNum || '';
    document.getElementById('invoiceDate').textContent = formatDate(invoice.DocDate);
    document.getElementById('npwp').textContent = '0010000990092000'; // Default NPWP
    document.getElementById('dueDate').textContent = formatDate(invoice.DocDate); // Use DocDate as due date
    
    // Recipient information
    document.getElementById('recipientName').textContent = invoice.CardName || '';
    document.getElementById('recipientAddress').textContent = 'JL. LAKSAMANA YOS SUDARSO, SUNTER II'; // Default address
    document.getElementById('recipientCity').textContent = 'JAKARTA UTARA 14330'; // Default city
    
    // Shipper information
    document.getElementById('shipperName').textContent = 'PT. KANSAI PAINT INDONESIA'; // Default shipper
    
    // Order numbers
    document.getElementById('doNumbers').textContent = invoice.NumAtCard || '';
    document.getElementById('poNumbers').textContent = invoice.NumAtCard || '';
    
    // Items table - convert from receive page structure to print page structure
    const printItems = convertItemsForPrint(invoice.Items || []);
    populateItemsTable(printItems);
    
    // Financial summary
    document.getElementById('totalAmount').textContent = formatCurrency(invoice.PriceBefDi || 0);
    document.getElementById('discountAmount').textContent = formatCurrency(0); // No discount in this structure
    document.getElementById('salesAmount').textContent = formatCurrency(invoice.PriceBefDi || 0);
    document.getElementById('taxBase').textContent = formatCurrency((invoice.PriceBefDi || 0) - (invoice.VatSum || 0));
    document.getElementById('vatAmount').textContent = formatCurrency(invoice.VatSum || 0);
    document.getElementById('grandTotal').textContent = formatCurrency(invoice.DocTotal || 0);
    
    // Signature information
    document.getElementById('signatureName').textContent = 'Atsuro Suzuki'; // Default signature
    document.getElementById('signatureTitle').textContent = 'Vice President Director'; // Default title
}

// Function to convert items from receive page structure to print page structure
function convertItemsForPrint(items) {
    return items.map((item, index) => ({
        codeNo: item.ItemCode || '',
        description: item.ItemName || '',
        quantity: item.Quantity || 0,
        unit: item.UoM || 'PCS',
        unitPrice: item.Price || 0,
        amount: item.LineTotal || 0
    }));
}

// Function to populate items table with pagination
function populateItemsTable(items) {
    const ITEMS_PER_PAGE = 10;
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // Clear existing pages except the first one
    const pagesContainer = document.getElementById('pagesContainer');
    const firstPage = document.getElementById('page1');
    
    // Remove additional pages if they exist
    const existingPages = pagesContainer.querySelectorAll('.page-container:not(#page1)');
    existingPages.forEach(page => page.remove());
    
    // Hide footer on first page if there are multiple pages
    const footer = document.getElementById('footer');
    if (totalPages > 1) {
        footer.style.display = 'none';
    } else {
        footer.style.display = 'flex';
    }
    
    // Populate first page
    populatePageItems(items.slice(0, ITEMS_PER_PAGE), 1, 0);
    
    // Create additional pages if needed
    for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
        const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
        const pageItems = items.slice(startIndex, endIndex);
        
        createAdditionalPage(pageItems, pageNum, startIndex, pageNum === totalPages);
    }
    
    // Update page info
    document.getElementById('pageInfo').textContent = `Page 1 of ${totalPages}`;
}

// Function to populate items for a specific page
function populatePageItems(items, pageNum, startIndex) {
    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';
    
    items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="number-col">${startIndex + index + 1}</td>
            <td class="code-col">${item.codeNo || ''}</td>
            <td class="description-col">${item.description || ''}</td>
            <td class="quantity-col">${formatNumber(item.quantity)}</td>
            <td class="unit-col">${item.unit || ''}</td>
            <td class="price-col">${formatCurrency(item.unitPrice)}</td>
            <td class="amount-col">${formatCurrency(item.amount)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Function to create additional pages
function createAdditionalPage(items, pageNum, startIndex, isLastPage) {
    const pagesContainer = document.getElementById('pagesContainer');
    
    const newPage = document.createElement('div');
    newPage.className = 'page-container page-break';
    newPage.id = `page${pageNum}`;
    
    // Clone the header structure
    const firstPage = document.getElementById('page1');
    const headerClone = firstPage.querySelector('.header').cloneNode(true);
    const invoiceDetailsClone = firstPage.querySelector('.invoice-details').cloneNode(true);
    const shippingInfoClone = firstPage.querySelector('.shipping-info').cloneNode(true);
    const orderNumbersClone = firstPage.querySelector('.order-numbers').cloneNode(true);
    
    // Create table structure
    const tableHTML = `
        <table class="items-table">
            <thead>
                <tr>
                    <th class="number-col">No.</th>
                    <th class="code-col">Code No.</th>
                    <th class="description-col">Description of Goods</th>
                    <th class="quantity-col">Quantity (Kg/Ltr)</th>
                    <th class="unit-col">Unit</th>
                    <th class="price-col">Unit Price</th>
                    <th class="amount-col">Amount</th>
                </tr>
            </thead>
            <tbody id="itemsTableBody${pageNum}">
            </tbody>
        </table>
    `;
    
    // Create payment summary if it's the last page
    let paymentSummaryHTML = '';
    if (isLastPage) {
        paymentSummaryHTML = `
            <div class="payment-summary">
                <div class="payment-instructions">
                    <div class="payment-title">Please remit us in full amount to :</div>
                    <div>MUFG Bank, Ltd., Jakarta Branch</div>
                    <div>Trinity Tower, Lt. 6-9</div>
                    <div>Jl. H. R. Rasuna Said Kav. C22 Blok IIB</div>
                    <div>Jakarta 12940</div>
                    <div>Acc No. 5100138687 (IDR)</div>
                </div>
                <div class="financial-summary">
                    <div class="summary-row">
                        <span class="summary-label">Total IDR</span>
                        <span class="summary-value" id="totalAmount${pageNum}">120,885,965</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Discounted IDR</span>
                        <span class="summary-value" id="discountAmount${pageNum}">0</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Sales Amount IDR</span>
                        <span class="summary-value" id="salesAmount${pageNum}">120,885,965</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Tax Base Other Value IDR</span>
                        <span class="summary-value" id="taxBase${pageNum}">110,812,135</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">VAT 12% IDR</span>
                        <span class="summary-value" id="vatAmount${pageNum}">13,297,456</span>
                    </div>
                    <div class="summary-row total-line">
                        <span class="summary-label">GRAND TOTAL IDR</span>
                        <span class="summary-value" id="grandTotal${pageNum}">134,183,421</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Create footer only if it's the last page
    let footerHTML = '';
    if (isLastPage) {
        footerHTML = `
            <div class="footer">
                <div class="signature-section">
                    <div class="qr-code">QR CODE</div>
                    <div class="signature-name">Atsuro Suzuki</div>
                    <div class="signature-title">Vice President Director</div>
                </div>
                <div class="system-info">
                    <div>Generated by Expressiv</div>
                    <div>Page ${pageNum} of ${getTotalPages()}</div>
                </div>
            </div>
        `;
    }
    
    newPage.innerHTML = `
        <div class="page-content">
            ${headerClone.outerHTML}
            ${invoiceDetailsClone.outerHTML}
            ${shippingInfoClone.outerHTML}
            ${orderNumbersClone.outerHTML}
            ${tableHTML}
            ${paymentSummaryHTML}
        </div>
        ${footerHTML}
    `;
    
    pagesContainer.appendChild(newPage);
    
    // Populate items for this page
    const tbody = newPage.querySelector(`#itemsTableBody${pageNum}`);
    items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="number-col">${startIndex + index + 1}</td>
            <td class="code-col">${item.codeNo || ''}</td>
            <td class="description-col">${item.description || ''}</td>
            <td class="quantity-col">${formatNumber(item.quantity)}</td>
            <td class="unit-col">${item.unit || ''}</td>
            <td class="price-col">${formatCurrency(item.unitPrice)}</td>
            <td class="amount-col">${formatCurrency(item.amount)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Function to get total pages
function getTotalPages() {
    const pagesContainer = document.getElementById('pagesContainer');
    return pagesContainer.querySelectorAll('.page-container').length;
}

// Function to get signature coordinates for e-sign implementation
function getSignatureCoordinates(pageNumber = null) {
    // If no page number specified, get the last page
    if (pageNumber === null) {
        const totalPages = getTotalPages();
        pageNumber = totalPages;
    }
    
    const page = document.getElementById(`page${pageNumber}`);
    if (!page) return null;
    
    const signatureSection = page.querySelector('.signature-section');
    if (!signatureSection) return null;
    
    const rect = signatureSection.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    
    return {
        x: rect.left - pageRect.left,
        y: rect.top - pageRect.top,
        width: rect.width,
        height: rect.height,
        pageNumber: pageNumber,
        element: signatureSection
    };
}

// Function to get signature coordinates from the last page only
function getLastPageSignatureCoordinates() {
    const totalPages = getTotalPages();
    if (totalPages === 0) return null;
    
    return getSignatureCoordinates(totalPages);
}

// Function to get all signature coordinates for multi-page documents
function getAllSignatureCoordinates() {
    const totalPages = getTotalPages();
    const coordinates = [];
    
    // Only get coordinates from pages that have signature sections
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = document.getElementById(`page${pageNum}`);
        if (page && page.querySelector('.signature-section')) {
            const coords = getSignatureCoordinates(pageNum);
            if (coords) {
                coordinates.push(coords);
            }
        }
    }
    
    return coordinates;
}

// Function to highlight signature areas (for testing)
function highlightSignatureAreas() {
    const coordinates = getAllSignatureCoordinates();
    coordinates.forEach(coord => {
        if (coord.element) {
            coord.element.style.border = '2px solid red';
            coord.element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        }
    });
    console.log('Signature coordinates:', coordinates);
}

// Function to highlight signature area on the last page only (for testing)
function highlightLastPageSignature() {
    const coords = getLastPageSignatureCoordinates();
    if (coords && coords.element) {
        coords.element.style.border = '2px solid green';
        coords.element.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        console.log('Last page signature coordinates:', coords);
        
        // Display coordinates in alert for easy reading
        const coordInfo = `Signature Section Coordinates:\n\n` +
            `X: ${Math.round(coords.x)}px\n` +
            `Y: ${Math.round(coords.y)}px\n` +
            `Width: ${Math.round(coords.width)}px\n` +
            `Height: ${Math.round(coords.height)}px\n` +
            `Page: ${coords.pageNumber}`;
        
        alert(coordInfo);
    } else {
        console.log('No signature found on last page');
        alert('No signature section found on the last page');
    }
}

// Function to get precise signature coordinates for e-sign
function getSignatureCoordinatesForESign() {
    const coords = getLastPageSignatureCoordinates();
    if (coords) {
        const preciseCoords = {
            x: Math.round(coords.x),
            y: Math.round(coords.y),
            width: Math.round(coords.width),
            height: Math.round(coords.height),
            pageNumber: coords.pageNumber
        };
        
        // Display coordinates in alert
        const coordInfo = `📍 Signature Section Coordinates:\n\n` +
            `X: ${preciseCoords.x}px\n` +
            `Y: ${preciseCoords.y}px\n` +
            `Width: ${preciseCoords.width}px\n` +
            `Height: ${preciseCoords.height}px\n` +
            `Page: ${preciseCoords.pageNumber}\n\n` +
            `💡 For E-Sign Implementation:\n` +
            `Use these coordinates to position the signature field.`;
        
        console.log('Signature coordinates for e-sign:', preciseCoords);
        alert(coordInfo);
        
        return preciseCoords;
    } else {
        alert('❌ No signature section found on the last page');
        console.log('No signature coordinates available');
        return null;
    }
}

// Function to load sample data for demonstration
function loadSampleData() {
    const sampleInvoice = {
        DocEntry: '12345',
        DocNum: 'FNC/INV/KPI/25070071',
        CardCode: 'C001',
        CardName: 'PT TOYOTA MOTOR MANUFACTURING INDONESIA',
        NumAtCard: 'MKT/SJ/KPI/25070012, MKT/SJ/KPI/25070098, MKT/SJ/KPI/25070305',
        DocCur: 'IDR',
        DocDate: '2025-07-11',
        GroupNum: 1,
        TrnspCode: 1,
        U_BSI_ShippingType: 'Standard',
        U_BSI_PaymentGroup: 'Group A',
        U_BSI_UDF1: 'Custom Field 1',
        U_BSI_UDF2: 'Custom Field 2',
        PriceBefDi: 150885965,
        VatSum: 16611299,
        DocTotal: 155038789,
        Comments: 'Sample invoice item for receiving',
        Items: [
            {
                LineNum: 0,
                ItemCode: '81-526-300',
                ItemName: 'WP505D No.8007 (IN)',
                FreeTxt: 'Sample notes for item 1',
                Quantity: 544.00,
                InvQty: 544.00,
                UoM: 'KG',
                SalesPrice: 137939,
                Price: 137939,
                DiscPrcnt: 0,
                TaxCode: 'VAT',
                LineTotal: 75038816,
                AccountCode: '4000',
                BaseType: 0,
                BaseEntry: 0,
                BaseLine: 0,
                LineType: 0
            },
            {
                LineNum: 1,
                ItemCode: '82-198-005',
                ItemName: 'TRP-1 GREY (TMMIN LINE 2)',
                FreeTxt: 'Sample notes for item 2',
                Quantity: 28.00,
                InvQty: 28.00,
                UoM: 'KG',
                SalesPrice: 1366038,
                Price: 1366038,
                DiscPrcnt: 0,
                TaxCode: 'VAT',
                LineTotal: 38249064,
                AccountCode: '4000',
                BaseType: 0,
                BaseEntry: 0,
                BaseLine: 0,
                LineType: 0
            },
            {
                LineNum: 2,
                ItemCode: 'K12-297-012',
                ItemName: 'MAGICRON TB-516 THINNER (202.1)',
                FreeTxt: 'Sample notes for item 3',
                Quantity: 20.00,
                InvQty: 20.00,
                UoM: 'LTR',
                SalesPrice: 38907,
                Price: 38907,
                DiscPrcnt: 0,
                TaxCode: 'VAT',
                LineTotal: 778140,
                AccountCode: '4000',
                BaseType: 0,
                BaseEntry: 0,
                BaseLine: 0,
                LineType: 0
            },
            {
                LineNum: 3,
                ItemCode: 'K14-650-007',
                ItemName: 'ADDITIVE X',
                FreeTxt: 'Sample notes for item 4',
                Quantity: 140.00,
                InvQty: 140.00,
                UoM: 'LTR',
                SalesPrice: 44071,
                Price: 44071,
                DiscPrcnt: 0,
                TaxCode: 'VAT',
                LineTotal: 6169940,
                AccountCode: '4000',
                BaseType: 0,
                BaseEntry: 0,
                BaseLine: 0,
                LineType: 0
            },
            {
                LineNum: 4,
                ItemCode: 'K6-163-902',
                ItemName: 'T/U REPAIR SUPER WHITE # 040',
                FreeTxt: 'Sample notes for item 5',
                Quantity: 5.00,
                InvQty: 5.00,
                UoM: 'LTR',
                SalesPrice: 130001,
                Price: 130001,
                DiscPrcnt: 0,
                TaxCode: 'VAT',
                LineTotal: 650005,
                AccountCode: '4000',
                BaseType: 0,
                BaseEntry: 0,
                BaseLine: 0,
                LineType: 0
            },
            {
                LineNum: 5,
                ItemCode: 'K8-234-567',
                ItemName: 'PRIMER COAT WHITE # 001',
                FreeTxt: 'Sample notes for item 6',
                Quantity: 15.00,
                InvQty: 15.00,
                UoM: 'LTR',
                SalesPrice: 89000,
                Price: 89000,
                DiscPrcnt: 0,
                TaxCode: 'VAT',
                LineTotal: 1335000,
                AccountCode: '4000',
                BaseType: 0,
                BaseEntry: 0,
                BaseLine: 0,
                LineType: 0
            },
            {
                LineNum: 6,
                ItemCode: 'K9-345-678',
                ItemName: 'CLEAR COAT GLOSS # 002',
                FreeTxt: 'Sample notes for item 7',
                Quantity: 25.00,
                InvQty: 25.00,
                UoM: 'LTR',
                SalesPrice: 125000,
                Price: 125000,
                DiscPrcnt: 0,
                TaxCode: 'VAT',
                LineTotal: 3125000,
                AccountCode: '4000',
                BaseType: 0,
                BaseEntry: 0,
                BaseLine: 0,
                LineType: 0
            },
            {
                LineNum: 7,
                ItemCode: 'K10-456-789',
                ItemName: 'BASE COAT RED # 003',
                FreeTxt: 'Sample notes for item 8',
                Quantity: 30.00,
                InvQty: 30.00,
                UoM: 'LTR',
                SalesPrice: 95000,
                Price: 95000,
                DiscPrcnt: 0,
                TaxCode: 'VAT',
                LineTotal: 2850000,
                AccountCode: '4000',
                BaseType: 0,
                BaseEntry: 0,
                BaseLine: 0,
                LineType: 0
            },
            {
                LineNum: 8,
                ItemCode: 'K11-567-890',
                ItemName: 'METALLIC SILVER # 004',
                FreeTxt: 'Sample notes for item 9',
                Quantity: 12.00,
                InvQty: 12.00,
                UoM: 'LTR',
                SalesPrice: 150000,
                Price: 150000,
                DiscPrcnt: 0,
                TaxCode: 'VAT',
                LineTotal: 1800000,
                AccountCode: '4000',
                BaseType: 0,
                BaseEntry: 0,
                BaseLine: 0,
                LineType: 0
            },
            {
                LineNum: 9,
                ItemCode: 'K12-678-901',
                ItemName: 'PEARL WHITE # 005',
                FreeTxt: 'Sample notes for item 10',
                Quantity: 8.00,
                InvQty: 8.00,
                UoM: 'LTR',
                SalesPrice: 180000,
                Price: 180000,
                DiscPrcnt: 0,
                TaxCode: 'VAT',
                LineTotal: 1440000,
                AccountCode: '4000',
                BaseType: 0,
                BaseEntry: 0,
                BaseLine: 0,
                LineType: 0
            }
        ]
    };
    
    populateInvoiceData(sampleInvoice);
}

// Utility function to format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
}

// Utility function to format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0';
    
    return new Intl.NumberFormat('en-US').format(amount);
}

// Utility function to format numbers
function formatNumber(number) {
    if (number === null || number === undefined) return '0.00';
    
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

// Function to handle print functionality
function printInvoice() {
    window.print();
}

// Function to go back to previous page
function goBack() {
    window.history.back();
}

// Add event listeners for print controls
document.addEventListener('DOMContentLoaded', function() {
    // Auto-print option (uncomment if needed)
    // setTimeout(() => {
    //     window.print();
    // }, 1000);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            window.print();
        }
    });
});

// Function to generate QR code (placeholder)
function generateQRCode(data) {
    // This is a placeholder for QR code generation
    // You can integrate with a QR code library like qrcode.js
    console.log('QR Code data:', data);
}

// Function to export as PDF (placeholder)
function exportAsPDF() {
    // This is a placeholder for PDF export functionality
    // You can integrate with libraries like jsPDF or html2pdf
    console.log('Exporting as PDF...');
}

// Function to save invoice data
function saveInvoiceData() {
    const invoiceData = {
        invoiceNumber: document.getElementById('invoiceNumber').textContent,
        visionInvoiceNumber: document.getElementById('visionInvoiceNumber').textContent,
        invoiceDate: document.getElementById('invoiceDate').textContent,
        // Add more fields as needed
    };
    
    // Save to localStorage or send to server
    localStorage.setItem('lastInvoiceData', JSON.stringify(invoiceData));
    console.log('Invoice data saved');
}

// Function to load saved invoice data
function loadSavedInvoiceData() {
    const savedData = localStorage.getItem('lastInvoiceData');
    if (savedData) {
        const data = JSON.parse(savedData);
        console.log('Loaded saved invoice data:', data);
        // Implement loading logic
    }
} 