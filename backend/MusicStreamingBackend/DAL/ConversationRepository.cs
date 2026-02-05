using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class ConversationRepository : Repository<Conversation>, IConversationRepository
    {
        public ConversationRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<Conversation> GetConversations()
        {
            return GetAll();
        }
    }
}
