# backend/seed_data.py
from sqlmodel import Session, select, SQLModel, create_engine
from models import Barber, Shift  # Make sure these import match your file names

# 1. Connect to your DB
sqlite_file_name = "barbershop.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def seed_data():
    with Session(engine) as session:
        # Check if we already have barbers
        existing_barbers = session.exec(select(Barber)).all()
        if existing_barbers:
            print("⚠️  Database already has data. Skipping seed.")
            return

        print("🌱 Seeding Database...")

        # 2. Create Barbers
        barber1 = Barber(name="Tomy Jones", photo_url="https://i.pravatar.cc/150?u=1")
        barber2 = Barber(name="Mike Wilson", photo_url="https://i.pravatar.cc/150?u=2")
        barber3 = Barber(name="Jake Martinez", photo_url="https://i.pravatar.cc/150?u=3")
        
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
        print("✅ Success! Added 3 Barbers and standard 9-5 Shifts.")

if __name__ == "__main__":
    create_db_and_tables() # Uncomment if you need to create tables from scratch
    seed_data()