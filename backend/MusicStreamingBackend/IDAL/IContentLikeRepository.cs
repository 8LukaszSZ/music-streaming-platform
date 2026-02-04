using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IContentLikeRepository
    {
        IQueryable<ContentLike> GetContentLikes();
        Task<ContentLike?> GetContentLikeByIdAsync(Guid contentLikeId);
        Task<ContentLike> AddContentLikeAsync(ContentLike contentLike);
        Task<ContentLike> UpdateContentLikeAsync(ContentLike contentLike);
        Task<ContentLike?> DeleteContentLikeAsync(Guid contentLikeId);
    }
}
