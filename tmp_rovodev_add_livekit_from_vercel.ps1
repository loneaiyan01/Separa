# Add LiveKit credentials from Vercel to local .env
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Copy LiveKit from Vercel to .env" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Go to your Vercel project:" -ForegroundColor Yellow
Write-Host "  Settings → Environment Variables" -ForegroundColor White
Write-Host ""
Write-Host "Copy the following three values:" -ForegroundColor Green
Write-Host ""

$livekitUrl = Read-Host "NEXT_PUBLIC_LIVEKIT_URL (e.g., wss://your-project.livekit.cloud)"
$apiKey = Read-Host "LIVEKIT_API_KEY"
$apiSecret = Read-Host "LIVEKIT_API_SECRET" -MaskInput

Write-Host ""
Write-Host "Adding to .env file..." -ForegroundColor Yellow

# Add LiveKit configuration to .env
$livekitConfig = @"

# LiveKit Configuration (from Vercel)
NEXT_PUBLIC_LIVEKIT_URL=$livekitUrl
LIVEKIT_API_KEY=$apiKey
LIVEKIT_API_SECRET=$apiSecret
"@

Add-Content -Path .env -Value $livekitConfig

Write-Host ""
Write-Host "✅ LiveKit credentials added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now join meetings!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. If dev server is running, restart it (Ctrl+C, then npm run dev)" -ForegroundColor White
Write-Host "  2. Open http://localhost:3000" -ForegroundColor White
Write-Host "  3. Try joining a meeting!" -ForegroundColor White
Write-Host ""
