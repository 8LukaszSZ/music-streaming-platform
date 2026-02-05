using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class ContentPlayRepository : Repository<ContentPlay>, IContentPlayRepository
    {
        public ContentPlayRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<ContentPlay> GetContentPlays()
        {
            return GetAll();
        }
    }
}
