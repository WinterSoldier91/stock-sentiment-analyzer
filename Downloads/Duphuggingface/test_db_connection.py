#!/usr/bin/env python3
"""
Test Supabase database connection locally
"""

import psycopg2
import os

def test_supabase_connection():
    """Test connection to Supabase database"""
    
    # Credentials from add_secrets.py
    host = "fwwnrulrrlgtfzbfusno.supabase.co"
    database = "postgres"
    user = "postgres"
    password = "SentimentDB2024!@#"
    # Try connection pooler (port 6543) - more reliable
    port = 6543
    
    print("🔍 Testing Supabase database connection...")
    print(f"Host: {host}")
    print(f"Database: {database}")
    print(f"User: {user}")
    print(f"Port: {port}")
    print(f"Password: {'*' * len(password)}")
    print()
    
    try:
        print("⏳ Attempting connection...")
        conn = psycopg2.connect(
            host=host,
            database=database,
            user=user,
            password=password,
            port=port,
            connect_timeout=30
        )
        print("✅ Connection successful!")
        
        # Test query
        print("⏳ Testing query...")
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print(f"✅ Query successful! Result: {result}")
        
        # Check if tables exist
        print("⏳ Checking tables...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cursor.fetchall()
        print(f"✅ Tables found: {[table[0] for table in tables]}")
        
        # Check sentiment_history table structure
        if any('sentiment_history' in table[0] for table in tables):
            print("⏳ Checking sentiment_history table structure...")
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'sentiment_history'
                ORDER BY ordinal_position
            """)
            columns = cursor.fetchall()
            print("✅ sentiment_history columns:")
            for col_name, col_type in columns:
                print(f"  - {col_name}: {col_type}")
        else:
            print("⚠️ sentiment_history table not found")
        
        cursor.close()
        conn.close()
        print("\n🎉 All tests passed! Database connection is working.")
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection failed: {e}")
        print("\nPossible causes:")
        print("- Incorrect password")
        print("- Supabase project is paused")
        print("- Network/firewall restrictions")
        print("- Host/port incorrect")
        return False
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_supabase_connection()
    if success:
        print("\n✅ Database credentials are correct!")
        print("The issue is likely in the HuggingFace Space environment.")
    else:
        print("\n❌ Database credentials need to be fixed.")
        print("Check Supabase dashboard for correct credentials.")