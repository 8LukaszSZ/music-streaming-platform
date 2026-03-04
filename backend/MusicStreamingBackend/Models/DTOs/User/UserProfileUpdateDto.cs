using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.User
{
    public class UserProfileUpdateDto
    {
        [MaxLength(500)]
        public string? Bio { get; set; }
    }
}

