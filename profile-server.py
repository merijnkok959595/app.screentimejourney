#!/usr/bin/env python3

import http.server
import socketserver
import os

PORT = 8080

class ProfileHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/profile':
            self.send_response(200)
            self.send_header('Content-Type', 'application/x-apple-aspen-config')
            self.send_header('Content-Disposition', 'attachment; filename="ScreenTime-Journey-PIN-1234.mobileconfig"')
            self.end_headers()
            
            try:
                with open('ScreenTime-Journey-PIN-1234-Direct.mobileconfig', 'rb') as f:
                    self.wfile.write(f.read())
            except FileNotFoundError:
                self.wfile.write(b"Profile not found")
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not found")

print("🌐 Starting profile server...")
print("📱 Download URL: http://localhost:8080/profile")
print("Press Ctrl+C to stop")

with socketserver.TCPServer(("", PORT), ProfileHandler) as httpd:
    httpd.serve_forever()
