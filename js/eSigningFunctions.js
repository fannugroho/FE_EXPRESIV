// E-Signing Functions for Invoice Item Receive Page

// Initialize E-Signing features
function initializeESigningFeatures() {
    // Setup file input event listener
    const fileInput = document.getElementById('eSignFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }

    // Setup drag and drop
    const uploadArea = document.getElementById('eSignUploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleFileDrop);
    }
}

// Show E-Signing section
function showESigningSection() {
    const eSigningSection = document.getElementById('eSigningSection');
    if (eSigningSection) {
        eSigningSection.style.display = 'block';
        eSigningSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Handle file selection
function handleFileSelection(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-blue-500', 'bg-blue-100');
}

// Handle drag leave
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
}

// Handle file drop
function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        validateAndSetFile(files[0]);
    }
}

// Validate and set file
function validateAndSetFile(file) {
    // Validate file type
    if (!file.type.includes('pdf')) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid File Type',
            text: 'Please upload a PDF file only.'
        });
        return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        Swal.fire({
            icon: 'error',
            title: 'File Too Large',
            text: 'Please upload a file smaller than 50MB.'
        });
        return;
    }

    selectedESignFile = file;
    displaySelectedFile(file);
    enableStartButton();
}

// Function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Display selected file
function displaySelectedFile(file) {
    const fileName = document.getElementById('selectedFileName');
    const fileSize = document.getElementById('selectedFileSize');
    const fileDisplay = document.getElementById('selectedFileDisplay');
    
    if (fileName && fileSize && fileDisplay) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileDisplay.classList.remove('hidden');
    }
}

// Remove selected file
function removeSelectedFile() {
    selectedESignFile = null;
    const fileDisplay = document.getElementById('selectedFileDisplay');
    const fileInput = document.getElementById('eSignFileInput');
    
    if (fileDisplay) {
        fileDisplay.classList.add('hidden');
    }
    if (fileInput) {
        fileInput.value = '';
    }
    
    disableStartButton();
}

// Enable start button
function enableStartButton() {
    const startBtn = document.getElementById('startESignBtn');
    const eStampCheckbox = document.getElementById('enableEStamp');
    if (startBtn) {
        startBtn.disabled = false;
    }
    // Enable e-stamp checkbox when file is selected
    if (eStampCheckbox) {
        eStampCheckbox.disabled = false;
    }
}

// Disable start button
function disableStartButton() {
    const startBtn = document.getElementById('startESignBtn');
    const eStampCheckbox = document.getElementById('enableEStamp');
    if (startBtn) {
        startBtn.disabled = true;
    }
    // Disable e-stamp checkbox when no file is selected
    if (eStampCheckbox) {
        eStampCheckbox.disabled = true;
        eStampCheckbox.checked = false;
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Start E-Signing process
async function startESigningProcess() {
    if (!selectedESignFile) {
        Swal.fire({
            icon: 'warning',
            title: 'No File Selected',
            text: 'Please select a PDF file to sign.'
        });
        return;
    }

    try {
        // Update UI to processing state
        updateStepProgress(2);
        showProcessingSection();
        hideUploadSection();

        // Convert PDF to base64
        updateProcessStatus('Converting document to base64...', 10);
        const documentBase64 = await fileToBase64(selectedESignFile);

        // Get document ID from current invoice data
        const docEntry = document.getElementById('DocEntry')?.value;
        if (!docEntry) {
            throw new Error('Document ID not found');
        }

        // Prepare API payload
        const apiPayload = {
            document_base64: documentBase64,
            sign_image_name: "Atsuro Suzuki", // Default signer name
            document_type: "ARInvoices",
            document_id: docEntry
        };

        // Call E-Sign API
        updateProcessStatus('Sending document for e-signing...', 30);
        console.log('📝 E-Sign API payload:', apiPayload);
        console.log('📍 E-Sign URL:', 'https://dentsu-kansai-expressiv.idsdev.site/esign/process');
        
        const response = await fetch('https://dentsu-kansai-expressiv.idsdev.site/esign/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiPayload)
        });

        console.log('📝 E-Sign response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ E-Sign API error:', errorText);
            throw new Error(`E-Sign API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('📝 E-Sign API result:', result);
        
        // Try different possible job ID fields
        currentJobId = result.jobId || result.job_id || result.id || result.data?.jobId || result.data?.job_id || result.data?.id;

        if (!currentJobId) {
            console.error('❌ No job ID found in e-sign response:', result);
            throw new Error('No job ID returned from e-sign API');
        }

        console.log('📝 E-Sign Job ID:', currentJobId);

        updateProcessStatus('Document submitted for e-signing...', 50);

        // Wait 25 seconds before checking status
        updateProcessStatus('Processing e-signature...', 60);
        await new Promise(resolve => setTimeout(resolve, 25000));

        // Start checking job status
        await checkESignJobStatus();

    } catch (error) {
        console.error('E-Signing error:', error);
        showErrorState(error.message);
    }
}

// Check E-Sign job status
async function checkESignJobStatus() {
    if (!currentJobId) {
        throw new Error('No job ID available');
    }

    try {
        const statusUrl = `https://dentsu-kansai-expressiv.idsdev.site/jobs/${currentJobId}/status`;
        const response = await fetch(statusUrl);

        if (!response.ok) {
            throw new Error(`Status check failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.job) {
            const job = result.job;
            
            if (job.status === 'completed') {
                // E-Signing completed
                signedDocumentUrl = extractSignedUrl(job.result);
                updateProcessStatus('E-signature completed successfully!', 100);
                
                // Check if E-Stamp is requested
                const enableEStamp = document.getElementById('enableEStamp')?.checked;
                if (enableEStamp) {
                    await startEStampProcess();
                } else {
                    showCompletionSection(false);
                }
                
            } else if (job.status === 'failed' || job.status === 'error') {
                throw new Error(job.error || 'E-signing failed');
            } else {
                // Still processing, check again in 10 seconds
                updateProcessStatus('E-signature in progress...', 75);
                setTimeout(() => checkESignJobStatus(), 10000);
            }
        } else {
            throw new Error('Invalid status response');
        }

    } catch (error) {
        console.error('Status check error:', error);
        
        // Retry once more after 10 seconds
        if (!statusCheckInterval) {
            statusCheckInterval = setTimeout(() => {
                statusCheckInterval = null;
                checkESignJobStatus();
            }, 10000);
        } else {
            throw error;
        }
    }
}

// Extract signed document URL from result
function extractSignedUrl(resultString) {
    if (!resultString) return null;
    
    // Look for URL pattern in the result string
    const urlMatch = resultString.match(/Signed URL: (https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : null;
}

// Start E-Stamp process
async function startEStampProcess() {
    try {
        updateProcessStatus('Starting e-stamp process...', 80);
        
        const docEntry = document.getElementById('DocEntry')?.value;
        if (!docEntry) {
            throw new Error('Document ID not found');
        }

        // Check if there's a QR code source from the invoice data
        // Use the same logic as in printARItem.js
        let qrcodeSrc = '';
        let hasQrCode = false;
        
        // Try to get QR code from current invoice data
        // currentInvItemData is defined in receiveInvItem.js
        if (typeof currentInvItemData !== 'undefined' && currentInvItemData && currentInvItemData.qrCodeSrc) {
            qrcodeSrc = currentInvItemData.qrCodeSrc;
            console.log('🔍 QR Code from invoice data:', qrcodeSrc);
        } else {
            // Fallback to HTML element if exists
            const qrElement = document.getElementById('qrcodeSrc');
            if (qrElement) {
                qrcodeSrc = qrElement.value || '';
                console.log('🔍 QR Code from HTML element:', qrcodeSrc);
            } else {
                console.log('🔍 No QR Code element found, defaulting to empty');
            }
        }
        
        // Check if QR code is valid (not null, empty, or "null" string)
        hasQrCode = qrcodeSrc && 
                   qrcodeSrc !== null && 
                   qrcodeSrc.trim() !== '' && 
                   qrcodeSrc !== 'null' && 
                   qrcodeSrc.toLowerCase() !== 'null';
        
        console.log('🔍 QR Code source:', qrcodeSrc);
        console.log('🔍 Has QR Code:', hasQrCode);

        const stampPayload = {
            is_document_withqrcode: hasQrCode
        };

        console.log('🏷️ E-Stamp payload:', stampPayload);
        console.log('📍 E-Stamp URL:', `https://dentsu-kansai-expressiv.idsdev.site/esign/stamp/ARInvoices/${docEntry}`);

        const stampUrl = `https://dentsu-kansai-expressiv.idsdev.site/esign/stamp/ARInvoices/${docEntry}`;
        const response = await fetch(stampUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stampPayload)
        });

        console.log('🏷️ E-Stamp response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ E-Stamp API error response:', errorText);
            throw new Error(`E-Stamp API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🏷️ E-Stamp API result:', result);
        
        // Try different possible job ID fields
        stampJobId = result.jobId || result.job_id || result.id || result.data?.jobId || result.data?.job_id || result.data?.id;

        if (!stampJobId) {
            console.error('❌ No stamp job ID found in response:', result);
            throw new Error('No stamp job ID returned from API');
        }

        console.log('🏷️ Stamp Job ID:', stampJobId);
        updateProcessStatus('E-stamp request submitted...', 85);

        // Wait 1 minute and 5 seconds before checking status
        console.log('⏳ Waiting 65 seconds before checking e-stamp status...');
        await new Promise(resolve => setTimeout(resolve, 65000));

        // Start checking stamp job status
        await checkEStampJobStatus();

    } catch (error) {
        console.error('❌ E-Stamp error:', error);
        // If e-stamp fails, still show the signed document
        showCompletionSection(false);
        Swal.fire({
            icon: 'warning',
            title: 'E-Stamp Failed',
            text: `E-signature completed successfully, but e-stamp failed: ${error.message}. You can download the signed document.`
        });
    }
}

// Check E-Stamp job status
async function checkEStampJobStatus() {
    if (!stampJobId) {
        throw new Error('No stamp job ID available');
    }

    try {
        const statusUrl = `https://dentsu-kansai-expressiv.idsdev.site/jobs/${stampJobId}/status`;
        console.log('🔍 Checking e-stamp status at:', statusUrl);
        
        const response = await fetch(statusUrl);
        console.log('🔍 E-Stamp status response:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ E-Stamp status check error:', errorText);
            throw new Error(`Stamp status check failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🔍 E-Stamp status result:', result);
        
        if (result.success && result.job) {
            const job = result.job;
            console.log('🔍 E-Stamp job status:', job.status);
            
            if (job.status === 'completed') {
                // E-Stamp completed
                stampedDocumentUrl = extractStampedFileName(job.result);
                console.log('✅ E-Stamp completed, file:', stampedDocumentUrl);
                updateProcessStatus('E-stamp completed successfully!', 100);
                showCompletionSection(true);
                
            } else if (job.status === 'failed' || job.status === 'error') {
                const errorMsg = job.error || job.result || 'E-stamping failed';
                console.error('❌ E-Stamp job failed:', errorMsg);
                throw new Error(errorMsg);
            } else {
                // Still processing, check again in 20 seconds
                console.log('⏳ E-Stamp still processing, will check again in 20 seconds...');
                updateProcessStatus('E-stamp in progress...', 95);
                setTimeout(() => checkEStampJobStatus(), 20000);
            }
        } else {
            console.error('❌ Invalid e-stamp status response:', result);
            throw new Error('Invalid stamp status response');
        }

    } catch (error) {
        console.error('❌ Stamp status check error:', error);
        
        // If e-stamp fails, still show the signed document
        showCompletionSection(false);
        Swal.fire({
            icon: 'warning',
            title: 'E-Stamp Failed',
            text: `E-signature completed successfully, but e-stamp failed: ${error.message}. You can download the signed document.`
        });
    }
}

// Extract stamped document filename from result
function extractStampedFileName(resultString) {
    if (!resultString) return null;
    
    // Look for stamped filename pattern in the result string
    const fileMatch = resultString.match(/stamped_ARInvoices_[^,\s]+\.pdf/);
    return fileMatch ? fileMatch[0] : null;
}

// Update step progress
function updateStepProgress(step) {
    const eSignStep = document.getElementById('eSignStep');
    if (eSignStep) {
        eSignStep.textContent = `${step} of 3`;
    }

    // Update step indicators
    for (let i = 1; i <= 3; i++) {
        const stepElement = document.getElementById(`step${i}`);
        const progressElement = document.getElementById(`progress${i}`);
        
        if (stepElement && progressElement) {
            if (i < step) {
                // Completed step
                stepElement.querySelector('div').className = 'w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold';
                stepElement.querySelector('span').className = 'text-sm font-medium text-green-600';
                progressElement.style.width = '100%';
            } else if (i === step) {
                // Current step
                stepElement.querySelector('div').className = 'w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold';
                stepElement.querySelector('span').className = 'text-sm font-medium text-blue-600';
                progressElement.style.width = '50%';
            } else {
                // Future step
                stepElement.querySelector('div').className = 'w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold';
                stepElement.querySelector('span').className = 'text-sm font-medium text-gray-500';
                progressElement.style.width = '0%';
            }
        }
    }
}

// Show processing section
function showProcessingSection() {
    const uploadSection = document.getElementById('uploadSection');
    const processingSection = document.getElementById('processingSection');
    const completionSection = document.getElementById('completionSection');
    
    if (uploadSection) uploadSection.classList.add('hidden');
    if (processingSection) processingSection.classList.remove('hidden');
    if (completionSection) completionSection.classList.add('hidden');
}

// Hide upload section
function hideUploadSection() {
    const uploadSection = document.getElementById('uploadSection');
    if (uploadSection) {
        uploadSection.classList.add('hidden');
    }
}

// Show completion section
function showCompletionSection(hasStamp) {
    updateStepProgress(3);
    
    const uploadSection = document.getElementById('uploadSection');
    const processingSection = document.getElementById('processingSection');
    const completionSection = document.getElementById('completionSection');
    const downloadStampedBtn = document.getElementById('downloadStampedBtn');
    const completionMessage = document.getElementById('completionMessage');
    
    if (uploadSection) uploadSection.classList.add('hidden');
    if (processingSection) processingSection.classList.add('hidden');
    if (completionSection) completionSection.classList.remove('hidden');
    
    if (hasStamp && downloadStampedBtn) {
        downloadStampedBtn.classList.remove('hidden');
        if (completionMessage) {
            completionMessage.textContent = 'Your document has been digitally signed and stamped, and is ready for download.';
        }
    } else {
        if (downloadStampedBtn) downloadStampedBtn.classList.add('hidden');
        if (completionMessage) {
            completionMessage.textContent = 'Your document has been digitally signed and is ready for download.';
        }
    }
}

// Update process status
function updateProcessStatus(status, percentage) {
    const processStatus = document.getElementById('processStatus');
    const processPercentage = document.getElementById('processPercentage');
    const processProgressBar = document.getElementById('processProgressBar');
    
    if (processStatus) processStatus.textContent = status;
    if (processPercentage) processPercentage.textContent = `${percentage}%`;
    if (processProgressBar) processProgressBar.style.width = `${percentage}%`;
    
    // Update time remaining estimate
    const timeRemaining = document.getElementById('timeRemaining');
    if (timeRemaining) {
        if (percentage < 50) {
            timeRemaining.textContent = '2-3 minutes';
        } else if (percentage < 80) {
            timeRemaining.textContent = '1-2 minutes';
        } else if (percentage < 95) {
            timeRemaining.textContent = '30-60 seconds';
        } else {
            timeRemaining.textContent = 'Almost done...';
        }
    }
}

// Show error state
function showErrorState(errorMessage) {
    const uploadSection = document.getElementById('uploadSection');
    const processingSection = document.getElementById('processingSection');
    const completionSection = document.getElementById('completionSection');
    
    if (uploadSection) uploadSection.classList.remove('hidden');
    if (processingSection) processingSection.classList.add('hidden');
    if (completionSection) completionSection.classList.add('hidden');
    
    updateStepProgress(1);
    
    Swal.fire({
        icon: 'error',
        title: 'E-Signing Failed',
        text: errorMessage || 'An error occurred during the e-signing process. Please try again.',
        confirmButtonText: 'Try Again'
    });
}

// Download original document (placeholder function)
function downloadOriginalDocument() {
    // This function should generate/download the original PDF
    // Implementation depends on your existing document generation logic
    Swal.fire({
        icon: 'info',
        title: 'Download Original Document',
        text: 'This feature will download the original document for signing.'
    });
}

// Download signed document
async function downloadSignedDocument() {
    if (!signedDocumentUrl) {
        Swal.fire({
            icon: 'error',
            title: 'No Signed Document',
            text: 'No signed document URL available.'
        });
        return;
    }

    try {
        // Create download link
        const link = document.createElement('a');
        link.href = signedDocumentUrl;
        link.download = `signed_invoice_${document.getElementById('DocEntry')?.value || 'document'}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
            icon: 'success',
            title: 'Download Started',
            text: 'Your signed document download has started.',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Download error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: 'Failed to download the signed document. Please try again.'
        });
    }
}

// Download stamped document
async function downloadStampedDocument() {
    if (!stampedDocumentUrl) {
        Swal.fire({
            icon: 'error',
            title: 'No Stamped Document',
            text: 'No stamped document available.'
        });
        return;
    }

    try {
        const downloadUrl = `https://dentsu-kansai-expressiv.idsdev.site/esign/download/stamped/ARInvoices/${stampedDocumentUrl}`;
        
        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = stampedDocumentUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
            icon: 'success',
            title: 'Download Started',
            text: 'Your signed and stamped document download has started.',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Download error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: 'Failed to download the stamped document. Please try again.'
        });
    }
}