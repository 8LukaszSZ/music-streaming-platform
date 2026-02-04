using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IPlaylistRepository
    {
        IQueryable<Playlist> GetPlaylists();
        Task<Playlist?> GetPlaylistByIdAsync(Guid playlistId);
        Task<Playlist> AddPlaylistAsync(Playlist playlist);
        Task<Playlist> UpdatePlaylistAsync(Playlist playlist);
        Task<Playlist?> DeletePlaylistAsync(Guid playlistId);
    }
}
