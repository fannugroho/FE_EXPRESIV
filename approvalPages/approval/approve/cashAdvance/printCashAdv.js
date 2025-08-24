// Cash Advance Voucher Print JavaScript
class CashAdvancePrinter {
    constructor() {
        this.apiBaseUrl = 'https://expressiv-be-sb.idsdev.site/api';
        this.cashAdvanceId = this.getCashAdvanceIdFromUrl();
        this.cashAdvanceData = null;
        this.currencyData = null;
        
        this.init();
    }

    init() {
        if (this.cashAdvanceId) {
            this.loadCurrencyData().then(() => {
                this.loadCashAdvanceData();
            });
        } else {
            const currentUrl = window.location.href;
            this.showError(`Cash Advance ID not found in URL. Current URL: ${currentUrl}. Expected parameters: id, cashAdvanceId, ca-id, or cashAdvanceNo`);
        }
        
    }

    async loadCurrencyData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/MasterCurrency`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status && result.data) {
                this.currencyData = result.data;
                console.log('Currency data loaded:', this.currencyData);
            } else {
                throw new Error(result.message || 'Failed to load currency data');
            }
        } catch (error) {
            console.error('Error loading currency data:', error);
            this.showError(`Failed to load currency data: ${error.message}`);
        }
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
        
        // Validate the data before proceeding
        if (!this.validateCashAdvanceData(this.cashAdvanceData)) {
            return;
        }

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
        this.setElementText('currency', this.cashAdvanceData.currency || 'IDR');
        this.setElementText('returnCurrency', this.cashAdvanceData.currency || 'IDR');

        // Settlement Table
        this.populateSettlementTable();
        
        // Update page numbering
        this.updatePageNumbers();
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
                const formattedAmount = this.formatCurrency(detail.amount);
                row.innerHTML = `
                    <td>${this.cashAdvanceData.transactionType}</td>
                    <td>${detail.glAccount || detail.coa || '-'}</td>
                    <td>${detail.accountName || '-'}</td>
                    <td>${detail.description || '-'}</td>
                    <td>${this.cashAdvanceData.currency || '-'}</td>
                    <td>${formattedAmount}</td>
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

        // Set totals using safe methods
        this.safeFormatAmount(this.cashAdvanceData.totalAmount, 'totalProposedAmount');
        
        // Update amount in words based on the total amount with currency
        this.safeNumberToWords(this.cashAdvanceData.totalAmount, 'amountInWords', this.cashAdvanceData.currency);
    }

    updateAmountInWordsWithCurrency(currencyCode) {
        if (!currencyCode) return;
        
        const amountInWordsElement = document.getElementById('amountInWords');
        if (!amountInWordsElement) return;
        
        // Use the centralized getCurrencyName method
        const currencyName = this.getCurrencyName(currencyCode);
        
        // Get the current amount in words without currency
        let currentText = amountInWordsElement.textContent;
        
        // Remove any existing currency name (more robust regex)
        currentText = currentText.replace(/\s+(Rupiah|IDR|USD|EUR|GBP|JPY|SGD|AUD|CAD|CHF|CNY|KRW|THB|MYR|PHP|VND|INR|BRL|MXN|RUB|ZAR|SEK|NOK|DKK|PLN|CZK|HUF|RON|BGN|HRK|RSD|UAH|BYN|KZT|UZS|GEL|AMD|AZN|BDT|KHR|LAK|MMK|MNT|NPR|PKR|LKR|TJS|TMT|TND|VEF|XOF|XAF|XCD|XPF|YER|ZMW|NGN|EGP|KES|UGX|TZS|GHS|MAD|DZD|TND|LYD|SDG|ETB|SOS|DJF|KMF|BIF|RWF|MWK|ZMK|SZL|LSL|NAD|BWP|MUR|SCR|SLL|GMD|GNF|CVE|STD|AOA|XOF|XAF|XCD|XPF|YER|ZMW|NGN|EGP|KES|UGX|TZS|GHS|MAD|DZD|TND|LYD|SDG|ETB|SOS|DJF|KMF|BIF|RWF|MWK|ZMK|SZL|LSL|NAD|BWP|MUR|SCR|SLL|GMD|GNF|CVE|STD|AOA)$/i, '');
        
        // Append the currency name
        const newText = `${currentText} ${currencyName}`;
        amountInWordsElement.textContent = newText;
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
        
        // Ensure amount is a number
        let numericAmount = amount;
        if (typeof amount === 'string') {
            numericAmount = this.parseIndonesianNumber(amount);
            if (isNaN(numericAmount)) {
                return '-';
            }
        }
        
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numericAmount);
    }



    numberToWords(num, includeCurrency = false, currencyCode = null) {
        // Handle null, undefined, or zero
        if (num === null || num === undefined || num === 0) {
            return includeCurrency && currencyCode ? `Zero ${currencyCode}` : 'Zero';
        }
        
        // If num is a string, parse it from Indonesian format
        let numericValue = num;
        if (typeof num === 'string') {
            // Parse Indonesian number format (e.g., "1.122.000,00" -> 1122000.00)
            numericValue = this.parseIndonesianNumber(num);
            if (isNaN(numericValue)) {
                console.warn('Failed to parse number:', num);
                return includeCurrency && currencyCode ? `Invalid Amount ${currencyCode}` : 'Invalid Amount';
            }
        }
        
        // Ensure we have a valid number
        if (isNaN(numericValue) || numericValue === 0) {
            return includeCurrency && currencyCode ? `Zero ${currencyCode}` : 'Zero';
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
        
        const wholePart = Math.floor(numericValue);
        const decimalPart = Math.round((numericValue - wholePart) * 100);
        
        let result = convert(wholePart);
        
        if (decimalPart > 0) {
            result += ' and ' + convert(decimalPart) + ' Cents';
        }
        
        // Add currency if requested
        if (includeCurrency && currencyCode) {
            result += ` ${currencyCode}`;
        }
        
        return result;
    }

    // Get currency name from currency code using API data
    getCurrencyName(currencyCode) {
        if (!currencyCode || !this.currencyData) {
            return currencyCode; // Return the code if no data available
        }
        
        const currency = this.currencyData.find(c => c.code === currencyCode);
        if (currency && currency.name) {
            return currency.name;
        }
        
        // Fallback to currency code if name not found
        return currencyCode;
    }

    // Safely format and display amount with fallback handling
    safeFormatAmount(amount, elementId) {
        try {
            if (!amount) {
                this.setElementText(elementId, '-');
                return;
            }
            
            const formatted = this.formatCurrency(amount);
            this.setElementText(elementId, formatted);
        } catch (error) {
            console.warn(`Error formatting amount for ${elementId}:`, error);
            this.setElementText(elementId, amount || '-');
        }
    }

    // Safely convert number to words with fallback handling
    safeNumberToWords(amount, elementId, currencyCode = null) {
        try {
            if (!amount) {
                const currencyName = this.getCurrencyName(currencyCode);
                const defaultText = currencyName ? `Zero ${currencyName}` : 'Zero';
                this.setElementText(elementId, defaultText);
                return;
            }
            
            // Get the currency name instead of using the code directly
            const currencyName = this.getCurrencyName(currencyCode);
            const words = this.numberToWords(amount, true, currencyName);
            this.setElementText(elementId, words);
        } catch (error) {
            console.warn(`Error converting amount to words for ${elementId}:`, error);
            const currencyName = this.getCurrencyName(currencyCode);
            const errorText = currencyName ? `Amount conversion error ${currencyName}` : 'Amount conversion error';
            this.setElementText(elementId, errorText);
        }
    }

    // Validate and sanitize cash advance data
    validateCashAdvanceData(data) {
        if (!data) {
            this.showError('No cash advance data received');
            return false;
        }
        
        if (!data.totalAmount) {
            this.showError('Total amount is missing from cash advance data');
            return false;
        }
        
        // Validate total amount is a valid number or Indonesian format string
        const amount = this.parseIndonesianNumber(data.totalAmount);
        if (isNaN(amount) || amount <= 0) {
            this.showError(`Invalid total amount: ${data.totalAmount}`);
            return false;
        }
        
        return true;
    }

    // Parse Indonesian number format (e.g., "1.122.000,00" -> 1122000.00)
    parseIndonesianNumber(numberString) {
        if (typeof numberString !== 'string') {
            return parseFloat(numberString);
        }
        
        // Remove all spaces and trim
        let cleaned = numberString.trim().replace(/\s/g, '');
        
        // Handle Indonesian format: dots as thousand separators, comma as decimal separator
        // First, replace dots with empty string (remove thousand separators)
        cleaned = cleaned.replace(/\./g, '');
        
        // Then replace comma with dot (decimal separator)
        cleaned = cleaned.replace(/,/g, '.');
        
        // Parse as float
        const result = parseFloat(cleaned);
        
        // Validate the result
        if (isNaN(result)) {
            console.warn('Failed to parse Indonesian number format:', numberString);
            return NaN;
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

    updatePageNumbers() {
        // Calculate total pages based on content height
        const container = document.querySelector('.print-container');
        if (container) {
            const containerHeight = container.scrollHeight;
            const pageHeight = 1123; // A4 page height in pixels (297mm)
            const totalPages = Math.ceil(containerHeight / pageHeight);
            
            // Update the total pages display
            const totalPagesElement = document.getElementById('totalPages');
            if (totalPagesElement) {
                totalPagesElement.textContent = totalPages;
            }
            
            // Set current page to 1 (first page)
            const currentPageElement = document.getElementById('currentPage');
            if (currentPageElement) {
                currentPageElement.textContent = '1';
            }
        }
    }
}

// Initialize the printer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.cashAdvancePrinter = new CashAdvancePrinter();
});

// Handle print events to update page numbers
window.addEventListener('beforeprint', () => {
    // Update page numbers before printing
    const printer = window.cashAdvancePrinter;
    if (printer && printer.updatePageNumbers) {
        printer.updatePageNumbers();
    }
});

// Add print functionality
function printVoucher() {
    window.print();
}

// Add close functionality
function closeWindow() {
    window.close();
}

// Export functions for global access
window.printVoucher = printVoucher;
window.closeWindow = closeWindow;
