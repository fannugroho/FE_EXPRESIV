document.addEventListener("DOMContentLoaded", function () {
    // Hapus array dokumen yang tidak lagi digunakan
    // let filesArray = []; // Array to store uploaded files
    let excelData = []; // Store excel data globally
    let originalFileName = ""; // Store the original filename
  
    // Excel File Upload Handling
    let excelFileInput = document.getElementById("excelFile");
    let dropArea = excelFileInput ? excelFileInput.parentElement : null;
  
    // Add download template button functionality
    addDownloadTemplateButton();
  
    // Add drag and drop functionality
    if (dropArea) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
      });
      
      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
      });
      
      function highlight() {
        dropArea.classList.add('border-blue-500', 'bg-blue-50');
      }
      
      function unhighlight() {
        dropArea.classList.remove('border-blue-500', 'bg-blue-50');
      }
      
      dropArea.addEventListener('drop', handleDrop, false);
      
      function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
          excelFileInput.files = files;
          handleExcelFile(files[0]);
        }
      }
    }
  
    // Excel file upload via input
    if (excelFileInput) {
      excelFileInput.addEventListener("change", function(event) {
        if (event.target.files.length) {
          handleExcelFile(event.target.files[0]);
        }
      });
    }
  
    function handleExcelFile(file) {
      // Store the original filename
      originalFileName = file.name;
      
      // Show loading state
      const tableBody = document.getElementById("employeeTableBody");
      if (tableBody) {
        tableBody.innerHTML = `
          <tr class="text-center">
            <td colspan="8" class="py-8">
              <div class="flex justify-center items-center">
                <svg class="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Excel file...
              </div>
            </td>
          </tr>
        `;
      }
      
      // Check file extension to determine type
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        showNotification('Unsupported file format. Please use Excel (.xlsx, .xls) or CSV files.', 'error');
        resetTableBody(tableBody);
        return;
      }
      
      console.log("Memproses file:", file.name, "Tipe:", file.type, "Ukuran:", file.size);
      
      let reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          console.log("File berhasil dibaca");
          let data = new Uint8Array(e.target.result);
          
          // Log untuk debugging
          console.log("Data binary size:", data.length, "bytes");
          
          let workbook;
          try {
            workbook = XLSX.read(data, { type: "array" });
            console.log("Workbook berhasil dibaca. Sheet names:", workbook.SheetNames);
          } catch (xlsxError) {
            console.error("Error saat membaca workbook:", xlsxError);
            showNotification('Error processing Excel file. Try a different file format.', 'error');
            resetTableBody(tableBody);
            return;
          }
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            console.error("Tidak ada sheet dalam workbook");
            showNotification('Excel file has no data sheets.', 'error');
            resetTableBody(tableBody);
            return;
          }
          
          let firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          console.log("First sheet name:", workbook.SheetNames[0]);
          
          if (!firstSheet) {
            console.error("Sheet pertama tidak ditemukan");
            showNotification('Data sheet not found in Excel file.', 'error');
            resetTableBody(tableBody);
            return;
          }
          
          // Coba dapatkan range dari sheet
          const range = XLSX.utils.decode_range(firstSheet['!ref'] || "A1");
          console.log("Sheet range:", firstSheet['!ref'], "Row count:", range.e.r + 1);
          
          // Ekstrak data dari sheet dengan header:1 untuk memastikan header row dikenali
          try {
            // Get as array of arrays with header
            excelData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            console.log("Data berhasil diekstrak. Row count:", excelData.length);
            console.log("Header row:", excelData[0]);
            
            if (excelData.length <= 1) {
              console.warn("File Excel hanya berisi header atau kosong");
              showNotification('Excel file contains no data or only headers.', 'warning');
              resetTableBody(tableBody, `
                <tr class="text-center text-yellow-500">
                  <td colspan="8" class="py-8">
                    <div class="flex flex-col items-center">
                      <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                      <p>Excel file contains no data or only headers.</p>
                    </div>
                  </td>
                </tr>
              `);
              return;
            }
          } catch (jsonError) {
            console.error("Error saat mengkonversi sheet ke JSON:", jsonError);
            showNotification('Error extracting data from Excel file.', 'error');
            resetTableBody(tableBody);
            return;
          }
          
          // Get header row to validate columns
          let headerRow = excelData[0];
          console.log("Validasi header row:", headerRow);
          
          // Check if essential columns exist
          if (!validateExcelStructure(headerRow)) {
            const errorMessage = `
              <tr class="text-center text-red-500">
                <td colspan="8" class="py-8">
                  <div class="flex flex-col items-center">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p class="font-semibold mb-1">Invalid Excel file format</p>
                    <p class="text-sm mb-3">The uploaded file does not have the required columns</p>
                    <div class="text-left text-xs bg-red-50 p-3 rounded-md border border-red-200 max-w-md">
                      <p class="font-semibold mb-1">Required columns:</p>
                      <ul class="list-disc pl-4 space-y-1">
                        <li>Username</li>
                        <li>Email</li>
                        <li>Password</li>
                        <li>First Name</li>
                        <li>Last Name</li>
                        <li>Kansai Employee ID</li>
                        <li>Position</li>
                        <li>Department Name</li>
                      </ul>
                      <p class="mt-2">Optional: Middle Name, Phone Number, Roles</p>
                      <p class="mt-2 font-semibold">Please download the template for the correct format.</p>
                    </div>
                  </div>
                </td>
              </tr>
            `;
            
            resetTableBody(tableBody, errorMessage);
            showNotification('Excel file does not have the required columns. Please download the template for the correct format.', 'error');
            return;
          }
          
          // Process and normalize data
          normalizeExcelData();
          
          // Display in table
          console.log("Menampilkan data di tabel. Row count:", excelData.length);
          displayExcelData(excelData);
          
          // Save to localStorage with metadata
          saveExcelDataToStorage();
          
          // Show success notification
          showNotification(`File "${originalFileName}" berhasil diproses!`, 'success');
        } catch (error) {
          console.error("Error memproses file Excel:", error);
          showNotification('Error processing file. Please check file format.', 'error');
          resetTableBody(tableBody);
        }
      };
      
      reader.onerror = function(event) {
        console.error("FileReader error:", event);
        showNotification('Error reading file', 'error');
        resetTableBody(tableBody);
      };
      
      reader.readAsArrayBuffer(file);
    }
    
    function validateExcelStructure(headerRow) {
      if (!headerRow || headerRow.length < 8) return false;
      
      const headerLower = headerRow.map(h => String(h).toLowerCase());
      
      // Required columns for the new API
      const requiredFields = [
        'username',
        'email', 
        'password',
        'first name',
        'last name',
        'kansai employee id',
        'position',
        'department name'
      ];
      
      // Check if all required fields exist
      const missingFields = requiredFields.filter(field => 
        !headerLower.some(h => h.includes(field.toLowerCase()))
      );
      
      if (missingFields.length > 0) {
        console.warn('Missing required fields:', missingFields);
        
        // Show detailed error message with correct format
        const errorMessage = `
          <tr class="text-center text-red-500">
            <td colspan="8" class="py-8">
              <div class="flex flex-col items-center">
                <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                <p class="font-semibold mb-1">Invalid Excel file format</p>
                <p class="text-sm mb-3">The uploaded file does not have the required columns</p>
                <div class="text-left text-xs bg-red-50 p-3 rounded-md border border-red-200 max-w-md">
                  <p class="font-semibold mb-1">Required columns:</p>
                  <ul class="list-disc pl-4 space-y-1">
                    <li>Username</li>
                    <li>Email</li>
                    <li>Password</li>
                    <li>First Name</li>
                    <li>Last Name</li>
                    <li>Kansai Employee ID</li>
                    <li>Position</li>
                    <li>Department Name</li>
                  </ul>
                  <p class="mt-2">Optional: Middle Name, Phone Number, Roles</p>
                  <p class="mt-2 font-semibold">Please download the template for the correct format.</p>
                </div>
              </div>
            </td>
          </tr>
        `;
        
        const tableBody = document.getElementById("employeeTableBody");
        if (tableBody) {
          tableBody.innerHTML = errorMessage;
        }
        
        return false;
      }
      
      return true;
    }
    
    function normalizeExcelData() {
      // If we have data, ensure each row has the expected number of columns
      if (!excelData || excelData.length <= 1) {
        console.warn("Tidak ada data untuk dinormalisasi atau hanya berisi header");
        return;
      }
      
      console.log("Mulai normalisasi data Excel. Row count sebelum:", excelData.length);
      
      // Get the expected column count from header
      const columnCount = excelData[0].length;
      console.log("Jumlah kolom yang diharapkan:", columnCount);
      
      let emptyRowCount = 0;
      let normalizedRowCount = 0;
      
      // Process each data row (skip header)
      for (let i = 1; i < excelData.length; i++) {
        // Skip completely empty rows
        if (!excelData[i] || excelData[i].length === 0 || excelData[i].every(cell => cell === null || cell === undefined || cell === '')) {
          console.log(`Baris ${i} kosong, akan dihapus`);
          excelData.splice(i, 1);
          i--; // Adjust index after removing an element
          emptyRowCount++;
          continue;
        }
        
        // Log original row data
        console.log(`Normalisasi baris ${i}:`, JSON.stringify(excelData[i]));
        
        // Check if row has any actual content
        const hasContent = excelData[i].some(cell => 
          cell !== null && cell !== undefined && String(cell).trim() !== ''
        );
        
        if (!hasContent) {
          console.log(`Baris ${i} tidak memiliki konten valid, akan dihapus`);
          excelData.splice(i, 1);
          i--; // Adjust index after removing an element
          emptyRowCount++;
          continue;
        }
        
        // Ensure the row has the right number of columns
        if (excelData[i].length < columnCount) {
          console.log(`Baris ${i} kurang kolom. Seharusnya ${columnCount}, sekarang ${excelData[i].length}`);
          while (excelData[i].length < columnCount) {
            excelData[i].push(''); // Pad with empty strings
          }
          normalizedRowCount++;
        }
        
        // Trim string values and convert null/undefined to empty string
        excelData[i] = excelData[i].map(cell => 
          (cell === null || cell === undefined) ? '' : String(cell).trim()
        );
      }
      
      console.log(`Normalisasi selesai. Removed ${emptyRowCount} empty rows, normalized ${normalizedRowCount} rows`);
      console.log("Row count setelah normalisasi:", excelData.length);
    }
    
    function resetTableBody(tableBody, customMessage = null) {
      if (tableBody) {
        if (customMessage) {
          tableBody.innerHTML = customMessage;
        } else {
          tableBody.innerHTML = `
            <tr class="text-center text-gray-500">
              <td colspan="8" class="px-4 py-8">Upload Excel file to preview data</td>
            </tr>
          `;
        }
      }
    }
    
    function saveExcelDataToStorage() {
      // Save the data to localStorage for use in the approval dashboard
      const registrationData = {
        excelData: excelData.slice(1), // Skip header row
        originalFileName: originalFileName,
        timestamp: new Date().toISOString(),
        status: "pending" // Set default status to pending
      };
      
      // Store in localStorage
      localStorage.setItem('pendingRegistrations', JSON.stringify(registrationData));
      
      console.log("Excel data saved to localStorage for approval");
    }
  
    function displayExcelData(data) {
      let tableBody = document.getElementById("employeeTableBody");
      if (!tableBody || !data || data.length <= 1) {
        return;
      }
      
      tableBody.innerHTML = "";
      
      const header = data[0];
      const colMap = mapColumns(header);
      
      let displayedRowCount = 0;
      
      for (let i = 1; i < data.length; i++) {
        let row = data[i];
        if (!row || !row.length || row.every(cell => !cell)) continue;
        
        let tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition-colors";
        
        // Create table cells based on the column mapping (8 columns)
        const cellData = [
          row[colMap.kansaiEmployeeId] || "—",      // Kansai Employee ID
          row[colMap.username] || "—",              // Username
          `${row[colMap.firstName] || ""} ${row[colMap.middleName] || ""} ${row[colMap.lastName] || ""}`.trim() || "—", // Full Name
          row[colMap.email] || "—",                 // Email
          row[colMap.departmentName] || "—",        // Department
          row[colMap.position] || "—",              // Position
          row[colMap.phoneNumber] || "—",           // Phone
          row[colMap.roles] || "User"               // Roles
        ];
        
        cellData.forEach(cellText => {
          let td = document.createElement("td");
          td.className = "px-4 py-3 whitespace-nowrap";
          td.textContent = cellText;
          tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
        displayedRowCount++;
      }
      
      // Update count
      const totalUsersElement = document.getElementById("totalUsers");
      if (totalUsersElement) {
        totalUsersElement.textContent = displayedRowCount;
      }
      
      if (displayedRowCount === 0) {
        tableBody.innerHTML = `
          <tr class="text-center text-yellow-500">
            <td colspan="8" class="py-8">
              <div class="flex flex-col items-center">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>No valid data found in Excel file.</p>
              </div>
            </td>
          </tr>
        `;
      }
    }
  
    // Form Submission with API Integration
    let registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.addEventListener("submit", function(event) {
        event.preventDefault();
        
        if (!excelData || excelData.length <= 1) {
          showNotification('Please upload an Excel file with user data first.', 'error');
          return false;
        }
        
        // Save the data to localStorage
        saveExcelDataToStorage();
        
        // Show success notification
        showNotification('User data submitted for approval!', 'success');
        
        // Redirect to the approval dashboard after a short delay
        setTimeout(() => {
          window.location.href = 'approval-dashboard.html';
        }, 1500);
      });
    }
    
    function prepareUserDataForAPI() {
      if (!excelData || excelData.length <= 1) return [];
      
      const header = excelData[0];
      const colMap = mapColumns(header);
      console.log('📋 Column mapping:', colMap);
      console.log('📋 Excel headers:', header);
      
      const userData = [];
      
      for (let i = 1; i < excelData.length; i++) {
        const row = excelData[i];
        if (!row || !row.length || row.every(cell => !cell)) continue;
        
        // Parse roles (can be comma-separated)
        const rolesStr = row[colMap.roles] || 'User';
        const roles = rolesStr.split(',').map(role => role.trim()).filter(role => role);
        
        console.log(`👤 Processing row ${i}:`, {
          rawRow: row,
          username: row[colMap.username],
          email: row[colMap.email],
          rolesStr: rolesStr,
          parsedRoles: roles
        });
        
        const user = {
          username: row[colMap.username] || '',
          email: row[colMap.email] || '',
          password: row[colMap.password] || 'DefaultPass123!',
          employee: {
            firstName: row[colMap.firstName] || '',
            middleName: row[colMap.middleName] || '',
            lastName: row[colMap.lastName] || '',
            kansaiEmployeeId: row[colMap.kansaiEmployeeId] || '',
            position: row[colMap.position] || '',
            phoneNumber: row[colMap.phoneNumber] || '',
            departmentName: row[colMap.departmentName] || ''
          },
          roles: roles
        };
        
        userData.push(user);
      }
      
      return userData;
    }

    function clearForm() {
      excelData = [];
      originalFileName = "";
      
      const tableBody = document.getElementById("employeeTableBody");
      if (tableBody) {
        tableBody.innerHTML = `
          <tr class="text-center text-gray-500">
            <td colspan="8" class="px-4 py-8">Upload Excel file to preview data</td>
          </tr>
        `;
      }
      
      document.getElementById("totalUsers").textContent = "0";
      if (document.getElementById("excelFile")) {
        document.getElementById("excelFile").value = "";
      }
    }

    function showFailureDetails(failedUsers) {
      // Create a more detailed error display
      let errorDetails = "Registration Failures:\n\n";
      
      failedUsers.forEach((item, index) => {
        errorDetails += `${index + 1}. ${item.user.username} (${item.user.email})\n`;
        errorDetails += `   Error: ${item.error}\n\n`;
      });
      
      // Also log to console for debugging
      console.error('📋 Detailed Registration Failures:', failedUsers);
      
      // Show in alert (you could replace this with a modal later)
      alert(errorDetails);
      
      // Also show a notification with summary
      const totalFailed = failedUsers.length;
      const firstError = failedUsers[0]?.error || 'Unknown error';
      
      if (totalFailed === 1) {
        showNotification(`Registration failed: ${firstError}`, 'error');
      } else {
        showNotification(`${totalFailed} registrations failed. Click to see details.`, 'error');
      }
    }
  
    function validateForm() {
      if (!excelData || excelData.length <= 1) {
        showNotification("Please upload Excel file with employee data", "error");
        return false;
      }
      
      // Validate Excel structure for new API format
      if (!validateExcelStructure(excelData[0])) {
        showNotification('Excel file does not have required columns. Please download the template for the correct format.', 'error');
        return false;
      }
      
      return true;
    }
  
    function showNotification(message, type = "info") {
      // Remove existing notifications
      const existingNotifications = document.querySelectorAll('.notification');
      existingNotifications.forEach(notification => {
        notification.remove();
      });
      
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 flex items-center transition-all duration-300 transform translate-y-0`;
      
      // Set background color based on type
      let bgColor, icon;
      switch(type) {
        case "success":
          bgColor = "bg-green-500";
          icon = "fa-check-circle";
          break;
        case "error":
          bgColor = "bg-red-500";
          icon = "fa-exclamation-circle";
          break;
        case "warning":
          bgColor = "bg-yellow-500";
          icon = "fa-exclamation-triangle";
          break;
        default:
          bgColor = "bg-blue-500";
          icon = "fa-info-circle";
      }
      
      notification.classList.add(bgColor);
      
      notification.innerHTML = `
        <i class="fas ${icon} mr-2"></i>
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.classList.add('opacity-100');
      }, 10);
      
      // Add click handler to close button
      const closeBtn = notification.querySelector('button');
      closeBtn.addEventListener('click', () => {
        notification.classList.add('opacity-0');
        setTimeout(() => {
          notification.remove();
        }, 300);
      });
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        notification.classList.add('opacity-0');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 4000);
    }
    
    // Function to add download template button
    function addDownloadTemplateButton() {
      const uploadSection = document.querySelector('.bg-gray-50');
      if (uploadSection) {
        const templateButton = document.createElement('button');
        templateButton.className = 'mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-green-700 transition-colors duration-300';
        templateButton.innerHTML = '<i class="fas fa-download mr-2"></i>Download Excel Template';
        templateButton.onclick = downloadExcelTemplate;
        
        const uploadArea = uploadSection.querySelector('.relative');
        uploadArea.parentNode.insertBefore(templateButton, uploadArea.nextSibling);
      }
    }

    // Function to generate and download Excel template
    function downloadExcelTemplate() {
      const templateData = [
        // Header row with required columns
        [
          'Username',
          'Email', 
          'Password',
          'First Name',
          'Middle Name',
          'Last Name',
          'Kansai Employee ID',
          'Position',
          'Phone Number',
          'Department Name',
          'Roles'
        ],
        // Sample data row
        [
          'john.doe',
          'john.doe@company.com',
          'DefaultPass123!',
          'John',
          'Michael',
          'Doe',
          'EMP001',
          'Software Developer',
          '+6281234567890',
          'IT Department',
          'User'
        ],
        // Additional sample row
        [
          'jane.smith',
          'jane.smith@company.com',
          'DefaultPass123!',
          'Jane',
          '',
          'Smith',
          'EMP002',
          'HR Manager',
          '+6281234567891',
          'Human Resources',
          'User,Admin'
        ]
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);
      
      // Set column widths
      const colWidths = [
        { wch: 15 }, // Username
        { wch: 25 }, // Email
        { wch: 15 }, // Password
        { wch: 15 }, // First Name
        { wch: 15 }, // Middle Name
        { wch: 15 }, // Last Name
        { wch: 20 }, // Kansai Employee ID
        { wch: 20 }, // Position
        { wch: 18 }, // Phone Number
        { wch: 20 }, // Department Name
        { wch: 15 }  // Roles
      ];
      worksheet['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Registration');
      
      // Generate and download file
      XLSX.writeFile(workbook, 'Employee_Registration_Template.xlsx');
      
      showNotification('Excel template downloaded successfully!', 'success');
    }

    function mapColumns(header) {
      const headerLower = header.map(h => String(h).toLowerCase());
      
      return {
        username: headerLower.findIndex(h => h.includes('username')),
        email: headerLower.findIndex(h => h.includes('email')),
        password: headerLower.findIndex(h => h.includes('password')),
        firstName: headerLower.findIndex(h => h.includes('first name')),
        middleName: headerLower.findIndex(h => h.includes('middle name')),
        lastName: headerLower.findIndex(h => h.includes('last name')),
        kansaiEmployeeId: headerLower.findIndex(h => h.includes('kansai employee id') || h.includes('employee id')),
        position: headerLower.findIndex(h => h.includes('position')),
        phoneNumber: headerLower.findIndex(h => h.includes('phone')),
        departmentName: headerLower.findIndex(h => h.includes('department')),
        roles: headerLower.findIndex(h => h.includes('roles'))
      };
    }
  });