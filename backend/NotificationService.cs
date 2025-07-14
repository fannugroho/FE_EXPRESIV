using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using ExpressivSystem.Data;
using ExpressivSystem.Models;

namespace ExpressivSystem.Services
{
    public interface INotificationService
    {
        Task CreateApprovalNotificationAsync(string docType, string docNumber, string requesterName, string department, DateTime submissionDate, string status, string nextApproverId);
        Task MarkNotificationAsReadAsync(string notificationId);
        Task<int> GetUnreadNotificationCountAsync(string userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(ApplicationDbContext context, IHubContext<NotificationHub> hubContext, ILogger<NotificationService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task CreateApprovalNotificationAsync(string docType, string docNumber, string requesterName, string department, DateTime submissionDate, string status, string nextApproverId)
        {
            var startTime = DateTime.UtcNow;
            _logger.LogInformation($"Starting notification creation for {docType} {docNumber} at {startTime}");

            try
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = nextApproverId,
                    DocType = docType,
                    DocNumber = docNumber,
                    RequesterName = requesterName,
                    Department = department,
                    SubmissionDate = submissionDate,
                    Status = status,
                    ApprovalLevel = GetNextApprovalLevel(status),
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                // Save to database
                var dbStartTime = DateTime.UtcNow;
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                var dbEndTime = DateTime.UtcNow;
                _logger.LogInformation($"Database save completed in {(dbEndTime - dbStartTime).TotalMilliseconds}ms");

                // Send real-time notification via SignalR
                var signalRStartTime = DateTime.UtcNow;
                await _hubContext.Clients.User(nextApproverId).SendAsync("NewNotification", notification);
                var signalREndTime = DateTime.UtcNow;
                _logger.LogInformation($"SignalR delivery completed in {(signalREndTime - signalRStartTime).TotalMilliseconds}ms");

                var totalTime = DateTime.UtcNow - startTime;
                _logger.LogInformation($"Total notification creation time: {totalTime.TotalMilliseconds}ms for {docType} {docNumber}");

            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating notification for {docType} {docNumber}: {ex.Message}");
                throw;
            }
        }

        public async Task MarkNotificationAsReadAsync(string notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification != null)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Notification {notificationId} marked as read");
            }
        }

        public async Task<int> GetUnreadNotificationCountAsync(string userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .CountAsync();
        }

        private string GetNextApprovalLevel(string currentStatus)
        {
            return currentStatus switch
            {
                "Draft" => "Checked",
                "Checked" => "Acknowledge",
                "Acknowledge" => "Approved",
                "Approved" => "Received",
                _ => "Checked"
            };
        }
    }
} 