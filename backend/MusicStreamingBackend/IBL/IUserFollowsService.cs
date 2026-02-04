using System;
using System.Threading.Tasks;
using Models.Entities;

namespace IBL
{
    public interface IUserFollowsService
    {
        Task<UserFollows> FollowAsync(Guid followerId, Guid followedUserId);
        Task<UserFollows?> UnfollowAsync(Guid followerId, Guid followedUserId);
        Task<int> GetFollowersCountAsync(Guid userId);
        Task<int> GetFollowingCountAsync(Guid userId);
    }
}
