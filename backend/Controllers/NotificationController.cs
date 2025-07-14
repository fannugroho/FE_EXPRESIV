using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExpressivSystem.Services;
using ExpressivSystem.Models;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace ExpressivSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ApplicationDbContext _context;

        public NotificationController(INotificationService notificationService, ApplicationDbContext context)
        {
            _notificationService = notificationService;
            _context = context;
        }

        [HttpGet("approval/{userId}")]
        public async Task<IActionResult> GetApprovalNotifications(string userId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new
                    {
                        n.Id,
                        n.DocType,
                        n.DocNumber,
                        n.RequesterName,
                        n.Department,
                        n.SubmissionDate,
                        n.Status,
                        n.ApprovalLevel,
                        n.IsRead,
                        n.CreatedAt
                    })
                    .ToListAsync();

                var unreadCount = await _notificationService.GetUnreadNotificationCountAsync(userId);

                return Ok(new
                {
                    data = notifications,
                    totalCount = notifications.Count,
                    unreadCount = unreadCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving notifications", error = ex.Message });
            }
        }

        [HttpPatch("{notificationId}/read")]
        public async Task<IActionResult> MarkAsRead(string notificationId)
        {
            try
            {
                await _notificationService.MarkNotificationAsReadAsync(notificationId);
                return Ok(new { message = "Notification marked as read" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error marking notification as read", error = ex.Message });
            }
        }

        [HttpGet("count/{userId}")]
        public async Task<IActionResult> GetUnreadCount(string userId)
        {
            try
            {
                var count = await _notificationService.GetUnreadNotificationCountAsync(userId);
                return Ok(new { unreadCount = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting unread count", error = ex.Message });
            }
        }
    }
} 