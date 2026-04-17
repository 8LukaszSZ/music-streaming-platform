using IBL;
using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BL.Services
{
    public class PlaylistTrackService : IPlaylistTrackService
    {
        private readonly IPlaylistTrackRepository _playlistTrackRepository;
        private readonly IPlaylistRepository _playlistRepository;

        public PlaylistTrackService(IPlaylistTrackRepository playlistTrackRepository, IPlaylistRepository playlistRepository)
        {
            _playlistTrackRepository = playlistTrackRepository;
            _playlistRepository = playlistRepository;
        }

        public async Task<List<PlaylistTrack>> GetTracksByPlaylistIdAsync(Guid playlistId)
        {
            return await _playlistTrackRepository.GetPlaylistTracks()
                .Where(pt => pt.PlaylistId == playlistId)
                .Include(pt => pt.LocalTrack)
                .OrderBy(pt => pt.Position)
                .ToListAsync();
        }

        public async Task<PlaylistTrack?> GetPlaylistTrackByIdAsync(Guid playlistTrackId)
        {
            return await _playlistTrackRepository.GetPlaylistTracks()
                .Include(pt => pt.LocalTrack)
                .Include(pt => pt.Playlist)
                .FirstOrDefaultAsync(pt => pt.Id == playlistTrackId);
        }

        public async Task<PlaylistTrack> AddTrackToPlaylistAsync(PlaylistTrack playlistTrack)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistTrack.PlaylistId);
            if (playlist == null)
                throw new InvalidOperationException("Playlist not found.");

            if (playlistTrack.Id == Guid.Empty)
                playlistTrack.Id = Guid.NewGuid();

            // Set position to the end of the playlist
            var existingTracks = await _playlistTrackRepository.GetPlaylistTracks()
                .Where(pt => pt.PlaylistId == playlistTrack.PlaylistId)
                .ToListAsync();
            var maxPosition = existingTracks.Any() ? existingTracks.Max(pt => pt.Position) : 0;
            playlistTrack.Position = maxPosition + 1;

            return await _playlistTrackRepository.AddAsync(playlistTrack);
        }

        public async Task<PlaylistTrack?> RemoveTrackFromPlaylistAsync(Guid playlistTrackId)
        {
            return await _playlistTrackRepository.DeleteAsync(playlistTrackId);
        }

        public async Task<bool> IsTrackInPlaylistAsync(Guid playlistId, Guid? localTrackId)
        {
            if (!localTrackId.HasValue)
                return false;

            return await _playlistTrackRepository.GetPlaylistTracks()
                .AnyAsync(pt => pt.PlaylistId == playlistId && pt.LocalTrackId == localTrackId.Value);
        }
    }
}
