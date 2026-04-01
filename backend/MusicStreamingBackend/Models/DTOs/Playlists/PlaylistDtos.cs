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
        [MinLength(1)]
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
        [MinLength(1)]
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

    public class PlaylistSearchResultDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string OwnerUsername { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPublic { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? PlaylistImagePath { get; set; }
        public List<PlaylistTrackSearchItemDto> Tracks { get; set; } = new();
    }

    public class PlaylistTrackSearchItemDto
    {
        public Guid PlaylistTrackId { get; set; }
        public Guid LocalTrackId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Duration { get; set; }
        public string? TrackImagePath { get; set; }
        public string ArtistUsername { get; set; } = string.Empty;
        public bool IsPrivate { get; set; }
    }
}

