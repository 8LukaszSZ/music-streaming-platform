using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Models.Constants;

namespace Models.Entities
{
    [Table("ContentShares")]
    public class ContentShare
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid SharerId { get; set; }
        [Required]
        public Guid SharedToUserId { get; set; }
        [Required]
        public Guid ContentId { get; set; }
        [Required]
        [MaxLength(20)]
        public string ContentType { get; set; } = ContentTypes.TRACK; // "TRACK" or "PLAYLIST"

        [MaxLength(1000)]
        public string? Message { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User Sharer { get; set; } = null!;
        public User SharedToUser { get; set; } = null!;
    }
}
