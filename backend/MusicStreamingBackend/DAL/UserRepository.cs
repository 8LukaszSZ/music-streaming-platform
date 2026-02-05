using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<User> GetUsers()
        {
            return GetAll();
        }
    }
}
