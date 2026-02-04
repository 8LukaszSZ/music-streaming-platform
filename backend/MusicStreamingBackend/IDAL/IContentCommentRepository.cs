using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IContentCommentRepository
    {
        IQueryable<ContentComment> GetContentComments();
        Task<ContentComment?> GetContentCommentByIdAsync(Guid contentCommentId);
        Task<ContentComment> AddContentCommentAsync(ContentComment contentComment);
        Task<ContentComment> UpdateContentCommentAsync(ContentComment contentComment);
        Task<ContentComment?> DeleteContentCommentAsync(Guid contentCommentId);
    }
}
