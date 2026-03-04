using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.User
{
    public class UpdateUserRoleRequestDto
    {
        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = string.Empty;
    }
}

