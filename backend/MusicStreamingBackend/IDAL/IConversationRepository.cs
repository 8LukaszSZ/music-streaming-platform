using Models.Entities;
using System.Linq;

namespace IDAL
{
    public interface IConversationRepository : IRepository<Conversation>
    {
        IQueryable<Conversation> GetConversations();
    }
}
