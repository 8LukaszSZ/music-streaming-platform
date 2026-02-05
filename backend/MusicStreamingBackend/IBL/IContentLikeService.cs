using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IBL
{
    public interface IContentLikeService
    {
        Task<int> GetLikeCountAsync(Guid contentId, string contentType);
        Task<bool> IsContentLikedByUserAsync(Guid userId, Guid contentId, string contentType);

        Task<ContentLike> LikeContentAsync(Guid userId, Guid contentId, string contentType);
        Task<bool> UnlikeContentAsync(Guid userId, Guid contentId, string contentType);
    }
}
