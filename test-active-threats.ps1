Write-Host "--- TEST 1: LEGIT BURST TRAFFIC (Should NOT trigger ACTIVE) ---" -ForegroundColor Cyan
1..15 | ForEach-Object {
    Invoke-RestMethod -Uri "http://localhost:5000/api/collect/frontend" -Method Post -Body '{"sessionId": "legit-1", "event_type": "http_request", "url": "/index.html"}' -ContentType "application/json" | Out-Null
}
Start-Sleep -Seconds 1
Write-Host "Checking Active Threats:"
Invoke-RestMethod -Uri "http://localhost:5000/api/active-threats" | ConvertTo-Json -Depth 5

Write-Host "`n--- TEST 2: SQL INJECTION (Should trigger ACTIVE with SQL reasoning) ---" -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:5000/api/collect/frontend" -Method Post -Body '{"sessionId": "sqli-1", "event_type": "http_request", "url": "/login", "request": {"method": "GET", "query": "id=1'' OR 1=1--"}}' -ContentType "application/json" | Out-Null
Start-Sleep -Seconds 1
Write-Host "Checking Active Threats:"
Invoke-RestMethod -Uri "http://localhost:5000/api/active-threats" | ConvertTo-Json -Depth 5

Write-Host "`n--- TEST 3: SLOW BRUTE FORCE & RATE BURST (Should merge reasoning) ---" -ForegroundColor Cyan
# Send a burst of 25 requests to break the >20 rate limit
1..25 | ForEach-Object {
    Invoke-RestMethod -Uri "http://localhost:5000/api/collect/frontend" -Method Post -Body '{"sessionId": "burst-1", "event_type": "http_request", "url": "/api/data"}' -ContentType "application/json" | Out-Null
}
# Send 6 failed auth attempts
1..6 | ForEach-Object {
    Invoke-RestMethod -Uri "http://localhost:5000/api/collect/frontend" -Method Post -Body '{"sessionId": "brute-1", "event_type": "login_attempt", "behavior": {"failed_auth_attempts": 1}}' -ContentType "application/json" | Out-Null
}
Start-Sleep -Seconds 1
Write-Host "Checking Active Threats:"
Invoke-RestMethod -Uri "http://localhost:5000/api/active-threats" | ConvertTo-Json -Depth 5
