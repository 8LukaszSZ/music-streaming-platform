using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models.Entities
{
    [Table("Users")]
    public class User
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;
        [Required]
        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = string.Empty;
        public byte[]? ProfileImage { get; set; }
        [MaxLength(500)]
        public string? Bio { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<LocalTrack> LocalTracks { get; set; } = new List<LocalTrack>();
        public ICollection<Playlist> Playlists { get; set; } = new List<Playlist>();
        public ICollection<UserFollows> Followers { get; set; } = new List<UserFollows>();
        public ICollection<UserFollows> Following { get; set; } = new List<UserFollows>();
        public ICollection<ContentLike> ContentLikes { get; set; } = new List<ContentLike>();
        public ICollection<ContentShare> ContentSharesSent { get; set; } = new List<ContentShare>();
        public ICollection<ContentShare> ContentSharesReceived { get; set; } = new List<ContentShare>();
        public ICollection<ContentComment> ContentComments { get; set; } = new List<ContentComment>();
        public ICollection<Conversation> ConversationsAsA { get; set; } = new List<Conversation>();
        public ICollection<Conversation> ConversationsAsB { get; set; } = new List<Conversation>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
