using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface IContentCommentRepository : IRepository<ContentComment>
    {
        IQueryable<ContentComment> GetContentComments();
    }
}
