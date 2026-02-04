using DAL.Context;
using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public class UserRepository : IUserRepository
    {
        private readonly MusicStreamingContext _context;
        public UserRepository(MusicStreamingContext context)
        {
            _context = context;
        }

        public IQueryable<User> GetUsers()
        {
            return _context.Users;
        }
        public async Task<User?> GetUserByIdAsync(Guid userId)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        }

        public async Task<User> AddUserAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User?> DeleteUserAsync(Guid userId)
        {
            var user = await GetUserByIdAsync(userId);
            if (user == null)
                return null;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return user;
        }
    }
}
