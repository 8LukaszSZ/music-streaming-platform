using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class ContentShareRepository : Repository<ContentShare>, IContentShareRepository
    {
        public ContentShareRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<ContentShare> GetContentShares()
        {
            return GetAll();
        }
    }
}
