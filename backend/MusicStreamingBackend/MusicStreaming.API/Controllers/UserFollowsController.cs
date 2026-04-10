using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Auth;
using MusicStreaming.API.Extensions;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserFollowsController : ControllerBase
    {
        private readonly IUserFollowsService _userFollowsService;

        public UserFollowsController(IUserFollowsService userFollowsService)
        {
            _userFollowsService = userFollowsService;
        }

        // POST: api/userfollows/{targetUserId}
        [HttpPost("{targetUserId:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> Follow(Guid targetUserId)
        {
            var userId = User.GetUserId();
            await _userFollowsService.FollowAsync(userId, targetUserId);
            return NoContent();
        }

        // DELETE: api/userfollows/{targetUserId}
        [HttpDelete("{targetUserId:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> Unfollow(Guid targetUserId)
        {
            var userId = User.GetUserId();
            await _userFollowsService.UnfollowAsync(userId, targetUserId);
            return NoContent();
        }

        // GET: api/userfollows/{userId}/followers/count
        [HttpGet("{userId:guid}/followers/count")]
        [AllowAnonymous]
        public async Task<ActionResult> GetFollowersCount(Guid userId)
        {
            var count = await _userFollowsService.GetFollowersCountAsync(userId);
            return Ok(new { count });
        }

        // GET: api/userfollows/{userId}/following/count
        [HttpGet("{userId:guid}/following/count")]
        [AllowAnonymous]
        public async Task<ActionResult> GetFollowingCount(Guid userId)
        {
            var count = await _userFollowsService.GetFollowingCountAsync(userId);
            return Ok(new { count });
        }

        // GET: api/userfollows/{userId}/followers
        [HttpGet("{userId:guid}/followers")]
        //[Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetFollowers(Guid userId)
        {
            var users = await _userFollowsService.GetFollowersAsync(userId);

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

        // GET: api/userfollows/{userId}/following
        [HttpGet("{userId:guid}/following")]
        //[Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetFollowing(Guid userId)
        {
            var users = await _userFollowsService.GetFollowingAsync(userId);

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
    }
}

