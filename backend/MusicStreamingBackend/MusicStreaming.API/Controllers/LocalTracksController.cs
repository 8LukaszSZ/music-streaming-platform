using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Models.Constants;
using Models.DTOs.Tracks;
using Models.Entities;
using MusicStreaming.API.Extensions;
using MusicStreaming.API.Helpers;
using System.ComponentModel.DataAnnotations;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LocalTracksController : ControllerBase
    {
        private readonly ILocalTrackService _localTrackService;
        private readonly IFileStorageService _fileStorageService;
        private readonly IWebHostEnvironment _env;

        public LocalTracksController(
            ILocalTrackService localTrackService,
            IFileStorageService fileStorageService,
            IWebHostEnvironment env)
        {
            _localTrackService = localTrackService;
            _fileStorageService = fileStorageService;
            _env = env;
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
                UploadedAt = t.UploadedAt,
                FilePath = t.FilePath,
                TrackImagePath = t.TrackImagePath,
                Username = t.User?.DisplayUsername() ?? "Deleted user",
                IsPrivate = t.IsPrivate
            });

            return Ok(result);
        }

        // GET: api/localtracks/user/{userId}
        [HttpGet("user/{userId:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<LocalTrackResponseDto>>> GetTracksByUserId(Guid userId)
        {
            var isAdmin = User.IsInRole(UserRoles.Admin);
            Guid? viewerUserId = null;
            if (User.Identity?.IsAuthenticated == true && !isAdmin)
                viewerUserId = User.GetUserId();

            var tracks = await _localTrackService.GetLocalTracksByUserIdAsync(userId);

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

        // GET: api/localtracks/{id}
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<LocalTrackResponseDto>> GetById(Guid id)
        {
            var track = await _localTrackService.GetLocalTrackByIdAsync(id);
            if (track == null)
                return NotFound();

            var isAdmin = User.IsInRole(UserRoles.Admin);
            Guid? viewerUserId = null;
            if (User.Identity?.IsAuthenticated == true && !isAdmin)
                viewerUserId = User.GetUserId();

            if (!LocalTrackAccess.CanView(track, viewerUserId, isAdmin))
                return Forbid();

            var showFilePath = isAdmin || (viewerUserId.HasValue && track.UserId == viewerUserId.Value);

            var dto = new LocalTrackResponseDto
            {
                Id = track.Id,
                UserId = track.UserId,
                Title = track.Title,
                Duration = track.Duration,
                Valence = track.Valence,
                Energy = track.Energy,
                UploadedAt = track.UploadedAt,
                FilePath = showFilePath ? track.FilePath : string.Empty,
                TrackImagePath = track.TrackImagePath,
                IsPrivate = track.IsPrivate
            };

            return Ok(dto);
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<LocalTrackResponseDto>>> Search([FromQuery] string query)
        {
            var isAdmin = User.IsInRole(UserRoles.Admin);
            Guid? viewerUserId = null;
            if (User.Identity?.IsAuthenticated == true && !isAdmin)
                viewerUserId = User.GetUserId();

            var tracks = await _localTrackService.SearchTracksAsync(query, viewerUserId, isAdmin);

            var result = tracks.Select(t => new LocalTrackResponseDto
            {
                Id = t.Id,
                Title = t.Title,
                Duration = t.Duration,
                TrackImagePath = t.TrackImagePath,
                Username = t.User?.DisplayUsername() ?? "Deleted user",
                IsPrivate = t.IsPrivate
            });

            return Ok(result);
        }

        // STREAM: api/localtracks/{id}/stream
        // Prywatny utwór: wymaga JWT. Tag <audio> nie wysyła nagłówka Authorization — użyj:
        // GET .../stream?access_token={token} (obsługiwane w Program.cs, OnMessageReceived).
        [HttpGet("{id:guid}/stream")]
        [AllowAnonymous]
        public async Task<IActionResult> Stream(Guid id)
        {
            var track = await _localTrackService.GetLocalTrackByIdAsync(id);
            if (track == null)
                return NotFound();

            if (track.IsPrivate)
            {
                if (User.Identity?.IsAuthenticated != true)
                    return Unauthorized();

                if (!User.IsInRole(UserRoles.Admin) && User.GetUserId() != track.UserId)
                    return Forbid();
            }

            var fullPath = Path.Combine(_env.ContentRootPath, track.FilePath);

            if (!System.IO.File.Exists(fullPath))
                return NotFound("File not found");

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(fullPath, out var contentType))
                contentType = "application/octet-stream";

            return PhysicalFile(fullPath, contentType, enableRangeProcessing: true);
        }

        // POST: api/localtracks
        [HttpPost]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<LocalTrackResponseDto>> Create([FromForm] LocalTrackCreateDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();
            var trackId = Guid.NewGuid();

            var filePath = await _fileStorageService.SaveTrackFileAsync(userId, trackId, request.File);

            string? imagePath = null;
            if (request.TrackImage != null)
            {
                imagePath = await _fileStorageService.SaveTrackImageAsync(userId, trackId, request.TrackImage);
            }

            var track = new LocalTrack
            {
                Id = trackId,
                UserId = userId,
                Title = request.Title,
                FilePath = filePath,
                TrackImagePath = imagePath,
                Duration = request.Duration,
                Valence = request.Valence,
                Energy = request.Energy,
                UploadedAt = DateTime.UtcNow,
                IsPrivate = request.IsPrivate
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
                UploadedAt = created.UploadedAt,
                IsPrivate = created.IsPrivate
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, response);
        }

        // PUT: api/localtracks/{id}
        [HttpPut("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<LocalTrackResponseDto>> Update(Guid id, [FromForm] LocalTrackUpdateDto request)
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

            track.Title = request.Title;
            track.Valence = request.Valence;
            track.Energy = request.Energy;
            if (request.IsPrivate.HasValue)
                track.IsPrivate = request.IsPrivate.Value;

            if (request.TrackImage != null)
            {
                var imagePath = await _fileStorageService.SaveTrackImageAsync(track.UserId, track.Id, request.TrackImage);
                track.TrackImagePath = imagePath;
            }

            var updated = await _localTrackService.UpdateLocalTrackAsync(track);

            var response = new LocalTrackResponseDto
            {
                Id = updated.Id,
                UserId = updated.UserId,
                Title = updated.Title,
                Duration = updated.Duration,
                Valence = updated.Valence,
                Energy = updated.Energy,
                UploadedAt = updated.UploadedAt,
                FilePath = updated.FilePath,
                TrackImagePath = updated.TrackImagePath,
                IsPrivate = updated.IsPrivate
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

