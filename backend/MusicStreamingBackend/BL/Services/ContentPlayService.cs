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
    public class ContentPlayService : IContentPlayService
    {
        private readonly IContentPlayRepository _playRepository;

        public ContentPlayService(IContentPlayRepository playRepository)
        {
            _playRepository = playRepository;
        }

        public async Task AddPlayAsync(Guid contentId, string contentType, Guid? userId)
        {
            var play = new ContentPlay
            {
                Id = Guid.NewGuid(),
                ContentId = contentId,
                ContentType = contentType,
                UserId = userId,
                PlayedAt = DateTime.UtcNow
            };

            await _playRepository.AddAsync(play);
        }

        public Task<long> GetPlaysCountAsync(Guid contentId, string contentType)
        {
            return _playRepository.GetContentPlays()
                .LongCountAsync(cp => cp.ContentId == contentId && cp.ContentType == contentType);
        }

        public Task<long> GetPlaysCountAsync(Guid contentId, string contentType, DateTime fromDate)
        {
            return _playRepository.GetContentPlays()
                .LongCountAsync(cp => cp.ContentId == contentId && cp.ContentType == contentType && cp.PlayedAt >= fromDate);
        }

        public async Task<List<ContentPlay>> GetUserPlaysAsync(Guid userId, DateTime fromDate)
        {
            return await _playRepository.GetContentPlays()
                .Where(cp => cp.UserId == userId && cp.PlayedAt >= fromDate)
                .OrderByDescending(cp => cp.PlayedAt)
                .ToListAsync();
        }
    }
}
