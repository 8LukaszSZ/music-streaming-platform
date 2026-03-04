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
    public class ContentShareService : IContentShareService
    {
        private readonly IContentShareRepository _shareRepository;
        private readonly IUserRepository _userRepository;

        public ContentShareService(IContentShareRepository shareRepository, IUserRepository userRepository)
        {
            _shareRepository = shareRepository;
            _userRepository = userRepository;
        }

        public async Task<List<ContentShare>> GetSharesSentByUserAsync(Guid userId)
        {
            return await _shareRepository.GetContentShares()
                .Where(cs => cs.SharerId == userId)
                .OrderByDescending(cs => cs.CreatedAt)
                .Include(cs => cs.SharedToUser)
                .ToListAsync();
        }

        public async Task<List<ContentShare>> GetSharesReceivedByUserAsync(Guid userId)
        {
            return await _shareRepository.GetContentShares()
                .Where(cs => cs.SharedToUserId == userId)
                .OrderByDescending(cs => cs.CreatedAt)
                .Include(cs => cs.Sharer)
                .ToListAsync();
        }

        public async Task<ContentShare> ShareContentAsync(
            Guid sharerId,
            Guid sharedToUserId,
            Guid contentId,
            string contentType,
            string? message)
        {
            var sharer = await _userRepository.GetByIdAsync(sharerId);
            if (sharer == null)
                throw new InvalidOperationException("Sharer not found.");

            var sharedToUser = await _userRepository.GetByIdAsync(sharedToUserId);
            if (sharedToUser == null)
                throw new InvalidOperationException("Target user not found.");

            var share = new ContentShare
            {
                Id = Guid.NewGuid(),
                SharerId = sharerId,
                SharedToUserId = sharedToUserId,
                ContentId = contentId,
                ContentType = contentType,
                Message = message,
                CreatedAt = DateTime.UtcNow
            };

            return await _shareRepository.AddAsync(share);
        }

        public async Task<ContentShare?> DeleteShareAsync(Guid contentShareId)
        {
            return await _shareRepository.DeleteAsync(contentShareId);
        }
    }
}
