using Microsoft.EntityFrameworkCore;

namespace URLService.Models
{
    [Index(nameof(ShortCode), IsUnique = true)]
    [Index(nameof(UserId))]
    public class UrlMappingModel
    {
        public int Id { get; set; }
        public string ShortCode { get; set; } = string.Empty;
        public string OriginalUrl { get; set; } = string.Empty;
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string CustomName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}