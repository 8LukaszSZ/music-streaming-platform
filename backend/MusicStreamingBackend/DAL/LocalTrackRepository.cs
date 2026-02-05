using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class LocalTrackRepository : Repository<LocalTrack>, ILocalTrackRepository
    {
        public LocalTrackRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<LocalTrack> GetLocalTracks()
        {
            return GetAll();
        }
    }
}
