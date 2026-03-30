using IBL;
using IDAL;
using Microsoft.EntityFrameworkCore;
using Models.Constants;
using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BL.Services
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IConversationRepository _conversationRepository;

        public MessageService(IMessageRepository messageRepository, IConversationRepository conversationRepository)
        {
            _messageRepository = messageRepository;
            _conversationRepository = conversationRepository;
        }

        public Task<int> GetMessageCountAsync()
        {
            return _messageRepository.GetMessages().CountAsync();
        }

        public async Task<List<Message>> GetAllMessagesAsync()
        {
            return await _messageRepository.GetMessages()
                .OrderByDescending(m => m.SentAt)
                .Include(m => m.Sender)
                .Include(m => m.Conversation)
                .ToListAsync();
        }

        public async Task<List<Message>> GetMessagesByConversationIdAsync(Guid conversationId)
        {
            return await _messageRepository.GetMessages()
                .Where(m => m.ConversationId == conversationId)
                .OrderBy(m => m.SentAt)
                .Include(m => m.Sender)
                .ToListAsync();
        }

        public async Task<Message?> GetMessageByIdAsync(Guid messageId)
        {
            return await _messageRepository.GetMessages()
                .Include(m => m.Sender)
                .Include(m => m.Conversation)
                .FirstOrDefaultAsync(m => m.Id == messageId);
        }

        public async Task<Message> SendMessageAsync(Message message)
        {
            var conversation = await _conversationRepository.GetByIdAsync(message.ConversationId);
            if (conversation == null)
                throw new InvalidOperationException("Conversation not found.");

            if (message.SenderId != conversation.ParticipantAId && message.SenderId != conversation.ParticipantBId)
                throw new InvalidOperationException("Sender is not a participant of this conversation.");

            if (!string.IsNullOrWhiteSpace(message.SharedContentType))
            {
                var normalizedType = message.SharedContentType.Trim().ToUpperInvariant();
                if (normalizedType != nameof(ContentType.TRACK) && normalizedType != nameof(ContentType.PLAYLIST))
                    throw new InvalidOperationException("SharedContentType must be TRACK or PLAYLIST.");

                if (!message.SharedContentId.HasValue)
                    throw new InvalidOperationException("SharedContentId is required when SharedContentType is provided.");

                message.SharedContentType = normalizedType;
            }
            else if (message.SharedContentId.HasValue)
            {
                throw new InvalidOperationException("SharedContentType is required when SharedContentId is provided.");
            }

            if (message.Id == Guid.Empty)
                message.Id = Guid.NewGuid();

            message.SentAt = DateTime.UtcNow;
            message.IsRead = false;

            return await _messageRepository.AddAsync(message);
        }

        public async Task<Message> UpdateMessageAsync(Message message)
        {
            return await _messageRepository.UpdateAsync(message);
        }

        public async Task<Message?> DeleteMessageAsync(Guid messageId)
        {
            return await _messageRepository.DeleteAsync(messageId);
        }

        public Task<int> GetUnreadMessageCountAsync(Guid conversationId, Guid userId)
        {
            return _messageRepository.GetMessages()
                .CountAsync(m => m.ConversationId == conversationId && m.SenderId != userId && !m.IsRead);
        }

        public async Task MarkMessagesAsReadAsync(Guid conversationId, Guid userId)
        {
            var messages = await _messageRepository.GetMessages()
                .Where(m => m.ConversationId == conversationId && m.SenderId != userId && !m.IsRead)
                .ToListAsync();

            foreach (var message in messages)
            {
                message.IsRead = true;
                await _messageRepository.UpdateAsync(message);
            }
        }
    }
}
