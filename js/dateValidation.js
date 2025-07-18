// Fungsi untuk validasi submission date
function validateSubmissionDate(input) {
    const errorDiv = document.getElementById('dateError');
    
    // Hapus pesan error sebelumnya
    errorDiv.classList.add('hidden');
    input.classList.remove('border-red-500');
    input.classList.add('border-gray-300');
    
    // Validasi jika tanggal dipilih
    if (input.value) {
        if (isPastDate(input.value)) {
            // Backdate - tanggal di masa lalu
            errorDiv.textContent = '❌ Tanggal submission tidak boleh di masa lalu. Silakan pilih tanggal hari ini.';
            errorDiv.classList.remove('hidden');
            input.classList.remove('border-gray-300');
            input.classList.add('border-red-500');
            return false;
        } else if (isFutureDate(input.value)) {
            // Future date - tanggal di masa depan
            errorDiv.textContent = '❌ Tanggal submission tidak boleh di masa depan. Silakan pilih tanggal hari ini saja.';
            errorDiv.classList.remove('hidden');
            input.classList.remove('border-gray-300');
            input.classList.add('border-red-500');
            return false;
        } else {
            // Tanggal hari ini - valid
            errorDiv.textContent = '✅ Tanggal submission valid';
            errorDiv.classList.remove('hidden');
            errorDiv.classList.add('text-green-500');
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 2000);
            return true;
        }
    }
    
    return true; // Jika tidak ada tanggal yang dipilih, anggap valid
}

// Fungsi untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
function getTodayDate() {
    // Implementasi lokal untuk menghindari recursive call
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Fungsi untuk mengatur tanggal default ke hari ini saat halaman dimuat
function setDefaultDate() {
    const postingDateInput = document.getElementById("postingDate");
    if (postingDateInput && !postingDateInput.value) {
        postingDateInput.value = getTodayDate();
    }
}

// Set default date saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDate();
}); 