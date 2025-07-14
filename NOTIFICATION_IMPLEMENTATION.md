# Implementasi Sistem Notifikasi Real-time

## Overview
Sistem notifikasi real-time yang otomatis mengirim notifikasi kepada user approval ketika ada dokumen yang memerlukan approval.

## Fitur yang Diimplementasikan

### ✅ 1. Real-time Notifications
- SignalR WebSocket connection untuk notifikasi instan
- Toast notifications untuk feedback langsung
- Badge counter yang update otomatis

### ✅ 2. Automatic Trigger
- Notifikasi otomatis saat dokumen dibuat
- Notifikasi otomatis saat status dokumen berubah
- Trigger berdasarkan approval workflow

### ✅ 3. Format Notifikasi Sesuai Skema
```
PR Number - Requester name - Department - submission date - status
```

### ✅ 4. Database Storage
- Tabel Notifications untuk menyimpan notifikasi
- Tracking status read/unread
- Index untuk performa optimal

### ✅ 5. API Endpoints
- `GET /api/notification/approval/{userId}` - Ambil notifikasi approval
- `PATCH /api/notification/{id}/read` - Mark as read
- `GET /api/notification/count/{userId}` - Hitung unread

## Cara Kerja

### 1. Saat Dokumen Dibuat
```csharp
// PurchaseRequestController.cs
[HttpPost]
public async Task<IActionResult> CreatePurchaseRequest([FromBody] PurchaseRequestDto dto)
{
    // 1. Create PR
    var pr = new PurchaseRequest { /* ... */ };
    _context.PurchaseRequests.Add(pr);
    await _context.SaveChangesAsync();

    // 2. Create notification for first approver
    var firstApprover = await GetFirstApprover(pr);
    await _notificationService.CreateApprovalNotificationAsync(
        "Purchase Request",
        pr.DocumentNumber,
        pr.RequesterName,
        pr.Department,
        pr.CreatedAt,
        pr.Status,
        firstApprover.Id
    );

    return Ok(pr);
}
```

### 2. Real-time Delivery
```javascript
// dashboard.js
function initializeWebSocket() {
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${BASE_URL}/notificationHub`)
        .withAutomaticReconnect()
        .build();

    connection.on("NewNotification", (notification) => {
        showToastNotification(notification);
        addNotificationToList(notification);
        updateNotificationBadge();
    });
}
```

### 3. Toast Notification
```javascript
function showToastNotification(notification) {
    const toast = document.createElement('div');
    toast.innerHTML = `
        <div class="font-semibold">${notification.docNumber}</div>
        <div>${notification.requesterName} - ${notification.department}</div>
        <div>${notification.approvalLevel} approval required</div>
    `;
    // Auto remove after 8 seconds
}
```

## Database Schema

```sql
CREATE TABLE Notifications (
    Id NVARCHAR(450) PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    DocType NVARCHAR(100) NOT NULL,
    DocNumber NVARCHAR(100) NOT NULL,
    RequesterName NVARCHAR(200) NOT NULL,
    Department NVARCHAR(100) NOT NULL,
    SubmissionDate DATETIME2 NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    ApprovalLevel NVARCHAR(50) NOT NULL,
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id)
);
```

## Workflow Approval

### Purchase Request Flow:
1. **Draft** → Notifikasi ke Checker
2. **Checked** → Notifikasi ke Acknowledger  
3. **Acknowledged** → Notifikasi ke Approver
4. **Approved** → Notifikasi ke Receiver
5. **Received** → Selesai

### Cash Advance Flow:
1. **Draft** → Notifikasi ke Checker
2. **Checked** → Notifikasi ke Approver
3. **Approved** → Notifikasi ke Receiver
4. **Received** → Selesai

## Frontend Features

### 1. Notification Badge
- Menampilkan jumlah notifikasi unread
- Update otomatis via WebSocket
- Animasi pulse untuk menarik perhatian

### 2. Dropdown Notifications
- List 5 notifikasi terbaru
- Filter berdasarkan tanggal, jenis dokumen, approval level
- Mark as read functionality
- Click untuk redirect ke halaman approval

### 3. Toast Notifications
- Muncul otomatis saat ada notifikasi baru
- Auto dismiss setelah 8 detik
- Manual close button
- Animasi slide-in dari kanan

## Backend Services

### NotificationService
```csharp
public interface INotificationService
{
    Task CreateApprovalNotificationAsync(string docType, string docNumber, 
        string requesterName, string department, DateTime submissionDate, 
        string status, string nextApproverId);
    Task MarkNotificationAsReadAsync(string notificationId);
    Task<int> GetUnreadNotificationCountAsync(string userId);
}
```

### SignalR Hub
```csharp
public class NotificationHub : Hub
{
    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, userId);
    }
}
```

## Testing

### 1. Test Create PR
```bash
POST /api/purchase-request
{
    "requesterName": "John Doe",
    "department": "Finance",
    "items": [...]
}
```

### 2. Test Notification API
```bash
GET /api/notification/approval/{userId}
```

### 3. Test Mark as Read
```bash
PATCH /api/notification/{notificationId}/read
```

## Deployment Checklist

### Backend
- [ ] Add SignalR package: `Microsoft.AspNetCore.SignalR`
- [ ] Run migration: `dotnet ef migrations add AddNotificationsTable`
- [ ] Update database: `dotnet ef database update`
- [ ] Configure SignalR in Startup.cs
- [ ] Add NotificationService to DI container

### Frontend
- [ ] Add SignalR client library
- [ ] Update dashboard.js dengan real-time features
- [ ] Test WebSocket connection
- [ ] Test toast notifications

### Database
- [ ] Verify Notifications table created
- [ ] Check indexes for performance
- [ ] Test foreign key constraints

## Monitoring

### Logs to Monitor
- SignalR connection status
- Notification creation success/failure
- WebSocket connection errors
- API response times

### Metrics
- Number of notifications created per day
- Average response time for notification API
- WebSocket connection success rate
- User engagement with notifications

## Troubleshooting

### Common Issues

1. **SignalR Connection Failed**
   - Check CORS configuration
   - Verify hub URL is correct
   - Check authentication token

2. **Notifications Not Appearing**
   - Check database connection
   - Verify user ID mapping
   - Check notification service registration

3. **Toast Notifications Not Showing**
   - Check JavaScript console for errors
   - Verify SignalR client library loaded
   - Check CSS animations

## Performance Considerations

1. **Database Indexes**
   - Index on UserId for fast queries
   - Index on IsRead for unread count
   - Index on CreatedAt for sorting

2. **SignalR Optimization**
   - Use groups for targeted notifications
   - Implement connection pooling
   - Monitor memory usage

3. **Frontend Optimization**
   - Limit notification list to 5 items
   - Implement virtual scrolling for large lists
   - Debounce API calls

## Security

1. **Authentication**
   - All notification endpoints require JWT token
   - User can only access their own notifications
   - Validate user permissions for approval actions

2. **Data Validation**
   - Sanitize all input data
   - Validate document types and statuses
   - Prevent SQL injection

3. **Rate Limiting**
   - Limit notification API calls
   - Implement request throttling
   - Monitor for abuse patterns 