using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Playlists;
using Models.Entities;
using MusicStreaming.API.Extensions;
using MusicStreaming.API.Helpers;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlaylistsController : ControllerBase
    {
        private readonly IPlaylistService _playlistService;
        private readonly IFileStorageService _fileStorageService;

        public PlaylistsController(IPlaylistService playlistService, IFileStorageService fileStorageService)
        {
            _playlistService = playlistService;
            _fileStorageService = fileStorageService;
        }

        // GET: api/playlists/me
        [HttpGet("me")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<IEnumerable<PlaylistResponseDto>>> GetMyPlaylists()
        {
            var userId = User.GetUserId();

            var playlists = await _playlistService.GetPlaylistsByUserIdAsync(userId);

            var result = playlists.Select(p => new PlaylistResponseDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                CreatedAt = p.CreatedAt,
                PlaylistImagePath = p.PlaylistImagePath,
                Username = p.User?.DisplayUsername()
            });

            return Ok(result);
        }

        // GET: api/playlists/user/{userId}
        [HttpGet("user/{userId:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<PlaylistResponseDto>>> GetPlaylistsByUserId(Guid userId)
        {
            var isAdmin = User.IsInRole(UserRoles.Admin);
            Guid? viewerUserId = null;
            if (User.Identity?.IsAuthenticated == true && !isAdmin)
                viewerUserId = User.GetUserId();

            var playlists = await _playlistService.GetPlaylistsByUserIdAsync(userId);

            var result = playlists
                .Where(p => p.IsPublic || isAdmin || (viewerUserId.HasValue && p.UserId == viewerUserId.Value))
                .Select(p => new PlaylistResponseDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    Name = p.Name,
                    Description = p.Description,
                    IsPublic = p.IsPublic,
                    CreatedAt = p.CreatedAt,
                    PlaylistImagePath = p.PlaylistImagePath,
                    Username = p.User?.DisplayUsername()
                });

            return Ok(result);
        }

        // GET: api/playlists/public
        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<PlaylistResponseDto>>> GetPublicPlaylists()
        {
            var playlists = await _playlistService.GetPublicPlaylistsAsync();

            var result = playlists.Select(p => new PlaylistResponseDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                CreatedAt = p.CreatedAt,
                PlaylistImagePath = p.PlaylistImagePath
            });

            return Ok(result);
        }

        // GET: api/playlists/search?query=...
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<PlaylistSearchResultDto>>> Search([FromQuery] string query)
        {
            var isAdmin = User.IsInRole(UserRoles.Admin);
            Guid? viewerUserId = null;
            if (User.Identity?.IsAuthenticated == true && !isAdmin)
                viewerUserId = User.GetUserId();

            var playlists = await _playlistService.SearchPlaylistsByNameAsync(query, viewerUserId, isAdmin);

            var result = playlists.Select(p => new PlaylistSearchResultDto
            {
                Id = p.Id,
                UserId = p.UserId,
                OwnerUsername = p.User?.DisplayUsername() ?? string.Empty,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                CreatedAt = p.CreatedAt,
                PlaylistImagePath = p.PlaylistImagePath,
                Tracks = p.PlaylistTracks
                    .Where(pt => pt.LocalTrack != null
                        && pt.LocalTrack.User != null
                        && !pt.LocalTrack.User.IsDeleted
                        && LocalTrackAccess.CanView(pt.LocalTrack, viewerUserId, isAdmin))
                    .OrderBy(pt => pt.Position)
                    .Select(pt => new PlaylistTrackSearchItemDto
                    {
                        PlaylistTrackId = pt.Id,
                        LocalTrackId = pt.LocalTrack!.Id,
                        Title = pt.LocalTrack.Title,
                        Duration = pt.LocalTrack.Duration,
                        TrackImagePath = pt.LocalTrack.TrackImagePath,
                        ArtistUsername = pt.LocalTrack.User!.DisplayUsername(),
                        IsPrivate = pt.LocalTrack.IsPrivate
                    })
                    .ToList()
            });

            return Ok(result);
        }

        // GET: api/playlists/{id}
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<PlaylistResponseDto>> GetById(Guid id)
        {
            var playlist = await _playlistService.GetPlaylistByIdAsync(id);
            if (playlist == null)
                return NotFound();

            if (!playlist.IsPublic && !User.IsInRole(UserRoles.Admin))
            {
                if (User.Identity?.IsAuthenticated != true)
                    return Forbid();

                var userId = User.GetUserId();

                if (playlist.UserId != userId)
                    return Forbid();
            }

            var dto = new PlaylistResponseDto
            {
                Id = playlist.Id,
                UserId = playlist.UserId,
                Name = playlist.Name,
                Description = playlist.Description,
                IsPublic = playlist.IsPublic,
                CreatedAt = playlist.CreatedAt,
                PlaylistImagePath = playlist.PlaylistImagePath,
                Username = playlist.User?.DisplayUsername()
            };

            return Ok(dto);
        }

        // POST: api/playlists
        [HttpPost]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<PlaylistResponseDto>> Create([FromForm] PlaylistCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();
            var playlistId = Guid.NewGuid();

            string? imagePath = null;
            if (dto.PlaylistImage != null)
            {
                imagePath = await _fileStorageService.SavePlaylistImageAsync(userId, playlistId, dto.PlaylistImage);
            }

            var playlist = new Playlist
            {
                Id = playlistId,
                UserId = userId,
                Name = dto.Name,
                PlaylistImagePath = imagePath,
                Description = dto.Description,
                IsPublic = dto.IsPublic,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _playlistService.AddPlaylistAsync(playlist);

            var response = new PlaylistResponseDto
            {
                Id = created.Id,
                UserId = created.UserId,
                Name = created.Name,
                Description = created.Description,
                IsPublic = created.IsPublic,
                CreatedAt = created.CreatedAt,
                PlaylistImagePath = created.PlaylistImagePath
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, response);
        }

        // PUT: api/playlists/{id}
        [HttpPut("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<PlaylistResponseDto>> Update(Guid id, [FromForm] PlaylistUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var playlist = await _playlistService.GetPlaylistByIdAsync(id);
            if (playlist == null)
                return NotFound();

            if (!User.IsInRole(UserRoles.Admin))
            {
                var userId = User.GetUserId();

                if (playlist.UserId != userId)
                    return Forbid();
            }

            playlist.Name = dto.Name;
            playlist.Description = dto.Description;

            if (dto.PlaylistImage != null)
            {
                var imagePath = await _fileStorageService.SavePlaylistImageAsync(playlist.UserId, playlist.Id, dto.PlaylistImage);
                playlist.PlaylistImagePath = imagePath;
            }

            var updated = await _playlistService.UpdatePlaylistAsync(playlist);

            var response = new PlaylistResponseDto
            {
                Id = updated.Id,
                UserId = updated.UserId,
                Name = updated.Name,
                Description = updated.Description,
                IsPublic = updated.IsPublic,
                CreatedAt = updated.CreatedAt,
                PlaylistImagePath = updated.PlaylistImagePath
            };

            return Ok(response);
        }

        // PUT: api/playlists/{id}/visibility
        [HttpPut("{id:guid}/visibility")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> UpdateVisibility(Guid id, [FromBody] PlaylistVisibilityUpdateDto dto)
        {
            var playlist = await _playlistService.GetPlaylistByIdAsync(id);
            if (playlist == null)
                return NotFound();

            if (!User.IsInRole(UserRoles.Admin))
            {
                var userId = User.GetUserId();

                if (playlist.UserId != userId)
                    return Forbid();
            }

            var success = await _playlistService.SetPlaylistVisibilityAsync(id, dto.IsPublic);
            if (!success)
                return NotFound();

            return NoContent();
        }

        // DELETE: api/playlists/{id}
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            var playlist = await _playlistService.GetPlaylistByIdAsync(id);
            if (playlist == null)
                return NotFound();

            if (!User.IsInRole(UserRoles.Admin))
            {
                var userId = User.GetUserId();

                if (playlist.UserId != userId)
                    return Forbid();
            }

            await _playlistService.DeletePlaylistAsync(id);
            return NoContent();
        }

        // GET: api/playlists/popular?count=10
        [HttpGet("popular")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<PlaylistResponseDto>>> GetPopular([FromQuery] int count = 6)
        {
            var playlists = await _playlistService.GetPopularPlaylistsAsync(count);

            var result = playlists.Select(p => new PlaylistResponseDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.Name,
                Description = p.Description,
                IsPublic = p.IsPublic,
                CreatedAt = p.CreatedAt,
                PlaylistImagePath = p.PlaylistImagePath,
                Username = p.User?.DisplayUsername()
            });

            return Ok(result);
        }
    }
}

