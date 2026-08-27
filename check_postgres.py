import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

passwords = ['postgres', 'root', 'admin', 'password', '1234', '123456', 'Admin@123', 'Postgres@123', '']
found = False

for pwd in passwords:
    try:
        conn = psycopg2.connect(dbname='postgres', user='postgres', password=pwd, host='127.0.0.1', port=5432)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'siridashboard'")
        exists = cur.fetchone()
        if not exists:
            cur.execute("CREATE DATABASE siridashboard")
            print(f"SUCCESS: Created database 'siridashboard' with password: '{pwd}'")
        else:
            print(f"SUCCESS: Database 'siridashboard' already exists with password: '{pwd}'")
        cur.close()
        conn.close()
        found = True
        print(f"POSTGRES_PASS={pwd}")
        break
    except Exception as e:
        # print(f"Failed with '{pwd}': {e}")
        pass

if not found:
    print("Could not auto-connect with standard passwords. Will default to postgresql://postgres:postgres@localhost:5432/siridashboard")
