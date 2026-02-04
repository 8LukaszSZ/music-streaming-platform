using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Models.Constants;

namespace Models.Entities
{
    [Table("ContentStats")]
    public class ContentStat
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid ContentId { get; set; }
        [Required]
        [MaxLength(20)]
        public string ContentType { get; set; } = ContentTypes.TRACK; // "TRACK" or "PLAYLIST"

        public long LikesCount { get; set; } = 0;
        public long CommentsCount { get; set; } = 0;
        public long PlaysCount { get; set; } = 0; 

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
