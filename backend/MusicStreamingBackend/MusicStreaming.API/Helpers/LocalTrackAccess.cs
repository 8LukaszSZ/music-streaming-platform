using Models.Entities;

namespace MusicStreaming.API.Helpers;

public static class LocalTrackAccess
{
    public static bool CanView(LocalTrack track, Guid? viewerUserId, bool isAdmin)
    {
        if (isAdmin)
            return true;
        if (!track.IsPrivate)
            return true;
        return viewerUserId.HasValue && track.UserId == viewerUserId.Value;
    }

    public static bool CanAddToPlaylist(LocalTrack track, Playlist playlist, bool isAdmin)
    {
        if (isAdmin)
            return true;
        if (!track.IsPrivate)
            return true;
        return !playlist.IsPublic && track.UserId == playlist.UserId;
    }
}
