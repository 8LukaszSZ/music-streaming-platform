using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IBL
{
    public interface ILocalTrackService
    {
        Task<int> GetLocalTrackCountAsync();
        Task<List<LocalTrack>> GetAllLocalTracksAsync();
        Task<List<LocalTrack>> GetLocalTracksByUserIdAsync(Guid userId);
        Task<LocalTrack?> GetLocalTrackByIdAsync(Guid localTrackId);
        Task<List<LocalTrack>> SearchTracksAsync(string query, Guid? viewerUserId, bool isAdmin);

        Task<LocalTrack> AddLocalTrackAsync(LocalTrack localTrack);
        Task<LocalTrack> UpdateLocalTrackAsync(LocalTrack localTrack);
        Task<LocalTrack?> DeleteLocalTrackAsync(Guid localTrackId);

        Task<bool> UserOwnsLocalTrackAsync(Guid userId, Guid localTrackId);

        Task<List<LocalTrack>> GetFansAlsoLikeRecommendationsAsync(Guid artistUserId, int count = 10);
        Task<List<LocalTrack>> GetTrendingTracksAsync(int count = 10);
    }
}
