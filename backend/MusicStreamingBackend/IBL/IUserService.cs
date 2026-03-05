using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IBL
{
    public interface IUserService
    {
        Task<int> GetUserCountAsync();
        Task<List<User>> GetAllUsersAsync();
        Task<User?> GetUserByIdAsync(Guid userId);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<List<User>> SearchUsersAsync(string query);

        Task<User> AddUserAsync(User user);
        Task<User> UpdateUserAsync(User user);
        Task<User> UpdateUserProfileAsync(Guid userId, string? bio, string profileImage);
        Task<User?> DeleteUserAsync(Guid userId);

        Task<bool> IsEmailTakenAsync(string email);
        Task<bool> IsUsernameTakenAsync(string username);

        Task<User> UpdateUserRoleAsync(Guid userId, string role);
    }
}
