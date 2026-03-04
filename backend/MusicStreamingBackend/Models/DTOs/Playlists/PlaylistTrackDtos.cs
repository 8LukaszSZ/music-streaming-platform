using System;
using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Playlists
{
    public class PlaylistTrackResponseDto
    {
        public Guid Id { get; set; }
        public Guid PlaylistId { get; set; }
        public Guid? LocalTrackId { get; set; }
        //public string SourceType { get; set; } = "LOCAL";
    }

    public class PlaylistTrackCreateDto
    {
        [Required]
        public Guid LocalTrackId { get; set; }
    }
}

