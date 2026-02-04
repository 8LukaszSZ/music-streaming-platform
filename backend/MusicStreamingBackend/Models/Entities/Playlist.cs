using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models.Entities
{
    [Table("Playlists")]
    public class Playlist
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid UserId { get; set; }
        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;
        public byte[]? PlaylistImage { get; set; }
        [MaxLength(1000)]
        public string? Description { get; set; }
        [Required]
        public bool IsPublic { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public User? User { get; set; }
        public ICollection<PlaylistTrack> PlaylistTracks { get; set; } = new List<PlaylistTrack>();
    }
}
