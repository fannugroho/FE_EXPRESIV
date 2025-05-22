document.addEventListener("DOMContentLoaded", function () {
    // Hapus array dokumen yang tidak lagi digunakan
    // let filesArray = []; // Array to store uploaded files
    let excelData = []; // Store excel data globally
    let originalFileName = ""; // Store the original filename
  
    // Excel File Upload Handling
    let excelFileInput = document.getElementById("excelFile");
    let dropArea = excelFileInput ? excelFileInput.parentElement : null;
  
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
            <td colspan="9" class="py-8">
              <div class="flex justify-center items-center">
                <svg class="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses file Excel...
              </div>
            </td>
          </tr>
        `;
      }
      
      // Check file extension to determine type
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        showNotification('Format file tidak didukung. Silakan gunakan file Excel (.xlsx, .xls) atau CSV.', 'error');
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
            showNotification('Error saat memproses file Excel. Coba dengan format file yang berbeda.', 'error');
            resetTableBody(tableBody);
            return;
          }
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            console.error("Tidak ada sheet dalam workbook");
            showNotification('File Excel tidak memiliki sheet data.', 'error');
            resetTableBody(tableBody);
            return;
          }
          
          let firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          console.log("First sheet name:", workbook.SheetNames[0]);
          
          if (!firstSheet) {
            console.error("Sheet pertama tidak ditemukan");
            showNotification('Sheet data tidak ditemukan dalam file Excel.', 'error');
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
              showNotification('File Excel tidak berisi data atau hanya berisi header.', 'warning');
              resetTableBody(tableBody, `
                <tr class="text-center text-yellow-500">
                  <td colspan="9" class="py-8">
                    <div class="flex flex-col items-center">
                      <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                      <p>File Excel tidak berisi data atau hanya berisi header.</p>
                    </div>
                  </td>
                </tr>
              `);
              return;
            }
          } catch (jsonError) {
            console.error("Error saat mengkonversi sheet ke JSON:", jsonError);
            showNotification('Error saat mengekstrak data dari file Excel.', 'error');
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
                <td colspan="9" class="py-8">
                  <div class="flex flex-col items-center">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p class="font-semibold mb-1">Format file Excel tidak valid</p>
                    <p class="text-sm mb-3">File yang diunggah tidak memiliki kolom yang diperlukan</p>
                    <div class="text-left text-xs bg-red-50 p-3 rounded-md border border-red-200 max-w-md">
                      <p class="font-semibold mb-1">Kolom yang diperlukan:</p>
                      <ul class="list-disc pl-4 space-y-1">
                        <li>Employee ID (atau ID)</li>
                        <li>NIK (atau National ID)</li>
                        <li>Name (atau First Name, Middle Name, Last Name)</li>
                        <li>Department</li>
                        <li>Position (atau Job Title)</li>
                      </ul>
                      <p class="mt-2">Opsional tapi disarankan: Phone, Email</p>
                    </div>
                  </div>
                </td>
              </tr>
            `;
            
            resetTableBody(tableBody, errorMessage);
            showNotification('File Excel tidak memiliki kolom yang diperlukan. Periksa format file.', 'error');
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
          showNotification('Error saat memproses file. Periksa format file.', 'error');
          resetTableBody(tableBody);
        }
      };
      
      reader.onerror = function(event) {
        console.error("FileReader error:", event);
        showNotification('Error saat membaca file', 'error');
        resetTableBody(tableBody);
      };
      
      reader.readAsArrayBuffer(file);
    }
    
    function validateExcelStructure(headerRow) {
      if (!headerRow || headerRow.length < 3) return false;
      
      // Convert header row to lowercase for case-insensitive comparison
      const headerLower = headerRow.map(h => String(h).toLowerCase());
      
      // Check for required columns with flexible matching
      const requiredFields = [
        // Need either employee ID or some ID field
        { 
          alternatives: ['employee id', 'employeeid', 'id', 'emp id', 'emp. id'] 
        },
        // Need either NIK or some kind of identification number
        { 
          alternatives: ['nik', 'national id', 'identification', 'id number'] 
        },
        // Need some form of name (either full name or at least first name)
        { 
          alternatives: ['name', 'full name', 'first name', 'firstname'] 
        },
        // Need department info
        { 
          alternatives: ['department', 'dept', 'division'] 
        },
        // Need position info
        { 
          alternatives: ['position', 'job title', 'title', 'role'] 
        }
      ];
      
      // Check if each required field has at least one match in the headers
      const missingFields = requiredFields.filter(field => {
        return !field.alternatives.some(alt => 
          headerLower.some(h => h.includes(alt))
        );
      });
      
      if (missingFields.length > 0) {
        console.warn('Missing required fields:', missingFields);
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
              <td colspan="9" class="px-4 py-8">Upload an Excel file to preview data</td>
            </tr>
          `;
        }
      }
    }
    
    function saveExcelDataToStorage() {
      // Create a metadata object with the file info
      const metadata = {
        fileName: originalFileName,
        dateImported: new Date().toISOString(),
        rowCount: excelData.length - 1, // Exclude header row
        columnCount: excelData[0].length,
        columns: excelData[0]
      };
      
      // Save both the data and metadata
      localStorage.setItem("supplierData", JSON.stringify(excelData.slice(1))); // Save without header
      localStorage.setItem("supplierDataMeta", JSON.stringify(metadata));
    }
  
    function displayExcelData(data) {
      let tableBody = document.getElementById("employeeTableBody");
      if (!tableBody) {
        console.error("Elemen table body tidak ditemukan");
        return;
      }
      
      tableBody.innerHTML = ""; // Clear table before adding new data
      
      if (!data || data.length === 0) {
        console.warn("Tidak ada data untuk ditampilkan");
        tableBody.innerHTML = `
          <tr class="text-center text-gray-500">
            <td colspan="9" class="py-8">Tidak ada data ditemukan dalam file Excel</td>
          </tr>
        `;
        return;
      }
      
      if (data.length <= 1) {
        console.warn("Hanya ada baris header, tidak ada data");
        tableBody.innerHTML = `
          <tr class="text-center text-gray-500">
            <td colspan="9" class="py-8">Tidak ada data ditemukan dalam file Excel</td>
          </tr>
        `;
        return;
      }
      
      try {
        // Get the header row to map columns
        const headerRow = data[0];
        console.log("Header row untuk mapping:", headerRow);
        
        // Map expected column indices
        const columnMap = {
          employeeId: headerRow.findIndex(col => String(col || '').toLowerCase().includes('employee') && String(col || '').toLowerCase().includes('id')),
          nik: headerRow.findIndex(col => String(col || '').toLowerCase().includes('nik')),
          firstName: headerRow.findIndex(col => String(col || '').toLowerCase().includes('first') && String(col || '').toLowerCase().includes('name')),
          middleName: headerRow.findIndex(col => String(col || '').toLowerCase().includes('middle') && String(col || '').toLowerCase().includes('name')),
          lastName: headerRow.findIndex(col => String(col || '').toLowerCase().includes('last') && String(col || '').toLowerCase().includes('name')),
          fullName: headerRow.findIndex(col => String(col || '').toLowerCase() === 'name' || String(col || '').toLowerCase() === 'full name' || String(col || '').toLowerCase() === 'nama'),
          department: headerRow.findIndex(col => String(col || '').toLowerCase().includes('depart')),
          position: headerRow.findIndex(col => String(col || '').toLowerCase().includes('position') || String(col || '').toLowerCase().includes('jabatan')),
          phone: headerRow.findIndex(col => String(col || '').toLowerCase().includes('phone') || String(col || '').toLowerCase().includes('mobile') || String(col || '').toLowerCase().includes('telepon')),
          email: headerRow.findIndex(col => String(col || '').toLowerCase().includes('email'))
        };
        
        console.log("Hasil mapping kolom:", columnMap);
        
        // Check if we have a full name but not individual name parts
        const hasFullNameOnly = columnMap.fullName !== -1 && 
                              columnMap.firstName === -1 && 
                              columnMap.middleName === -1 && 
                              columnMap.lastName === -1;
        
        if (hasFullNameOnly) {
          console.log("Hanya kolom nama lengkap yang ditemukan, akan memisahkan nama");
        }
        
        // Skip header row (index 0) and display data rows
        let displayedRowCount = 0;
        
        for (let i = 1; i < data.length; i++) {
          let row = data[i];
          if (!row || !row.length || row.every(cell => !cell)) {
            console.warn(`Baris ${i} kosong, dilewati`);
            continue; // Skip empty rows
          }
          
          console.log(`Memproses baris ${i}:`, row);
          
          let tr = document.createElement("tr");
          tr.className = "hover:bg-gray-50 transition-colors";
          
          // Create cells for each expected column in the table
          const tableCells = [];
          
          // 1. Employee ID
          let cellEmployeeId = document.createElement("td");
          cellEmployeeId.className = "px-4 py-3 whitespace-nowrap";
          cellEmployeeId.textContent = columnMap.employeeId !== -1 ? (row[columnMap.employeeId] || "—") : "—";
          tableCells.push(cellEmployeeId);
          
          // 2. NIK
          let cellNik = document.createElement("td");
          cellNik.className = "px-4 py-3 whitespace-nowrap";
          cellNik.textContent = columnMap.nik !== -1 ? (row[columnMap.nik] || "—") : "—";
          tableCells.push(cellNik);
          
          // Handle name fields (3-5: First, Middle, Last)
          if (hasFullNameOnly && columnMap.fullName !== -1) {
            // Split full name into parts
            const fullName = row[columnMap.fullName] || "";
            const nameParts = fullName.split(' ');
            
            // 3. First Name
            let cellFirstName = document.createElement("td");
            cellFirstName.className = "px-4 py-3 whitespace-nowrap";
            cellFirstName.textContent = nameParts[0] || "—";
            tableCells.push(cellFirstName);
            
            // 4. Middle Name
            let cellMiddleName = document.createElement("td");
            cellMiddleName.className = "px-4 py-3 whitespace-nowrap";
            cellMiddleName.textContent = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : "—";
            tableCells.push(cellMiddleName);
            
            // 5. Last Name
            let cellLastName = document.createElement("td");
            cellLastName.className = "px-4 py-3 whitespace-nowrap";
            cellLastName.textContent = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "—";
            tableCells.push(cellLastName);
          } else {
            // Use separate name columns if available
            
            // 3. First Name
            let cellFirstName = document.createElement("td");
            cellFirstName.className = "px-4 py-3 whitespace-nowrap";
            cellFirstName.textContent = columnMap.firstName !== -1 ? (row[columnMap.firstName] || "—") : "—";
            tableCells.push(cellFirstName);
            
            // 4. Middle Name
            let cellMiddleName = document.createElement("td");
            cellMiddleName.className = "px-4 py-3 whitespace-nowrap";
            cellMiddleName.textContent = columnMap.middleName !== -1 ? (row[columnMap.middleName] || "—") : "—";
            tableCells.push(cellMiddleName);
            
            // 5. Last Name
            let cellLastName = document.createElement("td");
            cellLastName.className = "px-4 py-3 whitespace-nowrap";
            cellLastName.textContent = columnMap.lastName !== -1 ? (row[columnMap.lastName] || "—") : "—";
            tableCells.push(cellLastName);
          }
          
          // 6. Department
          let cellDepartment = document.createElement("td");
          cellDepartment.className = "px-4 py-3 whitespace-nowrap";
          cellDepartment.textContent = columnMap.department !== -1 ? (row[columnMap.department] || "—") : "—";
          tableCells.push(cellDepartment);
          
          // 7. Position
          let cellPosition = document.createElement("td");
          cellPosition.className = "px-4 py-3 whitespace-nowrap";
          cellPosition.textContent = columnMap.position !== -1 ? (row[columnMap.position] || "—") : "—";
          tableCells.push(cellPosition);
          
          // 8. Phone
          let cellPhone = document.createElement("td");
          cellPhone.className = "px-4 py-3 whitespace-nowrap";
          cellPhone.textContent = columnMap.phone !== -1 ? (row[columnMap.phone] || "—") : "—";
          tableCells.push(cellPhone);
          
          // 9. Email
          let cellEmail = document.createElement("td");
          cellEmail.className = "px-4 py-3 whitespace-nowrap";
          cellEmail.textContent = columnMap.email !== -1 ? (row[columnMap.email] || "—") : "—";
          tableCells.push(cellEmail);
          
          // Add all cells to the row
          tableCells.forEach(cell => tr.appendChild(cell));
          
          // Add row to table
          tableBody.appendChild(tr);
          displayedRowCount++;
        }
        
        console.log(`Total ${displayedRowCount} baris ditampilkan dari ${data.length - 1} baris data`);
        
        // Update the count display
        const totalUsersElement = document.getElementById("totalUsers");
        if (totalUsersElement) {
          totalUsersElement.textContent = displayedRowCount;
        } else {
          console.warn("Element totalUsers tidak ditemukan");
        }
        
        // Add animation
        tableBody.classList.add('fade-in');
        
        if (displayedRowCount === 0) {
          tableBody.innerHTML = `
            <tr class="text-center text-yellow-500">
              <td colspan="9" class="py-8">
                <div class="flex flex-col items-center">
                  <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                  <p>Tidak ada data valid dalam file Excel yang dapat ditampilkan.</p>
                </div>
              </td>
            </tr>
          `;
        }
      } catch (error) {
        console.error("Error saat menampilkan data:", error);
        tableBody.innerHTML = `
          <tr class="text-center text-red-500">
            <td colspan="9" class="py-8">
              <div class="flex flex-col items-center">
                <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                <p>Terjadi kesalahan saat menampilkan data. Silakan coba lagi.</p>
                <p class="text-xs mt-1">${error.message}</p>
              </div>
            </td>
          </tr>
        `;
      }
    }
  
    // Check if there's already data in localStorage and display it
    function loadSavedData() {
      const savedData = localStorage.getItem("supplierData");
      const savedMeta = localStorage.getItem("supplierDataMeta");
      
      if (savedData && savedMeta) {
        try {
          const parsedData = JSON.parse(savedData);
          const parsedMeta = JSON.parse(savedMeta);
          
          // Create a complete dataset with header
          const fullData = [parsedMeta.columns, ...parsedData];
          excelData = fullData;
          originalFileName = parsedMeta.fileName;
          
          // Display the data
          displayExcelData(fullData);
          
          // Show info notification
          showNotification(`Loaded ${parsedData.length} records from "${parsedMeta.fileName}"`, 'info');
        } catch (error) {
          console.error("Error loading saved data:", error);
        }
      }
    }
    
    // Call this function to load data when the page loads
    loadSavedData();
  
    // Form Submission
    let registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.addEventListener("submit", function(event) {
        event.preventDefault();
        
        if (!validateForm()) {
          return;
        }
        
        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Memproses...
        `;
        
        // Create user data objects from Excel data
        const userData = prepareUserData();
        
        // Simulate API call
        setTimeout(() => {
          // Save additional data to localStorage
          const timestamp = new Date().toISOString();
          const registrationData = {
            excelData: excelData.slice(1), // without header
            userData: userData,
            originalFileName: originalFileName,
            timestamp: timestamp,
            status: "pending" // For approval process
          };
          
          localStorage.setItem("registrationData", JSON.stringify(registrationData));
          
          // Show success message
          showNotification("Pendaftaran berhasil! Mengalihkan...", "success");
          
          // Redirect after delay
          setTimeout(() => {
            window.location.href = "dashboard-users.html"; // Redirect to the new dashboard
          }, 1500);
        }, 800);
      });
    }
    
    function prepareUserData() {
      // Skip header (index 0) and prepare user objects from the Excel data
      if (!excelData || excelData.length <= 1) return [];
      
      const header = excelData[0];
      const userData = [];
      
      // Map column indices
      const colIndexMap = {
        employeeId: header.findIndex(col => String(col).toLowerCase().includes('employee id')),
        nik: header.findIndex(col => String(col).toLowerCase().includes('nik')),
        firstName: header.findIndex(col => String(col).toLowerCase().includes('first name')),
        middleName: header.findIndex(col => String(col).toLowerCase().includes('middle name')),
        lastName: header.findIndex(col => String(col).toLowerCase().includes('last name')),
        department: header.findIndex(col => String(col).toLowerCase().includes('department')),
        position: header.findIndex(col => String(col).toLowerCase().includes('position')),
        phone: header.findIndex(col => String(col).toLowerCase().includes('phone')),
        email: header.findIndex(col => String(col).toLowerCase().includes('email'))
      };
      
      // If we don't have separate name fields, look for a general name field
      if (colIndexMap.firstName === -1) {
        colIndexMap.name = header.findIndex(col => String(col).toLowerCase().includes('name'));
      }
      
      // Process each data row
      for (let i = 1; i < excelData.length; i++) {
        const row = excelData[i];
        if (!row || !row.length) continue;
        
        // Create user object with mapped data
        const user = {
          id: row[colIndexMap.employeeId] || `EMP${i.toString().padStart(3, '0')}`,
          nik: row[colIndexMap.nik] || '',
          department: row[colIndexMap.department] || '',
          position: row[colIndexMap.position] || '',
          phone: row[colIndexMap.phone] || '',
          email: row[colIndexMap.email] || ''
        };
        
        // Handle name fields
        if (colIndexMap.firstName !== -1) {
          user.firstName = row[colIndexMap.firstName] || '';
          user.middleName = colIndexMap.middleName !== -1 ? (row[colIndexMap.middleName] || '') : '';
          user.lastName = colIndexMap.lastName !== -1 ? (row[colIndexMap.lastName] || '') : '';
          user.fullName = `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`.trim();
        } else if (colIndexMap.name !== -1) {
          user.fullName = row[colIndexMap.name] || '';
          
          // Try to parse the full name into components
          const nameParts = user.fullName.split(' ');
          user.firstName = nameParts[0] || '';
          user.lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
          user.middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
        }
        
        userData.push(user);
      }
      
      return userData;
    }
  
    function validateForm() {
      // Check if we have Excel data
      if (!excelData || excelData.length <= 1) {
        showNotification("Silakan unggah file Excel dengan data karyawan", "error");
        return false;
      }
      
      // Hapus validasi dokumen pendukung karena sudah tidak diperlukan
      
      return true;
    }
  
    // Notification system
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
    
    // Check for previously saved data
    loadSavedData();
  });