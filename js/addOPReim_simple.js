// Simplified version of collectFormData for testing
function collectFormDataSimple(userId, isSubmit) {
    const stagingID = `OP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare the main request data - header only
    const requestData = {
        stagingID: stagingID,
        address: document.getElementById("Address")?.value || "",
        cardName: document.getElementById("CardName")?.value || "",
        docDate: document.getElementById("DocDate")?.value ? new Date(document.getElementById("DocDate").value).toISOString() : null,
        docDueDate: document.getElementById("DocDueDate")?.value ? new Date(document.getElementById("DocDueDate").value).toISOString() : null,
        taxDate: document.getElementById("DocDate")?.value ? new Date(document.getElementById("DocDate").value).toISOString() : null,
        counterRef: document.getElementById("CounterRef")?.value || document.getElementById("DocNum")?.value || "",
        docNum: Math.floor(Math.random() * 1000000),
        comments: document.getElementById("remarks")?.value || "",
        jrnlMemo: document.getElementById("jrnlMemo")?.value || "",
        remarks: document.getElementById("remarks")?.value || "",
        journalRemarks: document.getElementById("journalRemarks")?.value || "",
        doctype: document.getElementById("Doctype")?.value || "A",
        docCurr: document.getElementById("DocCurr")?.value || "IDR",
        diffCurr: document.getElementById("DocCurr")?.value || "IDR",
        remittanceRequestAmount: parseCurrency(document.getElementById("RemittanceRequestAmount")?.value) || 0,
        trsfrDate: document.getElementById("TrsfrDate")?.value ? new Date(document.getElementById("TrsfrDate").value).toISOString() : null,
        trsfrAcct: document.getElementById("TrsfrAcct")?.value || "",
        trsfrSum: parseCurrency(document.getElementById("TrsfrSum")?.value) || 0,
        isInterfaced: false,
        type: "REIMBURSEMENT",
        expressivNo: document.getElementById("CounterRef")?.value || "",
        requesterId: getUserGuid(userId),
        requesterName: document.getElementById("RequesterName")?.value || ""
    };
    
    console.log('Collected simple form data:', requestData);
    return requestData;
}

// Modified submit function for testing
async function submitDocumentSimple(isSubmit = false) {
    try {
        const userId = getUserId();
        if (!userId) {
            throw new Error("Cannot get user ID from token. Please login again.");
        }

        const formData = collectFormDataSimple(userId, isSubmit);
        
        console.log('Sending data:', formData);

        const apiUrl = '/api/staging-outgoing-payments/headers';
        const response = await makeAuthenticatedRequest(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Success:', result);
        
        Swal.fire({
            title: 'Success!',
            text: 'Document created successfully',
            icon: 'success',
            confirmButtonText: 'OK'
        });

        return result;

    } catch (error) {
        console.error("Error submitting document:", error);
        Swal.fire({
            title: 'Error',
            text: error.message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Make function available globally
window.submitDocumentSimple = submitDocumentSimple;