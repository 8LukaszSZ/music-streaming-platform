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
            // Krok 1: ID utworów artysty
            var artistTrackIds = await _trackRepository.GetLocalTracks()
                .Where(t => t.UserId == artistUserId)
                .Select(t => t.Id)
                .ToListAsync();

            if (!artistTrackIds.Any()) return [];

            // Krok 2: Fani + liczba odtworzeń artysty (im więcej słuchał, tym ważniejszy fan)
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

            // Krok 3: Inne utwory słuchane przez fanów z ważonym scoringiem
            var candidatePlays = await _playRepository.GetContentPlays()
                .Where(cp =>
                    cp.ContentType == "TRACK" &&
                    cp.UserId != null &&
                    fanUserIds.Contains(cp.UserId.Value) &&
                    !artistTrackIds.Contains(cp.ContentId))
                .Select(cp => new { cp.ContentId, cp.UserId })
                .ToListAsync();

            // Krok 5: Scoring w pamięci — ważony przez "jakość" fana
            var scored = candidatePlays
                .GroupBy(p => p.ContentId)
                .Select(g => new
                {
                    TrackId = g.Key,
                    // Score = suma wag fanów, którzy tego słuchali
                    Score = g.Sum(p => weightDict.GetValueOrDefault(p.UserId!.Value, 1)),
                    // Dodatkowy sygnał: liczba unikalnych fanów (nie tylko odtworzenia)
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

            // Zachowaj kolejność scoringu
            return scored
                .Select(id => tracks.FirstOrDefault(t => t.Id == id))
                .Where(t => t != null)
                .ToList()!;
        }
    }
}
