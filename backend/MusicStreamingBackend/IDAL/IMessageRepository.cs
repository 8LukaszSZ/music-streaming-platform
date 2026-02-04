using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IDAL
{
    public interface IMessageRepository
    {
        IQueryable<Message> GetMessages();
        Task<Message?> GetMessageByIdAsync(Guid messageId);
        Task<Message> AddMessageAsync(Message message);
        Task<Message> UpdateMessageAsync(Message message);
        Task<Message?> DeleteMessageAsync(Guid messageId);
    }
}
