using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Models.DTOs.Conversation;
using Models.Entities;
using MusicStreaming.API.Extensions;
using MusicStreaming.API.Hubs;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ConversationController : ControllerBase
    {
        private readonly IConversationService _conversationService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IMessageService _messageService;

        public ConversationController(IConversationService conversationService, IHubContext<ChatHub> hubContext, IMessageService messageService)
        {
            _conversationService = conversationService;
            _hubContext = hubContext;
            _messageService = messageService;
        }

        // GET: api/conversation
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Conversation>>> GetMyConversations()
        {
            var userId = User.GetUserId();

            var conversations = await _conversationService.GetUserConversationsAsync(userId);

            var result = new List<ConversationDto>();
            foreach (var c in conversations)
            {
                var unreadCount = await _messageService.GetUnreadMessageCountAsync(c.Id, userId);
                result.Add(new ConversationDto
                {
                    Id = c.Id,
                    ParticipantAId = c.ParticipantAId,
                    ParticipantBId = c.ParticipantBId,
                    ParticipantAUsername = c.ParticipantA.DisplayUsername(),
                    ParticipantBUsername = c.ParticipantB.DisplayUsername(),
                    CreatedAt = c.CreatedAt,
                    UnreadCount = unreadCount
                });
            }

            return Ok(result);
        }

        // GET: api/conversation/{id}
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<Conversation>> GetById(Guid id)
        {
            var userId = User.GetUserId();

            var participates = await _conversationService
                .UserParticipatesInConversationAsync(userId, id);

            if (!participates)
                return Forbid();

            var conversation = await _conversationService.GetConversationByIdAsync(id);

            if (conversation == null)
                return NotFound();

            var unreadCount = await _messageService.GetUnreadMessageCountAsync(id, userId);

            var dto = new ConversationDto
            {
                Id = conversation.Id,
                ParticipantAId = conversation.ParticipantAId,
                ParticipantBId = conversation.ParticipantBId,
                ParticipantAUsername = conversation.ParticipantA.DisplayUsername(),
                ParticipantBUsername = conversation.ParticipantB.DisplayUsername(),
                CreatedAt = conversation.CreatedAt,
                UnreadCount = unreadCount
            };

            return Ok(dto);
        }

        // POST: api/conversation
        [HttpPost]
        public async Task<ActionResult<Conversation>> Create([FromBody] Guid otherUserId)
        {
            var userId = User.GetUserId();
            var conversation = await _conversationService
                .CreateConversationAsync(userId, otherUserId);

            var fullConversation = await _conversationService
                .GetConversationByIdAsync(conversation.Id);

            var unreadCount = await _messageService.GetUnreadMessageCountAsync(fullConversation.Id, userId);

            var dto = new ConversationDto
            {
                Id = fullConversation.Id,
                ParticipantAId = fullConversation.ParticipantAId,
                ParticipantBId = fullConversation.ParticipantBId,
                ParticipantAUsername = fullConversation.ParticipantA.DisplayUsername(),
                ParticipantBUsername = fullConversation.ParticipantB.DisplayUsername(),
                CreatedAt = fullConversation.CreatedAt,
                UnreadCount = unreadCount
            };

            return Ok(dto);
        }

        // DELETE: api/conversation/{id}
        [HttpDelete("{id:guid}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            var userId = User.GetUserId();

            var participates = await _conversationService
                .UserParticipatesInConversationAsync(userId, id);

            if (!participates)
                return Forbid();

            var conversation = await _conversationService.GetConversationByIdAsync(id);
            if (conversation == null)
                return NotFound();

            var otherUserId = conversation.ParticipantAId == userId ? conversation.ParticipantBId : conversation.ParticipantAId;

            var deleted = await _conversationService.DeleteConversationAsync(id);

            if (deleted == null)
                return NotFound();

            await _hubContext.Clients.Group($"user:{otherUserId}")
                .SendAsync("ConversationDeleted", id);

            return NoContent();
        }
    }
}
