# Implementasi Tab Checked, Acknowledge, Approve, Receive, dan Revision pada Dashboard

## Overview
Tab "Checked", "Acknowledge", "Approved", "Received", dan "Revision" telah ditambahkan pada halaman `dashboard.html` dengan menyembunyikannya dari tampilan UI. Tab-tab ini menggunakan parameter, endpoint API, dan update counters yang ada pada halaman-halaman terkait.

**Fitur Notifikasi Approval** juga telah ditambahkan untuk memantau perubahan dokumen yang memerlukan approval secara real-time.

**Implementasi Reimbursement** telah ditambahkan dengan pola yang sama seperti Purchase Request.

## Perubahan yang Dilakukan

### 1. HTML Structure (`pages/dashboard.html`)
- **Lokasi**: Baris 270-395 (Purchase Request), Baris 396-520 (Reimbursement)
- **Fitur**: Menambahkan 10 section tersembunyi dengan ID:
  
  **Purchase Request:**
  - `checkedTab` - untuk data checked
  - `acknowledgeTab` - untuk data acknowledge  
  - `approveTab` - untuk data approve
  - `receiveTab` - untuk data receive
  - `revisionTab` - untuk data revision

  **Reimbursement:**
  - `reimCheckedTab` - untuk data reim checked
  - `reimAcknowledgeTab` - untuk data reim acknowledge
  - `reimApproveTab` - untuk data reim approve
  - `reimReceiveTab` - untuk data reim receive
  - `reimRevisionTab` - untuk data reim revision

#### Layout untuk setiap tab:
- **Checked Tab**: Grid 4 kolom (PR/Reim Prepared, PR/Reim Checked, PR/Reim Rejected, PR/Reim Total)
- **Acknowledge Tab**: Grid 4 kolom (PR/Reim Total, PR/Reim Checked, PR/Reim Acknowledged, PR/Reim Rejected)
- **Approve Tab**: Grid 4 kolom (PR/Reim Total, PR/Reim Acknowledge, PR/Reim Approved, PR/Reim Rejected)
- **Receive Tab**: Grid 4 kolom (PR/Reim Total, PR/Reim Approved, PR/Reim Received, PR/Reim Rejected)
- **Revision Tab**: Grid 2 kolom (PR/Reim Revision, PR/Reim Prepared)

### 2. JavaScript Functions (`js/dashboard.js`)

#### A. Fungsi Load Dashboard Purchase Request
- **`loadCheckedDashboard()`**: Mengambil data dari menuPRCheck.html
- **`loadAcknowledgeDashboard()`**: Mengambil data dari menuPRAcknow.html
- **`loadApproveDashboard()`**: Mengambil data dari menuPRApprove.html
- **`loadReceiveDashboard()`**: Mengambil data dari menuPRReceive.html
- **`loadRevisionDashboard()`**: Mengambil data dari menuPRRevision.html

#### B. Fungsi Load Dashboard Reimbursement
- **`loadReimCheckedDashboard()`**: Mengambil data dari menuReimCheck.html
- **`loadReimAcknowledgeDashboard()`**: Mengambil data dari menuReimAcknow.html
- **`loadReimApproveDashboard()`**: Mengambil data dari menuReimApprove.html
- **`loadReimReceiveDashboard()`**: Mengambil data dari menuReimReceive.html
- **`loadReimRevisionDashboard()`**: Mengambil data dari menuReimRevision.html

#### C. Fungsi Kontrol Tab Purchase Request
Untuk setiap tab, tersedia 3 fungsi:
- **`show[TabName]Tab()`**: Menampilkan tab
- **`hide[TabName]Tab()`**: Menyembunyikan tab
- **`toggle[TabName]Tab()`**: Toggle tampilan tab

#### D. Fungsi Kontrol Tab Reimbursement
Untuk setiap tab Reimbursement, tersedia 3 fungsi:
- **`showReim[TabName]Tab()`**: Menampilkan tab
- **`hideReim[TabName]Tab()`**: Menyembunyikan tab
- **`toggleReim[TabName]Tab()`**: Toggle tampilan tab

#### E. Fungsi Utilitas
- **`showAllTabs()`**: Menampilkan semua tab Purchase Request sekaligus
- **`hideAllTabs()`**: Menyembunyikan semua tab Purchase Request sekaligus
- **`showAllReimTabs()`**: Menampilkan semua tab Reimbursement sekaligus
- **`hideAllReimTabs()`**: Menyembunyikan semua tab Reimbursement sekaligus

#### F. Integrasi dengan `window.onload`
- **Lokasi**: Baris 1-15
- **Fungsi**: Memanggil semua fungsi load dashboard dan inisialisasi notifikasi saat halaman dimuat

### 3. Debug Buttons
- **Lokasi**: `pages/dashboard.html` baris 320-350
- **Status**: Tersembunyi (`display: none`)
- **Fungsi**: Untuk testing/development - dapat menampilkan/menyembunyikan tab

### 4. Fitur Notifikasi Approval
- **Lokasi**: `js/dashboard.js` baris 580-950
- **Fitur**: Real-time notification untuk dokumen yang memerlukan approval
- **Polling Interval**: Setiap 10 detik
- **Audio Alert**: Suara notifikasi saat ada dokumen baru
- **Panel Notifikasi**: Dropdown panel dengan daftar notifikasi
- **Multi-document Support**: Purchase Request dan Reimbursement

## Parameter API yang Digunakan

### Purchase Request dari menuPRCheck.html (Checked):
```javascript
ApproverId: userId
ApproverRole: 'checked'
isApproved: false/true (untuk prepared/checked)
```

### Purchase Request dari menuPRAcknow.html (Acknowledge):
```javascript
ApproverId: userId
ApproverRole: 'acknowledge'
isApproved: false/true (untuk checked/acknowledged)
```

### Purchase Request dari menuPRApprove.html (Approve):
```javascript
ApproverId: userId
ApproverRole: 'approve'
isApproved: false/true (untuk acknowledge/approved)
```

### Purchase Request dari menuPRReceive.html (Receive):
```javascript
ApproverId: userId
ApproverRole: 'receive'
isApproved: false/true (untuk approved/received)
```

### Purchase Request dari menuPRRevision.html (Revision):
```javascript
ApproverId: userId
ApproverRole: 'revision'
```

### Reimbursement dari menuReimCheck.html (Checked):
```javascript
Endpoint: /api/reimbursements/checker/{userId}/prepared
Endpoint: /api/reimbursements/checker/{userId}/checked
Endpoint: /api/reimbursements/checker/{userId}/rejected
```

### Reimbursement dari menuReimAcknow.html (Acknowledge):
```javascript
Endpoint: /api/reimbursements/acknowledger/{userId}/checked
Endpoint: /api/reimbursements/acknowledger/{userId}/acknowledged
Endpoint: /api/reimbursements/acknowledger/{userId}/rejected
```

### Reimbursement dari menuReimApprove.html (Approve):
```javascript
Endpoint: /api/reimbursements/approver/{userId}/acknowledged
Endpoint: /api/reimbursements/approver/{userId}/approved
Endpoint: /api/reimbursements/approver/{userId}/rejected
```

### Reimbursement dari menuReimReceive.html (Receive):
```javascript
Endpoint: /api/reimbursements/receiver/{userId}/approved
Endpoint: /api/reimbursements/receiver/{userId}/received
Endpoint: /api/reimbursements/receiver/{userId}/rejected
```

### Reimbursement dari menuReimRevision.html (Revision):
```javascript
Endpoint: /api/reimbursements/revisor/{userId}/revision
Endpoint: /api/reimbursements/revisor/{userId}/prepared
```

## Endpoint yang Digunakan

### 1. Purchase Request Checked Documents:
- **Prepared**: `/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=false`
- **Checked**: `/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=true`
- **Rejected**: `/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=checked`

### 2. Purchase Request Acknowledge Documents:
- **Checked**: `/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=acknowledge&isApproved=false`
- **Acknowledged**: `/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=acknowledge&isApproved=true`
- **Rejected**: `/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=acknowledge`

### 3. Purchase Request Approve Documents:
- **Acknowledge**: `/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=approve&isApproved=false`
- **Approved**: `/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=approve&isApproved=true`
- **Rejected**: `/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=approve`

### 4. Purchase Request Receive Documents:
- **Approved**: `/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=receive&isApproved=false`
- **Received**: `/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=receive&isApproved=true`
- **Rejected**: `/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=receive`

### 5. Purchase Request Revision Documents:
- **Revision**: `/api/pr/dashboard/revision?ApproverId=${userId}&ApproverRole=revision`
- **Prepared**: `/api/pr/dashboard/prepared?ApproverId=${userId}&ApproverRole=revision`

### 6. Reimbursement Checked Documents:
- **Prepared**: `/api/reimbursements/checker/${userId}/prepared`
- **Checked**: `/api/reimbursements/checker/${userId}/checked`
- **Rejected**: `/api/reimbursements/checker/${userId}/rejected`

### 7. Reimbursement Acknowledge Documents:
- **Checked**: `/api/reimbursements/acknowledger/${userId}/checked`
- **Acknowledged**: `/api/reimbursements/acknowledger/${userId}/acknowledged`
- **Rejected**: `/api/reimbursements/acknowledger/${userId}/rejected`

### 8. Reimbursement Approve Documents:
- **Acknowledged**: `/api/reimbursements/approver/${userId}/acknowledged`
- **Approved**: `/api/reimbursements/approver/${userId}/approved`
- **Rejected**: `/api/reimbursements/approver/${userId}/rejected`

### 9. Reimbursement Receive Documents:
- **Approved**: `/api/reimbursements/receiver/${userId}/approved`
- **Received**: `/api/reimbursements/receiver/${userId}/received`
- **Rejected**: `/api/reimbursements/receiver/${userId}/rejected`

### 10. Reimbursement Revision Documents:
- **Revision**: `/api/reimbursements/revisor/${userId}/revision`
- **Prepared**: `/api/reimbursements/revisor/${userId}/prepared`

## Data yang Ditampilkan

### Purchase Request Checked Tab Elements:
- `prPreparedCount`: Jumlah dokumen PR yang sudah disiapkan dan menunggu untuk di-check
- `prCheckedCount`: Jumlah dokumen PR yang sudah di-check oleh user yang login
- `prRejectedCount`: Jumlah dokumen PR yang ditolak oleh user yang login
- `prTotalCount`: Total semua dokumen PR yang terkait dengan user sebagai checker

### Purchase Request Acknowledge Tab Elements:
- `prAckTotalCount`: Total semua dokumen PR yang terkait dengan user sebagai acknowledger
- `prAckCheckedCount`: Jumlah dokumen PR yang sudah di-check dan menunggu acknowledge
- `prAckAcknowledgedCount`: Jumlah dokumen PR yang sudah di-acknowledge oleh user
- `prAckRejectedCount`: Jumlah dokumen PR yang ditolak oleh user sebagai acknowledger

### Purchase Request Approve Tab Elements:
- `prAppTotalCount`: Total semua dokumen PR yang terkait dengan user sebagai approver
- `prAppAcknowledgeCount`: Jumlah dokumen PR yang sudah di-acknowledge dan menunggu approve
- `prAppApprovedCount`: Jumlah dokumen PR yang sudah di-approve oleh user
- `prAppRejectedCount`: Jumlah dokumen PR yang ditolak oleh user sebagai approver

### Purchase Request Receive Tab Elements:
- `prRecTotalCount`: Total semua dokumen PR yang terkait dengan user sebagai receiver
- `prRecApprovedCount`: Jumlah dokumen PR yang sudah di-approve dan menunggu receive
- `prRecReceivedCount`: Jumlah dokumen PR yang sudah di-receive oleh user
- `prRecRejectedCount`: Jumlah dokumen PR yang ditolak oleh user sebagai receiver

### Purchase Request Revision Tab Elements:
- `prRevRevisionCount`: Jumlah dokumen PR yang perlu direvisi
- `prRevPreparedCount`: Jumlah dokumen PR yang sudah disiapkan setelah revisi

### Reimbursement Checked Tab Elements:
- `reimPreparedCount`: Jumlah dokumen Reimbursement yang sudah disiapkan dan menunggu untuk di-check
- `reimCheckedCount`: Jumlah dokumen Reimbursement yang sudah di-check oleh user yang login
- `reimRejectedCount`: Jumlah dokumen Reimbursement yang ditolak oleh user yang login
- `reimTotalCount`: Total semua dokumen Reimbursement yang terkait dengan user sebagai checker

### Reimbursement Acknowledge Tab Elements:
- `reimAckTotalCount`: Total semua dokumen Reimbursement yang terkait dengan user sebagai acknowledger
- `reimAckCheckedCount`: Jumlah dokumen Reimbursement yang sudah di-check dan menunggu acknowledge
- `reimAckAcknowledgedCount`: Jumlah dokumen Reimbursement yang sudah di-acknowledge oleh user
- `reimAckRejectedCount`: Jumlah dokumen Reimbursement yang ditolak oleh user sebagai acknowledger

### Reimbursement Approve Tab Elements:
- `reimAppTotalCount`: Total semua dokumen Reimbursement yang terkait dengan user sebagai approver
- `reimAppAcknowledgeCount`: Jumlah dokumen Reimbursement yang sudah di-acknowledge dan menunggu approve
- `reimAppApprovedCount`: Jumlah dokumen Reimbursement yang sudah di-approve oleh user
- `reimAppRejectedCount`: Jumlah dokumen Reimbursement yang ditolak oleh user sebagai approver

### Reimbursement Receive Tab Elements:
- `reimRecTotalCount`: Total semua dokumen Reimbursement yang terkait dengan user sebagai receiver
- `reimRecApprovedCount`: Jumlah dokumen Reimbursement yang sudah di-approve dan menunggu receive
- `reimRecReceivedCount`: Jumlah dokumen Reimbursement yang sudah di-receive oleh user
- `reimRecRejectedCount`: Jumlah dokumen Reimbursement yang ditolak oleh user sebagai receiver

### Reimbursement Revision Tab Elements:
- `reimRevRevisionCount`: Jumlah dokumen Reimbursement yang perlu direvisi
- `reimRevPreparedCount`: Jumlah dokumen Reimbursement yang sudah disiapkan setelah revisi

## Fitur Notifikasi Approval

### Komponen Notifikasi:
- **Notification Badge**: Menampilkan jumlah notifikasi di icon bell
- **Notification Panel**: Dropdown panel dengan daftar notifikasi
- **Audio Alert**: Suara notifikasi saat ada dokumen baru
- **Auto Cleanup**: Otomatis menghapus notifikasi untuk dokumen yang sudah diproses
- **Multi-document Support**: Mendukung Purchase Request dan Reimbursement

### Fungsi Notifikasi Purchase Request:
- **`pollCheckedDocs()`**: Memantau dokumen yang perlu di-check
- **`pollAcknowledgeDocs()`**: Memantau dokumen yang perlu di-acknowledge
- **`pollApproveDocs()`**: Memantau dokumen yang perlu di-approve
- **`pollReceiveDocs()`**: Memantau dokumen yang perlu di-receive
- **`pollRevisionDocs()`**: Memantau dokumen yang perlu direvisi

### Fungsi Notifikasi Reimbursement:
- **`pollReimCheckedDocs()`**: Memantau dokumen Reimbursement yang perlu di-check
- **`pollReimAcknowledgeDocs()`**: Memantau dokumen Reimbursement yang perlu di-acknowledge
- **`pollReimApproveDocs()`**: Memantau dokumen Reimbursement yang perlu di-approve
- **`pollReimReceiveDocs()`**: Memantau dokumen Reimbursement yang perlu di-receive
- **`pollReimRevisionDocs()`**: Memantau dokumen Reimbursement yang perlu direvisi

### Fungsi Utilitas Notifikasi:
- **`cleanupProcessedNotifications()`**: Membersihkan notifikasi yang sudah diproses (PR & Reim)
- **`showNotification()`**: Menampilkan notifikasi dengan role dan document type
- **`removeNotification()`**: Menghapus notifikasi
- **`playNotificationSound()`**: Memainkan suara notifikasi

### Data Notifikasi:
- **Document Number**: Nomor dokumen (PR Number / Voucher Number)
- **Requester**: Nama pembuat dokumen
- **Department**: Departemen pembuat dokumen
- **Submission Date**: Tanggal pengajuan
- **Status**: Status dokumen saat ini
- **Role**: Role approval (Checker, Acknowledger, Approver, Receiver, Revisor)
- **Document Type**: Purchase Request atau Reimbursement

## Cara Menggunakan

### 1. Tab Tersembunyi (Default)
- Semua tab secara default tersembunyi
- Data tetap diambil dan diupdate secara real-time
- Dapat diakses melalui console browser atau debug button

### 2. Debug Mode
- Untuk menampilkan tombol debug, ubah `display: none` menjadi `display: block` pada div debug button
- Klik tombol untuk menampilkan/menyembunyikan tab tertentu
- Tombol "Show All Tabs" untuk menampilkan semua tab Purchase Request sekaligus
- Tombol "Hide All Tabs" untuk menyembunyikan semua tab Purchase Request sekaligus
- Tombol "Show All Reim Tabs" untuk menampilkan semua tab Reimbursement sekaligus
- Tombol "Hide All Reim Tabs" untuk menyembunyikan semua tab Reimbursement sekaligus

### 3. Programmatic Access Purchase Request
```javascript
// Menampilkan tab tertentu
showCheckedTab();
showAcknowledgeTab();
showApproveTab();
showReceiveTab();
showRevisionTab();

// Menyembunyikan tab tertentu
hideCheckedTab();
hideAcknowledgeTab();
hideApproveTab();
hideReceiveTab();
hideRevisionTab();

// Toggle tab tertentu
toggleCheckedTab();
toggleAcknowledgeTab();
toggleApproveTab();
toggleReceiveTab();
toggleRevisionTab();

// Kontrol semua tab
showAllTabs();
hideAllTabs();
```

### 4. Programmatic Access Reimbursement
```javascript
// Menampilkan tab tertentu
showReimCheckedTab();
showReimAcknowledgeTab();
showReimApproveTab();
showReimReceiveTab();
showReimRevisionTab();

// Menyembunyikan tab tertentu
hideReimCheckedTab();
hideReimAcknowledgeTab();
hideReimApproveTab();
hideReimReceiveTab();
hideReimRevisionTab();

// Toggle tab tertentu
toggleReimCheckedTab();
toggleReimAcknowledgeTab();
toggleReimApproveTab();
toggleReimReceiveTab();
toggleReimRevisionTab();

// Kontrol semua tab
showAllReimTabs();
hideAllReimTabs();
```

### 5. Notifikasi Approval
- **Badge**: Otomatis muncul di icon bell saat ada notifikasi
- **Panel**: Klik icon bell untuk membuka panel notifikasi
- **Audio**: Suara otomatis saat ada dokumen baru (setelah user berinteraksi)
- **Auto-cleanup**: Notifikasi otomatis hilang saat dokumen diproses
- **Multi-document**: Mendukung Purchase Request dan Reimbursement

## Perbedaan dengan Dashboard Utama

| Aspek | Dashboard Utama | Tab Approval |
|-------|----------------|--------------|
| **Data Source** | Dokumen yang dibuat oleh user | Dokumen yang perlu di-approve oleh user |
| **Parameter** | `requesterId` | `ApproverId` + `ApproverRole` |
| **Endpoint** | `/api/pr/dashboard` | `/api/pr/dashboard/approval` |
| **Visibility** | Selalu terlihat | Tersembunyi (default) |
| **Notifikasi** | Tidak ada | Real-time approval notifications |
| **Document Types** | Purchase Request | Purchase Request + Reimbursement |

## Logging dan Monitoring

### Console Logs:
- `"Memuat [tab] dashboard untuk user ID: [userId]"`
- `"[Tab] dashboard counts updated successfully for user [userId]"`
- `"[Tab] tab ditampilkan/disembunyikan"`
- `"Initializing approval notifications..."`
- `"Approval notifications initialized successfully"`
- `"Notification sound played successfully"`

### Error Handling:
- Jika user ID tidak ditemukan: `"User ID tidak ditemukan, tidak bisa memuat [tab] dashboard"`
- Jika API error: Set semua counter ke 0
- Jika audio error: `"Failed to play notification sound"`

## Maintenance

### Untuk Menampilkan Tab Secara Permanen:
1. Ubah `style="display: none;"` menjadi `style="display: block;"` pada div tab yang diinginkan
2. Hapus atau ubah tombol debug

### Untuk Menghapus Tab:
1. Hapus div tab dari HTML
2. Hapus pemanggilan fungsi load dashboard dari `window.onload`
3. Hapus semua fungsi terkait tab dari JavaScript

### Untuk Menonaktifkan Notifikasi:
1. Hapus pemanggilan `initApprovalNotifications()` dari `window.onload`
2. Hapus semua fungsi notifikasi dari JavaScript
3. Hapus event listener pada notification bell

### Untuk Menambahkan Document Type Baru:
1. Tambahkan HTML structure untuk tab baru
2. Tambahkan fungsi load dashboard untuk document type baru
3. Tambahkan fungsi kontrol tab untuk document type baru
4. Tambahkan fungsi polling notifikasi untuk document type baru
5. Update `cleanupProcessedNotifications()` untuk document type baru
6. Update `window.onload` untuk memanggil fungsi load dashboard baru
7. Update `initApprovalNotifications()` untuk memanggil fungsi polling baru 