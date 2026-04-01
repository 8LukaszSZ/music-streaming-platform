using Microsoft.EntityFrameworkCore;
using Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Context
{
    public class MusicStreamingContext : DbContext
    {
        public MusicStreamingContext(DbContextOptions<MusicStreamingContext> options) : base(options)
        {}
        public DbSet<User> Users => Set<User>();
        public DbSet<LocalTrack> LocalTracks => Set<LocalTrack>();
        public DbSet<Playlist> Playlists => Set<Playlist>();
        public DbSet<PlaylistTrack> PlaylistTracks => Set<PlaylistTrack>();
        public DbSet<UserFollows> UserFollows => Set<UserFollows>();
        public DbSet<ContentLike> ContentLikes => Set<ContentLike>();
        public DbSet<ContentComment> ContentComments => Set<ContentComment>();
        public DbSet<ContentStat> ContentStats => Set<ContentStat>();
        public DbSet<ContentPlay> ContentPlays => Set<ContentPlay>();
        public DbSet<UserActivity> UserActivities => Set<UserActivity>();
        public DbSet<Conversation> Conversations => Set<Conversation>();
        public DbSet<Message> Messages => Set<Message>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigureUser(modelBuilder);
            ConfigureUserFollows(modelBuilder);
            ConfigureContentLike(modelBuilder);
            ConfigureContentComment(modelBuilder);
            ConfigureContentStat(modelBuilder);
            ConfigureContentPlay(modelBuilder);
            ConfigureUserActivity(modelBuilder);
            ConfigureConversation(modelBuilder);
            ConfigureMessage(modelBuilder);
        }

        private static void ConfigureUser(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();
        }

        private static void ConfigureUserFollows(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<UserFollows>()
                .HasIndex(uf => new { uf.FollowerId, uf.FollowingId })
                .IsUnique();

            modelBuilder.Entity<UserFollows>()
                .HasOne(uf => uf.Follower)
                .WithMany(u => u.Following)
                .HasForeignKey(uf => uf.FollowerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserFollows>()
                .HasOne(uf => uf.Following)
                .WithMany(u => u.Followers)
                .HasForeignKey(uf => uf.FollowingId)
                .OnDelete(DeleteBehavior.Restrict);
        }

        private static void ConfigureContentLike(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ContentLike>()
                .HasOne(cl => cl.User)
                .WithMany(u => u.ContentLikes)
                .HasForeignKey(cl => cl.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ContentLike>()
                .HasIndex(cl => new { cl.UserId, cl.ContentId, cl.ContentType })
                .IsUnique();
        }

        private static void ConfigureContentComment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ContentComment>()
                .HasOne(cc => cc.User)
                .WithMany(u => u.ContentComments)
                .HasForeignKey(cc => cc.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ContentComment>()
                .HasOne(cc => cc.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(cc => cc.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);
        }

        private static void ConfigureContentStat(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ContentStat>()
                .HasIndex(cs => new { cs.ContentId, cs.ContentType })
                .IsUnique();
        }

        private static void ConfigureContentPlay(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ContentPlay>()
                .HasOne(cp => cp.User)
                .WithMany()
                .HasForeignKey(cp => cp.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ContentPlay>()
                .HasIndex(cp => new { cp.ContentId, cp.PlayedAt });

            modelBuilder.Entity<ContentPlay>()
                .HasIndex(cp => cp.UserId)
                .HasFilter("\"UserId\" IS NOT NULL");
        }

        private static void ConfigureUserActivity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<UserActivity>()
                .HasOne(ua => ua.User)
                .WithMany(u => u.UserActivities)
                .HasForeignKey(ua => ua.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserActivity>()
                .HasIndex(ua => new { ua.UserId, ua.CreatedAt });

            modelBuilder.Entity<UserActivity>()
                .HasIndex(ua => new { ua.ContentId, ua.ContentType });
        }

        private static void ConfigureConversation(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Conversation>()
                .HasOne(c => c.ParticipantA)
                .WithMany(u => u.ConversationsAsA)
                .HasForeignKey(c => c.ParticipantAId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Conversation>()
                .HasOne(c => c.ParticipantB)
                .WithMany(u => u.ConversationsAsB)
                .HasForeignKey(c => c.ParticipantBId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Conversation>()
                .HasIndex(c => new { c.ParticipantAId, c.ParticipantBId })
                .IsUnique();
        }

        private static void ConfigureMessage(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany(u => u.Messages)
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
