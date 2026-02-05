using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface IPlaylistRepository : IRepository<Playlist>
    {
        IQueryable<Playlist> GetPlaylists();
    }
}
