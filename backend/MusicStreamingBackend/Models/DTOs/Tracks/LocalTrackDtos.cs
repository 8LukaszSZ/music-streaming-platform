using System;
using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Tracks
{
    public class LocalTrackResponseDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Duration { get; set; }
        public decimal? Valence { get; set; }
        public decimal? Energy { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    public class LocalTrackCreateDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public byte[] File { get; set; } = Array.Empty<byte>();

        public byte[]? TrackImage { get; set; }

        [Required]
        public int Duration { get; set; }

        public decimal? Valence { get; set; }
        public decimal? Energy { get; set; }
    }

    public class LocalTrackUpdateDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public byte[]? TrackImage { get; set; }
        public decimal? Valence { get; set; }
        public decimal? Energy { get; set; }
    }
}

