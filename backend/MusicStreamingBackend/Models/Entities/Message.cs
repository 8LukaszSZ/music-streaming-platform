using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models.Entities
{
    [Table("Messages")]
    public class Message
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid ConversationId { get; set; }
        [Required]
        public Guid SenderId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;

        public Conversation Conversation { get; set; } = null!;
        public User Sender { get; set; } = null!;
    }
}
