namespace Shared.Models
{
    public class UrlMapping
    {
        public int Id { get; set; }
        public string ShortCode { get; set; }
        public string OriginalUrl { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CustomName { get; set; }
        public string Description { get; set; }
    }
}