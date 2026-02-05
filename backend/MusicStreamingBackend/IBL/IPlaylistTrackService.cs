using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IBL
{
    public interface IPlaylistTrackService
    {
        Task<List<PlaylistTrack>> GetTracksByPlaylistIdAsync(Guid playlistId);
        Task<PlaylistTrack?> GetPlaylistTrackByIdAsync(Guid playlistTrackId);

        Task<PlaylistTrack> AddTrackToPlaylistAsync(PlaylistTrack playlistTrack);
        Task<PlaylistTrack?> RemoveTrackFromPlaylistAsync(Guid playlistTrackId);

        Task<bool> IsTrackInPlaylistAsync(Guid playlistId, Guid? localTrackId/*, string? spotifyTrackId*/);
    }
}
