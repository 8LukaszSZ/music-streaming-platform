using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Interactions;
using MusicStreaming.API.Extensions;

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
                    Username = l.User.Username,
                    ProfileImagePath = l.User.ProfileImagePath
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

        // POST: api/contentlikes
        [HttpPost]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> Like([FromBody] ContentLikeToggleDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();

            try
            {
                await _contentLikeService.LikeContentAsync(userId, dto.ContentId, dto.ContentType.ToString());
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
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

