#!/usr/bin/env python3

import http.server
import socketserver
import threading
import time
import os
import requests

def create_instant_download_server():
    """Create instant download server"""
    
    print("🚀 CREATING INSTANT DOWNLOAD URL")
    print("=" * 35)
    
    PORT = 8000
    
    class ProfileHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/' or self.path == '/profile' or self.path == '/download':
                self.send_response(200)
                self.send_header('Content-Type', 'application/x-apple-aspen-config')
                self.send_header('Content-Disposition', 'attachment; filename="ScreenTime-Journey-Supervised-PIN-1234.mobileconfig"')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                try:
                    with open('ScreenTime-Journey-PIN-1234-Direct.mobileconfig', 'rb') as f:
                        content = f.read()
                        self.wfile.write(content)
                        print(f"✅ Profile downloaded by client")
                except FileNotFoundError:
                    self.wfile.write(b"Profile not found")
                    print(f"❌ Profile file not found")
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"Not found")
    
    def run_server():
        try:
            with socketserver.TCPServer(("", PORT), ProfileHandler) as httpd:
                print(f"🌐 Server started on port {PORT}")
                httpd.serve_forever()
        except Exception as e:
            print(f"❌ Server error: {e}")
    
    # Start server in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Give server time to start
    time.sleep(2)
    
    # Test if server is running
    try:
        response = requests.get(f"http://localhost:{PORT}/", timeout=5)
        if response.status_code == 200:
            print(f"✅ Server is running and responding")
            
            local_url = f"http://localhost:{PORT}/"
            print(f"\n🎯 INSTANT DOWNLOAD URL:")
            print(f"🔗 {local_url}")
            
            return local_url
        else:
            print(f"❌ Server not responding properly")
            return None
    except:
        print(f"❌ Cannot connect to server")
        return None

def create_ngrok_public_url():
    """Instructions for creating public URL with ngrok"""
    
    print(f"\n🌍 MAKE IT PUBLIC WITH NGROK")
    print("=" * 35)
    
    print("📋 STEPS TO GET PUBLIC URL:")
    print("1. Install ngrok: brew install ngrok (Mac)")
    print("2. Run: ngrok http 8000")
    print("3. Copy the https://xxx.ngrok.io URL")
    print("4. Share that URL with customers")
    print("")
    print("💡 Your profile will be downloadable worldwide!")

def create_file_io_solution():
    """Create file.io solution"""
    
    print(f"\n📤 FILE.IO SOLUTION (INSTANT)")
    print("=" * 30)
    
    print("🚀 FASTEST PUBLIC URL (30 seconds):")
    print("1. Go to: https://file.io")
    print("2. Click 'Choose File'")
    print("3. Select: ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    print("4. Click 'Upload'")
    print("5. Copy the download link")
    print("6. Send to customers immediately!")
    print("")
    print("⚠️ Note: Link expires after first download")

def create_0x0_solution():
    """Create 0x0.st solution via curl"""
    
    print(f"\n⚡ 0X0.ST SOLUTION (COMMAND LINE)")
    print("=" * 35)
    
    print("🔥 INSTANT PUBLIC URL VIA TERMINAL:")
    print("Run this command:")
    print("")
    print("curl -F'file=@ScreenTime-Journey-PIN-1234-Direct.mobileconfig' https://0x0.st")
    print("")
    print("✅ Returns instant public download URL!")
    print("📱 Works immediately, share with customers")

def create_wetransfer_quick_guide():
    """Quick WeTransfer guide"""
    
    print(f"\n📦 WETRANSFER (2 MINUTES)")
    print("=" * 25)
    
    print("🎯 PROFESSIONAL SOLUTION:")
    print("1. 🌐 https://wetransfer.com")
    print("2. 📁 Add files → Select profile")
    print("3. 📧 Enter your email")  
    print("4. 🚀 Transfer")
    print("5. 📩 Check email for link")
    print("6. 🔗 Share link with customers")
    print("")
    print("✅ Professional download page")
    print("✅ Works for 7 days")
    print("✅ No account needed")

def main():
    print("⚡ INSTANT DOWNLOADABLE URL GENERATOR")
    print("=" * 45)
    print("Creating immediate download solutions for your profile")
    print("")
    
    # Create local server
    local_url = create_instant_download_server()
    
    if local_url:
        print(f"\n🎉 SUCCESS! Your download URL is ready:")
        print(f"🔗 {local_url}")
        print(f"\n📱 TEST IT:")
        print("Click the URL above - profile should download!")
        print("This works right now on your local network.")
        
        # Provide public URL solutions
        create_ngrok_public_url()
        create_file_io_solution()
        create_0x0_solution()
        create_wetransfer_quick_guide()
        
        print(f"\n🏆 PICK YOUR SOLUTION:")
        print("🌐 Local (testing): http://localhost:8000/")
        print("🌍 Public (ngrok): ngrok http 8000")
        print("📤 Instant (file.io): 30 seconds setup")
        print("⚡ Command (0x0.st): One curl command")
        print("📦 Professional (WeTransfer): 2 minutes")
        
    else:
        print(f"\n❌ Local server failed, using alternatives...")
        create_file_io_solution()
        create_0x0_solution()
        create_wetransfer_quick_guide()
    
    print(f"\n🛡️ YOUR PROFILE:")
    print("File: ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    print("PIN: 1234")
    print("Features: CleanBrowsing DNS + Content Blocking")
    print("Ready for customer download! 🚀")
    
    # Keep server running
    if local_url:
        print(f"\n⏳ Server running... Press Ctrl+C to stop")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print(f"\n👋 Server stopped")

if __name__ == "__main__":
    main()

