using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class ContentStatRepository : Repository<ContentStat>, IContentStatRepository
    {
        public ContentStatRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<ContentStat> GetContentStats()
        {
            return GetAll();
        }
    }
}
