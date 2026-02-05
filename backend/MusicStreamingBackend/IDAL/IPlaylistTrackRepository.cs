using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface IPlaylistTrackRepository : IRepository<PlaylistTrack>
    {
        IQueryable<PlaylistTrack> GetPlaylistTracks();
    }
}
