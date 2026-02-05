using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface ILocalTrackRepository : IRepository<LocalTrack>
    {
        IQueryable<LocalTrack> GetLocalTracks();
    }
}
