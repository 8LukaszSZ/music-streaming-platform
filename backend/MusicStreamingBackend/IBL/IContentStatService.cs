using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IBL
{
    public interface IContentStatService
    {
        Task<ContentStat> GetOrCreateAsync(Guid contentId, string contentType);
        Task<ContentStat> GetFromDateAsync(Guid contentId, string contentType, DateTime fromDate);

        Task IncrementLikesAsync(Guid contentId, string contentType);
        Task DecrementLikesAsync(Guid contentId, string contentType);

        Task IncrementCommentsAsync(Guid contentId, string contentType);
        Task DecrementCommentsAsync(Guid contentId, string contentType);

        Task IncrementPlaysAsync(Guid contentId, string contentType);
    }
}
