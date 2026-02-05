using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface IContentShareRepository : IRepository<ContentShare>
    {
        IQueryable<ContentShare> GetContentShares();
    }
}
