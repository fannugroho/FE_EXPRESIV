using System;
using System.ComponentModel.DataAnnotations;

namespace ExpressivSystem.Models
{
    public class Notification
    {
        [Key]
        public string Id { get; set; }
        
        [Required]
        public string UserId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string DocType { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string DocNumber { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string RequesterName { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Department { get; set; }
        
        [Required]
        public DateTime SubmissionDate { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string ApprovalLevel { get; set; }
        
        public bool IsRead { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ApplicationUser User { get; set; }
    }
} 