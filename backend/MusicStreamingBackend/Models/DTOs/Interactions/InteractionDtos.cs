using Models.Constants;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Interactions
{
    public class UserLiteDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? ProfileImagePath { get; set; }
    }

    public class ContentLikeToggleDto
    {
        [Required]
        public Guid ContentId { get; set; }

        [Required]
        public ContentType ContentType { get; set; }
    }

    public class ContentCommentCreateDto
    {
        [Required]
        public Guid ContentId { get; set; }

        [Required]
        public ContentType ContentType { get; set; }

        public Guid? ParentCommentId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }

    public class ContentCommentUpdateDto
    {
        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }

    public class ContentCommentResponseDto
    {
        public Guid Id { get; set; }
        public Guid ContentId { get; set; }
        public ContentType ContentType { get; set; }
        public Guid? ParentCommentId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public UserLiteDto User { get; set; } = new UserLiteDto();
        public List<ContentCommentResponseDto> Replies { get; set; } = new();
    }

    public class ContentPlayCreateDto
    {
        [Required]
        public Guid ContentId { get; set; }

        [Required]
        public ContentType ContentType { get; set; }
    }
}

