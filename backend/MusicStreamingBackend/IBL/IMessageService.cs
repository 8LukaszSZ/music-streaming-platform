using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IBL
{
    public interface IMessageService
    {
        Task<int> GetMessageCountAsync();
        Task<List<Message>> GetAllMessagesAsync();
        Task<List<Message>> GetMessagesByConversationIdAsync(Guid conversationId);

        Task<Message?> GetMessageByIdAsync(Guid messageId);
        Task<Message> SendMessageAsync(Message message);
        Task<Message> UpdateMessageAsync(Message message);
        Task<Message?> DeleteMessageAsync(Guid messageId);

        Task<int> GetUnreadMessageCountAsync(Guid conversationId, Guid userId);
        Task MarkMessagesAsReadAsync(Guid conversationId, Guid userId);
    }
}
