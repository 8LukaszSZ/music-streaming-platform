using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Constants;
using Models.DTOs.Playlists;
using Models.Entities;
using MusicStreaming.API.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlaylistsController : ControllerBase
    {
        private readonly IPlaylistService _playlistService;

        public PlaylistsController(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
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
                CreatedAt = p.CreatedAt
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
                CreatedAt = p.CreatedAt
            });

            return Ok(result);
        }

        // GET: api/playlists/{id}
        [HttpGet("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<PlaylistResponseDto>> GetById(Guid id)
        {
            var playlist = await _playlistService.GetPlaylistByIdAsync(id);
            if (playlist == null)
                return NotFound();

            if (!playlist.IsPublic && !User.IsInRole(UserRoles.Admin))
            {
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
                CreatedAt = playlist.CreatedAt
            };

            return Ok(dto);
        }

        // POST: api/playlists
        [HttpPost]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<PlaylistResponseDto>> Create([FromBody] PlaylistCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();

            var playlist = new Playlist
            {
                UserId = userId,
                Name = dto.Name,
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
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, response);
        }

        // PUT: api/playlists/{id}
        [HttpPut("{id:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<PlaylistResponseDto>> Update(Guid id, [FromBody] PlaylistUpdateDto dto)
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

            var updated = await _playlistService.UpdatePlaylistAsync(playlist);

            var response = new PlaylistResponseDto
            {
                Id = updated.Id,
                UserId = updated.UserId,
                Name = updated.Name,
                Description = updated.Description,
                IsPublic = updated.IsPublic,
                CreatedAt = updated.CreatedAt
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
    }
}

