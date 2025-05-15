# Reimbursement API Endpoints

This document provides a comprehensive overview of all API endpoints related to the Reimbursement system, as implemented based on the requirements in the Kansai Paint Indonesia blueprint document.

## Reimbursement Controller Endpoints

| Endpoint | Method | Description | Notes |
|----------|--------|-------------|-------|
| `/api/reimbursements` | GET | Retrieves all reimbursements | Returns all reimbursement documents in the system |
| `/api/reimbursements/{id}` | GET | Retrieves a specific reimbursement by ID | Used for viewing detailed information about a reimbursement |
| `/api/reimbursements/status/{status}` | GET | Retrieves reimbursements filtered by status | Useful for dashboard views based on status (Draft, Checked, Approved, Paid, Closed, Rejected) |
| `/api/reimbursements/user/{username}` | GET | Retrieves reimbursements for a specific user | Allows users to view their own reimbursement requests |
| `/api/reimbursements/status-counts` | GET | Retrieves count of reimbursements by status | Powers the dashboard cards showing counts by status |
| `/api/reimbursements` | POST | Creates a new reimbursement | When users click "Create Reimbursement" button |
| `/api/reimbursements/{id}` | PUT | Updates an existing reimbursement | Used when editing a reimbursement (only allowed in Draft or Rejected status) |
| `/api/reimbursements/{id}` | DELETE | Deletes a reimbursement | Should only be allowed for draft reimbursements |
| `/api/reimbursements/{id}/status` | PATCH | Updates the status of a reimbursement | Used during approval workflow (Checker and Approver) |

## Reimbursement Attachment Controller Endpoints

| Endpoint | Method | Description | Notes |
|----------|--------|-------------|-------|
| `/api/reimbursements/{reimbursementId}/attachments/upload` | POST | Uploads attachment files | Allows multiple file uploads; only allowed when reimbursement is in Draft or Rejected status |
| `/api/reimbursements/{reimbursementId}/attachments/{attachmentId}` | DELETE | Deletes a specific attachment | Only allowed when reimbursement is in Draft or Rejected status |
| `/api/reimbursements/{reimbursementId}/attachments` | GET | Retrieves all attachments for a reimbursement | Used to display attached documents in the UI |

## Reimbursement SAP Integration Controller Endpoints

| Endpoint | Method | Description | Notes |
|----------|--------|-------------|-------|
| `/api/reimbursements/sap/pending-payments` | GET | Retrieves reimbursements pending payment | Used by finance team to see approved reimbursements ready for payment |
| `/api/reimbursements/sap/interface-to-sap` | POST | Interfaces an approved reimbursement to SAP | Creates "Outgoing Payments Draft" in SAP; only works with "Approved" status reimbursements |
| `/api/reimbursements/sap/update-payment-status` | POST | Updates payment status from SAP | Updates reimbursement status based on payment result (Completed → Closed, Failed → Approved with remarks) |

## Important Notes

1. **Status Flow**: Reimbursements follow a specific status progression:
   - Draft → Checked → Approved → Paid → Closed
   - Can be rejected at Checker or Approver stage

2. **Attachment Restrictions**: 
   - Document attachments can only be uploaded or deleted when the reimbursement is in Draft or Rejected status
   - Support document uploads are required as per the business process

3. **SAP Integration**:
   - Only approved reimbursements can be interfaced to SAP
   - Payment status updates come from SAP to close the workflow loop
   - The "Paid" status is set when the reimbursement is interfaced to SAP
   - The "Closed" status is set when payment is confirmed completed

4. **Security Considerations**:
   - Authorization is currently commented out but should be implemented in production
   - SAP integration endpoints should be restricted to Finance and Administrator roles

5. **Data Requirements**:
   - Reimbursement requires information like Voucher No, Requester, Department, Currency, etc.
   - Transaction details including GL Account, Account Name, and Amount are required
   - Reference documents and type of transaction must be specified 