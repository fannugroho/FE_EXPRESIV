# Rekap Perubahan Revisi Reimbursement

Berikut adalah rekap perubahan baris-per-baris (diff) yang sudah dikelompokkan berdasarkan file dan menggabungkan seluruh perubahan dari commit terkait revisi reimbursement.

---

## 1. approvalPages/approval/acknowledge/reimbursement/acknowledgeReim.html

```diff
@@ -114,40 +114,19 @@
-            <!-- Revised Remarks Display Section (Read-only) -->
-            <div class="mt-4" id="revisedRemarksSection" style="display: none;">
-                ... (seluruh container revisi dihapus)
-            </div>
+        <!-- Revision Remarks Section -->
+        <div class="mt-4">
+            <div class="flex justify-between items-center">
+                <!--<label class="text-red-600">Need Revision</label>-->
+                <button onclick="toggleRevisionField()" id="addRevisionBtn" class="text-blue-500 hover:text-blue-700 font-medium">+ Add revision</button>
+            </div>
+            <div id="revisionContainer" class="hidden">
+                <!-- Revision fields will be added here by JavaScript -->
+            </div>
+        </div>
+
+        <!-- Revised Remarks Display Section (Read-only) -->
+        <div class="mt-4" id="revisedRemarksSection"></div>
```
Pada bagian submit revisi:
```diff
-                    fetch(`${BASE_URL}/api/reimbursements/revision/${id}`, {
-                        method: 'PATCH',
+                    // Get user ID from auth.js
+                    const userId = getUserId();
+                    if (!userId) {
+                        Swal.fire('Error', 'User ID not found', 'error');
+                        return;
+                    }
+                    fetch(`${BASE_URL}/api/reimbursements/revision/${id}`, {
+                        method: 'POST',
                         headers: {
                             'Content-Type': 'application/json',
                             'Authorization': `Bearer ${getAccessToken()}`
                         },
-                        body: JSON.stringify({
-                            remarks: allRemarks
-                        })
+                        body: JSON.stringify({
+                            userId: userId,
+                            remarks: allRemarks,
+                            stage: "Acknowledged"
+                        })
                     })
```

---

## 2. approvalPages/approval/acknowledge/reimbursement/acknowledgeReim.js

```diff
@@ -346,8 +346,53 @@
-    // Display revision history from API data
-    displayRevisionHistory(data);
+    if (data.revisions) {
+        renderRevisionHistory(data.revisions);
+    } else {
+        renderRevisionHistory([]);
+    }
@@ -675,6 +679,47 @@
+function formatDateToDDMMYYYY(dateString) {
+    if (!dateString) return '';
+    const date = new Date(dateString);
+    const day = String(date.getDate()).padStart(2, '0');
+    const month = String(date.getMonth() + 1).padStart(2, '0');
+    const year = date.getFullYear();
+    return `${day}/${month}/${year}`;
+}
+
+function renderRevisionHistory(revisions) {
+    const section = document.getElementById('revisedRemarksSection');
+    if (!section) return;
+
+    if (!Array.isArray(revisions) || revisions.length === 0) {
+        section.style.display = 'none';
+        return;
+    }
+
+    section.style.display = 'block';
+    // Group revisions by stage
+    const grouped = {};
+    revisions.forEach(rev => {
+        if (!grouped[rev.stage]) grouped[rev.stage] = [];
+        grouped[rev.stage].push(rev);
+    });
+    // Build HTML
+    let html = '';
+    html += `<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>`;
+    html += `<div class="bg-gray-50 p-4 rounded-lg border"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span id="revisedCount" class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;
+    Object.entries(grouped).forEach(([stage, items]) => {
+        html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
+        items.forEach((rev, idx) => {
+            html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${formatDateToDDMMYYYY(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
+        });
+    });
+    section.innerHTML = html;
+}
```

---

## 3. approvalPages/approval/approve/reimbursement/approveReim.html

```diff
@@ -114,9 +114,19 @@
-<!-- Revised Remarks Display Section (Read-only) -->
-<div class="mt-4" id="revisedRemarksSection"></div>
+        <!-- Revision Remarks Section -->
+        <div class="mt-4">
+            <div class="flex justify-between items-center">
+                <!--<label class="text-red-600">Need Revision</label>-->
+                <button onclick="toggleRevisionField()" id="addRevisionBtn" class="text-blue-500 hover:text-blue-700 font-medium">+ Add revision</button>
+            </div>
+            <div id="revisionContainer" class="hidden">
+                <!-- Revision fields will be added here by JavaScript -->
+            </div>
+        </div>
+
+        <!-- Revised Remarks Display Section (Read-only) -->
+        <div class="mt-4" id="revisedRemarksSection"></div>
```
Pada bagian submit revisi:
```diff
-                    fetch(`${BASE_URL}/api/reimbursements/revision/${id}`, {
-                        method: 'PATCH',
+                    // Get user ID from auth.js
+                    const userId = getUserId();
+                    if (!userId) {
+                        Swal.fire('Error', 'User ID not found', 'error');
+                        return;
+                    }
+                    fetch(`${BASE_URL}/api/reimbursements/revision/${id}`, {
+                        method: 'POST',
                         headers: {
                             'Content-Type': 'application/json',
                             'Authorization': `Bearer ${getAccessToken()}`
                         },
-                        body: JSON.stringify({
-                            remarks: allRemarks
-                        })
+                        body: JSON.stringify({
+                            userId: userId,
+                            remarks: allRemarks,
+                            stage: "Approved"
+                        })
                     })
```

---

## 4. approvalPages/approval/approve/reimbursement/approveReim.js

```diff
@@ -284,8 +319,53 @@
-    // Display revision history from API data
-    displayRevisionHistory(data);
+    if (data.revisions) {
+        renderRevisionHistory(data.revisions);
+    } else {
+        renderRevisionHistory([]);
+    }
@@ -891,6 +895,48 @@
+function formatDateToDDMMYYYY(dateString) {
+    if (!dateString) return '';
+    const date = new Date(dateString);
+    const day = String(date.getDate()).padStart(2, '0');
+    const month = String(date.getMonth() + 1).padStart(2, '0');
+    const year = date.getFullYear();
+    return `${day}/${month}/${year}`;
+}
+
+function renderRevisionHistory(revisions) {
+    const section = document.getElementById('revisedRemarksSection');
+    if (!section) return;
+
+    if (!Array.isArray(revisions) || revisions.length === 0) {
+        section.style.display = 'none';
+        return;
+    }
+
+    section.style.display = 'block';
+    // Group revisions by stage
+    const grouped = {};
+    revisions.forEach(rev => {
+        if (!grouped[rev.stage]) grouped[rev.stage] = [];
+        grouped[rev.stage].push(rev);
+    });
+    // Build HTML
+    let html = '';
+    html += `<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>`;
+    html += `<div class="bg-gray-50 p-4 rounded-lg border"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span id="revisedCount" class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;
+    Object.entries(grouped).forEach(([stage, items]) => {
+        html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
+        items.forEach((rev, idx) => {
+            html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${formatDateToDDMMYYYY(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
+        });
+    });
+    section.innerHTML = html;
+}
```

---

## 5. approvalPages/approval/check/reimbursement/checkedReim.html

```diff
@@ -136,7 +136,16 @@
-            <!-- Revised Remarks Display Section (Read-only) -->
-            <div class="mt-4" id="revisedRemarksSection"></div>
+            <!-- Revision Remarks Section -->
+            <div class="mt-4">
+                <div class="flex justify-between items-center">
+                    <!--<label class="text-red-600">Need Revision</label>-->
+                    <button onclick="toggleRevisionField()" id="addRevisionBtn" class="text-blue-500 hover:text-blue-700 font-medium">+ Add revision</button>
+                </div>
+                <div id="revisionContainer" class="hidden">
+                    <!-- Revision fields will be added here by JavaScript -->
+                </div>
+            </div>
+
+            <!-- Revised Remarks Display Section (Read-only) -->
+            <div class="mt-4" id="revisedRemarksSection"></div>
```
Pada bagian submit revisi:
```diff
-                    fetch(`${BASE_URL}/api/reimbursements/revision/${id}`, {
-                        method: 'PATCH',
+                    // Get user ID from auth.js
+                    const userId = getUserId();
+                    if (!userId) {
+                        Swal.fire('Error', 'User ID not found', 'error');
+                        return;
+                    }
+                    fetch(`${BASE_URL}/api/reimbursements/revision/${id}`, {
+                        method: 'POST',
                         headers: {
                             'Content-Type': 'application/json',
                             'Authorization': `Bearer ${getAccessToken()}`
                         },
-                        body: JSON.stringify({
-                            remarks: allRemarks
-                        })
+                        body: JSON.stringify({
+                            userId: userId,
+                            remarks: allRemarks,
+                            stage: "Checked"
+                        })
                     })
```

---

## 6. approvalPages/approval/check/reimbursement/checkedReim.js

```diff
@@ -324,8 +324,53 @@
-    // Display revision history from API data
-    displayRevisionHistory(data);
+    if (data.revisions) {
+        renderRevisionHistory(data.revisions);
+    } else {
+        renderRevisionHistory([]);
+    }
@@ -349,26 +349,22 @@
+function formatDateToDDMMYYYY(dateString) {
+    if (!dateString) return '';
+    const date = new Date(dateString);
+    const day = String(date.getDate()).padStart(2, '0');
+    const month = String(date.getMonth() + 1).padStart(2, '0');
+    const year = date.getFullYear();
+    return `${day}/${month}/${year}`;
+}
+
+function renderRevisionHistory(revisions) {
+    const section = document.getElementById('revisedRemarksSection');
+    if (!section) return;
+
+    if (!Array.isArray(revisions) || revisions.length === 0) {
+        section.style.display = 'none';
+        return;
+    }
+
+    section.style.display = 'block';
+    // Group revisions by stage
+    const grouped = {};
+    revisions.forEach(rev => {
+        if (!grouped[rev.stage]) grouped[rev.stage] = [];
+        grouped[rev.stage].push(rev);
+    });
+    // Build HTML
+    let html = '';
+    html += `<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>`;
+    html += `<div class="bg-gray-50 p-4 rounded-lg border"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span id="revisedCount" class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;
+    Object.entries(grouped).forEach(([stage, items]) => {
+        html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
+        items.forEach((rev, idx) => {
+            html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${formatDateToDDMMYYYY(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
+        });
+    });
+    section.innerHTML = html;
+}
```

---

## 7. approvalPages/approval/receive/reimbursement/receiveReim.html

```diff
@@ -175,6 +175,17 @@
+            <!-- Revision Remarks Section -->
+            <div class="mt-4">
+                <div class="flex justify-between items-center">
+                    <!--<label class="text-red-600">Need Revision</label>-->
+                    <button onclick="toggleRevisionField()" id="addRevisionBtn" class="text-blue-500 hover:text-blue-700 font-medium">+ Add revision</button>
+                </div>
+                <div id="revisionContainer" class="hidden">
+                    <!-- Revision fields will be added here by JavaScript -->
+                </div>
+            </div>
+
             <!-- Revised Remarks Display Section (Read-only) -->
             <div class="mt-4" id="revisedRemarksSection"></div>
```
Pada bagian submit revisi:
```diff
-                    fetch(`${BASE_URL}/api/reimbursements/revision/${id}`, {
-                        method: 'PATCH',
+                    // Get user ID from auth.js
+                    const userId = getUserId();
+                    if (!userId) {
+                        Swal.fire('Error', 'User ID not found', 'error');
+                        return;
+                    }
+                    fetch(`${BASE_URL}/api/reimbursements/revision/${id}`, {
+                        method: 'POST',
                         headers: {
                             'Content-Type': 'application/json',
                             'Authorization': `Bearer ${getAccessToken()}`
                         },
-                        body: JSON.stringify({
-                            remarks: allRemarks
-                        })
+                        body: JSON.stringify({
+                            userId: userId,
+                            remarks: allRemarks,
+                            stage: "Received"
+                        })
                     })
```

---

## 8. approvalPages/approval/receive/reimbursement/receiveReim.js

```diff
@@ -288,6 +288,12 @@
+    if (data.revisions) {
+        renderRevisionHistory(data.revisions);
+    } else {
+        renderRevisionHistory([]);
+    }
@@ -867,4 +873,46 @@
+function formatDateToDDMMYYYY(dateString) {
+    if (!dateString) return '';
+    const date = new Date(dateString);
+    const day = String(date.getDate()).padStart(2, '0');
+    const month = String(date.getMonth() + 1).padStart(2, '0');
+    const year = date.getFullYear();
+    return `${day}/${month}/${year}`;
+}
+
+function renderRevisionHistory(revisions) {
+    const section = document.getElementById('revisedRemarksSection');
+    if (!section) return;
+
+    if (!Array.isArray(revisions) || revisions.length === 0) {
+        section.style.display = 'none';
+        return;
+    }
+
+    section.style.display = 'block';
+    // Group revisions by stage
+    const grouped = {};
+    revisions.forEach(rev => {
+        if (!grouped[rev.stage]) grouped[rev.stage] = [];
+        grouped[rev.stage].push(rev);
+    });
+    // Build HTML
+    let html = '';
+    html += `<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>`;
+    html += `<div class="bg-gray-50 p-4 rounded-lg border"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span id="revisedCount" class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;
+    Object.entries(grouped).forEach(([stage, items]) => {
+        html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
+        items.forEach((rev, idx) => {
+            html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${formatDateToDDMMYYYY(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
+        });
+    });
+    section.innerHTML = html;
+}
```

---

## 9. approvalPages/approval/revision/reimbursement/revisionReim.html

```diff
@@ -137,40 +137,8 @@
-            <!-- Revised Remarks Display Section (Read-only) -->
-            <div class="mt-4" id="revisedRemarksSection" style="display: none;">
-                ... (seluruh container revisi dihapus)
-            </div>
+            <!-- Revised Remarks Display Section (Read-only) -->
+            <div class="mt-4" id="revisedRemarksSection"></div>
```

---

## 10. approvalPages/approval/revision/reimbursement/revisionReim.js

```diff
@@ -793,6 +793,48 @@
+function formatDateToDDMMYYYY(dateString) {
+    if (!dateString) return '';
+    const date = new Date(dateString);
+    const day = String(date.getDate()).padStart(2, '0');
+    const month = String(date.getMonth() + 1).padStart(2, '0');
+    const year = date.getFullYear();
+    return `${day}/${month}/${year}`;
+}
+
+function renderRevisionHistory(revisions) {
+    const section = document.getElementById('revisedRemarksSection');
+    if (!section) return;
+
+    if (!Array.isArray(revisions) || revisions.length === 0) {
+        section.style.display = 'none';
+        return;
+    }
+
+    section.style.display = 'block';
+    // Group revisions by stage
+    const grouped = {};
+    revisions.forEach(rev => {
+        if (!grouped[rev.stage]) grouped[rev.stage] = [];
+        grouped[rev.stage].push(rev);
+    });
+    // Build HTML
+    let html = '';
+    html += `<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>`;
+    html += `<div class="bg-gray-50 p-4 rounded-lg border"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span id="revisedCount" class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;
+    Object.entries(grouped).forEach(([stage, items]) => {
+        html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
+        items.forEach((rev, idx) => {
+            html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${formatDateToDDMMYYYY(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
+        });
+    });
+    section.innerHTML = html;
+}
@@ -897,6 +939,7 @@
+    renderRevisionHistory(data.revisions);
```

---

## 11. js/detailReim.js

```diff
@@ -1257,6 +1257,53 @@
+    // Helper to format date as DD/MM/YYYY
+    function formatDateToDDMMYYYY(dateString) {
+        if (!dateString) return '';
+        const date = new Date(dateString);
+        const day = String(date.getDate()).padStart(2, '0');
+        const month = String(date.getMonth() + 1).padStart(2, '0');
+        const year = date.getFullYear();
+        return `${day}/${month}/${year}`;
+    }
+
+    // Render revision history section
+    function renderRevisionHistory(revisions) {
+        const section = document.getElementById('revisedRemarksSection');
+        if (!section) return;
+
+        if (!Array.isArray(revisions) || revisions.length === 0) {
+            section.style.display = 'none';
+            return;
+        }
+
+        section.style.display = 'block';
+
+        // Group revisions by stage
+        const grouped = {};
+        revisions.forEach(rev => {
+            if (!grouped[rev.stage]) grouped[rev.stage] = [];
+            grouped[rev.stage].push(rev);
+        });
+
+        // Build HTML
+        let html = '';
+        html += `<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>`;
+        html += `<div class="bg-gray-50 p-4 rounded-lg border"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span id="revisedCount" class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;
+
+        Object.entries(grouped).forEach(([stage, items]) => {
+            html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
+            items.forEach((rev, idx) => {
+                html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${formatDateToDDMMYYYY(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
+            });
+        });
+
+        section.innerHTML = html;
+    }
+
+    // Display revision history if available
+    renderRevisionHistory(data.revisions);
```

---

``` 