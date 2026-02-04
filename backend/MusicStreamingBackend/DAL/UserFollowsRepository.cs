using DAL.Context;
using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    public class UserFollowsRepository : IUserFollowsRepository
    {
        private readonly MusicStreamingContext _context;
        public UserFollowsRepository(MusicStreamingContext context)
        {
            _context = context;
        }

        public IQueryable<UserFollows> GetUserFollows()
        {
            return _context.UserFollows;
        }

        public async Task<UserFollows?> GetUserFollowAsync(Guid followerId, Guid followingId)
        {
            return await _context.UserFollows
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);
        }

        public async Task<UserFollows> AddUserFollowAsync(UserFollows follow)
        {
            await _context.UserFollows.AddAsync(follow);
            await _context.SaveChangesAsync();
            return follow;
        }

        public async Task<UserFollows> UpdateUserFollowAsync(UserFollows follow)
        {
            _context.UserFollows.Update(follow);
            await _context.SaveChangesAsync();
            return follow;
        }

        public async Task<UserFollows?> DeleteUserFollowAsync(Guid followerId, Guid followingId)
        {
            var follow = await GetUserFollowAsync(followerId, followingId);
            if (follow == null)
                return null;

            _context.UserFollows.Remove(follow);
            await _context.SaveChangesAsync();
            return follow;
        }
    }
}
