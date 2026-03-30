using System;
using Models.Constants;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
        public string ContentType { get; set; } = nameof(Constants.ContentType.TRACK);

        [Range(0, long.MaxValue)]
        public long LikesCount { get; set; } = 0;
        [Range(0, long.MaxValue)]
        public long CommentsCount { get; set; } = 0;
        [Range(0, long.MaxValue)]
        public long PlaysCount { get; set; } = 0;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
