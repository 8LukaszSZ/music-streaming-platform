using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models.Entities
{
    [Table("UserFollows")]
    public class UserFollows
    {
        [Required]
        public Guid FollowerId { get; set; }
        [Required]
        public Guid FollowingId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User Follower { get; set; } = null!;
        public User Following { get; set; } = null!;
    }
}
