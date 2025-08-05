using AuthService.Data;
using AuthService.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Shared.Models;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AuthServiceDbContext>(options =>
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

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// In-memory user store
var users = new List<Shared.Models.User>
{
    new Shared.Models.User { Id = 1, Username = "admin", PasswordHash = BCrypt.Net.BCrypt.HashPassword("password") }
};

app.MapPost("/login", (Shared.Models.LoginRequest request) =>
{
    var user = users.FirstOrDefault(u => u.Username == request.Username);
    if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
    {
        var response = new Shared.Models.LoginResponse { Success = false, Message = "Invalid credentials" };
        return Results.Json(response, statusCode: 401);
    }

    var token = GenerateJwtToken(user);
    var successResponse = new Shared.Models.LoginResponse { Success = true, Token = token };
    return Results.Ok(successResponse);
});

app.MapPost("/logout", () => Results.Ok(new { Message = "Logged out successfully" }))
    .RequireAuthorization();

string GenerateJwtToken(Shared.Models.User user)
{
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var token = new JwtSecurityToken(
        claims: new[] { new System.Security.Claims.Claim("UserId", user.Id.ToString()) },
        expires: DateTime.Now.AddMinutes(30),
        signingCredentials: creds);
    return new JwtSecurityTokenHandler().WriteToken(token);
}

app.MapPost("/register", (Shared.Models.RegisterRequest request) =>
{
    if (users.Any(u => u.Username == request.Username))
    {
        return Results.BadRequest(new { Message = "Username already exists." });
    }

    var newUser = new Shared.Models.User
    {
        Id = users.Count > 0 ? users.Max(u => u.Id) + 1 : 1,
        Username = request.Username,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
    };
    users.Add(newUser);
    return Results.Ok(new { Message = "Register successful!" });
});

app.Run();
