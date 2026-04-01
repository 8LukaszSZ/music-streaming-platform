using IBL;
using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Entities;
using System;
using System.Threading.Tasks;

namespace BL.Services
{
    public class ContentStatService : IContentStatService
    {
        private readonly IContentStatRepository _statRepository;
        private readonly IContentLikeRepository _likeRepository;
        private readonly IContentCommentRepository _commentRepository;
        private readonly IContentPlayRepository _playRepository;

        public ContentStatService(
            IContentStatRepository statRepository,
            IContentLikeRepository likeRepository,
            IContentCommentRepository commentRepository,
            IContentPlayRepository playRepository)
        {
            _statRepository = statRepository;
            _likeRepository = likeRepository;
            _commentRepository = commentRepository;
            _playRepository = playRepository;
        }

        public async Task<ContentStat> GetOrCreateAsync(Guid contentId, string contentType)
        {
            var stat = await _statRepository.GetContentStats()
                .FirstOrDefaultAsync(cs => cs.ContentId == contentId && cs.ContentType == contentType);

            if (stat != null)
                return stat;

            stat = new ContentStat
            {
                Id = Guid.NewGuid(),
                ContentId = contentId,
                ContentType = contentType,
                LikesCount = 0,
                CommentsCount = 0,
                PlaysCount = 0,
                LastUpdated = DateTime.UtcNow
            };

            return await _statRepository.AddAsync(stat);
        }

        public async Task<ContentStat> GetFromDateAsync(Guid contentId, string contentType, DateTime fromDate)
        {
            var likesCount = await _likeRepository.GetContentLikes()
                .LongCountAsync(cl => cl.ContentId == contentId && cl.ContentType == contentType && cl.CreatedAt >= fromDate);

            var commentsCount = await _commentRepository.GetContentComments()
                .LongCountAsync(cc => cc.ContentId == contentId && cc.ContentType == contentType && cc.CreatedAt >= fromDate);

            var playsCount = await _playRepository.GetContentPlays()
                .LongCountAsync(cp => cp.ContentId == contentId && cp.ContentType == contentType && cp.PlayedAt >= fromDate);

            return new ContentStat
            {
                Id = Guid.NewGuid(),
                ContentId = contentId,
                ContentType = contentType,
                LikesCount = likesCount,
                CommentsCount = commentsCount,
                PlaysCount = playsCount,
                LastUpdated = DateTime.UtcNow
            };
        }

        public async Task IncrementLikesAsync(Guid contentId, string contentType)
        {
            var stat = await GetOrCreateAsync(contentId, contentType);
            stat.LikesCount++;
            stat.LastUpdated = DateTime.UtcNow;
            await _statRepository.UpdateAsync(stat);
        }

        public async Task DecrementLikesAsync(Guid contentId, string contentType)
        {
            var stat = await _statRepository.GetContentStats()
                .FirstOrDefaultAsync(cs => cs.ContentId == contentId && cs.ContentType == contentType);
            if (stat == null)
                return;

            if (stat.LikesCount > 0)
            {
                stat.LikesCount--;
                stat.LastUpdated = DateTime.UtcNow;
                await _statRepository.UpdateAsync(stat);
            }
        }

        public async Task IncrementCommentsAsync(Guid contentId, string contentType)
        {
            var stat = await GetOrCreateAsync(contentId, contentType);
            stat.CommentsCount++;
            stat.LastUpdated = DateTime.UtcNow;
            await _statRepository.UpdateAsync(stat);
        }

        public async Task DecrementCommentsAsync(Guid contentId, string contentType)
        {
            var stat = await _statRepository.GetContentStats()
                .FirstOrDefaultAsync(cs => cs.ContentId == contentId && cs.ContentType == contentType);
            if (stat == null)
                return;

            if (stat.CommentsCount > 0)
            {
                stat.CommentsCount--;
                stat.LastUpdated = DateTime.UtcNow;
                await _statRepository.UpdateAsync(stat);
            }
        }

        public async Task IncrementPlaysAsync(Guid contentId, string contentType)
        {
            var stat = await GetOrCreateAsync(contentId, contentType);
            stat.PlaysCount++;
            stat.LastUpdated = DateTime.UtcNow;
            await _statRepository.UpdateAsync(stat);
        }
    }
}
