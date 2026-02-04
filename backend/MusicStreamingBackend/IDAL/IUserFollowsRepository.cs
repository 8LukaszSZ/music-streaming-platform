using Models.Entities;
using System;
using System.Linq;

namespace IDAL
{
    public interface IUserFollowsRepository
    {
        IQueryable<UserFollows> GetUserFollows();
        Task<UserFollows?> GetUserFollowAsync(Guid followerId, Guid followingId);
        Task<UserFollows> AddUserFollowAsync(UserFollows follow);
        Task<UserFollows> UpdateUserFollowAsync(UserFollows follow);
        Task<UserFollows?> DeleteUserFollowAsync(Guid followerId, Guid followingId);
    }
}
