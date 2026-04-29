using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Models.DTOs.Message;
using Models.Entities;
using MusicStreaming.API.Extensions;

namespace MusicStreaming.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IMessageService _messageService;
        private readonly IConversationService _conversationService;

        public ChatHub(IMessageService messageService, IConversationService conversationService)
        {
            _messageService = messageService;
            _conversationService = conversationService;
        }

        private static string ConversationGroup(Guid conversationId) => $"conv:{conversationId}";
        private static string UserGroup(Guid userId) => $"user:{userId}";

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User!.GetUserId();
            await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Context.User != null)
            {
                var userId = Context.User.GetUserId();
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, UserGroup(userId));
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinConversation(Guid conversationId)
        {
            var userId = Context.User!.GetUserId();

            var participates = await _conversationService.UserParticipatesInConversationAsync(userId, conversationId);
            if (!participates)
                throw new HubException("Forbidden");

            await Groups.AddToGroupAsync(Context.ConnectionId, ConversationGroup(conversationId));
        }

        public async Task LeaveConversation(Guid conversationId)
        {
            var userId = Context.User!.GetUserId();

            var participates = await _conversationService.UserParticipatesInConversationAsync(userId, conversationId);
            if (!participates)
                throw new HubException("Forbidden");

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, ConversationGroup(conversationId));
        }

        public async Task<MessageDto> SendMessage(SendMessageDto dto)
        {
            var userId = Context.User!.GetUserId();

            var participates = await _conversationService.UserParticipatesInConversationAsync(userId, dto.ConversationId);
            if (!participates)
                throw new HubException("Forbidden");

            var message = new Message
            {
                ConversationId = dto.ConversationId,
                SenderId = userId,
                Content = dto.Content,
                SharedContentId = dto.SharedContentId,
                SharedContentType = dto.SharedContentType?.ToString()
            };

            Message saved;
            try
            {
                saved = await _messageService.SendMessageAsync(message);
            }
            catch (InvalidOperationException ex)
            {
                throw new HubException(ex.Message);
            }

            var full = await _messageService.GetMessageByIdAsync(saved.Id);
            if (full == null)
                throw new HubException("Message not found after save.");

            var dtoResult = new MessageDto
            {
                Id = full.Id,
                ConversationId = full.ConversationId,
                SenderId = full.SenderId,
                SenderUsername = full.Sender.Username,
                Content = full.Content,
                SharedContentId = full.SharedContentId,
                SharedContentType = full.SharedContentType,
                SentAt = full.SentAt,
                IsRead = full.IsRead
            };

            await Clients.Group(ConversationGroup(dto.ConversationId))
                .SendAsync("MessageReceived", dtoResult);

            var conversation = await _conversationService.GetConversationByIdAsync(dto.ConversationId);
            if (conversation != null)
            {
                var otherUserId = conversation.ParticipantAId == userId ? conversation.ParticipantBId : conversation.ParticipantAId;
                await Clients.Group(UserGroup(otherUserId))
                    .SendAsync("NewMessageNotification", dtoResult);
            }

            return dtoResult;
        }

        public async Task MarkConversationAsRead(Guid conversationId)
        {
            var userId = Context.User!.GetUserId();

            var participates = await _conversationService.UserParticipatesInConversationAsync(userId, conversationId);
            if (!participates)
                throw new HubException("Forbidden");

            var conversation = await _conversationService.GetConversationByIdAsync(conversationId);
            if (conversation == null)
                throw new HubException("Conversation not found");

            var otherUserId = conversation.ParticipantAId == userId ? conversation.ParticipantBId : conversation.ParticipantAId;

            await _messageService.MarkMessagesAsReadAsync(conversationId, userId);
            var lastReadAt = DateTime.UtcNow;

            await Clients.Group(UserGroup(otherUserId))
                .SendAsync("MessagesRead", new { conversationId, readerId = userId, lastReadAt });
        }
    }
}

