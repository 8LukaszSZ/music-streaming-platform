using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.User
{
    public class UpdateUserRoleRequestDto
    {
        [Required]
        [MinLength(1)]
        [MaxLength(50)]
        [RegularExpression("^(Admin|User)$", ErrorMessage = "Role must be Admin or User.")]
        public string Role { get; set; } = string.Empty;
    }
}

