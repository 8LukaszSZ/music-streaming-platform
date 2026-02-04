using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Models.Constants;

namespace Models.Entities
{
    [Table("ContentComments")]
    public class ContentComment
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid UserId { get; set; }
        [Required]
        public Guid ContentId { get; set; }
        [Required]
        [MaxLength(20)]
        public string ContentType { get; set; } = ContentTypes.TRACK; // "TRACK" or "PLAYLIST"
        
        public Guid? ParentCommentId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public User User { get; set; } = null!;

        [ForeignKey("ParentCommentId")]
        public ContentComment? ParentComment { get; set; }
        public ICollection<ContentComment> Replies { get; set; } = new List<ContentComment>();
    }
}
