using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models.Entities
{
    [Table("LocalTracks")]
    public class LocalTrack
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid UserId { get; set; }
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;
        [Required]
        public string FilePath { get; set; } = string.Empty;
        public string? TrackImagePath { get; set; }
        [Required]
        public int Duration { get; set; }
        [Range(0, 1)]
        public decimal? Valence { get; set; }
        [Range(0, 1)]
        public decimal? Energy { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public User? User { get; set; }
        public ICollection<PlaylistTrack> PlaylistTracks { get; set; } = new List<PlaylistTrack>();
    }
}
