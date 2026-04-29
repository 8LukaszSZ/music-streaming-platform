using IBL;
using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Constants;
using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BL.Services
{
    public class ContentLikeService : IContentLikeService
    {
        private readonly IContentLikeRepository _likeRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILocalTrackRepository _localTrackRepository;
        private readonly IPlaylistRepository _playlistRepository;

        public ContentLikeService(IContentLikeRepository likeRepository, IUserRepository userRepository, ILocalTrackRepository localTrackRepository, IPlaylistRepository playlistRepository)
        {
            _likeRepository = likeRepository;
            _userRepository = userRepository;
            _localTrackRepository = localTrackRepository;
            _playlistRepository = playlistRepository;
        }

        public Task<int> GetLikeCountAsync(Guid contentId, string contentType)
        {
            return _likeRepository.GetContentLikes()
                .CountAsync(cl => cl.ContentId == contentId && cl.ContentType == contentType);
        }

        public Task<int> GetLikeCountAsync(Guid contentId, string contentType, DateTime fromDate)
        {
            return _likeRepository.GetContentLikes()
                .CountAsync(cl => cl.ContentId == contentId && cl.ContentType == contentType && cl.CreatedAt >= fromDate);
        }

        public async Task<bool> IsContentLikedByUserAsync(Guid userId, Guid contentId, string contentType)
        {
            return await _likeRepository.GetContentLikes()
                .AnyAsync(cl => cl.UserId == userId && cl.ContentId == contentId && cl.ContentType == contentType);
        }

        public async Task<List<ContentLike>> GetLikesForContentAsync(Guid contentId, string contentType)
        {
            return await _likeRepository.GetContentLikes()
                .Where(cl => cl.ContentId == contentId && cl.ContentType == contentType)
                .OrderByDescending(cl => cl.CreatedAt)
                .Include(cl => cl.User)
                .ToListAsync();
        }

        public async Task<List<ContentLike>> GetLikedContentByUserAsync(Guid userId, string contentType)
        {
            return await _likeRepository.GetContentLikes()
                .Where(cl => cl.UserId == userId && cl.ContentType == contentType)
                .OrderByDescending(cl => cl.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<LocalTrack>> GetLikedTracksByUserAsync(Guid userId)
        {
            var likes = await GetLikedContentByUserAsync(userId, nameof(ContentType.TRACK));
            if (likes.Count == 0)
                return new List<LocalTrack>();

            var trackIds = likes.Select(l => l.ContentId).ToList();
            var tracks = await _localTrackRepository.GetLocalTracks()
                .Where(t => trackIds.Contains(t.Id))
                .Include(t => t.User)
                .ToListAsync();

            var trackDict = tracks.ToDictionary(t => t.Id);
            var result = new List<LocalTrack>();
            foreach (var like in likes)
            {
                if (trackDict.TryGetValue(like.ContentId, out var track))
                    result.Add(track);
            }
            return result;
        }

        public async Task<List<Playlist>> GetLikedPlaylistsByUserAsync(Guid userId)
        {
            var likes = await GetLikedContentByUserAsync(userId, nameof(ContentType.PLAYLIST));
            if (likes.Count == 0)
                return new List<Playlist>();

            var playlistIds = likes.Select(l => l.ContentId).ToList();
            var playlists = await _playlistRepository.GetPlaylists()
                .Where(p => playlistIds.Contains(p.Id))
                .Include(p => p.User)
                .ToListAsync();

            var playlistDict = playlists.ToDictionary(p => p.Id);
            var result = new List<Playlist>();
            foreach (var like in likes)
            {
                if (playlistDict.TryGetValue(like.ContentId, out var playlist))
                    result.Add(playlist);
            }
            return result;
        }

        public async Task<ContentLike> LikeContentAsync(Guid userId, Guid contentId, string contentType)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found.");

            var existing = await _likeRepository.GetContentLikes()
                .FirstOrDefaultAsync(cl => cl.UserId == userId && cl.ContentId == contentId && cl.ContentType == contentType);
            if (existing != null)
                throw new InvalidOperationException("Content is already liked by this user.");

            var like = new ContentLike
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ContentId = contentId,
                ContentType = contentType,
                CreatedAt = DateTime.UtcNow
            };

            return await _likeRepository.AddAsync(like);
        }

        public async Task<bool> UnlikeContentAsync(Guid userId, Guid contentId, string contentType)
        {
            var like = await _likeRepository.GetContentLikes()
                .FirstOrDefaultAsync(cl => cl.UserId == userId && cl.ContentId == contentId && cl.ContentType == contentType);
            if (like == null)
                return false;

            await _likeRepository.DeleteAsync(like.Id);
            return true;
        }
    }
}
