using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface IUserActivityRepository : IRepository<UserActivity>
    {
        IQueryable<UserActivity> GetUserActivities();
    }
}