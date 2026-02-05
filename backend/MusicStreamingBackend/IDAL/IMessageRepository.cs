using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface IMessageRepository : IRepository<Message>
    {
        IQueryable<Message> GetMessages();
    }
}
