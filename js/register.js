document.addEventListener("DOMContentLoaded", function () {
    let filesArray = []; // Inisialisasi array untuk menyimpan file
  
    let excelFileInput = document.getElementById("excelFile");
    if (excelFileInput) {
      excelFileInput.addEventListener("change", function(event) {
        let file = event.target.files[0];
        let reader = new FileReader();
        reader.onload = function(e) {
          let data = new Uint8Array(e.target.result);
          let workbook = XLSX.read(data, { type: "array" });
          let firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          let excelData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  
          let tableBody = document.getElementById("employeeTableBody");
          tableBody.innerHTML = ""; // Bersihkan tabel sebelum menambahkan data baru
  
          for (let i = 1; i < excelData.length; i++) {  // Mulai dari baris ke-1 (bukan header)
            let row = excelData[i];
            let tr = document.createElement("tr");
  
            for (let j = 0; j < row.length; j++) {
              let td = document.createElement("td");
              td.textContent = row[j] || "-";
              tr.appendChild(td);
            }
  
            tableBody.appendChild(tr);
          }
  
          // Simpan ke localStorage dengan key "RegUser"
          localStorage.setItem("supplierData", JSON.stringify(excelData.slice(1))); // Simpan tanpa header
        };
        reader.readAsArrayBuffer(file);
      });
    }
  
    let fileUpload = document.getElementById("fileUpload");
    if (fileUpload) {
      fileUpload.addEventListener("change", function(event) {
        if (filesArray.length >= 10) {
          alert("Maximum 10 files allowed!");
          return;
        }
  
        const file = event.target.files[0];
        if (file) {
          filesArray.push(file);
          updateFileList();
        }
  
        event.target.value = ""; // Reset file input
      });
    }
  
    function updateFileList() {
      let fileList = document.getElementById("fileList");
      if (!fileList) return;
  
      fileList.innerHTML = "";
  
      filesArray.forEach((file, index) => {
        let listItem = document.createElement("li");
        listItem.className = "flex justify-between items-center bg-gray-100 px-3 py-2 rounded mt-1";
        listItem.innerHTML = `
            <span>${file.name}</span>
            <button class="text-red-600 text-xs font-bold" onclick="removeFile(${index})">Remove</button>
        `;
        fileList.appendChild(listItem);
      });
  
      if (fileUpload) {
        fileUpload.disabled = filesArray.length >= 10;
      }
    }
  
    window.removeFile = function(index) {
      filesArray.splice(index, 1);
      updateFileList();
    }
  
    let docInput = document.getElementById("docInput");
    if (docInput) {
      docInput.addEventListener("change", function(event) {
        const fileList = event.target.files;
        const docNames = [];
        for (let i = 0; i < fileList.length; i++) {
          docNames.push(fileList[i].name);
        }
        localStorage.setItem("UploadedDocs", JSON.stringify(docNames));
      });
    }
  
    let registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.addEventListener("submit", function(event) {
        event.preventDefault();
  
        let storedData = localStorage.getItem("supplierData");
        let uploadedDocs = localStorage.getItem("UploadedDocs");
  
        if (!storedData) {
          alert("Silakan unggah file Excel terlebih dahulu!");
          return;
        }
  
        alert("Registrasi berhasil! Data telah disimpan di localStorage.");
        window.location.href = "RegisterMenu.html";
      });
    }
  });