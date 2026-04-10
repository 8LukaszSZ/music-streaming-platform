using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Interactions;
using Models.DTOs.Tracks;
using MusicStreaming.API.Extensions;
using MusicStreaming.API.Helpers;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContentLikesController : ControllerBase
    {
        private readonly IContentLikeService _contentLikeService;

        public ContentLikesController(IContentLikeService contentLikeService)
        {
            _contentLikeService = contentLikeService;
        }

        // GET: api/contentlikes/count?contentId=...&contentType=TRACK
        [HttpGet("count")]
        [AllowAnonymous]
        public async Task<ActionResult<int>> GetCount([FromQuery] Guid contentId, [FromQuery] ContentType contentType)
        {
            var count = await _contentLikeService.GetLikeCountAsync(contentId, contentType.ToString());
            return Ok(count);
        }

        // GET: api/contentlikes/users?contentId=...&contentType=TRACK
        [HttpGet("users")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<UserLiteDto>>> GetUsers([FromQuery] Guid contentId, [FromQuery] ContentType contentType)
        {
            var likes = await _contentLikeService.GetLikesForContentAsync(contentId, contentType.ToString());

            var users = likes
                .Where(l => l.User != null)
                .Select(l => new UserLiteDto
                {
                    Id = l.User.Id,
                    Username = l.User.DisplayUsername(),
                    ProfileImagePath = l.User.DisplayProfileImagePath()
                });

            return Ok(users);
        }

        // GET: api/contentlikes/me?contentId=...&contentType=TRACK
        [HttpGet("me")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<bool>> IsLikedByMe([FromQuery] Guid contentId, [FromQuery] ContentType contentType)
        {
            var userId = User.GetUserId();
            var isLiked = await _contentLikeService.IsContentLikedByUserAsync(userId, contentId, contentType.ToString());
            return Ok(isLiked);
        }

        // GET: api/contentlikes/me/tracks
        [HttpGet("me/tracks")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<IEnumerable<LocalTrackResponseDto>>> GetLikedTracksByMe()
        {
            var userId = User.GetUserId();
            var tracks = await _contentLikeService.GetLikedTracksByUserAsync(userId);

            var result = tracks.Select(t => new LocalTrackResponseDto
            {
                Id = t.Id,
                UserId = t.UserId,
                Title = t.Title,
                Duration = t.Duration,
                Valence = t.Valence,
                Energy = t.Energy,
                UploadedAt = t.UploadedAt,
                FilePath = t.FilePath,
                TrackImagePath = t.TrackImagePath,
                Username = t.User?.DisplayUsername() ?? string.Empty,
                IsPrivate = t.IsPrivate
            });

            return Ok(result);
        }

        // GET: api/contentlikes/user/{userId}/tracks
        [HttpGet("user/{userId:guid}/tracks")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<LocalTrackResponseDto>>> GetLikedTracksByUserId(Guid userId)
        {
            var isAdmin = User.IsInRole(UserRoles.Admin);
            Guid? viewerUserId = null;
            if (User.Identity?.IsAuthenticated == true && !isAdmin)
                viewerUserId = User.GetUserId();

            var tracks = await _contentLikeService.GetLikedTracksByUserAsync(userId);

            var result = tracks
                .Where(t => LocalTrackAccess.CanView(t, viewerUserId, isAdmin))
                .Select(t => new LocalTrackResponseDto
                {
                    Id = t.Id,
                    UserId = t.UserId,
                    Title = t.Title,
                    Duration = t.Duration,
                    Valence = t.Valence,
                    Energy = t.Energy,
                    UploadedAt = t.UploadedAt,
                    FilePath = (isAdmin || (viewerUserId.HasValue && t.UserId == viewerUserId.Value)) ? t.FilePath : string.Empty,
                    TrackImagePath = t.TrackImagePath,
                    Username = t.User?.DisplayUsername() ?? "Deleted user",
                    IsPrivate = t.IsPrivate
                });

            return Ok(result);
        }

        // POST: api/contentlikes
        [HttpPost]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> Like([FromBody] ContentLikeToggleDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();
            await _contentLikeService.LikeContentAsync(userId, dto.ContentId, dto.ContentType.ToString());
            return NoContent();
        }

        // DELETE: api/contentlikes
        [HttpDelete]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> Unlike([FromBody] ContentLikeToggleDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();
            var removed = await _contentLikeService.UnlikeContentAsync(userId, dto.ContentId, dto.ContentType.ToString());
            if (!removed)
                return NotFound();

            return NoContent();
        }
    }
}

