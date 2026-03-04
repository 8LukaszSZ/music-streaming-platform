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

        public ContentStatService(IContentStatRepository statRepository)
        {
            _statRepository = statRepository;
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
