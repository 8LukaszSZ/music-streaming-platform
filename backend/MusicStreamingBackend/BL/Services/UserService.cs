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
            return await _userRepository.GetUsers().ToListAsync();
        }
        public async Task<User?> GetUserByIdAsync(Guid userId)
        {
            return await _userRepository.GetUserByIdAsync(userId);
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
        public async Task<User> AddUserAsync(User user)
        {
            return await _userRepository.AddUserAsync(user);
        }
        public async Task<User> UpdateUserAsync(User user)
        {
            var updatedUser = await _userRepository.UpdateUserAsync(user);
            if (updatedUser == null)
                throw new InvalidOperationException("Failed to update the user.");

            return updatedUser;
        }
        public async Task<User> UpdateUserProfileAsync(Guid userId, string? bio, byte[]? profileImage)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found.");

            user.Bio = bio ?? user.Bio;
            user.ProfileImage = profileImage ?? user.ProfileImage;

            return await _userRepository.UpdateUserAsync(user);
        }
        public async Task<User?> DeleteUserAsync(Guid userId)
        {
            return await _userRepository.DeleteUserAsync(userId);
        }
        public async Task<bool> IsEmailTakenAsync(string email)
        {
            return await _userRepository.GetUsers().AnyAsync(u => u.Email == email);
        }
        public async Task<bool> IsUsernameTakenAsync(string username)
        {
            return await _userRepository.GetUsers().AnyAsync(u => u.Username == username);
        }
    }
}
