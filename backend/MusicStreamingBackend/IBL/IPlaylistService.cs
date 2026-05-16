using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IBL
{
    public interface IPlaylistService
    {
        Task<int> GetPlaylistCountAsync();
        Task<List<Playlist>> GetAllPlaylistsAsync();
        Task<List<Playlist>> GetPlaylistsByUserIdAsync(Guid userId);
        Task<List<Playlist>> GetPublicPlaylistsAsync();
        Task<List<Playlist>> SearchPlaylistsByNameAsync(string query, Guid? viewerUserId, bool isAdmin);
        Task<Playlist?> GetPlaylistByIdAsync(Guid playlistId);

        Task<Playlist> AddPlaylistAsync(Playlist playlist);
        Task<Playlist> UpdatePlaylistAsync(Playlist playlist);
        Task<Playlist?> DeletePlaylistAsync(Guid playlistId);

        Task<bool> UserOwnsPlaylistAsync(Guid userId, Guid playlistId);
        Task<bool> SetPlaylistVisibilityAsync(Guid playlistId, bool isPublic);
        Task<List<Playlist>> GetPopularPlaylistsAsync(int count = 10);
    }
}
