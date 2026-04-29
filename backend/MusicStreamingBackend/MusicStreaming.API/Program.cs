using DAL;
using DAL.Context;
using BL.Options;
using BL.Services;
using IBL;
using IDAL;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Models.Entities;
using System.Text;
using Microsoft.OpenApi.Models;
using MusicStreaming.API.Hubs;
using MusicStreaming.API.Middleware;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

const long maxUploadBodyBytes = 110L * 1024 * 1024;
builder.Services.Configure<KestrelServerOptions>(o => o.Limits.MaxRequestBodySize = maxUploadBodyBytes);
builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = maxUploadBodyBytes;
    o.ValueLengthLimit = int.MaxValue;
});
builder.Services.Configure<IISServerOptions>(o => o.MaxRequestBodySize = maxUploadBodyBytes);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddDbContext<MusicStreamingContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        x => x.MigrationsAssembly("DAL")));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ILocalTrackRepository, LocalTrackRepository>();
builder.Services.AddScoped<IPlaylistRepository, PlaylistRepository>();
builder.Services.AddScoped<IPlaylistTrackRepository, PlaylistTrackRepository>();
builder.Services.AddScoped<IUserFollowsRepository, UserFollowsRepository>();
builder.Services.AddScoped<IContentLikeRepository, ContentLikeRepository>();
builder.Services.AddScoped<IContentCommentRepository, ContentCommentRepository>();
builder.Services.AddScoped<IContentStatRepository, ContentStatRepository>();
builder.Services.AddScoped<IContentPlayRepository, ContentPlayRepository>();
builder.Services.AddScoped<IUserActivityRepository, UserActivityRepository>();
builder.Services.AddScoped<IConversationRepository, ConversationRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();

builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ILocalTrackService, LocalTrackService>();
builder.Services.AddScoped<IPlaylistService, PlaylistService>();
builder.Services.AddScoped<IPlaylistTrackService, PlaylistTrackService>();
builder.Services.AddScoped<IUserFollowsService, UserFollowsService>();
builder.Services.AddScoped<IContentLikeService, ContentLikeService>();
builder.Services.AddScoped<IContentCommentService, ContentCommentService>();
builder.Services.AddScoped<IContentStatService, ContentStatService>();
builder.Services.AddScoped<IContentPlayService, ContentPlayService>();
builder.Services.AddScoped<IUserActivityService, UserActivityService>();
builder.Services.AddScoped<IConversationService, ConversationService>();
builder.Services.AddScoped<IMessageService, MessageService>();

builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IAuthTokenService, AuthTokenService>();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtOptions = jwtSection.Get<JwtOptions>();

if (jwtOptions == null || string.IsNullOrWhiteSpace(jwtOptions.Secret))
{
    throw new InvalidOperationException("JWT Secret is not configured.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtOptions.Issuer,
        ValidAudience = jwtOptions.Audience,
        IssuerSigningKey = signingKey,
        RoleClaimType = System.Security.Claims.ClaimTypes.Role
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            var pathValue = path.Value ?? string.Empty;

            if (string.IsNullOrEmpty(accessToken))
                return Task.CompletedTask;

            // SignalR
            if (path.StartsWithSegments("/hubs/chat"))
            {
                context.Token = accessToken;
                return Task.CompletedTask;
            }

            // <audio src> nie wysyła nagłówka Authorization — token w query dla odtwarzania (np. prywatne utwory).
            if (pathValue.Contains("/localtracks/", StringComparison.OrdinalIgnoreCase)
                && pathValue.EndsWith("/stream", StringComparison.OrdinalIgnoreCase))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

var origins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>();

if (origins == null || origins.Length == 0)
{
    throw new Exception("No CORS configuration in appsettings.json");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(origins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Music Streaming API",
        Version = "v1"
    });

    // JWT Bearer auth in Swagger
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {token}"
    };

    c.AddSecurityDefinition("Bearer", securityScheme);

    var securityRequirement = new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    };

    c.AddSecurityRequirement(securityRequirement);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(builder.Environment.ContentRootPath, "UploadedImagesUser")),
    RequestPath = "/UploadedImagesUser"
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(builder.Environment.ContentRootPath, "UploadedImagesTracks")),
    RequestPath = "/UploadedImagesTracks"
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(builder.Environment.ContentRootPath, "UploadedImagesPlaylist")),
    RequestPath = "/UploadedImagesPlaylist"
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(builder.Environment.ContentRootPath, "UploadedMusic")),
    RequestPath = "/UploadedMusic"
});
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
