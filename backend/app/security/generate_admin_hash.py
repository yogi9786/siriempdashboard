"""
Siri Samruddhi Gold Palace — Super Admin Password Hash Generator
Use this utility to generate a secure password hash for the server-side .env configuration.

Usage:
    python -m backend.app.security.generate_admin_hash
"""

import sys
import getpass
import bcrypt


def generate_hash(password: str) -> str:
    """Generate a bcrypt hash with 12 rounds of salting."""
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def main():
    print("\n========================================================")
    print(" Siri Samruddhi Gold Palace — Super Admin Key Provisioning")
    print("========================================================\n")
    print("This utility securely provisions the Super Admin password hash.")
    print("The plaintext password will never be logged, echoed, or stored in the database.\n")

    try:
        email = input("Enter Super Admin Email [admin@sirisamruddhigold.com]: ").strip()
        if not email:
            email = "admin@sirisamruddhigold.com"

        password = getpass.getpass("Enter Super Admin Password: ")
        if len(password) < 8:
            print("\n[ERROR] Password must be at least 8 characters long for Super Admin.")
            sys.exit(1)

        confirm = getpass.getpass("Confirm Super Admin Password: ")
        if password != confirm:
            print("\n[ERROR] Passwords do not match. Aborting.")
            sys.exit(1)

        hashed = generate_hash(password)

        print("\n--------------------------------------------------------")
        print(" SUCCESS! Generated Secure Super Admin Configuration:")
        print("--------------------------------------------------------\n")
        print(f"ADMIN_EMAIL={email}")
        print(f"ADMIN_PASSWORD_HASH={hashed}\n")
        print("--------------------------------------------------------")
        print("Copy the values above directly into your server-side .env file.")
        print("Restart the FastAPI backend to activate the new credentials.\n")

    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
        sys.exit(1)


if __name__ == "__main__":
    main()
