using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IConversationRepository
    {
        IQueryable<Conversation> GetConversations();
        Task<Conversation?> GetConversationByIdAsync(Guid conversationId);
        Task<Conversation> AddConversationAsync(Conversation conversation);
        Task<Conversation> UpdateConversationAsync(Conversation conversation);
        Task<Conversation?> DeleteConversationAsync(Guid conversationId);
    }
}
