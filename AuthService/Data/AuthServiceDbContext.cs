using Microsoft.EntityFrameworkCore;
using AuthService.Models;

namespace AuthService.Data
{
    public class AuthServiceDbContext : DbContext
    {
        public AuthServiceDbContext(DbContextOptions<AuthServiceDbContext > options) : base(options) { }

        public DbSet<UserModel> Users { get; set; }
    }
}