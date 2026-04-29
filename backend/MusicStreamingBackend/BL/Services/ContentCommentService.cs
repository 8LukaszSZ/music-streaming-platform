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
        private readonly ILocalTrackRepository _trackRepository;

        public ContentCommentService(IContentCommentRepository commentRepository, IUserRepository userRepository, ILocalTrackRepository trackRepository)
        {
            _commentRepository = commentRepository;
            _userRepository = userRepository;
            _trackRepository = trackRepository;
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
            var comment = await _commentRepository.GetByIdAsync(commentId);
            if (comment == null)
                return null;

            if (comment.ParentCommentId.HasValue)
            {
                return await _commentRepository.DeleteAsync(commentId);
            }
            else
            {
                var hasReplies = await _commentRepository.GetContentComments()
                    .AnyAsync(cc => cc.ParentCommentId == commentId);

                if (!hasReplies)
                {
                    return await _commentRepository.DeleteAsync(commentId);
                }
                else
                {
                    comment.IsDeleted = true;
                    comment.DeletedAt = DateTime.UtcNow;
                    comment.Content = "Deleted comment";

                    return await _commentRepository.UpdateAsync(comment);
                }
            }
        }

        public async Task<bool> UserOwnsCommentAsync(Guid userId, Guid commentId)
        {
            var comment = await _commentRepository.GetByIdAsync(commentId);
            return comment != null && comment.UserId == userId;
        }

        public async Task<List<ContentComment>> GetLatestCommentsForUserTracksAsync(Guid creatorUserId, int count = 3)
        {
            // Get track IDs for the creator
            var creatorTrackIds = await _trackRepository.GetLocalTracks()
                .Where(t => t.UserId == creatorUserId)
                .Select(t => t.Id)
                .ToListAsync();

            if (!creatorTrackIds.Any())
                return new List<ContentComment>();

            // Get comments on those tracks (excluding comments by the creator)
            return await _commentRepository.GetContentComments()
                .Where(cc => cc.ContentType == "TRACK" && cc.UserId != creatorUserId && creatorTrackIds.Contains(cc.ContentId))
                .OrderByDescending(cc => cc.CreatedAt)
                .Take(count)
                .Include(cc => cc.User)
                .ToListAsync();
        }
    }
}
