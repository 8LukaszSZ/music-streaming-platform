using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Models.Constants;

namespace Models.Entities
{
    [Table("UserActivities")]
    public class UserActivity
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string ActivityType { get; set; } = nameof(Models.Constants.ActivityType.SHARE);

        [Required]
        public Guid ContentId { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string ContentType { get; set; } = nameof(Constants.ContentType.TRACK);

        [MaxLength(1000)]
        public string? Message { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public User User { get; set; } = null!;
    }
}