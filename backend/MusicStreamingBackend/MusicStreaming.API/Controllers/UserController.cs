using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Auth;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        // GET: api/user
        [HttpGet]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAll()
        {
            var users = await _userService.GetAllUsersAsync();

            var result = users.Select(u => new UserResponseDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            });

            return Ok(result);
        }

        // GET: api/user/{id}
        [HttpGet("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<UserResponseDto>> GetById(Guid id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            var dto = new UserResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            return Ok(dto);
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
