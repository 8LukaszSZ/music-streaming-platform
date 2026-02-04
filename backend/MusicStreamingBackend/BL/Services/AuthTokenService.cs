using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BL.Options;
using IBL;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Models.Entities;

namespace BL.Services
{
    public class AuthTokenService : IAuthTokenService
    {
        private readonly JwtOptions _jwtOptions;

        public AuthTokenService(IOptions<JwtOptions> jwtOptions)
        {
            _jwtOptions = jwtOptions.Value;
        }

        public string GenerateToken(User user, out DateTime expiresAt)
        {
            if (string.IsNullOrWhiteSpace(_jwtOptions.Secret))
            {
                throw new InvalidOperationException("JWT Secret is not configured.");
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Secret));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            expiresAt = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpirationTimeInMinutes);

            var token = new JwtSecurityToken(
                issuer: _jwtOptions.Issuer,
                audience: _jwtOptions.Audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

