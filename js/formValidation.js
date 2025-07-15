// Fungsi untuk validasi form reimbursement
function validateReimbursementForm() {
    // Daftar field yang wajib diisi
    const mandatoryFields = [
        { id: "requesterNameSearch", label: "Requester Name" },
        { id: "currency", label: "Currency" },
        { id: "payToSearch", label: "Pay To" },
        { id: "postingDate", label: "Submission Date" },
        { id: "filePath", label: "Attach Doc" },
        { id: "referenceDoc", label: "Reference Doc" },
        { id: "typeOfTransaction", label: "Type of Transaction" }
    ];

    // Cek apakah ada field yang kosong
    let emptyFields = [];
    
    mandatoryFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element) return;
        
        // Khusus untuk file input, cek apakah ada file yang dipilih
        if (field.id === "filePath") {
            if (element.files.length === 0) {
                emptyFields.push(field.label);
                highlightField(element, true);
            } else {
                highlightField(element, false);
            }
        } 
        // Untuk field lainnya, cek apakah nilainya kosong
        else {
            if (!element.value.trim()) {
                emptyFields.push(field.label);
                highlightField(element, true);
            } else {
                highlightField(element, false);
            }
        }
    });

    // Validasi tabel detail reimbursement
    const tableRows = document.querySelectorAll("#tableBody tr");
    let hasEmptyTableFields = false;
    
    tableRows.forEach((row, index) => {
        const categoryInput = row.querySelector('.category-search');
        const accountNameInput = row.querySelector('.account-name-search');
        const descriptionInput = row.querySelector('td:nth-child(4) input');
        const amountInput = row.querySelector('td:nth-child(5) input');
        
        // Cek category
        if (!categoryInput.value.trim()) {
            highlightField(categoryInput, true);
            hasEmptyTableFields = true;
        } else {
            highlightField(categoryInput, false);
        }
        
        // Cek account name
        if (!accountNameInput.value.trim()) {
            highlightField(accountNameInput, true);
            hasEmptyTableFields = true;
        } else {
            highlightField(accountNameInput, false);
        }
        
        // Cek description
        if (!descriptionInput.value.trim()) {
            highlightField(descriptionInput, true);
            hasEmptyTableFields = true;
        } else {
            highlightField(descriptionInput, false);
        }
        
        // Cek amount (nilai harus lebih dari 0)
        const amountValue = parseCurrencyIDR(amountInput.value);
        if (amountValue <= 0) {
            highlightField(amountInput, true);
            hasEmptyTableFields = true;
        } else {
            highlightField(amountInput, false);
        }
    });
    
    if (hasEmptyTableFields) {
        emptyFields.push("Detail Reimbursement (Category, Account Name, Description, Amount)");
    }

    // Jika ada field yang kosong, tampilkan pesan error
    if (emptyFields.length > 0) {
        Swal.fire({
            icon: 'error',
            title: 'Form Tidak Lengkap',
            html: `Silakan lengkapi field berikut:<br><ul class="text-left"><li>${emptyFields.join('</li><li>')}</li></ul>`,
            confirmButtonText: 'OK'
        });
        return false;
    }
    
    return true;
}

// Fungsi untuk highlight field yang kosong
function highlightField(element, isError) {
    if (isError) {
        element.classList.add('border-red-500');
        element.classList.remove('border-gray-300');
    } else {
        element.classList.remove('border-red-500');
        element.classList.add('border-gray-300');
    }
}

// Fungsi untuk menghapus highlight pada semua field
function resetFieldHighlights() {
    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.classList.remove('border-red-500');
        input.classList.add('border-gray-300');
    });
} 