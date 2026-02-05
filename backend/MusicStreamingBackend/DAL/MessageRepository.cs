using DAL.Context;
using IDAL;
using Models.Entities;
using System.Linq;

namespace DAL
{
    public class MessageRepository : Repository<Message>, IMessageRepository
    {
        public MessageRepository(MusicStreamingContext context) : base(context)
        {
        }

        public IQueryable<Message> GetMessages()
        {
            return GetAll();
        }
    }
}
