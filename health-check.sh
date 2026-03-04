#!/bin/bash
# Mission Control Health Check

echo "=== Mission Control Health Check ==="
echo ""
echo "1. Service Status:"
sudo systemctl is-active mission-control
echo ""
echo "2. Backend Health:"
curl -s http://127.0.0.1:3001/health | jq . 2>/dev/null || curl -s http://127.0.0.1:3001/health
echo ""
echo "3. Frontend Accessible:"
curl -s http://127.0.0.1:5173 | head -3 | tail -1
echo ""
echo "4. Ports Listening:"
sudo ss -tlnp 2>/dev/null | grep -E ':(3001|5173)' || echo "  Error: Could not check ports"
echo ""
echo "5. Service Uptime:"
sudo systemctl status mission-control --no-pager | grep Active
echo ""
echo "=== Check Complete ==="
echo ""
echo "Access URLs:"
echo "  Frontend: http://140.82.57.157:5173"
echo "  Backend:  http://140.82.57.157:3001"
echo "  Login:    iqbal / test123"
