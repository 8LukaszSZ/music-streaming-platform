using IBL;
using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BL.Services
{
    public class ContentCommentService : IContentCommentService
    {
        private readonly IContentCommentRepository _commentRepository;
        private readonly IUserRepository _userRepository;

        public ContentCommentService(IContentCommentRepository commentRepository, IUserRepository userRepository)
        {
            _commentRepository = commentRepository;
            _userRepository = userRepository;
        }

        public Task<int> GetCommentCountAsync(Guid contentId, string contentType)
        {
            return _commentRepository.GetContentComments()
                .CountAsync(cc => cc.ContentId == contentId && cc.ContentType == contentType);
        }

        public Task<int> GetCommentCountAsync(Guid contentId, string contentType, DateTime fromDate)
        {
            return _commentRepository.GetContentComments()
                .CountAsync(cc => cc.ContentId == contentId && cc.ContentType == contentType && cc.CreatedAt >= fromDate);
        }

        public async Task<List<ContentComment>> GetCommentsForContentAsync(Guid contentId, string contentType)
        {
            return await _commentRepository.GetContentComments()
                .Where(cc => cc.ContentId == contentId && cc.ContentType == contentType && cc.ParentCommentId == null)
                .OrderBy(cc => cc.CreatedAt)
                .Include(cc => cc.User)
                .Include(cc => cc.Replies).ThenInclude(r => r.User)
                .ToListAsync();
        }

        public async Task<List<ContentComment>> GetRepliesAsync(Guid parentCommentId)
        {
            return await _commentRepository.GetContentComments()
                .Where(cc => cc.ParentCommentId == parentCommentId)
                .OrderBy(cc => cc.CreatedAt)
                .Include(cc => cc.User)
                .ToListAsync();
        }

        public async Task<ContentComment?> GetCommentByIdAsync(Guid commentId)
        {
            return await _commentRepository.GetByIdAsync(commentId);
        }

        public async Task<ContentComment> AddCommentAsync(
            Guid userId,
            Guid contentId,
            string contentType,
            string content,
            Guid? parentCommentId = null)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found.");

            if (parentCommentId.HasValue)
            {
                var parent = await _commentRepository.GetByIdAsync(parentCommentId.Value);
                if (parent == null)
                    throw new InvalidOperationException("Parent comment not found.");
            }

            var comment = new ContentComment
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ContentId = contentId,
                ContentType = contentType,
                Content = content,
                ParentCommentId = parentCommentId,
                CreatedAt = DateTime.UtcNow
            };

            return await _commentRepository.AddAsync(comment);
        }

        public async Task<ContentComment> UpdateCommentAsync(ContentComment comment)
        {
            return await _commentRepository.UpdateAsync(comment);
        }

        public async Task<ContentComment?> DeleteCommentAsync(Guid commentId)
        {
            return await _commentRepository.DeleteAsync(commentId);
        }

        public async Task<bool> UserOwnsCommentAsync(Guid userId, Guid commentId)
        {
            var comment = await _commentRepository.GetByIdAsync(commentId);
            return comment != null && comment.UserId == userId;
        }
    }
}
