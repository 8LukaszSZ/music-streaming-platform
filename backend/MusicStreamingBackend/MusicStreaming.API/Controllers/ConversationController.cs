using IBL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.DTOs.Conversation;
using Models.Entities;
using MusicStreaming.API.Extensions;

namespace MusicStreaming.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ConversationController : ControllerBase
    {
        private readonly IConversationService _conversationService;

        public ConversationController(IConversationService conversationService)
        {
            _conversationService = conversationService;
        }

        // GET: api/conversation
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Conversation>>> GetMyConversations()
        {
            var userId = User.GetUserId();

            var conversations = await _conversationService.GetUserConversationsAsync(userId);

            var result = conversations.Select(c => new ConversationDto
            {
                Id = c.Id,
                ParticipantAId = c.ParticipantAId,
                ParticipantBId = c.ParticipantBId,
                ParticipantAUsername = c.ParticipantA.DisplayUsername(),
                ParticipantBUsername = c.ParticipantB.DisplayUsername(),
                CreatedAt = c.CreatedAt
            });

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

            var dto = new ConversationDto
            {
                Id = conversation.Id,
                ParticipantAId = conversation.ParticipantAId,
                ParticipantBId = conversation.ParticipantBId,
                ParticipantAUsername = conversation.ParticipantA.DisplayUsername(),
                ParticipantBUsername = conversation.ParticipantB.DisplayUsername(),
                CreatedAt = conversation.CreatedAt
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

            var dto = new ConversationDto
            {
                Id = fullConversation.Id,
                ParticipantAId = fullConversation.ParticipantAId,
                ParticipantBId = fullConversation.ParticipantBId,
                ParticipantAUsername = fullConversation.ParticipantA.DisplayUsername(),
                ParticipantBUsername = fullConversation.ParticipantB.DisplayUsername(),
                CreatedAt = fullConversation.CreatedAt
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

            var deleted = await _conversationService.DeleteConversationAsync(id);

            if (deleted == null)
                return NotFound();

            return NoContent();
        }
    }
}
