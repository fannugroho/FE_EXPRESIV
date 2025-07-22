using ExpressivSystem.Services;

namespace ExpressivSystem
{
    public class Startup
    {
        // ... existing constructor and configuration ...

        public void ConfigureServices(IServiceCollection services)
        {
            // Add CORS configuration
            services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", builder =>
                {
                    builder
                        .AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

            // ... existing service configurations ...

            // Add Notification Service
            services.AddScoped<INotificationService, NotificationService>();

            // ... rest of existing configurations ...
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // ... existing middleware configurations ...

            // Use CORS before routing
            app.UseCors("AllowAll");

            // ... existing middleware configurations ...

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                
                // ... existing endpoint mappings ...
            });
        }
    }
} 