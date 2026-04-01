using BL.Services;
using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Auth;
using Models.DTOs.User;
using Models.Entities;
using MusicStreaming.API.Extensions;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IFileStorageService _fileStorageService;

        public UserController(IUserService userService, IFileStorageService fileStorageService)
        {
            _userService = userService;
            _fileStorageService = fileStorageService;

        }

        // GET: api/user
        // Pełna lista użytkowników tylko dla administratora
        [HttpGet]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAll()
        {
            var users = await _userService.GetAllUsersAsync();

            var result = users.Select(u => new UserResponseDto
            {
                Id = u.Id,
                Username = u.DisplayUsername(),
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt,
                ProfileImagePath = u.DisplayProfileImagePath()
            });

            return Ok(result);
        }

        // GET: api/user/{id}
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<UserResponseDto>> GetById(Guid id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            var isAdmin = User.IsInRole(UserRoles.Admin);

            var dto = new UserResponseDto
            {
                Id = user.Id,
                Username = user.DisplayUsername(),
                Email = isAdmin ? user.Email : string.Empty,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                ProfileImagePath = user.DisplayProfileImagePath()
            };

            return Ok(dto);
        }

        // GET: api/user/me
        [HttpGet("me")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<UserResponseDto>> GetMe()
        {
            var userId = User.GetUserId();

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound();
            }
            if (user.IsDeleted)
            {
                return NotFound();
            }

            var dto = new UserResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                ProfileImagePath = user.DisplayProfileImagePath()

            };

            return Ok(dto);
        }

        // PUT: api/user/me/profile
        [HttpPut("me/profile")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<UserResponseDto>> UpdateMyProfile([FromForm] UserProfileUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.GetUserId();

            string? imagePath = null;
            if (dto.ProfileImage != null)
            {
                imagePath = await _fileStorageService.SaveUserImageAsync(userId, dto.ProfileImage);
            }

            var updated = await _userService.UpdateUserProfileAsync(userId, dto.Bio, imagePath);

            var response = new UserResponseDto
            {
                Id = updated.Id,
                Username = updated.DisplayUsername(),
                Email = updated.Email,
                Role = updated.Role,
                CreatedAt = updated.CreatedAt,
                ProfileImagePath = updated.DisplayProfileImagePath()
            };

            return Ok(response);
        }

        // GET: api/user/check-username?username=...
        [HttpGet("check-username")]
        [AllowAnonymous]
        public async Task<ActionResult> CheckUsername([FromQuery] string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest(new { message = "Username is required." });

            var taken = await _userService.IsUsernameTakenAsync(username);
            return Ok(new { available = !taken });
        }

        // GET: api/user/check-email?email=...
        [HttpGet("check-email")]
        [AllowAnonymous]
        public async Task<ActionResult> CheckEmail([FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email is required." });

            var taken = await _userService.IsEmailTakenAsync(email);
            return Ok(new { available = !taken });
        }

        // GET: api/user/search?query=...
        [HttpGet("search")]
        //[Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> Search([FromQuery] string query)
        {
            var users = await _userService.SearchUsersAsync(query);
            var isAdmin = User.IsInRole(UserRoles.Admin);

            var result = users.Select(u => new UserResponseDto
            {
                Id = u.Id,
                Username = u.DisplayUsername(),
                Email = isAdmin ? u.Email : string.Empty,
                Role = u.Role,
                CreatedAt = u.CreatedAt,
                ProfileImagePath = u.DisplayProfileImagePath()
            });

            return Ok(result);
        }

        // PUT: api/user/{id}/role
        [HttpPut("{id:guid}/role")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<UserResponseDto>> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updated = await _userService.UpdateUserRoleAsync(id, dto.Role);

            var response = new UserResponseDto
            {
                Id = updated.Id,
                Username = updated.DisplayUsername(),
                Email = updated.Email,
                Role = updated.Role,
                CreatedAt = updated.CreatedAt,
                ProfileImagePath = updated.DisplayProfileImagePath()
            };

            return Ok(response);
        }

        // DELETE: api/user/{id}
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult> Delete(Guid id)
        {
            var deleted = await _userService.DeleteUserAsync(id);
            if (deleted == null)
                return NotFound();
            return NoContent();
        }
    }
}
