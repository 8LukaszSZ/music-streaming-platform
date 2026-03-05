using Microsoft.AspNetCore.Http;

namespace IBL
{
    public interface IFileStorageService
    {
        Task<string> SaveUserImageAsync(Guid userId, IFormFile file);
        Task<string> SavePlaylistImageAsync(Guid userId, Guid playlistId, IFormFile file);
        Task<string> SaveTrackFileAsync(Guid userId, Guid trackId, IFormFile file);
        Task<string> SaveTrackImageAsync(Guid userId, Guid trackId, IFormFile file);
    }
}
