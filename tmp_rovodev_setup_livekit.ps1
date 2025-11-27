# LiveKit Setup Helper Script
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "   LiveKit Configuration Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "You need to add LiveKit credentials to your .env file." -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Green
Write-Host "  1. I have LiveKit credentials (enter them now)" -ForegroundColor White
Write-Host "  2. I need to create a LiveKit account first" -ForegroundColor White
Write-Host "  3. Use local LiveKit server (advanced)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "Please enter your LiveKit credentials:" -ForegroundColor Cyan
    Write-Host ""
    
    $livekitUrl = Read-Host "LiveKit WebSocket URL (e.g., wss://your-project.livekit.cloud)"
    $apiKey = Read-Host "LiveKit API Key"
    $apiSecret = Read-Host "LiveKit API Secret"
    
    # Read existing .env content
    $envContent = Get-Content .env -Raw
    
    # Add LiveKit configuration
    $livekitConfig = @"

# LiveKit Configuration (Added by setup script)
NEXT_PUBLIC_LIVEKIT_URL=$livekitUrl
LIVEKIT_API_KEY=$apiKey
LIVEKIT_API_SECRET=$apiSecret
"@
    
    # Append to .env
    Add-Content -Path .env -Value $livekitConfig
    
    Write-Host ""
    Write-Host "✅ LiveKit configuration added to .env file!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run: npm run dev" -ForegroundColor White
    Write-Host "  2. Open: http://localhost:3000" -ForegroundColor White
    Write-Host "  3. Try joining a meeting!" -ForegroundColor White
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "📚 Instructions to create a LiveKit account:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Go to: https://cloud.livekit.io/" -ForegroundColor White
    Write-Host "2. Sign up for a free account" -ForegroundColor White
    Write-Host "3. Create a new project" -ForegroundColor White
    Write-Host "4. Copy these values:" -ForegroundColor White
    Write-Host "   - WebSocket URL (wss://...)" -ForegroundColor Gray
    Write-Host "   - API Key" -ForegroundColor Gray
    Write-Host "   - API Secret" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Run this script again and choose option 1" -ForegroundColor White
    Write-Host ""
    Write-Host "Opening LiveKit Cloud in your browser..." -ForegroundColor Yellow
    Start-Process "https://cloud.livekit.io/"
    
} elseif ($choice -eq "3") {
    Write-Host ""
    Write-Host "📚 Local LiveKit Server Setup:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You'll need Docker installed. Then run:" -ForegroundColor White
    Write-Host ""
    Write-Host "  docker run -d -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \" -ForegroundColor Gray
    Write-Host "    -e LIVEKIT_KEYS='devkey: devsecret' \" -ForegroundColor Gray
    Write-Host "    livekit/livekit-server" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then add to .env:" -ForegroundColor White
    Write-Host ""
    Write-Host "  NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880" -ForegroundColor Gray
    Write-Host "  LIVEKIT_API_KEY=devkey" -ForegroundColor Gray
    Write-Host "  LIVEKIT_API_SECRET=devsecret" -ForegroundColor Gray
    
} else {
    Write-Host ""
    Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
