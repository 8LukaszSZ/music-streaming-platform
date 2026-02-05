using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class ContentLikeRepository : Repository<ContentLike>, IContentLikeRepository
    {
        public ContentLikeRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<ContentLike> GetContentLikes()
        {
            return GetAll();
        }
    }
}
