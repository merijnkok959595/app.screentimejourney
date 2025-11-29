#!/usr/bin/env python3

import sqlite3
import uuid
from datetime import datetime

def create_database_table():
    """Create the single_use_enrollments table"""
    
    print("💾 Creating database table...")
    
    # For demo, using SQLite (change to MySQL/PostgreSQL in production)
    conn = sqlite3.connect('screen_time_journey.db')
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS single_use_enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enrollment_uuid TEXT UNIQUE,
        simplemdm_enrollment_id INTEGER,
        enrollment_url TEXT NOT NULL,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'assigned', 'used', 'expired')),
        assigned_customer_email TEXT,
        assigned_at TIMESTAMP,
        used_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create indexes for performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_status ON single_use_enrollments(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_expires ON single_use_enrollments(expires_at)')
    
    conn.commit()
    conn.close()
    
    print("✅ Database table created!")

def add_enrollment_urls_manually():
    """Helper function to add enrollment URLs to database"""
    
    print("\n📋 ADD ENROLLMENT URLS TO DATABASE")
    print("=" * 40)
    print("Na het maken van enrollment URLs in SimpleMDM dashboard:")
    print("")
    
    conn = sqlite3.connect('screen_time_journey.db')
    cursor = conn.cursor()
    
    print("🔢 Voer enrollment URLs in (lege regel om te stoppen):")
    print("Format: SIMPLEMDM_ID,ENROLLMENT_URL")
    print("Voorbeeld: 12345,https://a.simplemdm.com/enroll/xyz123")
    print("")
    
    count = 0
    while True:
        user_input = input(f"#{count+1}: ")
        
        if not user_input.strip():
            break
            
        try:
            parts = user_input.split(',', 1)
            if len(parts) != 2:
                print("❌ Format: SIMPLEMDM_ID,URL")
                continue
                
            simplemdm_id = int(parts[0].strip())
            url = parts[1].strip()
            
            # Generate unique UUID
            enrollment_uuid = str(uuid.uuid4())
            
            cursor.execute('''
                INSERT INTO single_use_enrollments 
                (enrollment_uuid, simplemdm_enrollment_id, enrollment_url, status)
                VALUES (?, ?, ?, 'available')
            ''', (enrollment_uuid, simplemdm_id, url))
            
            count += 1
            print(f"✅ Added enrollment {enrollment_uuid[:8]}...")
            
        except ValueError:
            print("❌ SimpleMDM ID moet een nummer zijn")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ {count} enrollment URLs toegevoegd!")

def view_available_enrollments():
    """Show current available enrollment URLs"""
    
    print("\n📊 CURRENT ENROLLMENT STATUS")
    print("=" * 40)
    
    conn = sqlite3.connect('screen_time_journey.db')
    cursor = conn.cursor()
    
    # Count by status
    cursor.execute('''
        SELECT status, COUNT(*) as count 
        FROM single_use_enrollments 
        GROUP BY status
    ''')
    
    status_counts = cursor.fetchall()
    
    print("📈 Status Overview:")
    for status, count in status_counts:
        icon = {"available": "🟢", "assigned": "🟡", "used": "🔴", "expired": "⚫"}.get(status, "⚪")
        print(f"  {icon} {status}: {count}")
    
    # Show available enrollments
    cursor.execute('''
        SELECT enrollment_uuid, simplemdm_enrollment_id, enrollment_url 
        FROM single_use_enrollments 
        WHERE status = 'available'
        ORDER BY created_at ASC
        LIMIT 5
    ''')
    
    available = cursor.fetchall()
    
    if available:
        print(f"\n🟢 Next {len(available)} Available URLs:")
        for uuid_val, mdm_id, url in available:
            print(f"  {uuid_val[:8]}... (MDM:{mdm_id}) - {url[:50]}...")
    else:
        print("\n⚠️ No available enrollment URLs! Create more in SimpleMDM dashboard.")
    
    conn.close()

def test_assignment_function():
    """Test the enrollment assignment logic"""
    
    print("\n🧪 TEST ASSIGNMENT FUNCTION")
    print("=" * 30)
    
    def assign_enrollment_to_customer(customer_email):
        """Simple test version of assignment function"""
        
        conn = sqlite3.connect('screen_time_journey.db')
        cursor = conn.cursor()
        
        # Get next available enrollment
        cursor.execute('''
            SELECT id, enrollment_uuid, enrollment_url 
            FROM single_use_enrollments 
            WHERE status = 'available'
            ORDER BY created_at ASC
            LIMIT 1
        ''')
        
        enrollment = cursor.fetchone()
        
        if not enrollment:
            conn.close()
            return {"error": "No available enrollment URLs"}
        
        enrollment_id, enrollment_uuid, enrollment_url = enrollment
        
        # Mark as assigned with 48h expiry
        cursor.execute('''
            UPDATE single_use_enrollments 
            SET status = 'assigned',
                assigned_customer_email = ?,
                assigned_at = datetime('now'),
                expires_at = datetime('now', '+48 hours')
            WHERE id = ?
        ''', (customer_email, enrollment_id))
        
        conn.commit()
        conn.close()
        
        return {
            "enrollment_uuid": enrollment_uuid,
            "enrollment_url": enrollment_url,
            "expires_in_hours": 48,
            "customer_email": customer_email
        }
    
    # Test assignment
    test_email = "test@screentimejourney.com"
    result = assign_enrollment_to_customer(test_email)
    
    if "error" in result:
        print(f"❌ {result['error']}")
    else:
        print(f"✅ Enrollment assigned!")
        print(f"  Customer: {result['customer_email']}")
        print(f"  UUID: {result['enrollment_uuid']}")
        print(f"  URL: {result['enrollment_url'][:50]}...")
        print(f"  Expires: {result['expires_in_hours']} hours")

def provide_next_steps():
    """Show what to do next"""
    
    print(f"\n🚀 VOLGENDE STAPPEN")
    print("=" * 20)
    
    print(f"1. 🌐 Ga naar SimpleMDM Dashboard:")
    print(f"   https://a.simplemdm.com/enrollments")
    print(f"")
    print(f"2. ➕ Maak 10 test enrollments:")
    print(f"   Namen: PC-Test-001, PC-Test-002, etc.")
    print(f"   Auto-assign: Profile ID 214139")
    print(f"   Kopieer elk enrollment ID en URL")
    print(f"")
    print(f"3. 📋 Voer URLs in met dit script:")
    print(f"   python3 import-enrollment-urls.py")
    print(f"")
    print(f"4. 🧪 Test assignment functie:")
    print(f"   Verify dat een URL wordt toegewezen")
    print(f"   Check dat status changes naar 'assigned'")
    print(f"")
    print(f"5. 📱 Test op iPhone:")
    print(f"   Gebruik toegewezen URL")
    print(f"   Verify SimpleMDM remote management werkt")
    print(f"   Check dat profile automatisch installeert")

def main():
    print("🏗️ SimpleMDM Single-Use Enrollment Database Setup")
    print("=" * 55)
    
    # Create database table
    create_database_table()
    
    while True:
        print(f"\n📋 MENU:")
        print(f"1. Add enrollment URLs to database")
        print(f"2. View current enrollment status") 
        print(f"3. Test assignment function")
        print(f"4. Show next steps")
        print(f"5. Exit")
        
        choice = input(f"\nKies optie (1-5): ").strip()
        
        if choice == "1":
            add_enrollment_urls_manually()
        elif choice == "2":
            view_available_enrollments()
        elif choice == "3":
            test_assignment_function()
        elif choice == "4":
            provide_next_steps()
        elif choice == "5":
            print("👋 Tot ziens!")
            break
        else:
            print("❌ Ongeldige keuze")

if __name__ == "__main__":
    main()

