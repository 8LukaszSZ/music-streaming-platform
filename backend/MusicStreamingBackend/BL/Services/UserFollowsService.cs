using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BL.Services
{
    public class UserFollowsService : IBL.IUserFollowsService
    {
        private readonly IUserFollowsRepository _followsRepository;
        private readonly IUserRepository _userRepository;

        public UserFollowsService(IUserFollowsRepository followsRepository, IUserRepository userRepository)
        {
            _followsRepository = followsRepository;
            _userRepository = userRepository;
        }

        public async Task<UserFollows> FollowAsync(Guid followerId, Guid followedUserId)
        {
            if (followerId == followedUserId)
                throw new InvalidOperationException("Cannot follow yourself.");

            var follower = await _userRepository.GetByIdAsync(followerId);
            var following = await _userRepository.GetByIdAsync(followedUserId);
            if (follower == null || following == null)
                throw new InvalidOperationException("User(s) not found.");

            var existing = await _followsRepository.GetUserFollowAsync(followerId, followedUserId);
            if (existing != null)
                throw new InvalidOperationException("Already following this user.");

            var follow = new UserFollows
            {
                Id = Guid.NewGuid(),
                FollowerId = followerId,
                FollowingId = followedUserId,
                CreatedAt = DateTime.UtcNow
            };

            return await _followsRepository.AddUserFollowAsync(follow);
        }

        public async Task<UserFollows?> UnfollowAsync(Guid followerId, Guid followedUserId)
        {
            var existing = await _followsRepository.GetUserFollowAsync(followerId, followedUserId);
            if (existing == null)
                throw new InvalidOperationException("Follow relationship does not exist.");

            return await _followsRepository.DeleteUserFollowAsync(followerId, followedUserId);
        }

        public async Task<int> GetFollowersCountAsync(Guid userId)
        {
            return await _followsRepository.GetUserFollows()
                .CountAsync(f => f.FollowingId == userId);
        }

        public async Task<int> GetFollowingCountAsync(Guid userId)
        {
            return await _followsRepository.GetUserFollows()
                .CountAsync(f => f.FollowerId == userId);
        }

        public async Task<List<User>> GetFollowersAsync(Guid userId)
        {
            return await _followsRepository.GetUserFollows()
                .Where(f => f.FollowingId == userId)
                .Include(f => f.Follower)
                .Select(f => f.Follower)
                .OrderBy(u => u.Username)
                .ToListAsync();
        }

        public async Task<List<User>> GetFollowingAsync(Guid userId)
        {
            return await _followsRepository.GetUserFollows()
                .Where(f => f.FollowerId == userId)
                .Include(f => f.Following)
                .Select(f => f.Following)
                .OrderBy(u => u.Username)
                .ToListAsync();
        }
    }
}
