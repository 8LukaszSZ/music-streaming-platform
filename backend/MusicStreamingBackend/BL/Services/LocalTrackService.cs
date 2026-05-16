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
    public class LocalTrackService : ILocalTrackService
    {
        private readonly ILocalTrackRepository _trackRepository;
        private readonly IContentPlayRepository _playRepository;

        public LocalTrackService(ILocalTrackRepository trackRepository, IContentPlayRepository playRepository)
        {
            _trackRepository = trackRepository;
            _playRepository = playRepository;
        }

        public Task<int> GetLocalTrackCountAsync()
        {
            return _trackRepository.GetLocalTracks().CountAsync();
        }

        public async Task<List<LocalTrack>> GetAllLocalTracksAsync()
        {
            return await _trackRepository.GetLocalTracks()
                .OrderByDescending(t => t.UploadedAt)
                .ToListAsync();
        }

        public async Task<List<LocalTrack>> GetLocalTracksByUserIdAsync(Guid userId)
        {
            return await _trackRepository.GetLocalTracks()
                .Include(t => t.User)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.UploadedAt)
                .ToListAsync();
        }

        public async Task<LocalTrack?> GetLocalTrackByIdAsync(Guid localTrackId)
        {
            return await _trackRepository.GetLocalTracks()
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == localTrackId);
        }
        public async Task<List<LocalTrack>> SearchTracksAsync(string query, Guid? viewerUserId, bool isAdmin)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new List<LocalTrack>();
            }

            var normalized = query.Trim().ToLower();

            return await _trackRepository.GetLocalTracks()
                .Include(t => t.User)
                .Where(t =>
                    t.Title.ToLower().Contains(normalized) ||
                    (t.User != null && t.User.Username.ToLower().Contains(normalized)))
                .Where(t =>
                    !t.IsPrivate || isAdmin || (viewerUserId.HasValue && t.UserId == viewerUserId.Value))
                .OrderBy(t => t.Title)
                .Take(50)
                .ToListAsync();
        }


        public async Task<LocalTrack> AddLocalTrackAsync(LocalTrack localTrack)
        {
            if (localTrack.Id == Guid.Empty)
                localTrack.Id = Guid.NewGuid();

            return await _trackRepository.AddAsync(localTrack);
        }

        public async Task<LocalTrack> UpdateLocalTrackAsync(LocalTrack localTrack)
        {
            return await _trackRepository.UpdateAsync(localTrack);
        }

        public async Task<LocalTrack?> DeleteLocalTrackAsync(Guid localTrackId)
        {
            return await _trackRepository.DeleteAsync(localTrackId);
        }

        public async Task<bool> UserOwnsLocalTrackAsync(Guid userId, Guid localTrackId)
        {
            var track = await _trackRepository.GetByIdAsync(localTrackId);
            return track != null && track.UserId == userId;
        }

        public async Task<List<LocalTrack>> GetFansAlsoLikeRecommendationsAsync(
            Guid artistUserId,
            int count = 10)
        {
            var artistTrackIds = await _trackRepository.GetLocalTracks()
                .Where(t => t.UserId == artistUserId)
                .Select(t => t.Id)
                .ToListAsync();

            if (!artistTrackIds.Any()) return [];

            var fanWeights = await _playRepository.GetContentPlays()
                .Where(cp =>
                    cp.ContentType == "TRACK" &&
                    cp.UserId != null &&
                    cp.UserId != artistUserId &&
                    artistTrackIds.Contains(cp.ContentId))
                .GroupBy(cp => cp.UserId!.Value)
                .Select(g => new { UserId = g.Key, Weight = g.Count() })
                .ToListAsync();

            if (!fanWeights.Any()) return [];

            var fanUserIds = fanWeights.Select(f => f.UserId).ToList();
            var weightDict = fanWeights.ToDictionary(f => f.UserId, f => f.Weight);

            var candidatePlays = await _playRepository.GetContentPlays()
                .Where(cp =>
                    cp.ContentType == "TRACK" &&
                    cp.UserId != null &&
                    fanUserIds.Contains(cp.UserId.Value) &&
                    !artistTrackIds.Contains(cp.ContentId))
                .Select(cp => new { cp.ContentId, cp.UserId })
                .ToListAsync();

            var scored = candidatePlays
                .GroupBy(p => p.ContentId)
                .Select(g => new
                {
                    TrackId = g.Key,
                    Score = g.Sum(p => weightDict.GetValueOrDefault(p.UserId!.Value, 1)),
                    UniqueFans = g.Select(p => p.UserId).Distinct().Count()
                })
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.UniqueFans)
                .ThenBy(x => x.TrackId)
                .Take(count)
                .Select(x => x.TrackId)
                .ToList();

            if (!scored.Any()) return [];

            var tracks = await _trackRepository.GetLocalTracks()
                .Include(t => t.User)
                .Where(t => scored.Contains(t.Id))
                .ToListAsync();

            return scored
                .Select(id => tracks.FirstOrDefault(t => t.Id == id))
                .Where(t => t != null)
                .ToList()!;
        }

        public async Task<List<LocalTrack>> GetTrendingTracksAsync(int count = 10)
        {
            var tracksWithPlays = await _trackRepository.GetLocalTracks()
                .AsNoTracking()
                .Include(t => t.User)
                .Where(t => !t.IsPrivate)
                .Select(t => new
                {
                    Track = t,
                    PlayCount = _playRepository.GetContentPlays()
                        .Count(cp => cp.ContentId == t.Id && cp.ContentType == "TRACK")
                })
                .ToListAsync();

            //  plays / (age_in_hours + 2)^1.5
            var now = DateTime.UtcNow;
            var scoredTracks = tracksWithPlays
                .Select(tp =>
                {
                    var ageInHours = (now - tp.Track.UploadedAt).TotalHours;
                    var score = tp.PlayCount / Math.Pow(ageInHours + 2, 1.5);
                    return new
                    {
                        Track = tp.Track,
                        Score = score,
                        PlayCount = tp.PlayCount
                    };
                })
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.Track.UploadedAt)
                .Take(count)
                .Select(x => x.Track)
                .ToList();

            return scoredTracks;
        }
    }
}
