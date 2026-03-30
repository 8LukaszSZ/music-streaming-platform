using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Models.Constants;

namespace Models.DTOs.Message
{
    public class MessageDto
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Guid SenderId { get; set; }

        public string SenderUsername { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public Guid? SharedContentId { get; set; }
        public string? SharedContentType { get; set; }

        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
    }

    public class SendMessageDto
    {
        public Guid ConversationId { get; set; }
        public string Content { get; set; } = string.Empty;
        public Guid? SharedContentId { get; set; }
        public ContentType? SharedContentType { get; set; }
    }
}
