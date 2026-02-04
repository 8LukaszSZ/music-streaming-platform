using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models.DTOs.Auth
{
    public class RegisterRequestDto
    {
        [Required(ErrorMessage = "Username is required")]
        [MaxLength(50, ErrorMessage = "Username cannot exceed 50 characters")]
        [RegularExpression(
        @"^[a-zA-Z0-9_]{3,50}$",
        ErrorMessage = "Username must be 3-50 characters long and contain only letters, numbers, or underscores")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [MaxLength(100)]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters long")]
        [MaxLength(100)]
        [RegularExpression(
            @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$",
            ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one digit and one special character")]
        public string Password { get; set; } = string.Empty;
    }
}
