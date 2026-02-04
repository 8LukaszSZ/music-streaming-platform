using System;
using Models.Entities;

namespace IBL
{
    public interface IAuthTokenService
    {
        string GenerateToken(User user, out DateTime expiresAt);
    }
}

