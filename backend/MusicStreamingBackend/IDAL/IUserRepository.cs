using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IUserRepository
    {
        IQueryable<User> GetUsers();
        Task<User?> GetUserByIdAsync(Guid userId);
        Task<User> AddUserAsync(User user);
        Task<User> UpdateUserAsync(User user);
        Task<User?> DeleteUserAsync(Guid userId);
    }
}
