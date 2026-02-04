using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IContentStatRepository
    {
        IQueryable<ContentStat> GetContentStats();
        Task<ContentStat?> GetContentStatByIdAsync(Guid contentStatId);
        Task<ContentStat> AddContentStatAsync(ContentStat contentStat);
        Task<ContentStat> UpdateContentStatAsync(ContentStat contentStat);
        Task<ContentStat?> DeleteContentStatAsync(Guid contentStatId);
    }
}
