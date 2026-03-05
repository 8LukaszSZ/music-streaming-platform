using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

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
        public string FilePath { get; set; } = string.Empty;
        public string? TrackImagePath { get; set; }
    }

    public class LocalTrackCreateDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;
        [Required]
        public int Duration { get; set; }
        public decimal? Valence { get; set; }
        public decimal? Energy { get; set; }

        [Required]
        public IFormFile File { get; set; } = null!;
        public IFormFile? TrackImage { get; set; }
    }

    public class LocalTrackUpdateDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;
        public decimal? Valence { get; set; }
        public decimal? Energy { get; set; }
        public IFormFile? TrackImage { get; set; }
    }
}

