using Models.Entities;

namespace MusicStreaming.API.Extensions
{
    public static class UserDisplayExtensions
    {
        public const string DeletedUserDisplayName = "Deleted user";

        public static string DisplayUsername(this User? user)
        {
            if (user == null)
                return string.Empty;

            return user.IsDeleted ? DeletedUserDisplayName : user.Username;
        }

        public static string? DisplayProfileImagePath(this User? user)
        {
            if (user == null || user.IsDeleted)
                return null;

            return user.ProfileImagePath;
        }
    }
}
