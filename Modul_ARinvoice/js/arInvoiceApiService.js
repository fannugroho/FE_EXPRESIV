/**
 * ARInvoice API Service
 * Centralized service for all ARInvoice API operations
 */

class ARInvoiceApiService {
    constructor() {
        this.baseUrl = window.BASE_URL || 'http://localhost:5249';
    }

    /**
     * Make authenticated request to the API
     */
    async makeRequest(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;

        const defaultOptions = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        };

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.Message || errorMessage;
                } catch (e) {
                    // If parsing fails, use the raw text
                    errorMessage = errorText || errorMessage;
                }

                throw new Error(errorMessage);
            }

            return response;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    /**
     * Get all AR Invoices with pagination
     */
    async getARInvoices(parameters = {}) {
        const queryParams = new URLSearchParams();

        if (parameters.pageNumber) queryParams.append('pageNumber', parameters.pageNumber);
        if (parameters.pageSize) queryParams.append('pageSize', parameters.pageSize);
        if (parameters.searchTerm) queryParams.append('searchTerm', parameters.searchTerm);
        if (parameters.sortBy) queryParams.append('sortBy', parameters.sortBy);
        if (parameters.sortOrder) queryParams.append('sortOrder', parameters.sortOrder);

        const endpoint = `/api/ar-invoices${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await this.makeRequest(endpoint, { method: 'GET' });
        return await response.json();
    }

    /**
     * Get AR Invoice by staging ID
     */
    async getARInvoice(stagingId) {
        const response = await this.makeRequest(`/api/ar-invoices/${stagingId}`, { method: 'GET' });
        return await response.json();
    }

    /**
     * Get AR Invoice with details by staging ID
     */
    async getARInvoiceWithDetails(stagingId) {
        const response = await this.makeRequest(`/api/ar-invoices/${stagingId}/details`, { method: 'GET' });
        return await response.json();
    }

    /**
     * Create new AR Invoice
     */
    async createARInvoice(arInvoiceData) {
        const response = await this.makeRequest('/api/ar-invoices', {
            method: 'POST',
            body: JSON.stringify(arInvoiceData)
        });
        return await response.json();
    }

    /**
     * Update AR Invoice
     */
    async updateARInvoice(stagingId, arInvoiceData) {
        const response = await this.makeRequest(`/api/ar-invoices/${stagingId}`, {
            method: 'PUT',
            body: JSON.stringify(arInvoiceData)
        });
        return response; // Returns 204 No Content
    }

    /**
     * Delete AR Invoice
     */
    async deleteARInvoice(stagingId) {
        const response = await this.makeRequest(`/api/ar-invoices/${stagingId}`, {
            method: 'DELETE'
        });
        return response; // Returns 204 No Content
    }

    /**
     * Update AR Invoice approval
     */
    async updateARInvoiceApproval(stagingId, approvalData) {
        const response = await this.makeRequest(`/api/ar-invoices/approval/${stagingId}`, {
            method: 'PATCH',
            body: JSON.stringify(approvalData)
        });
        return await response.json();
    }

    /**
     * Get AR Invoices by card code
     */
    async getARInvoicesByCardCode(cardCode) {
        const response = await this.makeRequest(`/api/ar-invoices/by-card-code/${cardCode}`, { method: 'GET' });
        return await response.json();
    }

    /**
     * Get AR Invoices by preparer NIK
     */
    async getARInvoicesByPreparer(preparerNIK) {
        const response = await this.makeRequest(`/api/ar-invoices/by-preparer/${preparerNIK}`, { method: 'GET' });
        return await response.json();
    }

    /**
     * Get AR Invoices by date range
     */
    async getARInvoicesByDateRange(fromDate, toDate) {
        const queryParams = new URLSearchParams();
        queryParams.append('fromDate', fromDate);
        queryParams.append('toDate', toDate);

        const response = await this.makeRequest(`/api/ar-invoices/by-date-range?${queryParams.toString()}`, { method: 'GET' });
        return await response.json();
    }

    /**
     * Get AR Invoices by acknowledged by
     */
    async getARInvoicesByAcknowledged(acknowledgedBy) {
        const response = await this.makeRequest(`/api/ar-invoices/by-acknowledged/${acknowledgedBy}`, { method: 'GET' });
        return await response.json();
    }

    /**
     * Get AR Invoices by prepared by
     */
    async getARInvoicesByPrepared(preparedBy) {
        const response = await this.makeRequest(`/api/ar-invoices/by-prepared/${preparedBy}`, { method: 'GET' });
        return await response.json();
    }

    /**
     * Get AR Invoices by checked by
     */
    async getARInvoicesByChecked(checkedBy) {
        const response = await this.makeRequest(`/api/ar-invoices/by-checked/${checkedBy}`, { method: 'GET' });
        return await response.json();
    }

    /**
     * Get AR Invoices by approved by
     */
    async getARInvoicesByApproved(approvedBy) {
        const response = await this.makeRequest(`/api/ar-invoices/by-approved/${approvedBy}`, { method: 'GET' });
        return await response.json();
    }

    /**
     * Get AR Invoices by received by
     */
    async getARInvoicesByReceived(receivedBy) {
        const response = await this.makeRequest(`/api/ar-invoices/by-received/${receivedBy}`, { method: 'GET' });
        return await response.json();
    }

    // Attachment Operations

    /**
     * Upload attachments for AR Invoice
     */
    async uploadAttachments(stagingId, files) {
        const formData = new FormData();

        if (Array.isArray(files)) {
            files.forEach(file => {
                formData.append('files', file);
            });
        } else {
            formData.append('files', files);
        }

        const response = await this.makeRequest(`/api/ar-invoices/${stagingId}/attachments/upload`, {
            method: 'POST',
            headers: {
                // Don't set Content-Type for FormData
            },
            body: formData
        });
        return await response.json();
    }

    /**
     * Get attachments for AR Invoice
     */
    async getAttachments(stagingId) {
        const response = await this.makeRequest(`/api/ar-invoices/${stagingId}/attachments`, { method: 'GET' });
        return await response.json();
    }

    /**
     * Download attachment
     */
    async downloadAttachment(stagingId, attachmentId) {
        const response = await this.makeRequest(`/api/ar-invoices/${stagingId}/attachments/${attachmentId}/download`, {
            method: 'GET'
        });
        return response.blob();
    }

    /**
     * Delete attachment
     */
    async deleteAttachment(stagingId, attachmentId) {
        const response = await this.makeRequest(`/api/ar-invoices/${stagingId}/attachments/${attachmentId}`, {
            method: 'DELETE'
        });
        return await response.json();
    }

    // Utility Methods

    /**
     * Format currency value for display
     */
    formatCurrency(value) {
        if (value === null || value === undefined) return '0.00';

        const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;

        if (isNaN(numValue)) return '0.00';

        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numValue);
    }

    /**
     * Parse currency value from formatted string
     */
    parseCurrency(formattedValue) {
        if (!formattedValue) return 0;

        // Remove all non-numeric characters except decimal point
        const cleanValue = formattedValue.toString().replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleanValue);

        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        return date.toISOString().split('T')[0];
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        if (typeof Swal !== 'undefined') {
            return Swal.fire({
                title: 'Success',
                text: message,
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            alert(message);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (typeof Swal !== 'undefined') {
            return Swal.fire({
                title: 'Error',
                text: message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } else {
            alert('Error: ' + message);
        }
    }

    /**
     * Show confirmation dialog
     */
    async showConfirmation(message, title = 'Confirm') {
        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
                title: title,
                text: message,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No'
            });
            return result.isConfirmed;
        } else {
            return confirm(message);
        }
    }

    /**
     * Show loading dialog
     */
    showLoading(title = 'Loading...', text = 'Please wait...') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: title,
                text: text,
                icon: 'info',
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
    }

    /**
     * Close loading dialog
     */
    closeLoading() {
        if (typeof Swal !== 'undefined') {
            Swal.close();
        }
    }
}

// Create global instance
window.arInvoiceApiService = new ARInvoiceApiService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ARInvoiceApiService;
} 