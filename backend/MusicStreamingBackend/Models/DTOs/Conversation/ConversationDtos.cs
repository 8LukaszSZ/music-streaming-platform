using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models.DTOs.Conversation
{
    public class ConversationDto
    {
        public Guid Id { get; set; }
        public Guid ParticipantAId { get; set; }
        public Guid ParticipantBId { get; set; }

        public string ParticipantAUsername { get; set; } = string.Empty;
        public string ParticipantBUsername { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public int UnreadCount { get; set; }
    }
}
