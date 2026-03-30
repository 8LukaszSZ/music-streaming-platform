using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Models.Constants;

namespace Models.Entities
{
    [Table("ContentLikes")]
    public class ContentLike
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid UserId { get; set; }
        [Required]
        public Guid ContentId { get; set; }
        [Required]
        [MaxLength(20)]
        public string ContentType { get; set; } = nameof(Constants.ContentType.TRACK);

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public User User { get; set; } = null!;
    }
}
