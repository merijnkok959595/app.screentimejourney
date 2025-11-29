#!/usr/bin/env python3

import http.server
import socketserver
import os

# Change to the directory containing the profile
os.chdir('/Users/merijnkok/Desktop/screen-time-journey-workspace')

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Set correct MIME type for .mobileconfig files
        if self.path.endswith('.mobileconfig'):
            self.send_header('Content-Type', 'application/x-apple-aspen-config')
            self.send_header('Content-Disposition', 'attachment; filename="' + os.path.basename(self.path) + '"')
        super().end_headers()

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"🌐 Local server running at: http://localhost:{PORT}")
    print(f"📱 Profile URL: http://localhost:{PORT}/ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    print("Press Ctrl+C to stop server")
    httpd.serve_forever()
