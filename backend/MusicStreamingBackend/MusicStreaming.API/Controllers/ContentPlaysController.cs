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
    public class ContentPlaysController : ControllerBase
    {
        private readonly IContentPlayService _contentPlayService;

        public ContentPlaysController(IContentPlayService contentPlayService)
        {
            _contentPlayService = contentPlayService;
        }

        // GET: api/contentplays/count?contentId=...&contentType=TRACK
        [HttpGet("count")]
        [AllowAnonymous]
        public async Task<ActionResult<long>> GetCount([FromQuery] Guid contentId, [FromQuery] ContentType contentType)
        {
            var count = await _contentPlayService.GetPlaysCountAsync(contentId, contentType.ToString());
            return Ok(count);
        }

        // POST: api/contentplays
        // Adds a play event (anonymous allowed). If user is logged in, userId is attached.
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult> AddPlay([FromBody] ContentPlayCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            Guid? userId = null;
            if (User?.Identity?.IsAuthenticated == true)
            {
                userId = User.GetUserId();
            }

            await _contentPlayService.AddPlayAsync(dto.ContentId, dto.ContentType.ToString(), userId);
            return NoContent();
        }
    }
}

