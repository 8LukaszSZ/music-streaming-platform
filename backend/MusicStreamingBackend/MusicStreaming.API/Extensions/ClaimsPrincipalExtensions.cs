using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MusicStreaming.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var claim =
            user.FindFirst(JwtRegisteredClaimNames.Sub) ??
            user.FindFirst(ClaimTypes.NameIdentifier);

        if (claim == null || !Guid.TryParse(claim.Value, out var userId))
            throw new UnauthorizedAccessException("Invalid user token.");

        return userId;
    }
}