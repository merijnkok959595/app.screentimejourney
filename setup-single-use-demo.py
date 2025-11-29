#!/usr/bin/env python3

import sqlite3
import uuid
from datetime import datetime

def setup_database_and_demo():
    """Set up database and show demo of single-use enrollment tracking"""
    
    print("🏗️ SINGLE-USE ENROLLMENT SETUP & DEMO")
    print("=" * 50)
    
    # Create database
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
    
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_status ON single_use_enrollments(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_expires ON single_use_enrollments(expires_at)')
    
    print("✅ Database created: screen_time_journey.db")
    print("✅ Table: single_use_enrollments")
    print("✅ Indexes created for performance")
    
    # Add demo enrollment URLs
    demo_enrollments = [
        (12345, "https://a.simplemdm.com/enroll/demo123"),
        (12346, "https://a.simplemdm.com/enroll/demo456"), 
        (12347, "https://a.simplemdm.com/enroll/demo789")
    ]
    
    print(f"\n📋 Adding {len(demo_enrollments)} demo enrollment URLs...")
    
    for simplemdm_id, url in demo_enrollments:
        enrollment_uuid = str(uuid.uuid4())
        
        cursor.execute('''
            INSERT OR IGNORE INTO single_use_enrollments 
            (enrollment_uuid, simplemdm_enrollment_id, enrollment_url, status)
            VALUES (?, ?, ?, 'available')
        ''', (enrollment_uuid, simplemdm_id, url))
        
        print(f"  ✅ {enrollment_uuid[:8]}... (MDM:{simplemdm_id})")
    
    conn.commit()
    
    # Show current status
    cursor.execute('SELECT COUNT(*) FROM single_use_enrollments WHERE status = "available"')
    available_count = cursor.fetchone()[0]
    
    print(f"\n📊 Database Status: {available_count} available enrollment URLs")
    
    conn.close()

def demo_assignment_flow():
    """Demonstrate the assignment flow"""
    
    print(f"\n🧪 DEMO: ASSIGNMENT FLOW")
    print("=" * 30)
    
    def assign_enrollment(customer_email):
        conn = sqlite3.connect('screen_time_journey.db')
        cursor = conn.cursor()
        
        # Get next available
        cursor.execute('''
            SELECT id, enrollment_uuid, enrollment_url, simplemdm_enrollment_id
            FROM single_use_enrollments 
            WHERE status = 'available'
            ORDER BY created_at ASC
            LIMIT 1
        ''')
        
        result = cursor.fetchone()
        if not result:
            conn.close()
            return None
            
        enrollment_id, uuid_val, url, mdm_id = result
        
        # Mark as assigned
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
            "enrollment_uuid": uuid_val,
            "enrollment_url": url,
            "simplemdm_id": mdm_id,
            "customer_email": customer_email
        }
    
    # Demo assignment
    print("1. 📧 Customer signs up: john@example.com")
    
    assignment = assign_enrollment("john@example.com")
    
    if assignment:
        print("2. ✅ Enrollment URL assigned:")
        print(f"   UUID: {assignment['enrollment_uuid'][:16]}...")
        print(f"   SimpleMDM ID: {assignment['simplemdm_id']}")
        print(f"   Customer: {assignment['customer_email']}")
        print(f"   URL: {assignment['enrollment_url']}")
        print("3. 📱 Email sent to customer with enrollment link")
        print("4. ⏰ URL expires in 48 hours if not used")
    else:
        print("❌ No available enrollment URLs")

def show_webhook_simulation():
    """Show what happens when webhook receives enrollment event"""
    
    print(f"\n📡 DEMO: WEBHOOK EVENT SIMULATION")
    print("=" * 40)
    
    def handle_enrollment_webhook(customer_email):
        conn = sqlite3.connect('screen_time_journey.db')
        cursor = conn.cursor()
        
        # Find assigned enrollment for this customer
        cursor.execute('''
            SELECT id, enrollment_uuid 
            FROM single_use_enrollments 
            WHERE assigned_customer_email = ? AND status = 'assigned'
        ''', (customer_email,))
        
        result = cursor.fetchone()
        if result:
            enrollment_id, uuid_val = result
            
            # Mark as used
            cursor.execute('''
                UPDATE single_use_enrollments 
                SET status = 'used',
                    used_at = datetime('now')
                WHERE id = ?
            ''', (enrollment_id,))
            
            conn.commit()
            print(f"✅ Enrollment {uuid_val[:8]}... marked as USED")
            print(f"✅ Customer {customer_email} successfully enrolled")
            print(f"✅ Remote management now active via SimpleMDM")
        
        conn.close()
    
    print("1. 📱 Customer installs enrollment profile on iPhone")
    print("2. 📡 SimpleMDM sends webhook: device_enrolled")
    print("3. 🔄 Our system processes webhook:")
    
    handle_enrollment_webhook("john@example.com")
    
    print("4. 🎛️ Parent can now manage device remotely")

def show_current_database_status():
    """Show current database status"""
    
    print(f"\n📊 CURRENT DATABASE STATUS")
    print("=" * 30)
    
    conn = sqlite3.connect('screen_time_journey.db')
    cursor = conn.cursor()
    
    # Status counts
    cursor.execute('''
        SELECT status, COUNT(*) 
        FROM single_use_enrollments 
        GROUP BY status
    ''')
    
    statuses = cursor.fetchall()
    status_icons = {
        'available': '🟢',
        'assigned': '🟡', 
        'used': '🔴',
        'expired': '⚫'
    }
    
    for status, count in statuses:
        icon = status_icons.get(status, '⚪')
        print(f"{icon} {status.upper()}: {count}")
    
    # Show recent activity
    cursor.execute('''
        SELECT enrollment_uuid, status, assigned_customer_email, 
               assigned_at, used_at
        FROM single_use_enrollments 
        ORDER BY created_at DESC
        LIMIT 5
    ''')
    
    recent = cursor.fetchall()
    
    if recent:
        print(f"\n📋 Recent Activity:")
        for uuid_val, status, email, assigned_at, used_at in recent:
            email_part = email[:20] + "..." if email and len(email) > 20 else email or "None"
            print(f"  {uuid_val[:8]}... | {status} | {email_part}")
    
    conn.close()

def provide_production_instructions():
    """Provide instructions for production setup"""
    
    print(f"\n🚀 PRODUCTION SETUP INSTRUCTIES")
    print("=" * 40)
    
    print(f"📋 STAP 1: SimpleMDM Enrollments Maken")
    print(f"1. 🌐 Ga naar: https://a.simplemdm.com/enrollments")
    print(f"2. ➕ Klik 'Create Enrollment'")
    print(f"3. 📝 Vul in:")
    print(f"   Name: PC-Customer-001-{datetime.now().strftime('%Y%m%d')}")
    print(f"   Auto-assign: Profile ID 214139")
    print(f"4. 💾 Save en kopieer enrollment URL")
    print(f"5. 🔄 Herhaal voor 20-50 enrollments")
    print(f"")
    
    print(f"💾 STAP 2: Database Setup (Production)")
    print(f"# MySQL versie:")
    mysql_schema = '''
CREATE TABLE single_use_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_uuid VARCHAR(36) UNIQUE NOT NULL,
    simplemdm_enrollment_id INT NOT NULL,
    enrollment_url TEXT NOT NULL,
    status ENUM('available', 'assigned', 'used', 'expired') DEFAULT 'available',
    assigned_customer_email VARCHAR(255),
    assigned_at TIMESTAMP NULL,
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_expires (expires_at),
    INDEX idx_customer (assigned_customer_email)
);
'''
    print(mysql_schema)
    
    print(f"🤖 STAP 3: Assignment API Endpoint")
    api_code = '''
@app.route('/api/assign-enrollment', methods=['POST'])
def assign_enrollment_api():
    data = request.json
    customer_email = data.get('email')
    
    if not customer_email:
        return {"error": "Email required"}, 400
    
    # Get available enrollment
    enrollment = db.query("""
        SELECT * FROM single_use_enrollments 
        WHERE status = 'available' 
        ORDER BY created_at ASC 
        LIMIT 1
    """).first()
    
    if not enrollment:
        return {"error": "No available enrollments"}, 503
    
    # Assign to customer
    db.execute("""
        UPDATE single_use_enrollments 
        SET status = 'assigned',
            assigned_customer_email = %s,
            assigned_at = NOW(),
            expires_at = DATE_ADD(NOW(), INTERVAL 48 HOUR)
        WHERE id = %s
    """, (customer_email, enrollment['id']))
    
    # Send email
    send_enrollment_email(customer_email, enrollment['enrollment_url'])
    
    return {
        "enrollment_url": enrollment['enrollment_url'],
        "expires_in_hours": 48,
        "status": "assigned"
    }
'''
    print(api_code)
    
    print(f"📡 STAP 4: SimpleMDM Webhook Setup")
    print(f"1. 🔧 Ga naar SimpleMDM webhook settings")
    print(f"2. 📡 Add webhook URL: https://yourdomain.com/webhook/simplemdm")
    print(f"3. ✅ Enable 'device_enrolled' events")
    print(f"4. 🧪 Test webhook met test device")

def main():
    print("🎯 SimpleMDM Single-Use Enrollment Setup")
    print("Dit demonstreert hoe je single-use enrollment URLs")
    print("kunt implementeren met behoud van remote management.")
    print("")
    
    setup_database_and_demo()
    demo_assignment_flow()
    show_webhook_simulation()
    show_current_database_status()
    provide_production_instructions()
    
    print(f"\n✅ SAMENVATTING:")
    print(f"• ✅ Database setup klaar")
    print(f"• ✅ Assignment flow getest") 
    print(f"• ✅ Webhook simulation getoond")
    print(f"• ✅ Production instructies verschaft")
    print(f"")
    print(f"🚀 Volgende stap: Maak 20 enrollment URLs in SimpleMDM!")

if __name__ == "__main__":
    main()

