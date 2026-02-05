using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface IContentPlayRepository : IRepository<ContentPlay>
    {
        IQueryable<ContentPlay> GetContentPlays();
    }
}