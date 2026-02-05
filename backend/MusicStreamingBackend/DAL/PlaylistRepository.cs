using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class PlaylistRepository : Repository<Playlist>, IPlaylistRepository
    {
        public PlaylistRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<Playlist> GetPlaylists()
        {
            return GetAll();
        }
    }
}
