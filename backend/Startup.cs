using ExpressivSystem.Services;
using ExpressivSystem.Hubs;

namespace ExpressivSystem
{
    public class Startup
    {
        // ... existing constructor and configuration ...

        public void ConfigureServices(IServiceCollection services)
        {
            // ... existing service configurations ...

            // Add SignalR
            services.AddSignalR();

            // Add Notification Service
            services.AddScoped<INotificationService, NotificationService>();

            // ... rest of existing configurations ...
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // ... existing middleware configurations ...

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                
                // Add SignalR Hub
                endpoints.MapHub<NotificationHub>("/notificationHub");
                
                // ... existing endpoint mappings ...
            });
        }
    }
} 