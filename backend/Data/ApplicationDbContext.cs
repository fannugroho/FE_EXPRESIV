using ExpressivSystem.Models;

namespace ExpressivSystem.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Notification configuration
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(450);
                entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
                entity.Property(e => e.DocType).HasMaxLength(100).IsRequired();
                entity.Property(e => e.DocNumber).HasMaxLength(100).IsRequired();
                entity.Property(e => e.RequesterName).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Department).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
                entity.Property(e => e.ApprovalLevel).HasMaxLength(50).IsRequired();
                entity.Property(e => e.IsRead).HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
} 