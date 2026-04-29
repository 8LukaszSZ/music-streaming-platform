using Models.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IBL
{
    public interface IContentLikeService
    {
        Task<int> GetLikeCountAsync(Guid contentId, string contentType);
        Task<int> GetLikeCountAsync(Guid contentId, string contentType, DateTime fromDate);
        Task<bool> IsContentLikedByUserAsync(Guid userId, Guid contentId, string contentType);

        Task<List<ContentLike>> GetLikesForContentAsync(Guid contentId, string contentType);
        Task<List<ContentLike>> GetLikedContentByUserAsync(Guid userId, string contentType);
        Task<List<LocalTrack>> GetLikedTracksByUserAsync(Guid userId);
        Task<List<Playlist>> GetLikedPlaylistsByUserAsync(Guid userId);

        Task<ContentLike> LikeContentAsync(Guid userId, Guid contentId, string contentType);
        Task<bool> UnlikeContentAsync(Guid userId, Guid contentId, string contentType);
    }
}
