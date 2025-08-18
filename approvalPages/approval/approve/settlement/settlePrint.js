// Settlement Voucher Print JavaScript
class SettlementPrinter {
    constructor() {
        this.apiBaseUrl = 'https://expressiv-be-sb.idsdev.site/api';
        this.settlementId = this.getSettlementIdFromUrl();
        this.settlementData = null;
        
        this.init();
    }

    init() {
        if (this.settlementId) {
            this.loadSettlementData();
        } else {
            const currentUrl = window.location.href;
            this.showError(`Settlement ID not found in URL. Current URL: ${currentUrl}. Expected parameters: id, settlementId, settle-id, or settlementNo`);
        }
    }

    getSettlementIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        // Check for all possible parameter names used in different parts of the application
        const id = urlParams.get('id') || 
                   urlParams.get('settlementId') || 
                   urlParams.get('settle-id') || 
                   urlParams.get('settlementNo');
        
        // Debug logging
        console.log('URL parameters found:', Object.fromEntries(urlParams.entries()));
        console.log('Settlement ID extracted:', id);
        
        return id;
    }

    async loadSettlementData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/settlement/${this.settlementId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status && result.data) {
                this.settlementData = result.data;
                this.populateForm();
            } else {
                throw new Error(result.message || 'Failed to load data');
            }
        } catch (error) {
            console.error('Error loading settlement data:', error);
            this.showError(`Failed to load data: ${error.message}`);
        }
    }

    populateForm() {
        if (!this.settlementData) return;

        // Header Information
        this.setElementText('voucherNo', this.settlementData.settlementNo || '-');
        this.setElementText('submissionDate', this.formatDate(this.settlementData.submissionDate) || '-');
        
        // Set batch number (using settlement number as fallback)
        this.setElementText('batchNo', this.settlementData.settlementNo || '-');

        // Department Selection
        this.setElementText('departmentName', this.settlementData.departmentName || '-');

        // Recipient Information
        this.setElementText('recipientName', this.settlementData.employeeName || '-');

        // Approval Information
        this.setApprovalInfo('proposedByName', 'proposedDate', 
            this.settlementData.preparedName, this.settlementData.preparedDate);
        this.setApprovalInfo('checkedByName', 'checkedDate', 
            this.settlementData.checkedName, this.settlementData.checkedDate);
        this.setApprovalInfo('acknowledgedByName', 'acknowledgedDate', 
            this.settlementData.acknowledgedName, this.settlementData.acknowledgedDate);
        this.setApprovalInfo('approvedByName', 'approvedDate', 
            this.settlementData.approvedName, this.settlementData.approvedDate);
        this.setApprovalInfo('receivedByName', 'receivedDate', 
            this.settlementData.receivedName, this.settlementData.receivedDate);

        // Cost and Purpose
        this.setElementText('totalAmount', this.formatCurrency(this.settlementData.totalAmount));
        this.setElementText('amountInWords', this.numberToWords(this.settlementData.totalAmount));
        this.setElementText('purpose', this.settlementData.purpose || '-');
        
        // Set currency from API data
        this.setElementText('currency', this.settlementData.currency || 'Rp');
        this.setElementText('originalCurrency', this.settlementData.currency || 'Rp');
        this.setElementText('usedCurrency', this.settlementData.currency || 'Rp');
        this.setElementText('returnCurrency', this.settlementData.currency || 'Rp');

        // Settlement Table
        this.populateSettlementTable();

        // Settlement Details
        this.setElementText('originalAmount', this.formatCurrency(this.settlementData.originalAmount || this.settlementData.totalAmount));
        this.setElementText('usedAmount', this.formatCurrency(this.settlementData.usedAmount || 0));
        
        // Calculate return amount (original amount - used amount)
        const originalAmount = this.settlementData.originalAmount || this.settlementData.totalAmount;
        const usedAmount = this.settlementData.usedAmount || 0;
        const returnAmount = Math.max(0, originalAmount - usedAmount);
        
        this.setElementText('returnAmount', this.formatCurrency(returnAmount));
        this.setElementText('returnAmountInWords', this.numberToWords(returnAmount));
        
        // Set settlement date to current date or from API
        const settlementDate = this.settlementData.settlementDate || this.settlementData.submissionDate || new Date();
        this.setElementText('settlementDate', this.formatDate(settlementDate));
    }

    setApprovalInfo(nameId, dateId, name, date) {
        if (name) {
            this.setElementText(nameId, name);
        }
        if (date) {
            this.setElementText(dateId, this.formatDate(date));
        }
    }

    populateSettlementTable() {
        const tableBody = document.getElementById('settlementTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (this.settlementData.settlementDetails && this.settlementData.settlementDetails.length > 0) {
            this.settlementData.settlementDetails.forEach(detail => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${detail.description || '-'}</td>
                    <td>${this.formatCurrency(detail.amount)}</td>
                    <td>-</td>
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
                `;
                tableBody.appendChild(row);
            }
        }

        // Set totals
        this.setElementText('totalDebit', this.formatCurrency(this.settlementData.totalAmount));
        this.setElementText('totalCredit', '-');
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

    numberToWords(num) {
        if (num === null || num === undefined || num === 0) return 'Zero Rupiah';
        
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
        
        let result = convert(wholePart) + ' Rupiah';
        
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
}

// Initialize the printer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SettlementPrinter();
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
