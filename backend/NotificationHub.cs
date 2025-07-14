using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using ExpressivSystem.Models;

namespace ExpressivSystem.Hubs
{
    public class NotificationHub : Hub
    {
        public async Task JoinUserGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        }

        public async Task LeaveUserGroup(string userId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
        }

        public override async Task OnConnectedAsync()
        {
            // Get user ID from connection
            var userId = Context.User?.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, userId);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.User?.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
} 