using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models.Entities
{
    [Table("PlaylistTracks")]
    public class PlaylistTrack
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid PlaylistId { get; set; }
        [Required]
        [MaxLength(20)]
        public string SourceType { get; set; } = "LOCAL";
        public Guid? LocalTrackId { get; set; }
        public string? SpotifyTrackId { get; set; }

        [ForeignKey("PlaylistId")]
        public Playlist? Playlist { get; set; }
        [ForeignKey("LocalTrackId")]
        public LocalTrack? LocalTrack { get; set; }
    }
}
