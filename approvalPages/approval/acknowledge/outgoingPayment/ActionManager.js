class ActionManager {
    static async acknowledgeOPReim() {
        try {
            // Validate document status first
            const currentUser = getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated. Please login again.');
            }

            // Show loading indicator
            Swal.fire({
                title: 'Processing...',
                text: 'Submitting acknowledgment',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const userId = currentUser.userId;
            const currentDate = new Date().toISOString();

            // Prepare request data based on the API structure
            const requestData = {
                stagingID: checkState.documentId,
                createdAt: checkState.opReimData?.approval?.createdAt || currentDate,
                updatedAt: currentDate,
                approvalStatus: "Acknowledged",
                preparedBy: checkState.opReimData?.approval?.preparedBy || null,
                checkedBy: checkState.opReimData?.approval?.checkedBy || null,
                acknowledgedBy: userId,
                approvedBy: checkState.opReimData?.approval?.approvedBy || null,
                receivedBy: checkState.opReimData?.approval?.receivedBy || null,
                preparedDate: checkState.opReimData?.approval?.preparedDate || null,
                preparedByName: checkState.opReimData?.approval?.preparedByName || null,
                checkedByName: checkState.opReimData?.approval?.checkedByName || null,
                acknowledgedByName: currentUser.username,
                approvedByName: checkState.opReimData?.approval?.approvedByName || null,
                receivedByName: checkState.opReimData?.approval?.receivedByName || null,
                checkedDate: checkState.opReimData?.approval?.checkedDate || null,
                acknowledgedDate: currentDate,
                approvedDate: checkState.opReimData?.approval?.approvedDate || null,
                receivedDate: checkState.opReimData?.approval?.receivedDate || null,
                rejectedDate: null,
                rejectionRemarks: "",
                revisionNumber: checkState.opReimData?.approval?.revisionNumber || null,
                revisionDate: checkState.opReimData?.approval?.revisionDate || null,
                revisionRemarks: checkState.opReimData?.approval?.revisionRemarks || null,
                header: {}
            };

            // Log request data for debugging
            console.log('📤 Acknowledge Request Data:', requestData);

            // Make API request
            const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/approvals/${checkState.documentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json-patch+json'
                },
                body: JSON.stringify(requestData)
            });

            // Log response for debugging
            console.log('📥 Acknowledge Response Status:', response.status);
            console.log('📥 Acknowledge Response OK:', response.ok);

            if (!response.ok) {
                let errorMessage = `API error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.Message || errorMessage;
                } catch (e) {
                    console.error('Could not parse error response:', e);
                }
                throw new Error(errorMessage);
            }

            // Show success message
            await Swal.fire({
                title: 'Success',
                text: 'Document has been acknowledged successfully',
                icon: 'success'
            });

            // Redirect back to menu
            window.location.href = '../../../dashboard/dashboardAcknowledge/OPReim/menuOPReimAcknowledge.html';

        } catch (error) {
            console.error('Error acknowledging document:', error);
            await Swal.fire({
                title: 'Error',
                text: `Failed to acknowledge document: ${error.message}`,
                icon: 'error'
            });
        }
    }

    static async rejectOPReim() {
        try {
            // Validate document status first
            const currentUser = getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated. Please login again.');
            }

            // Create custom dialog with rejection reason field
            const { value: rejectionReason } = await Swal.fire({
                title: 'Reject Outgoing Payment Reimbursement',
                html: `
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 mb-3">Please provide a reason for rejection:</p>
                        <div id="rejectionFieldsContainer">
                            <textarea id="rejectionField1" class="w-full p-2 border rounded-md" placeholder="Enter rejection reason" rows="3"></textarea>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Reject',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                width: '600px',
                didOpen: () => {
                    const firstField = document.getElementById('rejectionField1');
                    if (firstField) {
                        const prefix = `[${currentUser.username}]: `;
                        firstField.value = prefix;
                        firstField.dataset.prefixLength = prefix.length;
                        firstField.setSelectionRange(prefix.length, prefix.length);
                        firstField.focus();
                    }
                },
                preConfirm: () => {
                    const field = document.querySelector('#rejectionFieldsContainer textarea');
                    const remarks = field ? field.value.trim() : '';
                    if (remarks === '') {
                        Swal.showValidationMessage('Please enter a rejection reason');
                        return false;
                    }
                    return remarks;
                }
            });

            if (!rejectionReason) {
                return; // User cancelled or didn't provide a reason
            }

            // Show loading indicator
            Swal.fire({
                title: 'Processing...',
                text: 'Rejecting document, please wait...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const userId = currentUser.userId;
            const currentDate = new Date().toISOString();

            // Prepare request data for rejection
            const requestData = {
                stagingID: checkState.documentId,
                createdAt: checkState.opReimData?.approval?.createdAt || currentDate,
                updatedAt: currentDate,
                approvalStatus: "Rejected",
                preparedBy: checkState.opReimData?.approval?.preparedBy || null,
                checkedBy: checkState.opReimData?.approval?.checkedBy || null,
                acknowledgedBy: userId,
                approvedBy: checkState.opReimData?.approval?.approvedBy || null,
                receivedBy: checkState.opReimData?.approval?.receivedBy || null,
                preparedDate: checkState.opReimData?.approval?.preparedDate || null,
                preparedByName: checkState.opReimData?.approval?.preparedByName || null,
                checkedByName: checkState.opReimData?.approval?.checkedByName || null,
                acknowledgedByName: currentUser.username,
                approvedByName: checkState.opReimData?.approval?.approvedByName || null,
                receivedByName: checkState.opReimData?.approval?.receivedByName || null,
                checkedDate: checkState.opReimData?.approval?.checkedDate || null,
                acknowledgedDate: null,
                approvedDate: checkState.opReimData?.approval?.approvedDate || null,
                receivedDate: checkState.opReimData?.approval?.receivedDate || null,
                rejectedDate: currentDate,
                rejectionRemarks: rejectionReason,
                revisionNumber: checkState.opReimData?.approval?.revisionNumber || null,
                revisionDate: checkState.opReimData?.approval?.revisionDate || null,
                revisionRemarks: checkState.opReimData?.approval?.revisionRemarks || null,
                header: {}
            };

            // Log request data for debugging
            console.log('📤 Reject Request Data:', requestData);

            // Make API request to reject document
            const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/approvals/${checkState.documentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            // Log response for debugging
            console.log('📥 Reject Response Status:', response.status);
            console.log('📥 Reject Response OK:', response.ok);

            if (!response.ok) {
                let errorMessage = `API error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.Message || errorMessage;
                } catch (e) {
                    console.error('Could not parse error response:', e);
                }
                throw new Error(errorMessage);
            }

            // Show success message
            await Swal.fire({
                title: 'Success',
                text: 'Document has been rejected',
                icon: 'success'
            });

            // Redirect back to menu
            window.location.href = '../../../dashboard/dashboardAcknowledge/OPReim/menuOPReimAcknowledge.html';

        } catch (error) {
            console.error('Error rejecting document:', error);
            await Swal.fire({
                title: 'Error',
                text: `Failed to reject document: ${error.message}`,
                icon: 'error'
            });
        }
    }
}
