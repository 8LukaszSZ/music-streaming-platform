using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface IContentLikeRepository : IRepository<ContentLike>
    {
        IQueryable<ContentLike> GetContentLikes();
    }
}
