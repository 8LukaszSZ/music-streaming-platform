using DAL.Context;
using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    public class UserFollowsRepository : Repository<UserFollows>, IUserFollowsRepository
    {
        public UserFollowsRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<UserFollows> GetUserFollows()
        {
            return GetAll();
        }

        public async Task<UserFollows?> GetUserFollowAsync(Guid followerId, Guid followingId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);
        }

        public async Task<UserFollows> AddUserFollowAsync(UserFollows follow)
        {
            return await AddAsync(follow);
        }

        public async Task<UserFollows?> DeleteUserFollowAsync(Guid followerId, Guid followingId)
        {
            var follow = await GetUserFollowAsync(followerId, followingId);
            if (follow == null)
                return null;

            _dbSet.Remove(follow);
            await _context.SaveChangesAsync();
            return follow;
        }
    }
}
