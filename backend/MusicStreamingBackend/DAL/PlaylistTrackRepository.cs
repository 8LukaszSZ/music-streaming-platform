using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class PlaylistTrackRepository : Repository<PlaylistTrack>, IPlaylistTrackRepository
    {
        public PlaylistTrackRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<PlaylistTrack> GetPlaylistTracks()
        {
            return GetAll();
        }
    }
}
