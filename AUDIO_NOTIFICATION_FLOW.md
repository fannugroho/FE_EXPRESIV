# Alur Pemanggilan Audio Notification - menuReimCheck.html

## Diagram Alur Pemanggilan Audio

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ALUR PEMANGGILAN AUDIO                           │
└─────────────────────────────────────────────────────────────────────────────┘

1. PAGE LOAD
   ↓
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    DOMContentLoaded Event                             │
   │                                                                       │
   │  • loadDashboard()                                                    │
   │  • debugNotificationElements()                                        │
   │  • Setup polling interval (10 detik)                                 │
   │  • Setup event listeners                                             │
   └─────────────────────────────────────────────────────────────────────────┘
   ↓
   
2. USER INTERACTION TRACKING
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    Event Listeners                                    │
   │                                                                       │
   │  document.addEventListener('click', function() {                      │
   │    document.hasInteracted = true;                                    │
   │  });                                                                 │
   │                                                                       │
   │  document.addEventListener('keydown', function() {                    │
   │    document.hasInteracted = true;                                    │
   │  });                                                                 │
   └─────────────────────────────────────────────────────────────────────────┘
   ↓
   
3. POLLING SYSTEM (Setiap 10 detik)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    setInterval()                                      │
   │                                                                       │
   │  setInterval(() => {                                                 │
   │    pollPreparedDocs();                                               │
   │    pollCheckedDocs();                                                │
   │  }, 10000);                                                          │
   └─────────────────────────────────────────────────────────────────────────┘
   ↓
   
4. API CALL - pollPreparedDocs()
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    Fetch API                                          │
   │                                                                       │
   │  const response = await fetch(                                       │
   │    `${BASE_URL}/api/reimbursements/checker/${userId}`,               │
   │    { headers: { 'Authorization': `Bearer ${getAccessToken()}` } }    │
   │  );                                                                   │
   └─────────────────────────────────────────────────────────────────────────┘
   ↓
   
5. CHECK FOR NEW DOCUMENTS
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    Document Processing                                │
   │                                                                       │
   │  docs.forEach(doc => {                                               │
   │    if (doc.status === 'Prepared' &&                                  │
   │        !notifiedReims.has(doc.voucherNo)) {                         │
   │      showNotification(doc);                                          │
   │      newReimFound = true;                                            │
   │    }                                                                  │
   │  });                                                                  │
   └─────────────────────────────────────────────────────────────────────────┘
   ↓
   
6. TRIGGER AUDIO (Jika ada dokumen baru)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    Audio Trigger                                      │
   │                                                                       │
   │  if (newReimFound) {                                                 │
   │    console.log('Playing notification sound for new documents');      │
   │    playNotificationSound();                                          │
   │  }                                                                    │
   └─────────────────────────────────────────────────────────────────────────┘
   ↓
   
7. AUDIO PLAYBACK FUNCTION
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    playNotificationSound()                            │
   │                                                                       │
   │  function playNotificationSound() {                                   │
   │    // Check user interaction                                         │
   │    if (document.hasInteracted) {                                     │
   │      const audio = new Audio('../../../../components/shared/tones.mp3'); │
   │      audio.volume = 0.5;                                             │
   │      audio.play().then(() => {                                       │
   │        console.log('Notification sound played successfully');         │
   │      }).catch(e => {                                                 │
   │        // Try alternative path                                       │
   │        const altAudio = new Audio('../../../components/shared/tones.mp3'); │
   │        altAudio.play();                                              │
   │      });                                                             │
   │    }                                                                  │
   │  }                                                                   │
   └─────────────────────────────────────────────────────────────────────────┘
```

## Detail Implementasi Audio

### 1. **User Interaction Tracking**
```javascript
// Track user interaction for audio playback
document.addEventListener('click', function() {
    document.hasInteracted = true;
});

document.addEventListener('keydown', function() {
    document.hasInteracted = true;
});
```

**Tujuan:** Browser memerlukan user interaction sebelum dapat memainkan audio.

### 2. **Polling System**
```javascript
// Polling interval (setiap 10 detik)
setInterval(() => {
    pollPreparedDocs();
    pollCheckedDocs();
}, 10000);
```

**Tujuan:** Mengecek dokumen baru setiap 10 detik.

### 3. **Audio Path Configuration**
```javascript
// Primary path
const audioPath = '../../../../components/shared/tones.mp3';

// Fallback path (jika primary gagal)
const alternativePath = '../../../components/shared/tones.mp3';
```

**Tujuan:** Menyediakan fallback jika path utama gagal.

### 4. **Audio Playback Function**
```javascript
function playNotificationSound() {
    console.log('Attempting to play notification sound');
    try {
        // Use the correct path from current directory to components/shared/tones.mp3
        const audioPath = '../../../../components/shared/tones.mp3';
        
        // Only attempt to play if user has interacted with the page
        if (document.hasInteracted) {
            console.log('User has interacted, attempting to play audio from:', audioPath);
            const audio = new Audio(audioPath);
            audio.volume = 0.5; // Set volume to 50%
            
            // Add error handling for audio loading
            audio.addEventListener('error', function(e) {
                console.warn('Audio loading error:', e);
            });
            
            audio.play().then(() => {
                console.log('Notification sound played successfully');
            }).catch(e => {
                console.warn('Failed to play notification sound:', e);
                // Try alternative path if first one fails
                const alternativePath = '../../../components/shared/tones.mp3';
                console.log('Trying alternative path:', alternativePath);
                const altAudio = new Audio(alternativePath);
                altAudio.volume = 0.5;
                altAudio.play().catch(e2 => {
                    console.warn('Alternative audio path also failed:', e2);
                });
            });
        } else {
            console.log('User has not interacted with page yet, cannot play audio');
        }
    } catch (e) {
        console.warn('Failed to play notification sound:', e);
    }
}
```

## Kondisi untuk Audio Berjalan

### ✅ **Kondisi yang Harus Terpenuhi:**

1. **User Interaction:** `document.hasInteracted = true`
2. **File Audio Tersedia:** `tones.mp3` ada di path yang benar
3. **Browser Support:** Browser mendukung Web Audio API
4. **Autoplay Policy:** Browser mengizinkan autoplay setelah user interaction
5. **Network Access:** File audio dapat diakses dari server

### ❌ **Kondisi yang Menghalangi Audio:**

1. **No User Interaction:** User belum berinteraksi dengan halaman
2. **File Not Found:** File `tones.mp3` tidak ada di path yang ditentukan
3. **Network Error:** Gagal mengakses file audio
4. **Browser Blocking:** Browser memblokir autoplay
5. **Volume Muted:** System volume 0 atau browser muted

## Debugging Audio Issues

### **Console Commands untuk Debug:**
```javascript
// Test audio manual
testNotification()

// Check user interaction status
console.log('User interacted:', document.hasInteracted)

// Check audio file availability
fetch('../../../../components/shared/tones.mp3')
  .then(response => console.log('Audio file available:', response.ok))
  .catch(error => console.log('Audio file error:', error))
```

### **Network Tab Check:**
1. Buka Developer Tools (F12)
2. Buka tab Network
3. Filter by "Media"
4. Cari request ke `tones.mp3`
5. Periksa status response (200 = OK, 404 = Not Found)

## Troubleshooting Audio

### **Masalah Umum:**

1. **"User has not interacted with page yet"**
   - **Solusi:** Klik atau tekan keyboard di halaman

2. **"Audio loading error"**
   - **Solusi:** Periksa path file audio dan network connection

3. **"Alternative audio path also failed"**
   - **Solusi:** Pastikan file `tones.mp3` ada di direktori yang benar

4. **"Failed to play notification sound"**
   - **Solusi:** Periksa browser autoplay policy dan system volume

### **Path File Audio:**
```
Current Directory: approvalPages/dashboard/dashboardCheck/reimbursement/
Target File: components/shared/tones.mp3

Primary Path: ../../../../components/shared/tones.mp3
Fallback Path: ../../../components/shared/tones.mp3
```

## Monitoring Audio Playback

### **Console Logs yang Diharapkan:**
```
Attempting to play notification sound
User has interacted, attempting to play audio from: ../../../../components/shared/tones.mp3
Notification sound played successfully
```

### **Error Logs yang Mungkin:**
```
User has not interacted with page yet, cannot play audio
Audio loading error: [error details]
Failed to play notification sound: [error details]
Alternative audio path also failed: [error details]
``` 