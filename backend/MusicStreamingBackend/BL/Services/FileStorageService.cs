using IBL;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace BL.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;

        private const string UserImagesFolder = "UploadedImagesUser";
        private const string TrackImagesFolder = "UploadedImagesTracks";
        private const string PlaylistImagesFolder = "UploadedImagesPlaylist";
        private const string MusicFolder = "UploadedMusic";

        private const long MaxImageSize = 5 * 1024 * 1024;  // 5MB
        private const long MaxMusicSize = 50 * 1024 * 1024; // 50MB

        private static readonly string[] AllowedImageExtensions =
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        private static readonly string[] AllowedMusicExtensions =
        {
            ".mp3",
            ".wav",
            ".flac",
            ".ogg"
        };

        public FileStorageService(IWebHostEnvironment env)
        {
            _env = env;
        }

        private static void ValidateFile(IFormFile file, string[] allowedExtensions, long maxSize)
        {
            if (file == null || file.Length == 0)
                throw new Exception("File is empty.");

            if (file.Length > maxSize)
                throw new Exception($"File exceeds maximum size of {maxSize / 1024 / 1024} MB.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                throw new Exception($"File type {extension} is not allowed.");
        }

        private async Task<string> SaveFileInternalAsync(string baseFolder, string ownerFolder, string? subFolder, IFormFile file)
        {
            var root = _env.ContentRootPath;

            // jeśli podfolder nie jest null lub pusty, dodaj go do ścieżki
            var folder = string.IsNullOrWhiteSpace(subFolder)
                ? Path.Combine(root, baseFolder, ownerFolder)
                : Path.Combine(root, baseFolder, ownerFolder, subFolder);

            Directory.CreateDirectory(folder);

            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var fullPath = Path.Combine(folder, fileName);

            using (var stream = System.IO.File.Create(fullPath))
            {
                await file.CopyToAsync(stream);
            }

            // ścieżka względna dla zapisu w DB
            var relativePath = string.IsNullOrWhiteSpace(subFolder)
                ? Path.Combine(baseFolder, ownerFolder, fileName)
                : Path.Combine(baseFolder, ownerFolder, subFolder, fileName);

            return relativePath.Replace("\\", "/");
        }

        public Task<string> SaveUserImageAsync(Guid userId, IFormFile file)
        {
            ValidateFile(file, AllowedImageExtensions, MaxImageSize);
            // brak podfolderu, bo obrazek należy bezpośrednio do usera
            return SaveFileInternalAsync(UserImagesFolder, userId.ToString(), null, file);
        }

        public Task<string> SavePlaylistImageAsync(Guid userId, Guid playlistId, IFormFile file)
        {
            ValidateFile(file, AllowedImageExtensions, MaxImageSize);
            // drugi poziom folderu = ID playlisty
            return SaveFileInternalAsync(PlaylistImagesFolder, userId.ToString(), playlistId.ToString(), file);
        }

        public Task<string> SaveTrackFileAsync(Guid userId, Guid trackId, IFormFile file)
        {
            ValidateFile(file, AllowedMusicExtensions, MaxMusicSize);
            // drugi poziom folderu = ID tracka
            return SaveFileInternalAsync(MusicFolder, userId.ToString(), trackId.ToString(), file);
        }

        public Task<string> SaveTrackImageAsync(Guid userId, Guid trackId, IFormFile file)
        {
            ValidateFile(file, AllowedImageExtensions, MaxImageSize);
            // drugi poziom folderu = ID tracka
            return SaveFileInternalAsync(TrackImagesFolder, userId.ToString(), trackId.ToString(), file);
        }
    }
}
