using IBL;
using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Constants;
using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BL.Services
{
    public class UserActivityService : IUserActivityService
    {
        private readonly IUserActivityRepository _activityRepository;
        private readonly IUserFollowsRepository _followsRepository;

        public UserActivityService(IUserActivityRepository activityRepository, IUserFollowsRepository followsRepository)
        {
            _activityRepository = activityRepository;
            _followsRepository = followsRepository;
        }

        public async Task<List<UserActivity>> GetUserActivitiesAsync(Guid userId)
        {
            return await _activityRepository.GetUserActivities()
                .Where(ua => ua.UserId == userId)
                .OrderByDescending(ua => ua.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<UserActivity>> GetUserActivitiesAsync(Guid userId, DateTime fromDate)
        {
            return await _activityRepository.GetUserActivities()
                .Where(ua => ua.UserId == userId && ua.CreatedAt >= fromDate)
                .OrderByDescending(ua => ua.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<UserActivity>> GetFeedActivitiesAsync(Guid userId, DateTime fromDate)
        {
            var followingIds = await _followsRepository.GetUserFollows()
                .Where(f => f.FollowerId == userId)
                .Select(f => f.FollowingId)
                .ToListAsync();

            followingIds.Add(userId);

            return await _activityRepository.GetUserActivities()
                .Where(ua => followingIds.Contains(ua.UserId) && ua.CreatedAt >= fromDate)
                .OrderByDescending(ua => ua.CreatedAt)
                .Include(ua => ua.User)
                .ToListAsync();
        }

        public async Task<UserActivity> AddActivityAsync(
            Guid userId,
            ActivityType activityType,
            Guid contentId,
            ContentType contentType,
            string? message)
        {
            var activity = new UserActivity
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ActivityType = activityType.ToString(),
                ContentId = contentId,
                ContentType = contentType.ToString(),
                Message = message,
                CreatedAt = DateTime.UtcNow
            };

            return await _activityRepository.AddAsync(activity);
        }

        public async Task<UserActivity?> DeleteActivityAsync(Guid activityId)
        {
            return await _activityRepository.DeleteAsync(activityId);
        }
    }
}
