using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IContentShareRepository
    {
        IQueryable<ContentShare> GetContentShares();
        Task<ContentShare?> GetContentShareByIdAsync(Guid contentShareId);
        Task<ContentShare> AddContentShareAsync(ContentShare contentShare);
        Task<ContentShare> UpdateContentShareAsync(ContentShare contentShare);
        Task<ContentShare?> DeleteContentShareAsync(Guid contentShareId);
    }
}
