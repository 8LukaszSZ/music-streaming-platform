using Models.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IUserRepository : IRepository<User>
    {
        IQueryable<User> GetUsers();
    }
}
