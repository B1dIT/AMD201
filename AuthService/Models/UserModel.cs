using Microsoft.EntityFrameworkCore;

namespace AuthService.Models
{
    [Index(nameof(Username), IsUnique = true)]
    public class UserModel
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
    }
}