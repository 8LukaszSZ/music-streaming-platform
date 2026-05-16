using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Interactions;
using Models.Entities;
using MusicStreaming.API.Extensions;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserActivitiesController : ControllerBase
    {
        private readonly IUserActivityService _userActivityService;
        private readonly IUserService _userService;

        public UserActivitiesController(IUserActivityService userActivityService, IUserService userService)
        {
            _userActivityService = userActivityService;
            _userService = userService;
        }

        // GET: api/useractivities/me?all=true
        [HttpGet("me")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<IEnumerable<UserActivityResponseDto>>> GetMyActivities([FromQuery] bool all = false)
        {
            var userId = User.GetUserId();
            var activities = all
                ? await _userActivityService.GetUserActivitiesAsync(userId)
                : await _userActivityService.GetUserActivitiesAsync(userId, DateTime.UtcNow.AddDays(-30));
            return Ok(activities.Select(MapActivity));
        }

        // GET: api/useractivities/{userId}?all=true
        [HttpGet("{userId:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<UserActivityResponseDto>>> GetUserActivities(Guid userId, [FromQuery] bool all = false)
        {
            var activities = all
                ? await _userActivityService.GetUserActivitiesAsync(userId)
                : await _userActivityService.GetUserActivitiesAsync(userId, DateTime.UtcNow.AddDays(-30));
            return Ok(activities.Select(MapActivity));
        }

        // POST: api/useractivities/share
        [HttpPost("share")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<UserActivityResponseDto>> Share([FromBody] UserActivityCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();
            var activity = await _userActivityService.AddActivityAsync(
                userId,
                ActivityType.SHARE,
                dto.ContentId,
                dto.ContentType,
                dto.Message
            );

            var response = MapActivity(activity);
            var currentUser = await _userService.GetUserByIdAsync(userId);
            if (currentUser != null)
            {
                response.User = new UserLiteDto
                {
                    Id = currentUser.Id,
                    Username = currentUser.DisplayUsername(),
                    ProfileImagePath = currentUser.DisplayProfileImagePath()
                };
            }

            return Ok(response);
        }

        // DELETE: api/useractivities/{activityId}
        [HttpDelete("{activityId:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> Delete(Guid activityId)
        {
            var userId = User.GetUserId();
            var removed = await _userActivityService.DeleteActivityAsync(activityId, userId);
            if (removed == null)
                return NotFound();

            return NoContent();
        }

        private static UserActivityResponseDto MapActivity(UserActivity activity)
        {
            Enum.TryParse<ActivityType>(activity.ActivityType, ignoreCase: true, out var parsedActivityType);
            Enum.TryParse<ContentType>(activity.ContentType, ignoreCase: true, out var parsedContentType);

            return new UserActivityResponseDto
            {
                Id = activity.Id,
                UserId = activity.UserId,
                ActivityType = parsedActivityType,
                ContentId = activity.ContentId,
                ContentType = parsedContentType,
                Message = activity.Message,
                CreatedAt = activity.CreatedAt,
                User = activity.User == null
                    ? null
                    : new UserLiteDto
                    {
                        Id = activity.User.Id,
                        Username = activity.User.DisplayUsername(),
                        ProfileImagePath = activity.User.DisplayProfileImagePath()
                    }
            };
        }
    }
}
