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
    public class ConversationService : IConversationService
    {
        private readonly IConversationRepository _conversationRepository;
        private readonly IUserRepository _userRepository;

        public ConversationService(IConversationRepository conversationRepository, IUserRepository userRepository)
        {
            _conversationRepository = conversationRepository;
            _userRepository = userRepository;
        }

        public Task<int> GetConversationCountAsync()
        {
            return _conversationRepository.GetConversations().CountAsync();
        }

        public async Task<List<Conversation>> GetAllConversationsAsync()
        {
            return await _conversationRepository.GetConversations()
                .Include(c => c.ParticipantA)
                .Include(c => c.ParticipantB)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Conversation>> GetUserConversationsAsync(Guid userId)
        {
            return await _conversationRepository.GetConversations()
                .Where(c => c.ParticipantAId == userId || c.ParticipantBId == userId)
                .Include(c => c.ParticipantA)
                .Include(c => c.ParticipantB)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Conversation?> GetConversationByIdAsync(Guid conversationId)
        {
            return await _conversationRepository.GetConversations()
                .Include(c => c.ParticipantA)
                .Include(c => c.ParticipantB)
                .FirstOrDefaultAsync(c => c.Id == conversationId);
        }

        public async Task<Conversation?> GetConversationBetweenUsersAsync(Guid userAId, Guid userBId)
        {
            return await _conversationRepository.GetConversations()
                .FirstOrDefaultAsync(c =>
                    (c.ParticipantAId == userAId && c.ParticipantBId == userBId) ||
                    (c.ParticipantAId == userBId && c.ParticipantBId == userAId));
        }

        public async Task<Conversation> CreateConversationAsync(Guid userAId, Guid userBId)
        {
            if (userAId == userBId)
                throw new InvalidOperationException("Cannot create conversation with yourself.");

            var userA = await _userRepository.GetByIdAsync(userAId);
            var userB = await _userRepository.GetByIdAsync(userBId);
            if (userA == null || userB == null)
                throw new InvalidOperationException("User(s) not found.");

            var existing = await GetConversationBetweenUsersAsync(userAId, userBId);
            if (existing != null)
                return existing;

            var conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                ParticipantAId = userAId,
                ParticipantBId = userBId,
                CreatedAt = DateTime.UtcNow
            };

            return await _conversationRepository.AddAsync(conversation);
        }

        public async Task<Conversation?> DeleteConversationAsync(Guid conversationId)
        {
            return await _conversationRepository.DeleteAsync(conversationId);
        }

        public async Task<bool> UserParticipatesInConversationAsync(Guid userId, Guid conversationId)
        {
            var conversation = await _conversationRepository.GetByIdAsync(conversationId);
            if (conversation == null)
                return false;

            return conversation.ParticipantAId == userId || conversation.ParticipantBId == userId;
        }
    }
}
