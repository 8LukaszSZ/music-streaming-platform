using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IDAL
{
    public interface ILocalTrackRepository
    {
        IQueryable<LocalTrack> GetLocalTracks();
        Task<LocalTrack?> GetLocalTrackByIdAsync(Guid trackId);
        Task<LocalTrack> AddLocalTrackAsync(LocalTrack track);
        Task<LocalTrack> UpdateLocalTrackAsync(LocalTrack track);
        Task<LocalTrack?> DeleteLocalTrackAsync(Guid trackId);
    }
}
