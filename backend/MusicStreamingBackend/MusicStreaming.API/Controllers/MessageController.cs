using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs.Message;
using Models.Entities;
using MusicStreaming.API.Extensions;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IConversationService _conversationService;

        public MessageController(
            IMessageService messageService,
            IConversationService conversationService)
        {
            _messageService = messageService;
            _conversationService = conversationService;
        }

        // GET: api/message/conversation/{conversationId}
        [HttpGet("conversation/{conversationId:guid}")]
        public async Task<ActionResult<IEnumerable<Message>>> GetMessages(Guid conversationId)
        {
            var userId = User.GetUserId();

            var participates = await _conversationService
                .UserParticipatesInConversationAsync(userId, conversationId);

            if (!participates)
                return Forbid();

            var messages = await _messageService
                .GetMessagesByConversationIdAsync(conversationId);

            var result = messages.Select(m => new MessageDto
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderUsername = m.Sender.DisplayUsername(),
                Content = m.Content,
                SharedContentId = m.SharedContentId,
                SharedContentType = m.SharedContentType,
                SentAt = m.SentAt,
                IsRead = m.IsRead
            });

            return Ok(result);
        }

        // POST: api/message
        [HttpPost]
        public async Task<ActionResult<Message>> Send([FromBody] SendMessageDto dto)
        {
            var userId = User.GetUserId();

            var participates = await _conversationService
                .UserParticipatesInConversationAsync(userId, dto.ConversationId);

            if (!participates)
                return Forbid();

            var message = new Message
            {
                ConversationId = dto.ConversationId,
                SenderId = userId,
                Content = dto.Content,
                SharedContentId = dto.SharedContentId,
                SharedContentType = dto.SharedContentType?.ToString()
            };
            var saved = await _messageService.SendMessageAsync(message);

            var fullMessage = await _messageService.GetMessageByIdAsync(saved.Id);
            if (fullMessage == null)
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Message not found after save." });

            var dtoResult = new MessageDto
            {
                Id = fullMessage.Id,
                ConversationId = fullMessage.ConversationId,
                SenderId = fullMessage.SenderId,
                SenderUsername = fullMessage.Sender.DisplayUsername(),
                Content = fullMessage.Content,
                SharedContentId = fullMessage.SharedContentId,
                SharedContentType = fullMessage.SharedContentType,
                SentAt = fullMessage.SentAt,
                IsRead = fullMessage.IsRead
            };

            return Ok(dtoResult);
        }

        // PUT: api/message/{conversationId}/read
        [HttpPut("{conversationId:guid}/read")]
        public async Task<ActionResult> MarkAsRead(Guid conversationId)
        {
            var userId = User.GetUserId();

            var participates = await _conversationService
                .UserParticipatesInConversationAsync(userId, conversationId);

            if (!participates)
                return Forbid();

            await _messageService.MarkMessagesAsReadAsync(conversationId, userId);

            return NoContent();
        }

        // GET: api/message/unread-count
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            var userId = User.GetUserId();

            var conversations = await _conversationService.GetUserConversationsAsync(userId);
            int totalUnread = 0;

            foreach (var conversation in conversations)
            {
                totalUnread += await _messageService.GetUnreadMessageCountAsync(conversation.Id, userId);
            }

            return Ok(totalUnread);
        }
    }
}
