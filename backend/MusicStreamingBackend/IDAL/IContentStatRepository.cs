using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface IContentStatRepository : IRepository<ContentStat>
    {
        IQueryable<ContentStat> GetContentStats();
    }
}
