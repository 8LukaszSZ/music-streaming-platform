using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Interactions;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContentStatsController : ControllerBase
    {
        private readonly IContentStatService _contentStatService;

        public ContentStatsController(IContentStatService contentStatService)
        {
            _contentStatService = contentStatService;
        }

        // GET: api/contentstats/two-weeks?contentId=...&contentType=TRACK
        [HttpGet("two-weeks")]
        //[AllowAnonymous]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<ContentStatsResponseDto>> GetFromLastTwoWeeks([FromQuery] Guid contentId, [FromQuery] ContentType contentType)
        {
            var fromDate = DateTime.UtcNow.AddDays(-14);
            var stats = await _contentStatService.GetFromDateAsync(contentId, contentType.ToString(), fromDate);

            var result = new ContentStatsResponseDto
            {
                ContentId = stats.ContentId,
                ContentType = contentType,
                LikesCount = stats.LikesCount,
                CommentsCount = stats.CommentsCount,
                PlaysCount = stats.PlaysCount,
                FromDate = fromDate
            };

            return Ok(result);
        }
    }
}
