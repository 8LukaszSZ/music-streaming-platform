using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class UserActivityRepository : Repository<UserActivity>, IUserActivityRepository
    {
        public UserActivityRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<UserActivity> GetUserActivities()
        {
            return GetAll();
        }
    }
}
