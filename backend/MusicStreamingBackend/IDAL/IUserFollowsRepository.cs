using Models.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IUserFollowsRepository : IRepository<UserFollows>
    {
        IQueryable<UserFollows> GetUserFollows();
        Task<UserFollows?> GetUserFollowAsync(Guid followerId, Guid followingId);
        Task<UserFollows> AddUserFollowAsync(UserFollows follow);
        Task<UserFollows?> DeleteUserFollowAsync(Guid followerId, Guid followingId);
    }
}
