using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Playlists
{
    public class PlaylistResponseDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPublic { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? PlaylistImagePath { get; set; }
    }

    public class PlaylistCreateDto
    {
        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public bool IsPublic { get; set; } = false;
        public IFormFile? PlaylistImage { get; set; }
    }

    public class PlaylistUpdateDto
    {
        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }
        public IFormFile? PlaylistImage { get; set; }
    }

    public class PlaylistVisibilityUpdateDto
    {
        public bool IsPublic { get; set; }
    }
}

