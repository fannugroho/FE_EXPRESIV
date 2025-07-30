// AR Invoice Print Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get invoice data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stagingID = urlParams.get('stagingID');
    const docEntry = urlParams.get('docEntry');
    
    if (stagingID) {
        loadInvoiceDataFromReceivePage(stagingID);
    } else if (docEntry) {
        loadInvoiceDataFromReceivePage(docEntry);
    } else {
        // Load sample data for demonstration if no stagingID or docEntry provided
        loadSampleData();
    }
});

// Function to load invoice data from receive page
async function loadInvoiceDataFromReceivePage(identifier) {
    try {
        // Get data from localStorage or sessionStorage that was set by receiveInvItem.html
        const invoiceData = getInvoiceDataFromStorage(identifier);
        
        if (invoiceData) {
            populateInvoiceData(invoiceData);
        } else {
            console.error('No invoice data found for identifier:', identifier);
            loadSampleData();
        }
    } catch (error) {
        console.error('Error loading invoice data:', error);
        loadSampleData();
    }
}

// Function to get invoice data from storage
function getInvoiceDataFromStorage(identifier) {
    // Try to get data from localStorage first
    const storedData = localStorage.getItem(`invoice_${identifier}`);
    if (storedData) {
        return JSON.parse(storedData);
    }
    
    // Try to get data from sessionStorage
    const sessionData = sessionStorage.getItem(`invoice_${identifier}`);
    if (sessionData) {
        return JSON.parse(sessionData);
    }
    
    // If no stored data, try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceData = {
        stagingID: identifier,
        docNum: urlParams.get('docNum') || 'INV-2024-001',
        cardCode: urlParams.get('cardCode') || 'C001',
        cardName: urlParams.get('cardName') || 'PT Sample Customer',
        numAtCard: urlParams.get('numAtCard') || 'EXT-REF-001',
        docCur: urlParams.get('docCur') || 'IDR',
        docDate: urlParams.get('docDate') || '2024-01-15',
        groupNum: urlParams.get('groupNum') || 1,
        trnspCode: urlParams.get('trnspCode') || 1,
        u_BSI_ShippingType: urlParams.get('u_BSI_ShippingType') || 'Standard',
        u_BSI_PaymentGroup: urlParams.get('u_BSI_PaymentGroup') || 'Group A',
        u_bsi_udf1: urlParams.get('u_bsi_udf1') || 'Custom Field 1',
        u_bsi_udf2: urlParams.get('u_bsi_udf2') || 'Custom Field 2',
        docTotal: parseFloat(urlParams.get('docTotal')) || 1000000,
        vatSum: parseFloat(urlParams.get('vatSum')) || 100000,
        priceBefDi: parseFloat(urlParams.get('priceBefDi')) || 900000,
        comments: urlParams.get('comments') || 'Sample invoice item for receiving',
        arInvoiceDetails: []
    };
    
    return invoiceData;
}

// Function to save invoice data to storage (to be called from receiveInvItem.html)
function saveInvoiceDataToStorage(identifier, invoiceData) {
    try {
        localStorage.setItem(`invoice_${identifier}`, JSON.stringify(invoiceData));
        sessionStorage.setItem(`invoice_${identifier}`, JSON.stringify(invoiceData));
        console.log('Invoice data saved to storage for identifier:', identifier);
        return true;
    } catch (error) {
        console.error('Error saving invoice data to storage:', error);
        return false;
    }
}

// Function to clear invoice data from storage
function clearInvoiceDataFromStorage(identifier) {
    try {
        localStorage.removeItem(`invoice_${identifier}`);
        sessionStorage.removeItem(`invoice_${identifier}`);
        console.log('Invoice data cleared from storage for identifier:', identifier);
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
    console.log('Populating invoice data:', invoice);
    
    // Invoice details - map from receive page structure to print page structure
    document.getElementById('invoiceNumber').textContent = invoice.docNum || '';
    document.getElementById('visionInvoiceNumber').textContent = invoice.docNum || '';
    document.getElementById('invoiceDate').textContent = formatDate(invoice.docDate);
    document.getElementById('npwp').textContent = '0010000990092000'; // Default NPWP
    document.getElementById('dueDate').textContent = formatDate(invoice.docDate); // Use DocDate as due date
    
    // Recipient information
    document.getElementById('recipientName').textContent = invoice.cardName || '';
    document.getElementById('recipientAddress').textContent = 'JL. LAKSAMANA YOS SUDARSO, SUNTER II'; // Default address
    document.getElementById('recipientCity').textContent = 'JAKARTA UTARA 14330'; // Default city
    
    // Shipper information
    document.getElementById('shipperName').textContent = 'PT. KANSAI PAINT INDONESIA'; // Default shipper
    
    // Order numbers
    document.getElementById('doNumbers').textContent = invoice.numAtCard || '';
    document.getElementById('poNumbers').textContent = invoice.numAtCard || '';
    
    // Items table - convert from receive page structure to print page structure
    const printItems = convertItemsForPrint(invoice.arInvoiceDetails || []);
    populateItemsTable(printItems);
    
    // Financial summary
    document.getElementById('totalAmount').textContent = formatCurrency(invoice.priceBefDi || 0);
    document.getElementById('discountAmount').textContent = formatCurrency(0); // No discount in this structure
    document.getElementById('salesAmount').textContent = formatCurrency(invoice.priceBefDi || 0);
    document.getElementById('taxBase').textContent = formatCurrency((invoice.priceBefDi || 0) - (invoice.vatSum || 0));
    document.getElementById('vatAmount').textContent = formatCurrency(invoice.vatSum || 0);
    document.getElementById('grandTotal').textContent = formatCurrency(invoice.docTotal || 0);
    
    // Signature information
    document.getElementById('signatureName').textContent = 'Atsuro Suzuki'; // Default signature
    document.getElementById('signatureTitle').textContent = 'Vice President Director'; // Default title
}

// Function to convert items from receive page structure to print page structure
function convertItemsForPrint(items) {
    return items.map((item, index) => ({
        codeNo: item.itemCode || '',
        description: item.dscription || '', // Note: this is the correct field name from receive page
        quantity: item.invQty || item.quantity || 0, // Use invQty (invoice quantity) for print
        unit: item.unitMsr || 'PCS',
        unitPrice: item.priceBefDi || item.u_bsi_salprice || 0,
        amount: item.lineTotal || 0
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
        stagingID: 'STG-12345',
        docNum: 'FNC/INV/KPI/25070071',
        cardCode: 'C001',
        cardName: 'PT TOYOTA MOTOR MANUFACTURING INDONESIA',
        numAtCard: 'MKT/SJ/KPI/25070012, MKT/SJ/KPI/25070098, MKT/SJ/KPI/25070305',
        docCur: 'IDR',
        docDate: '2025-07-11',
        groupNum: 1,
        trnspCode: 1,
        u_BSI_ShippingType: 'Standard',
        u_BSI_PaymentGroup: 'Group A',
        u_bsi_udf1: 'Custom Field 1',
        u_bsi_udf2: 'Custom Field 2',
        priceBefDi: 150885965,
        vatSum: 16611299,
        docTotal: 155038789,
        comments: 'Sample invoice item for receiving',
        arInvoiceDetails: [
            {
                lineNum: 0,
                itemCode: '81-526-300',
                dscription: 'WP505D No.8007 (IN)',
                text: 'Sample notes for item 1',
                quantity: 544.00,
                invQty: 544.00,
                unitMsr: 'KG',
                u_bsi_salprice: 137939,
                priceBefDi: 137939,
                discount: 0,
                vatgroup: 'VAT',
                lineTotal: 75038816,
                acctCode: '4000',
                baseType: 0,
                baseEntry: 0,
                baseLine: 0,
                lineType: 0
            },
            {
                lineNum: 1,
                itemCode: '82-198-005',
                dscription: 'TRP-1 GREY (TMMIN LINE 2)',
                text: 'Sample notes for item 2',
                quantity: 28.00,
                invQty: 28.00,
                unitMsr: 'KG',
                u_bsi_salprice: 1366038,
                priceBefDi: 1366038,
                discount: 0,
                vatgroup: 'VAT',
                lineTotal: 38249064,
                acctCode: '4000',
                baseType: 0,
                baseEntry: 0,
                baseLine: 0,
                lineType: 0
            },
            {
                lineNum: 2,
                itemCode: 'K12-297-012',
                dscription: 'MAGICRON TB-516 THINNER (202.1)',
                text: 'Sample notes for item 3',
                quantity: 20.00,
                invQty: 20.00,
                unitMsr: 'LTR',
                u_bsi_salprice: 38907,
                priceBefDi: 38907,
                discount: 0,
                vatgroup: 'VAT',
                lineTotal: 778140,
                acctCode: '4000',
                baseType: 0,
                baseEntry: 0,
                baseLine: 0,
                lineType: 0
            },
            {
                lineNum: 3,
                itemCode: 'K14-650-007',
                dscription: 'ADDITIVE X',
                text: 'Sample notes for item 4',
                quantity: 140.00,
                invQty: 140.00,
                unitMsr: 'LTR',
                u_bsi_salprice: 44071,
                priceBefDi: 44071,
                discount: 0,
                vatgroup: 'VAT',
                lineTotal: 6169940,
                acctCode: '4000',
                baseType: 0,
                baseEntry: 0,
                baseLine: 0,
                lineType: 0
            },
            {
                lineNum: 4,
                itemCode: 'K6-163-902',
                dscription: 'T/U REPAIR SUPER WHITE # 040',
                text: 'Sample notes for item 5',
                quantity: 5.00,
                invQty: 5.00,
                unitMsr: 'LTR',
                u_bsi_salprice: 130001,
                priceBefDi: 130001,
                discount: 0,
                vatgroup: 'VAT',
                lineTotal: 650005,
                acctCode: '4000',
                baseType: 0,
                baseEntry: 0,
                baseLine: 0,
                lineType: 0
            },
            {
                lineNum: 5,
                itemCode: 'K8-234-567',
                dscription: 'PRIMER COAT WHITE # 001',
                text: 'Sample notes for item 6',
                quantity: 15.00,
                invQty: 15.00,
                unitMsr: 'LTR',
                u_bsi_salprice: 89000,
                priceBefDi: 89000,
                discount: 0,
                vatgroup: 'VAT',
                lineTotal: 1335000,
                acctCode: '4000',
                baseType: 0,
                baseEntry: 0,
                baseLine: 0,
                lineType: 0
            },
            {
                lineNum: 6,
                itemCode: 'K9-345-678',
                dscription: 'CLEAR COAT GLOSS # 002',
                text: 'Sample notes for item 7',
                quantity: 25.00,
                invQty: 25.00,
                unitMsr: 'LTR',
                u_bsi_salprice: 125000,
                priceBefDi: 125000,
                discount: 0,
                vatgroup: 'VAT',
                lineTotal: 3125000,
                acctCode: '4000',
                baseType: 0,
                baseEntry: 0,
                baseLine: 0,
                lineType: 0
            },
            {
                lineNum: 7,
                itemCode: 'K10-456-789',
                dscription: 'BASE COAT RED # 003',
                text: 'Sample notes for item 8',
                quantity: 30.00,
                invQty: 30.00,
                unitMsr: 'LTR',
                u_bsi_salprice: 95000,
                priceBefDi: 95000,
                discount: 0,
                vatgroup: 'VAT',
                lineTotal: 2850000,
                acctCode: '4000',
                baseType: 0,
                baseEntry: 0,
                baseLine: 0,
                lineType: 0
            },
            {
                lineNum: 8,
                itemCode: 'K11-567-890',
                dscription: 'METALLIC SILVER # 004',
                text: 'Sample notes for item 9',
                quantity: 12.00,
                invQty: 12.00,
                unitMsr: 'LTR',
                u_bsi_salprice: 150000,
                priceBefDi: 150000,
                discount: 0,
                vatgroup: 'VAT',
                lineTotal: 1800000,
                acctCode: '4000',
                baseType: 0,
                baseEntry: 0,
                baseLine: 0,
                lineType: 0
            },
            {
                lineNum: 9,
                itemCode: 'K12-678-901',
                dscription: 'PEARL WHITE # 005',
                text: 'Sample notes for item 10',
                quantity: 8.00,
                invQty: 8.00,
                unitMsr: 'LTR',
                u_bsi_salprice: 180000,
                priceBefDi: 180000,
                discount: 0,
                vatgroup: 'VAT',
                lineTotal: 1440000,
                acctCode: '4000',
                baseType: 0,
                baseEntry: 0,
                baseLine: 0,
                lineType: 0
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