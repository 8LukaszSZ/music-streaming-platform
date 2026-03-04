using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Tracks;
using Models.Entities;
using MusicStreaming.API.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LocalTracksController : ControllerBase
    {
        private readonly ILocalTrackService _localTrackService;

        public LocalTracksController(ILocalTrackService localTrackService)
        {
            _localTrackService = localTrackService;
        }

        // GET: api/localtracks/me
        [HttpGet("me")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<IEnumerable<LocalTrackResponseDto>>> GetMyTracks()
        {
            var userId = User.GetUserId();

            var tracks = await _localTrackService.GetLocalTracksByUserIdAsync(userId);

            var result = tracks.Select(t => new LocalTrackResponseDto
            {
                Id = t.Id,
                UserId = t.UserId,
                Title = t.Title,
                Duration = t.Duration,
                Valence = t.Valence,
                Energy = t.Energy,
                UploadedAt = t.UploadedAt
            });

            return Ok(result);
        }

        // GET: api/localtracks/{id}
        [HttpGet("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<LocalTrackResponseDto>> GetById(Guid id)
        {
            var track = await _localTrackService.GetLocalTrackByIdAsync(id);
            if (track == null)
                return NotFound();

            // Jeśli nie admin, sprawdź własność
            if (!User.IsInRole(UserRoles.Admin))
            {
                var userId = User.GetUserId();

                if (track.UserId != userId)
                    return Forbid();
            }

            var dto = new LocalTrackResponseDto
            {
                Id = track.Id,
                UserId = track.UserId,
                Title = track.Title,
                Duration = track.Duration,
                Valence = track.Valence,
                Energy = track.Energy,
                UploadedAt = track.UploadedAt
            };

            return Ok(dto);
        }

        // POST: api/localtracks
        [HttpPost]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<LocalTrackResponseDto>> Create([FromBody] LocalTrackCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();

            var track = new LocalTrack
            {
                UserId = userId,
                Title = dto.Title,
                File = dto.File,
                TrackImage = dto.TrackImage,
                Duration = dto.Duration,
                Valence = dto.Valence,
                Energy = dto.Energy,
                UploadedAt = DateTime.UtcNow
            };

            var created = await _localTrackService.AddLocalTrackAsync(track);

            var response = new LocalTrackResponseDto
            {
                Id = created.Id,
                UserId = created.UserId,
                Title = created.Title,
                Duration = created.Duration,
                Valence = created.Valence,
                Energy = created.Energy,
                UploadedAt = created.UploadedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, response);
        }

        // PUT: api/localtracks/{id}
        [HttpPut("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<LocalTrackResponseDto>> Update(Guid id, [FromBody] LocalTrackUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var track = await _localTrackService.GetLocalTrackByIdAsync(id);
            if (track == null)
                return NotFound();

            if (!User.IsInRole(UserRoles.Admin))
            {
                var userId = User.GetUserId();

                if (track.UserId != userId)
                    return Forbid();
            }

            track.Title = dto.Title;
            if (dto.TrackImage != null)
                track.TrackImage = dto.TrackImage;
            track.Valence = dto.Valence;
            track.Energy = dto.Energy;

            var updated = await _localTrackService.UpdateLocalTrackAsync(track);

            var response = new LocalTrackResponseDto
            {
                Id = updated.Id,
                UserId = updated.UserId,
                Title = updated.Title,
                Duration = updated.Duration,
                Valence = updated.Valence,
                Energy = updated.Energy,
                UploadedAt = updated.UploadedAt
            };

            return Ok(response);
        }

        // DELETE: api/localtracks/{id}
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            var track = await _localTrackService.GetLocalTrackByIdAsync(id);
            if (track == null)
                return NotFound();

            if (!User.IsInRole(UserRoles.Admin))
            {
                var userId = User.GetUserId();

                if (track.UserId != userId)
                    return Forbid();
            }

            await _localTrackService.DeleteLocalTrackAsync(id);
            return NoContent();
        }
    }
}

