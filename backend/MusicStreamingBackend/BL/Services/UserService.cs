using IBL;
using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BL.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }
        public Task<int> GetUserCountAsync()
        {
            return _userRepository.GetUsers().CountAsync();
        }
        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _userRepository.GetUsers()
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }
        public async Task<User?> GetUserByIdAsync(Guid userId)
        {
            return await _userRepository.GetByIdAsync(userId);
        }
        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _userRepository.GetUsers()
                .FirstOrDefaultAsync(u => u.Email == email);
        }
        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _userRepository.GetUsers()
                .FirstOrDefaultAsync(u => u.Username == username);
        }
        public async Task<List<User>> SearchUsersAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new List<User>();
            }

            var normalized = query.Trim().ToLower();

            return await _userRepository.GetUsers()
                .Where(u => u.Username.ToLower().Contains(normalized))
                .OrderBy(u => u.Username)
                .Take(50)
                .ToListAsync();
        }
        public async Task<User> AddUserAsync(User user)
        {
            if (user.Id == Guid.Empty)
                user.Id = Guid.NewGuid();
            return await _userRepository.AddAsync(user);
        }
        public async Task<User> UpdateUserAsync(User user)
        {
            var updatedUser = await _userRepository.UpdateAsync(user);
            if (updatedUser == null)
                throw new InvalidOperationException("Failed to update the user.");

            return updatedUser;
        }
        public async Task<User> UpdateUserProfileAsync(Guid userId, string? bio, string? profileImage)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found.");

            user.Bio = bio ?? user.Bio;
            user.ProfileImagePath = profileImage ?? user.ProfileImagePath;

            return await _userRepository.UpdateAsync(user);
        }
        public async Task<User?> DeleteUserAsync(Guid userId)
        {
            return await _userRepository.DeleteAsync(userId);
        }
        public async Task<bool> IsEmailTakenAsync(string email)
        {
            return await _userRepository.GetUsers().AnyAsync(u => u.Email == email);
        }
        public async Task<bool> IsUsernameTakenAsync(string username)
        {
            return await _userRepository.GetUsers().AnyAsync(u => u.Username == username);
        }
        public async Task<User> UpdateUserRoleAsync(Guid userId, string role)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found.");

            user.Role = role;
            return await _userRepository.UpdateAsync(user);
        }
    }
}
