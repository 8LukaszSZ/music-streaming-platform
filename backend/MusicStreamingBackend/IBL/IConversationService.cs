using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IBL
{
    public interface IConversationService
    {
        Task<int> GetConversationCountAsync();
        Task<List<Conversation>> GetAllConversationsAsync();
        Task<List<Conversation>> GetUserConversationsAsync(Guid userId);

        Task<Conversation?> GetConversationByIdAsync(Guid conversationId);
        Task<Conversation?> GetConversationBetweenUsersAsync(Guid userAId, Guid userBId);

        Task<Conversation> CreateConversationAsync(Guid userAId, Guid userBId);
        Task<Conversation?> DeleteConversationAsync(Guid conversationId);

        Task<bool> UserParticipatesInConversationAsync(Guid userId, Guid conversationId);
    }
}
