using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IBL
{
    public interface IContentCommentService
    {
        Task<int> GetCommentCountAsync(Guid contentId, string contentType);
        Task<int> GetCommentCountAsync(Guid contentId, string contentType, DateTime fromDate);

        Task<List<ContentComment>> GetCommentsForContentAsync(Guid contentId, string contentType);

        Task<List<ContentComment>> GetRepliesAsync(Guid parentCommentId);
        Task<ContentComment?> GetCommentByIdAsync(Guid commentId);

        Task<ContentComment> AddCommentAsync(
            Guid userId,
            Guid contentId,
            string contentType,
            string content,
            Guid? parentCommentId = null
        );

        Task<ContentComment> UpdateCommentAsync(ContentComment comment);
        Task<ContentComment?> DeleteCommentAsync(Guid commentId);

        Task<bool> UserOwnsCommentAsync(Guid userId, Guid commentId);
        Task<List<ContentComment>> GetLatestCommentsForUserTracksAsync(Guid creatorUserId, int count = 3);
    }
}
