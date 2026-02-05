using Models.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IBL
{
    public interface IUserActivityService
    {
        Task<List<UserActivity>> GetUserActivitiesAsync(Guid userId);
        Task<List<UserActivity>> GetUserActivitiesAsync(Guid userId, DateTime fromDate);

        Task<List<UserActivity>> GetFeedActivitiesAsync(Guid userId, DateTime fromDate);

        Task<UserActivity> AddActivityAsync(
            Guid userId,
            string activityType,
            Guid contentId,
            string contentType,
            string? message
        );

        Task<UserActivity?> DeleteActivityAsync(Guid activityId);
    }
}