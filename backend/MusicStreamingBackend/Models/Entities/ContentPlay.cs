using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Models.Constants;

namespace Models.Entities
{
    [Table("ContentPlays")]
    public class ContentPlay
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ContentId { get; set; }

        [Required]
        [MaxLength(20)]
        public string ContentType { get; set; } = nameof(Constants.ContentType.TRACK);

        public Guid? UserId { get; set; }
        
        public DateTime PlayedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}