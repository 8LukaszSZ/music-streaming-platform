using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IPlaylistTrackRepository
    {
        IQueryable<PlaylistTrack> GetPlaylistTracks();
        Task<PlaylistTrack?> GetPlaylistTrackByIdAsync(Guid playlistTrackId);
        Task<PlaylistTrack> AddPlaylistTrackAsync(PlaylistTrack playlistTrack);
        Task<PlaylistTrack> UpdatePlaylistTrackAsync(PlaylistTrack playlistTrack);
        Task<PlaylistTrack?> DeletePlaylistTrackAsync(Guid playlistTrackId);
    }
}
