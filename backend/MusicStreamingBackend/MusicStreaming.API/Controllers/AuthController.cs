using IBL;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Auth;
using Models.Entities;

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
                Username = createdUser.Username,
                Email = createdUser.Email,
                Role = createdUser.Role,
                CreatedAt = createdUser.CreatedAt
            };

            return CreatedAtAction(
                nameof(UserController.GetById),
                "User",
                new { id = createdUser.Id },
                response);
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetUserByEmailAsync(dto.Email);
            if (user == null)
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
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            var response = new LoginResponseDto
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = userDto
            };

            return Ok(response);
        }

    }
}

