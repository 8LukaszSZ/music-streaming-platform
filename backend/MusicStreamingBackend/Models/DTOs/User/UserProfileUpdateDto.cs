using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.User
{
    public class UserProfileUpdateDto
    {
        [MaxLength(500)]
        public string? Bio { get; set; }
        public IFormFile? ProfileImage { get; set; }
    }
}

