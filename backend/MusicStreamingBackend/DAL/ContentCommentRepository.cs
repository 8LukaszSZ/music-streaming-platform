using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class ContentCommentRepository : Repository<ContentComment>, IContentCommentRepository
    {
        public ContentCommentRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<ContentComment> GetContentComments()
        {
            return GetAll();
        }
    }
}
