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
    public class PlaylistService : IPlaylistService
    {
        private readonly IPlaylistRepository _playlistRepository;

        public PlaylistService(IPlaylistRepository playlistRepository)
        {
            _playlistRepository = playlistRepository;
        }

        public Task<int> GetPlaylistCountAsync()
        {
            return _playlistRepository.GetPlaylists().CountAsync();
        }

        public async Task<List<Playlist>> GetAllPlaylistsAsync()
        {
            return await _playlistRepository.GetPlaylists()
                .OrderByDescending(p => p.CreatedAt)
                .Include(p => p.User)
                .ToListAsync();
        }

        public async Task<List<Playlist>> GetPlaylistsByUserIdAsync(Guid userId)
        {
            return await _playlistRepository.GetPlaylists()
                .Include(p => p.User)
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Playlist>> GetPublicPlaylistsAsync()
        {
            return await _playlistRepository.GetPlaylists()
                .Where(p => p.IsPublic)
                .OrderByDescending(p => p.CreatedAt)
                .Include(p => p.User)
                .ToListAsync();
        }

        public async Task<List<Playlist>> SearchPlaylistsByNameAsync(string query, Guid? viewerUserId, bool isAdmin)
        {
            if (string.IsNullOrWhiteSpace(query))
                return new List<Playlist>();

            var normalized = query.Trim().ToLower();

            var q = _playlistRepository.GetPlaylists()
                .Where(p => p.Name.ToLower().Contains(normalized));

            if (!isAdmin)
            {
                q = q.Where(p =>
                    p.IsPublic ||
                    (viewerUserId.HasValue && p.UserId == viewerUserId.Value));
            }

            return await q
                .Include(p => p.User)
                .Include(p => p.PlaylistTracks)
                    .ThenInclude(pt => pt.LocalTrack!)
                        .ThenInclude(t => t.User)
                .OrderByDescending(p => p.CreatedAt)
                .Take(50)
                .ToListAsync();
        }

        public async Task<Playlist?> GetPlaylistByIdAsync(Guid playlistId)
        {
            return await _playlistRepository.GetPlaylists()
                .Include(p => p.User)
                .Include(p => p.PlaylistTracks)
                .FirstOrDefaultAsync(p => p.Id == playlistId);
        }

        public async Task<Playlist> AddPlaylistAsync(Playlist playlist)
        {
            if (playlist.Id == Guid.Empty)
                playlist.Id = Guid.NewGuid();

            playlist.CreatedAt = DateTime.UtcNow;
            return await _playlistRepository.AddAsync(playlist);
        }

        public async Task<Playlist> UpdatePlaylistAsync(Playlist playlist)
        {
            return await _playlistRepository.UpdateAsync(playlist);
        }

        public async Task<Playlist?> DeletePlaylistAsync(Guid playlistId)
        {
            return await _playlistRepository.DeleteAsync(playlistId);
        }

        public async Task<bool> UserOwnsPlaylistAsync(Guid userId, Guid playlistId)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            return playlist != null && playlist.UserId == userId;
        }

        public async Task<bool> SetPlaylistVisibilityAsync(Guid playlistId, bool isPublic)
        {
            var playlist = await _playlistRepository.GetByIdAsync(playlistId);
            if (playlist == null)
                return false;

            playlist.IsPublic = isPublic;
            await _playlistRepository.UpdateAsync(playlist);
            return true;
        }
    }
}
