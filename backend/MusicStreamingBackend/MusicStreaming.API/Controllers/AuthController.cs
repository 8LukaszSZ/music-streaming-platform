using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Auth;
using Models.Entities;
using MusicStreaming.API.Extensions;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IAuthTokenService _authTokenService;

        public AuthController(
            IUserService userService,
            IPasswordHasher<User> passwordHasher,
            IAuthTokenService authTokenService)
        {
            _userService = userService;
            _passwordHasher = passwordHasher;
            _authTokenService = authTokenService;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<UserResponseDto>> Register([FromBody] RegisterRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (await _userService.IsEmailTakenAsync(dto.Email))
            {
                return Conflict(new { message = "Email is already taken." });
            }

            if (await _userService.IsUsernameTakenAsync(dto.Username))
            {
                return Conflict(new { message = "Username is already taken." });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = dto.Username,
                Email = dto.Email,
                Role = UserRoles.User
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            var createdUser = await _userService.AddUserAsync(user);

            var response = new UserResponseDto
            {
                Id = createdUser.Id,
                Username = createdUser.DisplayUsername(),
                Email = createdUser.Email,
                Role = createdUser.Role,
                CreatedAt = createdUser.CreatedAt,
                ProfileImagePath = createdUser.DisplayProfileImagePath(),
                Bio = createdUser.Bio
            };

            return CreatedAtAction(
                nameof(UserController.GetById),
                "User",
                new { id = createdUser.Id },
                response);
        }

        // POST: api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetUserByEmailAsync(dto.Email);
            if (user == null || user.IsDeleted)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (verificationResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var token = _authTokenService.GenerateToken(user, out DateTime expiresAt);

            var userDto = new UserResponseDto
            {
                Id = user.Id,
                Username = user.DisplayUsername(),
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                ProfileImagePath = user.DisplayProfileImagePath(),
                Bio = user.Bio
            };

            var response = new LoginResponseDto
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = userDto
            };

            return Ok(response);
        }

        // PUT: api/auth/change-password
        [HttpPut("change-password")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized();
            }

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null || user.IsDeleted)
            {
                return NotFound();
            }

            var verify = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (verify == PasswordVerificationResult.Failed)
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            await _userService.UpdateUserAsync(user);

            return NoContent();
        }

    }
}

