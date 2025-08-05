using Microsoft.EntityFrameworkCore;
using URLService.Data;
using URLService.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using StackExchange.Redis;
using Shared.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<URLServiceDbContext>(options =>
{
    options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sqlOptions => sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 10,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null)
    );
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(80);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();

var jwtKey = "YourSuperSecretKeyThatIsLongerThan32Chars";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key
        };
    });

// Add Redis
builder.Services.AddSingleton<IConnectionMultiplexer>(
    ConnectionMultiplexer.Connect("redis:6379"));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseCors("AllowAll");
app.UseAuthorization();

// Persistent storage for logged-in users
var urlMappings = new List<UrlMapping>();

// Temporary storage for anonymous users (in-memory, cleared when service restarts)
var temporaryUrls = new Dictionary<string, TemporaryUrl>();

// Single endpoint for both anonymous and authenticated users
app.MapPost("/shorten", async (HttpContext context, ShortenUrlRequest request) =>
{
    // Validate URL
    if (string.IsNullOrEmpty(request.OriginalUrl))
    {
        return Results.BadRequest(new { Message = "Original URL is required" });
    }

    // Try to get user ID (will be 0 for anonymous users)
    var userIdClaim = context.User.FindFirst("UserId")?.Value;
    var userId = string.IsNullOrEmpty(userIdClaim) ? 0 : int.Parse(userIdClaim);

    var shortCode = GenerateShortCode();

    if (userId > 0)
    {
        // Authenticated user - save permanently
        var mapping = new UrlMapping
        {
            Id = urlMappings.Count + 1,
            ShortCode = shortCode,
            OriginalUrl = request.OriginalUrl,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            CustomName = request.CustomName ?? "",
            Description = request.Description ?? ""
        };
        urlMappings.Add(mapping);

        // Cache in Redis
        var redis = app.Services.GetRequiredService<IConnectionMultiplexer>();
        var db = redis.GetDatabase();
        await db.StringSetAsync($"url:{shortCode}", request.OriginalUrl, TimeSpan.FromHours(24));

        var shortUrl = $"http://localhost:8000/{shortCode}";
        var qrUrl = $"http://localhost:8000/api/qr/{shortCode}";

        return Results.Ok(new
        {
            ShortUrl = shortUrl,
            ShortCode = shortCode,
            QrCodeUrl = qrUrl,
            CustomName = request.CustomName,
            Description = request.Description,
            Saved = true,
            Message = "URL saved to your account"
        });
    }
    else
    {
        // Anonymous user - temporary storage
        var tempUrl = new TemporaryUrl
        {
            ShortCode = shortCode,
            OriginalUrl = request.OriginalUrl,
            CreatedAt = DateTime.UtcNow,
            CustomName = request.CustomName ?? "",
            Description = request.Description ?? ""
        };
        temporaryUrls[shortCode] = tempUrl;

        // Cache in Redis (shorter expiration for temporary URLs)
        var redis = app.Services.GetRequiredService<IConnectionMultiplexer>();
        var db = redis.GetDatabase();
        await db.StringSetAsync($"temp_url:{shortCode}", request.OriginalUrl, TimeSpan.FromHours(1));

        var shortUrl = $"http://localhost:8000/{shortCode}";

        return Results.Ok(new
        {
            ShortUrl = shortUrl,
            ShortCode = shortCode,
            CustomName = request.CustomName,
            Description = request.Description,
            Saved = false,
            Message = "URL is temporary and will be deleted when service restarts"
        });
    }
});

// Redirect endpoint (works for both temporary and permanent URLs)
app.MapGet("/{shortCode}", async (string shortCode) =>
{
    // Try Redis cache first (both temporary and permanent)
    var redis = app.Services.GetRequiredService<IConnectionMultiplexer>();
    var db = redis.GetDatabase();

    // Check permanent URLs first
    var cachedUrl = await db.StringGetAsync($"url:{shortCode}");
    if (!cachedUrl.IsNullOrEmpty)
    {
        return Results.Redirect(cachedUrl);
    }

    // Check temporary URLs
    var tempCachedUrl = await db.StringGetAsync($"temp_url:{shortCode}");
    if (!tempCachedUrl.IsNullOrEmpty)
    {
        return Results.Redirect(tempCachedUrl);
    }

    // Check in-memory storage (fallback)
    if (temporaryUrls.TryGetValue(shortCode, out var tempUrl))
    {
        return Results.Redirect(tempUrl.OriginalUrl);
    }

    // Check permanent storage
    var mapping = urlMappings.FirstOrDefault(u => u.ShortCode == shortCode);
    if (mapping != null)
    {
        // Cache it for next time
        await db.StringSetAsync($"url:{shortCode}", mapping.OriginalUrl, TimeSpan.FromHours(24));
        return Results.Redirect(mapping.OriginalUrl);
    }

    return Results.NotFound();
});

// Endpoint for logged-in users to view their saved URLs
app.MapGet("/my-urls", (HttpContext context) =>
{
    var userIdClaim = context.User.FindFirst("UserId")?.Value;
    var userId = string.IsNullOrEmpty(userIdClaim) ? 0 : int.Parse(userIdClaim);

    if (userId == 0) return Results.Unauthorized();

    var userUrls = urlMappings.Where(u => u.UserId == userId).ToList();
    return Results.Ok(userUrls);
})
.RequireAuthorization();

// Endpoint for logged-in users to delete their saved URLs
app.MapDelete("/delete/{shortCode}", (HttpContext context, string shortCode) =>
{
    var userIdClaim = context.User.FindFirst("UserId")?.Value;
    var userId = string.IsNullOrEmpty(userIdClaim) ? 0 : int.Parse(userIdClaim);

    if (userId == 0) return Results.Unauthorized();

    // Find the URL mapping
    var urlMapping = urlMappings.FirstOrDefault(u => u.ShortCode == shortCode && u.UserId == userId);

    if (urlMapping == null)
    {
        return Results.NotFound(new { Message = "URL not found or you don't have permission to delete it" });
    }

    // Remove from in-memory storage
    urlMappings.Remove(urlMapping);

    // Remove from Redis cache
    var redis = app.Services.GetRequiredService<IConnectionMultiplexer>();
    var db = redis.GetDatabase();
    db.KeyDelete($"url:{shortCode}");

    return Results.Ok(new { Message = "URL deleted successfully" });
})
.RequireAuthorization();

// Endpoint for logged-in users to update their saved URLs
app.MapPut("/update/{shortCode}", (HttpContext context, string shortCode, ShortenUrlRequest request) =>
{
    var userIdClaim = context.User.FindFirst("UserId")?.Value;
    var userId = string.IsNullOrEmpty(userIdClaim) ? 0 : int.Parse(userIdClaim);

    if (userId == 0) return Results.Unauthorized();

    // Find the URL mapping
    var urlMapping = urlMappings.FirstOrDefault(u => u.ShortCode == shortCode && u.UserId == userId);

    if (urlMapping == null)
    {
        return Results.NotFound(new { Message = "URL not found or you don't have permission to update it" });
    }

    // Update the URL information
    urlMapping.OriginalUrl = request.OriginalUrl ?? urlMapping.OriginalUrl;
    urlMapping.CustomName = request.CustomName ?? urlMapping.CustomName;
    urlMapping.Description = request.Description ?? urlMapping.Description;

    // Update Redis cache
    var redis = app.Services.GetRequiredService<IConnectionMultiplexer>();
    var db = redis.GetDatabase();
    if (!string.IsNullOrEmpty(request.OriginalUrl))
    {
        db.StringSet($"url:{shortCode}", request.OriginalUrl, TimeSpan.FromHours(24));
    }

    return Results.Ok(new
    {
        Message = "URL updated successfully",
        UrlMapping = urlMapping
    });
})
.RequireAuthorization();

string GenerateShortCode()
{
    const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var random = new Random();
    return new string(Enumerable.Repeat(chars, 6)
        .Select(s => s[random.Next(s.Length)]).ToArray());
}

app.Run();