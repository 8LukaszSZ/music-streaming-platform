using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models.Entities
{
    [Table("Conversations")]
    public class Conversation
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public Guid ParticipantAId { get; set; }
        [Required]
        public Guid ParticipantBId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User ParticipantA { get; set; } = null!;
        public User ParticipantB { get; set; } = null!;

        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
