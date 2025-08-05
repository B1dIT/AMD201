using System.Drawing;
using System.Drawing.Imaging;
using QRCoder;
using Shared.Models;

var builder = WebApplication.CreateBuilder(args);

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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var qrCodes = new Dictionary<string, byte[]>();


app.MapPost("/generate-qr", (GenerateQrRequest request) =>
{
    if (string.IsNullOrEmpty(request?.ShortCode) || string.IsNullOrEmpty(request.Url))
    {
        return Results.BadRequest(new { Message = "shortCode and url are required" });
    }

    try
    {
        var qrBytes = GenerateQrCode(request.Url);
        qrCodes[request.ShortCode] = qrBytes;

        return Results.Ok(new
        {
            Message = "QR code generated successfully",
            QrCodeUrl = $"http://localhost:8000/api/qr/{request.ShortCode}"
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Failed to generate QR: {ex.Message}");
    }
});

app.MapGet("/qr/{shortCode}", (string shortCode) =>
{
    if (qrCodes.TryGetValue(shortCode, out var qrBytes))
    {
        return Results.File(qrBytes, "image/png");
    }
    return Results.NotFound();
});

byte[] GenerateQrCode(string url)
{
    using var qrGenerator = new QRCodeGenerator();
    using var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
    using var qrCode = new PngByteQRCode(qrCodeData);
    return qrCode.GetGraphic(20);
}

app.Run();