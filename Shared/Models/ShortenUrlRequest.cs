namespace Shared.Models
{
    public class ShortenUrlRequest
    {
        public string OriginalUrl { get; set; }
        public string CustomName { get; set; } // Optional custom name
        public string Description { get; set; } // Optional description
    }
}