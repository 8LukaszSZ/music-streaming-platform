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
        private readonly IContentLikeRepository _likeRepository;
        private readonly IContentPlayRepository _playRepository;

        public PlaylistService(IPlaylistRepository playlistRepository, IContentLikeRepository likeRepository, IContentPlayRepository playRepository)
        {
            _playlistRepository = playlistRepository;
            _likeRepository = likeRepository;
            _playRepository = playRepository;
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

        public async Task<List<Playlist>> GetPopularPlaylistsAsync(int count = 10)
        {
            var playlists = await _playlistRepository.GetPlaylists()
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.PlaylistTracks)
                .Where(p => p.IsPublic)
                .ToListAsync();

            var playlistIds = playlists.Select(p => p.Id).ToList();
            var allTrackIds = playlists
                .SelectMany(p => p.PlaylistTracks.Select(pt => pt.LocalTrackId))
                .Distinct()
                .ToList();

            var allLikes = await _likeRepository.GetContentLikes()
                .Where(cl => playlistIds.Contains(cl.ContentId) && cl.ContentType == "PLAYLIST")
                .Select(cl => new { cl.ContentId, cl.UserId })
                .ToListAsync();

            var allPlays = allTrackIds.Count == 0
                ? []
                : await _playRepository.GetContentPlays()
                    .Where(cp => allTrackIds.Contains(cp.ContentId) && cp.ContentType == "TRACK" && cp.UserId != null)
                    .Select(cp => new { cp.ContentId, UserId = cp.UserId!.Value })
                    .ToListAsync();

            var likesByPlaylist = allLikes
                .GroupBy(l => l.ContentId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.UserId).ToHashSet());

            return playlists
                .Select(playlist =>
                {
                    var likerIds = likesByPlaylist.TryGetValue(playlist.Id, out var playlistLikerIds)
                        ? playlistLikerIds
                        : new HashSet<Guid>();
                    var likesCount = likerIds.Count;
                    var trackIds = playlist.PlaylistTracks.Select(pt => pt.LocalTrackId).ToHashSet();

                    var playsByLikers = allPlays.Count(cp =>
                        trackIds.Contains(cp.ContentId) &&
                        likerIds.Contains(cp.UserId));

                    var score = likesCount * 2.0 + Math.Log(playsByLikers + 1);

                    return new { Playlist = playlist, Score = score };
                })
                .OrderByDescending(x => x.Score)
                .Take(count)
                .Select(x => x.Playlist)
                .ToList();
        }
    }
}
