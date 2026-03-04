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

        public LocalTrackService(ILocalTrackRepository trackRepository)
        {
            _trackRepository = trackRepository;
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
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.UploadedAt)
                .ToListAsync();
        }

        public async Task<LocalTrack?> GetLocalTrackByIdAsync(Guid localTrackId)
        {
            return await _trackRepository.GetByIdAsync(localTrackId);
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
    }
}
