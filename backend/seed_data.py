# backend/seed_data.py
from sqlmodel import Session, select, SQLModel
from backend.models import Barber, Shift, Appointment
from backend.database import engine, create_db_and_tables

# No need to recreate engine here, use the one from database.py

from backend.auth import get_password_hash

def seed_data():
    with Session(engine) as session:
        # Check if we already have barbers
        existing_barbers = session.exec(select(Barber)).all()
        if existing_barbers:
            print("⚠️  Database already has data. Skipping seed.")
            return

        print("🌱 Seeding Database...")

        # 2. Create Barbers with Auth
        # Admin User (also a barber for simplicity or separate?) 
        # Requirement: "Barber Dashboard" -> separate dashboard.
        # Let's make "Tomy" an admin, others regular.
        
        pwd = get_password_hash("password") # Default password for all
        
        barber1 = Barber(
            name="Tomy Jones", 
            photo_url="https://i.pravatar.cc/150?u=1",
            username="tomy",
            hashed_password=pwd,
            role="admin",
            is_checked_in=True
        )
        barber2 = Barber(
            name="Mike Wilson", 
            photo_url="https://i.pravatar.cc/150?u=2",
            username="mike",
            hashed_password=pwd,
            role="barber",
            is_checked_in=False
        )
        barber3 = Barber(
            name="Jake Martinez", 
            photo_url="https://i.pravatar.cc/150?u=3",
            username="jake",
            hashed_password=pwd,
            role="barber",
            is_checked_in=False
        )
        
        session.add(barber1)
        session.add(barber2)
        session.add(barber3)
        session.commit() # Save to get IDs

        # 3. Create Shifts (9 AM to 5 PM, Mon-Sun)
        barbers = [barber1, barber2, barber3]
        for barber in barbers:
            for day in range(7): # 0=Monday, 6=Sunday
                shift = Shift(
                    barber_id=barber.id,
                    weekday=day,
                    start_hour=9,
                    end_hour=17
                )
                session.add(shift)
        
        session.commit()
        print("✅ Success! Added 3 Barbers (with logins) and standard 9-5 Shifts.")

if __name__ == "__main__":
    create_db_and_tables() # Uncomment if you need to create tables from scratch
    seed_data()