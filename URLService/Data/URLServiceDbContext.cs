using Microsoft.EntityFrameworkCore;
using URLService.Models;

namespace URLService.Data
{
    public class URLServiceDbContext : DbContext
    {
        public URLServiceDbContext(DbContextOptions<URLServiceDbContext> options) : base(options) { }

        public DbSet<UrlMappingModel> UrlMappings { get; set; }
    }
}