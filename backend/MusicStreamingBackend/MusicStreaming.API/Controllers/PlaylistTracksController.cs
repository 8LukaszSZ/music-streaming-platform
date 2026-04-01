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
    [Route("api/playlists/{playlistId:guid}/tracks")]
    [Authorize]
    public class PlaylistTracksController : ControllerBase
    {
        private readonly IPlaylistTrackService _playlistTrackService;
        private readonly IPlaylistService _playlistService;
        private readonly ILocalTrackService _localTrackService;

        public PlaylistTracksController(
            IPlaylistTrackService playlistTrackService,
            IPlaylistService playlistService,
            ILocalTrackService localTrackService)
        {
            _playlistTrackService = playlistTrackService;
            _playlistService = playlistService;
            _localTrackService = localTrackService;
        }

        private Task<bool> CanAccessPlaylistAsync(Playlist playlist)
        {
            if (playlist.IsPublic)
                return Task.FromResult(true);

            if (User.IsInRole(UserRoles.Admin))
                return Task.FromResult(true);

            if (User.Identity?.IsAuthenticated != true)
                return Task.FromResult(false);

            var userId = User.GetUserId();

            return Task.FromResult(playlist.UserId == userId);
        }

        private Task<bool> IsOwnerAsync(Playlist playlist)
        {
            if (User.IsInRole(UserRoles.Admin))
                return Task.FromResult(true);

            var userId = User.GetUserId();

            return Task.FromResult(playlist.UserId == userId);
        }

        // GET: api/playlists/{playlistId}/tracks
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<PlaylistTrackResponseDto>>> GetTracks(Guid playlistId)
        {
            var playlist = await _playlistService.GetPlaylistByIdAsync(playlistId);
            if (playlist == null)
                return NotFound();

            if (!await CanAccessPlaylistAsync(playlist))
                return Forbid();

            var tracks = await _playlistTrackService.GetTracksByPlaylistIdAsync(playlistId);

            var result = tracks.Select(pt => new PlaylistTrackResponseDto
            {
                Id = pt.Id,
                PlaylistId = pt.PlaylistId,
                LocalTrackId = pt.LocalTrackId,
                //SourceType = pt.SourceType
            });

            return Ok(result);
        }

        // POST: api/playlists/{playlistId}/tracks
        [HttpPost]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult<PlaylistTrackResponseDto>> AddTrack(Guid playlistId, [FromBody] PlaylistTrackCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var playlist = await _playlistService.GetPlaylistByIdAsync(playlistId);
            if (playlist == null)
                return NotFound();

            if (!await IsOwnerAsync(playlist))
                return Forbid();

            var localTrack = await _localTrackService.GetLocalTrackByIdAsync(dto.LocalTrackId);
            if (localTrack == null)
                return NotFound();

            var isAdmin = User.IsInRole(UserRoles.Admin);
            if (!LocalTrackAccess.CanAddToPlaylist(localTrack, playlist, isAdmin))
                return BadRequest(new { message = "This song cannot be added to this playlist (private songs only to your own private playlist)." });

            var playlistTrack = new PlaylistTrack
            {
                PlaylistId = playlistId,
                LocalTrackId = dto.LocalTrackId,
                //SourceType = "LOCAL"
            };

            var created = await _playlistTrackService.AddTrackToPlaylistAsync(playlistTrack);

            var response = new PlaylistTrackResponseDto
            {
                Id = created.Id,
                PlaylistId = created.PlaylistId,
                LocalTrackId = created.LocalTrackId,
                //SourceType = created.SourceType
            };

            return CreatedAtAction(nameof(GetTracks), new { playlistId }, response);
        }

        // DELETE: api/playlists/{playlistId}/tracks/{playlistTrackId}
        [HttpDelete("{playlistTrackId:guid}")]
        [Authorize(Roles = $"{UserRoles.User},{UserRoles.Admin}")]
        public async Task<ActionResult> RemoveTrack(Guid playlistId, Guid playlistTrackId)
        {
            var playlist = await _playlistService.GetPlaylistByIdAsync(playlistId);
            if (playlist == null)
                return NotFound();

            if (!await IsOwnerAsync(playlist))
                return Forbid();

            var playlistTrack = await _playlistTrackService.GetPlaylistTrackByIdAsync(playlistTrackId);
            if (playlistTrack == null || playlistTrack.PlaylistId != playlistId)
                return NotFound();

            var removed = await _playlistTrackService.RemoveTrackFromPlaylistAsync(playlistTrackId);
            if (removed == null)
                return NotFound();

            return NoContent();
        }

        // GET: api/playlists/{playlistId}/tracks/{localTrackId}/exists
        [HttpGet("{localTrackId:guid}/exists")]
        [AllowAnonymous]
        public async Task<ActionResult> IsTrackInPlaylist(Guid playlistId, Guid localTrackId)
        {
            var playlist = await _playlistService.GetPlaylistByIdAsync(playlistId);
            if (playlist == null)
                return NotFound();

            if (!await CanAccessPlaylistAsync(playlist))
                return Forbid();

            var exists = await _playlistTrackService.IsTrackInPlaylistAsync(playlistId, localTrackId);
            return Ok(new { exists });
        }
    }
}

