// Global variables
let currentDocumentId = null;
let currentDocumentData = null;

// Development mode - bypass authentication
const isDevelopmentMode = true;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get document ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentDocumentId = urlParams.get('id');
    
    if (currentDocumentId) {
        loadDocumentData(currentDocumentId);
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No document ID provided'
        }).then(() => {
            goToMenuAcknowInvItem();
        });
    }
});

// Function to load document data
async function loadDocumentData(documentId) {
    try {
        // Show loading state
        Swal.fire({
            title: 'Loading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        if (isDevelopmentMode) {
            // Use dummy data for development
            const dummyData = {
                DocEntry: documentId,
                DocNum: "INV-2024-001",
                CardCode: "C001",
                CardName: "PT Sample Customer",
                NumAtCard: "EXT-REF-001",
                DocCur: "IDR",
                DocDate: "2024-01-15",
                GroupNum: 1,
                TrnspCode: 1,
                U_BSI_ShippingType: "Standard",
                U_BSI_PaymentGroup: "Group A",
                U_BSI_UDF1: "Custom Field 1",
                U_BSI_UDF2: "Custom Field 2",
                PriceBefDi: 1000000,
                VatSum: 100000,
                DocTotal: 1100000,
                Comments: "Sample invoice item for acknowledgment",
                items: [
                    {
                        LineNum: 0,
                        ItemCode: "ITEM001",
                        ItemName: "Sample Item 1",
                        FreeTxt: "Sample notes for item 1",
                        Quantity: 10,
                        InvQty: 10,
                        UoM: "PCS",
                        SalesPrice: 50000,
                        Price: 50000,
                        DiscPrcnt: 0,
                        TaxCode: "VAT",
                        LineTotal: 500000,
                        AccountCode: "4000",
                        BaseType: 0,
                        BaseEntry: 0,
                        BaseLine: 0,
                        LineType: 0
                    },
                    {
                        LineNum: 1,
                        ItemCode: "ITEM002",
                        ItemName: "Sample Item 2",
                        FreeTxt: "Sample notes for item 2",
                        Quantity: 5,
                        InvQty: 5,
                        UoM: "PCS",
                        SalesPrice: 60000,
                        Price: 60000,
                        DiscPrcnt: 0,
                        TaxCode: "VAT",
                        LineTotal: 300000,
                        AccountCode: "4000",
                        BaseType: 0,
                        BaseEntry: 0,
                        BaseLine: 0,
                        LineType: 0
                    }
                ],
                preparedBy: "John Doe",
                acknowledgeBy: "",
                checkedBy: "",
                approvedBy: "",
                receivedBy: "",
                status: "prepared"
            };
            
            console.log('Development mode: Using dummy document data');
            currentDocumentData = dummyData;
            
            // Populate form fields
            populateFormFields(dummyData);
            
            // Populate table data
            populateTableData(dummyData.items || []);
            
            // Populate approval fields
            populateApprovalFields(dummyData);
            
            // Check document status and show/hide rejection remarks
            handleDocumentStatus(dummyData);
            
            // Close loading dialog
            Swal.close();
        } else {
            // Fetch document data from API
            const response = await fetch(`/api/invoice-items/${documentId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            currentDocumentData = data;
            
            // Populate form fields
            populateFormFields(data);
            
            // Populate table data
            populateTableData(data.items || []);
            
            // Populate approval fields
            populateApprovalFields(data);
            
            // Check document status and show/hide rejection remarks
            handleDocumentStatus(data);
            
            // Close loading dialog
            Swal.close();
        }
        
    } catch (error) {
        console.error('Error loading document:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load document data'
        });
    }
}

// Function to populate form fields
function populateFormFields(data) {
    // Header information
    document.getElementById('DocEntry').value = data.DocEntry || '';
    document.getElementById('DocNum').value = data.DocNum || '';
    document.getElementById('CardCode').value = data.CardCode || '';
    document.getElementById('CardName').value = data.CardName || '';
    document.getElementById('NumAtCard').value = data.NumAtCard || '';
    document.getElementById('DocCur').value = data.DocCur || '';
    document.getElementById('DocDate').value = data.DocDate || '';
    document.getElementById('GroupNum').value = data.GroupNum || '';
    document.getElementById('TrnspCode').value = data.TrnspCode || '';
    document.getElementById('U_BSI_ShippingType').value = data.U_BSI_ShippingType || '';
    document.getElementById('U_BSI_PaymentGroup').value = data.U_BSI_PaymentGroup || '';
    document.getElementById('U_BSI_UDF1').value = data.U_BSI_UDF1 || '';
    document.getElementById('U_BSI_UDF2').value = data.U_BSI_UDF2 || '';
    
    // Comments
    document.getElementById('comments').value = data.Comments || '';
    
    // Totals
    document.getElementById('PriceBefDi').value = data.PriceBefDi || 0;
    document.getElementById('VatSum').value = data.VatSum || 0;
    document.getElementById('DocTotal').value = data.DocTotal || 0;
}

// Function to populate table data
function populateTableData(items) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (!items || items.length === 0) {
        // Add empty row if no items
        addEmptyRow();
        return;
    }
    
    items.forEach((item, index) => {
        const row = createTableRow(item, index);
        tableBody.appendChild(row);
    });
    
    // Apply text wrapping to new rows
    refreshTextWrapping();
}

// Function to create table row
function createTableRow(item, index) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td class="p-2 border no-column">
            <input type="number" class="line-num-input no-input p-2 border rounded bg-gray-100" value="${index + 1}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border relative item-code-column">
            <input type="text" class="item-input item-code-input p-2 border rounded bg-gray-100" value="${item.ItemCode || ''}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${item.ItemName || ''}</textarea>
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-free-txt bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" style="height: 40px; vertical-align: top;" autocomplete="off" disabled>${item.FreeTxt || ''}</textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-sls-qty bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: center;" autocomplete="off" disabled>${item.SalesQty || ''}</textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-quantity bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: center;" autocomplete="off" disabled>${item.Quantity || ''}</textarea>
        </td>
        <td class="p-2 border uom-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="10" autocomplete="off" disabled value="${item.UoM || ''}" />
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-sls-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" autocomplete="off" disabled>${item.SalesPrice || ''}</textarea>
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" autocomplete="off" disabled>${item.Price || ''}</textarea>
        </td>
        <td class="p-2 border discount-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="8" autocomplete="off" disabled value="${item.Discount || ''}" />
        </td>
        <td class="p-2 border tax-code-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="8" autocomplete="off" disabled value="${item.TaxCode || ''}" />
        </td>
        <td class="p-2 border h-12 line-total-column">
            <textarea class="line-total-input item-line-total bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" autocomplete="off" disabled>${item.LineTotal || ''}</textarea>
        </td>
        <td class="p-2 border account-code-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="15" autocomplete="off" disabled value="${item.AccountCode || ''}" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${item.BaseType || 0}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${item.BaseEntry || 0}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${item.BaseLine || 0}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${item.LineType || 0}" disabled autocomplete="off" />
        </td>
    `;
    
    return row;
}

// Function to add empty row
function addEmptyRow() {
    const tableBody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td class="p-2 border no-column">
            <input type="number" class="line-num-input no-input p-2 border rounded bg-gray-100" value="0" disabled autocomplete="off" />
        </td>
        <td class="p-2 border relative item-code-column">
            <input type="text" class="item-input item-code-input p-2 border rounded bg-gray-100" disabled autocomplete="off" />
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off"></textarea>
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-free-txt bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" style="height: 40px; vertical-align: top;" autocomplete="off" disabled></textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-sls-qty bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: center;" autocomplete="off" disabled></textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-quantity bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: center;" autocomplete="off" disabled></textarea>
        </td>
        <td class="p-2 border uom-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="10" autocomplete="off" disabled />
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-sls-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" autocomplete="off" disabled></textarea>
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" autocomplete="off" disabled></textarea>
        </td>
        <td class="p-2 border discount-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="8" autocomplete="off" disabled />
        </td>
        <td class="p-2 border tax-code-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="8" autocomplete="off" disabled />
        </td>
        <td class="p-2 border h-12 line-total-column">
            <textarea class="line-total-input item-line-total bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" autocomplete="off" disabled></textarea>
        </td>
        <td class="p-2 border account-code-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="15" autocomplete="off" disabled />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="0" disabled autocomplete="off" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="0" disabled autocomplete="off" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="0" disabled autocomplete="off" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="0" disabled autocomplete="off" />
        </td>
    `;
    
    tableBody.appendChild(row);
}

// Function to populate approval fields
function populateApprovalFields(data) {
    // Prepared by
    if (data.PreparedBy) {
        document.getElementById('preparedBySearch').value = data.PreparedBy;
    }
    
    // Acknowledge by
    if (data.AcknowledgeBy) {
        document.getElementById('acknowledgeBySearch').value = data.AcknowledgeBy;
    }
    
    // Checked by
    if (data.CheckedBy) {
        document.getElementById('checkedBySearch').value = data.CheckedBy;
    }
    
    // Approved by
    if (data.ApprovedBy) {
        document.getElementById('approvedBySearch').value = data.ApprovedBy;
    }
    
    // Received by
    if (data.ReceivedBy) {
        document.getElementById('receivedBySearch').value = data.ReceivedBy;
    }
}

// Function to handle document status
function handleDocumentStatus(data) {
    const rejectionSection = document.getElementById('rejectionRemarksSection');
    const rejectionRemarks = document.getElementById('rejectionRemarks');
    
    if (data.Status === 'Rejected' && data.RejectionRemarks) {
        rejectionSection.style.display = 'block';
        rejectionRemarks.value = data.RejectionRemarks;
    } else {
        rejectionSection.style.display = 'none';
    }
}

// Function to approve invoice item
async function approveInvItem() {
    try {
        const result = await Swal.fire({
            title: 'Confirm Acknowledgment',
            text: 'Are you sure you want to acknowledge this invoice item?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Acknowledge!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            // Show loading state
            Swal.fire({
                title: 'Processing...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Get current user info
            const currentUser = getCurrentUser();
            
            // Prepare approval data
            const approvalData = {
                documentId: currentDocumentId,
                action: 'acknowledge',
                acknowledgedBy: currentUser.username,
                acknowledgedDate: new Date().toISOString(),
                status: 'Acknowledged'
            };

            // Send approval request
            const response = await fetch('/api/invoice-items/acknowledge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(approvalData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Invoice item has been acknowledged successfully.',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                goToMenuAcknowInvItem();
            });

        }
    } catch (error) {
        console.error('Error acknowledging invoice item:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to acknowledge invoice item'
        });
    }
}

// Function to reject invoice item
async function rejectInvItem() {
    try {
        const { value: rejectionReason } = await Swal.fire({
            title: 'Reject Invoice Item',
            input: 'textarea',
            inputLabel: 'Rejection Reason',
            inputPlaceholder: 'Please provide a reason for rejection...',
            inputAttributes: {
                'aria-label': 'Type your rejection reason here',
                'aria-describedby': 'swal2-description'
            },
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'You need to provide a rejection reason!';
                }
            }
        });

        if (rejectionReason) {
            // Show loading state
            Swal.fire({
                title: 'Processing...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Get current user info
            const currentUser = getCurrentUser();
            
            // Prepare rejection data
            const rejectionData = {
                documentId: currentDocumentId,
                action: 'reject',
                rejectedBy: currentUser.username,
                rejectedDate: new Date().toISOString(),
                rejectionReason: rejectionReason.trim(),
                status: 'Rejected'
            };

            // Send rejection request
            const response = await fetch('/api/invoice-items/reject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rejectionData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            Swal.fire({
                icon: 'success',
                title: 'Rejected!',
                text: 'Invoice item has been rejected successfully.',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                goToMenuAcknowInvItem();
            });
        }
    } catch (error) {
        console.error('Error rejecting invoice item:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to reject invoice item'
        });
    }
}

// Function to navigate back to menu
function goToMenuAcknowInvItem() {
    window.location.href = '../../dashboard/dashboardAcknowledge/invoiceItem/menuInvItemAcknow.html';
}

// Export functions for global access
window.approveInvItem = approveInvItem;
window.rejectInvItem = rejectInvItem;
window.goToMenuAcknowInvItem = goToMenuAcknowInvItem; 