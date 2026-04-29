using IBL;
using IDAL;
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
    public class ContentCommentsController : ControllerBase
    {
        private readonly IContentCommentService _contentCommentService;
        private readonly ILocalTrackRepository _localTrackRepository;

        public ContentCommentsController(IContentCommentService contentCommentService, ILocalTrackRepository localTrackRepository)
        {
            _contentCommentService = contentCommentService;
            _localTrackRepository = localTrackRepository;
        }

        // GET: api/contentcomments/count?contentId=...&contentType=TRACK
        [HttpGet("count")]
        [AllowAnonymous]
        public async Task<ActionResult<int>> GetCount([FromQuery] Guid contentId, [FromQuery] ContentType contentType)
        {
            var count = await _contentCommentService.GetCommentCountAsync(contentId, contentType.ToString());
            return Ok(count);
        }

        // GET: api/contentcomments?contentId=...&contentType=TRACK
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ContentCommentResponseDto>>> GetForContent([FromQuery] Guid contentId, [FromQuery] ContentType contentType)
        {
            var comments = await _contentCommentService.GetCommentsForContentAsync(contentId, contentType.ToString());
            var result = comments.Select(MapComment).ToList();
            return Ok(result);
        }

        // GET: api/contentcomments/latest?userId=...
        [HttpGet("latest")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ContentCommentResponseDto>>> GetLatestForUser([FromQuery] Guid userId, [FromQuery] int count = 3)
        {
            var comments = await _contentCommentService.GetLatestCommentsForUserTracksAsync(userId, count);
            var result = new List<ContentCommentResponseDto>();

            foreach (var comment in comments)
            {
                var dto = MapComment(comment);
                var track = await _localTrackRepository.GetByIdAsync(comment.ContentId);
                dto.TrackTitle = track?.Title;
                result.Add(dto);
            }

            return Ok(result);
        }

        // POST: api/contentcomments
        [HttpPost]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<ContentCommentResponseDto>> Create([FromBody] ContentCommentCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();
            var created = await _contentCommentService.AddCommentAsync(
                userId,
                dto.ContentId,
                dto.ContentType.ToString(),
                dto.Content,
                dto.ParentCommentId
            );

            var createdFull = await _contentCommentService.GetCommentByIdAsync(created.Id);
            if (createdFull == null)
                return Ok(MapComment(created));

            return Ok(MapComment(createdFull));
        }

        // PUT: api/contentcomments/{id}
        [HttpPut("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<ContentCommentResponseDto>> Update(Guid id, [FromBody] ContentCommentUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var comment = await _contentCommentService.GetCommentByIdAsync(id);
            if (comment == null)
                return NotFound();

            if (!User.IsInRole(UserRoles.Admin))
            {
                var userId = User.GetUserId();
                if (comment.UserId != userId)
                    return Forbid();
            }

            comment.Content = dto.Content;
            var updated = await _contentCommentService.UpdateCommentAsync(comment);
            return Ok(MapComment(updated));
        }

        // DELETE: api/contentcomments/{id}
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            var comment = await _contentCommentService.GetCommentByIdAsync(id);
            if (comment == null)
                return NotFound();

            if (!User.IsInRole(UserRoles.Admin))
            {
                var userId = User.GetUserId();
                if (comment.UserId != userId)
                    return Forbid();
            }

            await _contentCommentService.DeleteCommentAsync(id);
            return NoContent();
        }

        private static ContentCommentResponseDto MapComment(ContentComment comment)
        {
            Enum.TryParse<ContentType>(comment.ContentType, ignoreCase: true, out var parsedType);

            return new ContentCommentResponseDto
            {
                Id = comment.Id,
                ContentId = comment.ContentId,
                ContentType = parsedType,
                ParentCommentId = comment.ParentCommentId,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                IsDeleted = comment.IsDeleted,
                User = new UserLiteDto
                {
                    Id = comment.UserId,
                    Username = comment.User.DisplayUsername(),
                    ProfileImagePath = comment.User.DisplayProfileImagePath()
                },
                Replies = comment.Replies?.Select(MapComment).ToList() ?? new List<ContentCommentResponseDto>()
            };
        }
    }
}

