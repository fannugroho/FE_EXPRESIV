// Cash Advance Voucher Print JavaScript
class CashAdvancePrinter {
    constructor() {
        this.apiBaseUrl = 'https://expressiv-be-sb.idsdev.site/api';
        this.cashAdvanceId = this.getCashAdvanceIdFromUrl();
        this.cashAdvanceData = null;
        this.currencies = null;
        
        this.init();
    }

    init() {
        if (this.cashAdvanceId) {
            this.loadCurrencies().then(() => {
                this.loadCashAdvanceData();
            });
        } else {
            const currentUrl = window.location.href;
            this.showError(`Cash Advance ID not found in URL. Current URL: ${currentUrl}. Expected parameters: id, cashAdvanceId, ca-id, or cashAdvanceNo`);
        }
        
        // Setup pagination functionality
        this.setupPagination();
    }

    getCashAdvanceIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        // Check for all possible parameter names used in different parts of the application
        const id = urlParams.get('id') || 
                   urlParams.get('cashAdvanceId') || 
                   urlParams.get('ca-id') || 
                   urlParams.get('cashAdvanceNo');
        
        // Debug logging
        console.log('URL parameters found:', Object.fromEntries(urlParams.entries()));
        console.log('Cash Advance ID extracted:', id);
        
        return id;
    }

    async loadCurrencies() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/MasterCurrency`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status && result.data) {
                this.currencies = result.data;
                console.log('Loaded currencies:', this.currencies);
            } else {
                throw new Error(result.message || 'Failed to load currencies');
            }
        } catch (error) {
            console.error('Error loading currencies:', error);
            this.showError(`Failed to load currencies: ${error.message}`);
        }
    }

    async loadCashAdvanceData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/cash-advance/${this.cashAdvanceId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status && result.data) {
                this.cashAdvanceData = result.data;
                this.populateForm();
            } else {
                throw new Error(result.message || 'Failed to load data');
            }
        } catch (error) {
            console.error('Error loading cash advance data:', error);
            this.showError(`Failed to load data: ${error.message}`);
        }
    }

    populateForm() {
        if (!this.cashAdvanceData) return;

        // Header Information
        this.setElementText('voucherNo', this.cashAdvanceData.cashAdvanceNo || '-');
        this.setElementText('submissionDate', this.formatDate(this.cashAdvanceData.submissionDate) || '-');

        // Department Selection
        this.setElementText('departmentName', this.cashAdvanceData.departmentName || '-');

        // Recipient Information
        this.setElementText('recipientName', this.cashAdvanceData.employeeName || '-');

        // Approval Information
        this.setApprovalInfo('proposedByName', 'proposedDate', 
            this.cashAdvanceData.preparedName, this.cashAdvanceData.preparedDate);
        this.setApprovalInfo('checkedByName', 'checkedDate', 
            this.cashAdvanceData.checkedName, this.cashAdvanceData.checkedDate);
        this.setApprovalInfo('acknowledgedByName', 'acknowledgedDate', 
            this.cashAdvanceData.acknowledgedName, this.cashAdvanceData.acknowledgedDate);
        this.setApprovalInfo('approvedByName', 'approvedDate', 
            this.cashAdvanceData.approvedName, this.cashAdvanceData.approvedDate);
        this.setApprovalInfo('receivedByName', 'receivedDate', 
            this.cashAdvanceData.receivedName, this.cashAdvanceData.receivedDate);

        // Cost and Purpose
        this.setElementText('purpose', this.cashAdvanceData.purpose || '-');
        this.setElementText('remarks', this.cashAdvanceData.remarks || '-');
        
        // Set currency from API data
        this.setElementText('currency', this.cashAdvanceData.currency || 'Rp');

        // Settlement Table
        this.populateSettlementTable();
        
        // Set amount in words after table is populated to get currency from first row
        this.updateAmountInWords();
    }

    setApprovalInfo(nameId, dateId, name, date) {
        if (name) {
            this.setElementText(nameId, name);
        }
        if (date) {
            this.setElementText(dateId, this.formatDate(date));
        }
        
        // Handle approval stamp visibility for "Received by" section
        if (nameId === 'receivedByName') {
            if (!date || date === null || date === '') {
                this.hideApprovalStamp('receivedByName');
            } else {
                this.showApprovalStamp('receivedByName');
            }
        }
    }

    populateSettlementTable() {
        const tableBody = document.getElementById('settlementTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (this.cashAdvanceData.cashAdvanceDetails && this.cashAdvanceData.cashAdvanceDetails.length > 0) {
            this.cashAdvanceData.cashAdvanceDetails.forEach(detail => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.cashAdvanceData.transactionType}</td>
                    <td>${detail.glAccount || detail.coa || '-'}</td>
                    <td>${detail.accountName || '-'}</td>
                    <td>${detail.description || '-'}</td>
                    <td>${this.cashAdvanceData.currency || '-'}</td>
                    <td>${this.formatCurrency(detail.amount)}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            // Add empty rows if no details
            for (let i = 0; i < 6; i++) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                `;
                tableBody.appendChild(row);
            }
        }

        // Set totals
        this.setElementText('totalProposedAmount', this.formatCurrency(this.cashAdvanceData.totalAmount));
    }

    updateAmountInWords() {
        // Get currency from first row of settlement table
        const firstRow = document.querySelector('#settlementTableBody tr:first-child');
        let currencyCode = null;
        
        if (firstRow) {
            const currencyCell = firstRow.querySelector('td:nth-child(5)');
            if (currencyCell && currencyCell.textContent.trim() !== '-' && currencyCell.textContent.trim() !== '') {
                currencyCode = currencyCell.textContent.trim();
                console.log('Currency from table:', currencyCode);
            }
        }
        
        // Update amount in words with the currency from the table
        const amountInWords = this.numberToWords(this.cashAdvanceData.totalAmount, currencyCode);
        console.log('Amount in words:', amountInWords);
        this.setElementText('amountInWords', amountInWords);
    }

    getCurrencyName(currencyCode) {
        if (!this.currencies || !currencyCode) return null;
        
        console.log('Looking for currency code:', currencyCode);
        console.log('Available currencies:', this.currencies);
        
        const currency = this.currencies.find(c => c.code === currencyCode);
        console.log('Found currency:', currency);
        
        return currency ? currency.name : null;
    }

    setElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return '-';
        }
    }

    formatCurrency(amount) {
        if (amount === null || amount === undefined) return '-';
        
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    numberToWords(num, currencyCode) {
        if (num === null || num === undefined || num === 0) {
            const currencyName = this.getCurrencyName(currencyCode);
            if (!currencyName) return 'Zero';
            return `Zero ${currencyName}`;
        }
        
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        
        function convertLessThanOneThousand(n) {
            if (n === 0) return '';
            
            if (n < 10) return ones[n];
            if (n < 20) return teens[n - 10];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
            if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
        }
        
        function convert(n) {
            if (n === 0) return 'Zero';
            
            const billion = Math.floor(n / 1000000000);
            const million = Math.floor((n % 1000000000) / 1000000);
            const thousand = Math.floor((n % 1000000) / 1000);
            const remainder = n % 1000;
            
            let result = '';
            
            if (billion) result += convertLessThanOneThousand(billion) + ' Billion ';
            if (million) result += convertLessThanOneThousand(million) + ' Million ';
            if (thousand) result += convertLessThanOneThousand(thousand) + ' Thousand ';
            if (remainder) result += convertLessThanOneThousand(remainder);
            
            return result.trim();
        }
        
        const wholePart = Math.floor(num);
        const decimalPart = Math.round((num - wholePart) * 100);
        
        const currencyName = this.getCurrencyName(currencyCode);
        if (!currencyName) return convert(wholePart);
        
        let result = convert(wholePart) + ' ' + currencyName;
        
        if (decimalPart > 0) {
            result += ' and ' + convert(decimalPart) + ' Cents';
        }
        
        return result;
    }

    showError(message) {
        console.error(message);
        // You can implement a user-friendly error display here
        alert('Error: ' + message);
    }

    hideApprovalStamp(nameId) {
        // Find the approval box containing the name element
        const nameElement = document.getElementById(nameId);
        if (nameElement) {
            const approvalBox = nameElement.closest('.approval-box');
            if (approvalBox) {
                const stampElement = approvalBox.querySelector('.approval-stamp');
                if (stampElement) {
                    stampElement.classList.add('hidden');
                }
            }
        }
    }

    showApprovalStamp(nameId) {
        // Find the approval box containing the name element
        const nameElement = document.getElementById(nameId);
        if (nameElement) {
            const approvalBox = nameElement.closest('.approval-box');
            if (approvalBox) {
                const stampElement = approvalBox.querySelector('.approval-stamp');
                if (stampElement) {
                    stampElement.classList.remove('hidden');
                }
            }
        }
    }

    // Add pagination functionality
    setupPagination() {
        // Update page number on print
        window.addEventListener('beforeprint', () => {
            this.updatePageNumbers();
        });
        
        // Update page number when print dialog closes
        window.addEventListener('afterprint', () => {
            this.updatePageNumbers();
        });
        
        // Initial page number update
        this.updatePageNumbers();
    }

    updatePageNumbers() {
        const pageNumberElement = document.getElementById('currentPage');
        const totalPagesElement = document.getElementById('totalPages');
        
        if (pageNumberElement && totalPagesElement) {
            // For single page documents, always show page 1 of 1
            // For multi-page documents, this would be updated dynamically
            pageNumberElement.textContent = '1';
            totalPagesElement.textContent = '1';
        }
    }

    // Enhanced print functionality with pagination
    printWithPagination() {
        // Update page numbers before printing
        this.updatePageNumbers();
        // Trigger print
        window.print();
    }
}

// Initialize the printer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.cashAdvancePrinter = new CashAdvancePrinter();
});

// Add print functionality
function printVoucher() {
    window.print();
}

// Add enhanced print functionality with pagination
function printVoucherWithPagination() {
    if (window.cashAdvancePrinter) {
        window.cashAdvancePrinter.printWithPagination();
    } else {
        window.print();
    }
}

// Add close functionality
function closeWindow() {
    window.close();
}

// Export functions for global access
window.printVoucher = printVoucher;
window.printVoucherWithPagination = printVoucherWithPagination;
window.closeWindow = closeWindow;