from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import datetime, timedelta
from typing import List, Optional
import os

from backend.database import create_db_and_tables, get_session
from backend.models import Barber, Appointment, Shift
from backend.auth import (
    verify_password, 
    create_access_token, 
    get_current_barber, 
    get_current_admin
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# (SECRET_KEY defined in auth.py, we can reuse or just use auth functions)

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_path):
    app.mount("/static", StaticFiles(directory=static_path), name="static")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Seeding is handled by seed_data.py now

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    statement = select(Barber).where(Barber.username == form_data.username)
    barber = session.exec(statement).first()
    
    if not barber or not verify_password(form_data.password, barber.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": barber.username})
    return {"access_token": access_token, "token_type": "bearer", "role": barber.role, "name": barber.name}
    
@app.get("/users/me")
def read_users_me(current_barber: Barber = Depends(get_current_barber)):
    return current_barber

def get_smart_slots(date_str: str, barber_id: int, session: Session):
    # 1. Determine Weekday (0=Mon, 6=Sun)
    dt_obj = datetime.strptime(date_str, "%Y-%m-%d")
    weekday_int = dt_obj.weekday()

    # 2. Get the Barber's Shift for this specific day
    statement = select(Shift).where(
        Shift.barber_id == barber_id, 
        Shift.weekday == weekday_int
    )
    shift = session.exec(statement).first()
    
    # If no shift found, barber is OFF today
    if not shift:
        return []

    # 3. Generate slots based on THAT shift
    # Create start/end datetime objects for the loop
    current_time = dt_obj.replace(hour=shift.start_hour, minute=0, second=0)
    end_time = dt_obj.replace(hour=shift.end_hour, minute=0, second=0)
    
    potential_slots = []
    while current_time < end_time:
        potential_slots.append(current_time)
        current_time += timedelta(minutes=30) # 30 min duration

    # 4. Filter out existing appointments
    start_of_day = dt_obj.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = dt_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    statement = select(Appointment).where(
        Appointment.barber_id == barber_id,
        Appointment.time_slot >= start_of_day,
        Appointment.time_slot <= end_of_day
    )
    appointments = session.exec(statement).all()
    booked_times = [appt.time_slot for appt in appointments]
    
    return [slot.strftime("%H:%M") for slot in potential_slots if slot not in booked_times]

@app.get("/barbers", response_model=List[Barber])
def get_barbers(session: Session = Depends(get_session)):
    return session.exec(select(Barber)).all()

@app.get("/slots")
def get_slots(barber_id: int, date: str, session: Session = Depends(get_session)):
    return get_smart_slots(date, barber_id, session)

@app.post("/shifts")
def create_shift(shift: Shift, session: Session = Depends(get_session)):
    # Remove existing shift for that day if any
    statement = select(Shift).where(
        Shift.barber_id == shift.barber_id, 
        Shift.weekday == shift.weekday
    )
    existing_shift = session.exec(statement).first()
    if existing_shift:
        session.delete(existing_shift)
        session.commit()
    
    session.add(shift)
    session.commit()
    return {"message": "Shift saved"}

@app.post("/book")
def book_appointment(barber_id: int, date: str, time: str, name: str, session: Session = Depends(get_session)):
    time_slot_str = f"{date} {time}"
    try:
        time_slot = datetime.strptime(time_slot_str, "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    statement = select(Appointment).where(
        Appointment.barber_id == barber_id,
        Appointment.time_slot == time_slot
    )
    if session.exec(statement).first():
         raise HTTPException(status_code=400, detail="Slot already booked")
    
    appt = Appointment(barber_id=barber_id, customer_name=name, time_slot=time_slot)
    session.add(appt)
    session.commit()
    return {"message": "Booking successful"}

@app.get("/appointments")
def get_all_appointments(session: Session = Depends(get_session)):
    # Public for now (Phase 1)
    statement = select(Appointment, Barber).where(Appointment.barber_id == Barber.id)
    results = session.exec(statement).all()
    # Return a custom structure
    return [
        {
            "id": appt.id,
            "barber_id": appt.barber_id,
            "customer_name": appt.customer_name,
            "time_slot": appt.time_slot,
            "barber_name": barber.name
        } 
        for appt, barber in results
    ]

@app.get("/admin/stats")
def get_admin_stats(session: Session = Depends(get_session)):
    # Public for now (Phase 1)
    
    # Total appointments
    total_bookings = session.exec(select(Appointment)).all()
    count = len(total_bookings)
    
    # Revenue (assuming $25 per cut)
    revenue = count * 25
    
    # Active Barbers
    barbers = session.exec(select(Barber).where(Barber.is_active == True)).all()
    active_barbers = len(barbers)

    return {
        "total_bookings": count,
        "revenue": revenue,
        "active_barbers": active_barbers
    }

@app.post("/barber/toggle-status")
def toggle_status(current_barber: Barber = Depends(get_current_barber), session: Session = Depends(get_session)):
    current_barber.is_checked_in = not current_barber.is_checked_in
    session.add(current_barber)
    session.commit()
    session.refresh(current_barber)
    return {"status": "checked_in" if current_barber.is_checked_in else "checked_out"}

@app.get("/barber/dashboard-stats")
def get_barber_stats(current_barber: Barber = Depends(get_current_barber), session: Session = Depends(get_session)):
    # 1. Customers Served Today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    statement = select(Appointment).where(
        Appointment.barber_id == current_barber.id,
        Appointment.time_slot >= today_start
    )
    todays_appointments = session.exec(statement).all()
    count = len(todays_appointments)
    
    # 2. Earnings
    earnings = count * 25
    
    # 3. Queue Duration
    now = datetime.now()
    future_appts = [a for a in todays_appointments if a.time_slot > now]
    if future_appts:
        last_appt_end = max([a.time_slot for a in future_appts]) + timedelta(minutes=30)
        duration = (last_appt_end - now).seconds // 60
    else:
        duration = 0

    return {
        "customers_served_today": count,
        "total_earned_today": earnings,
        "queue_duration_minutes": duration,
        "is_checked_in": current_barber.is_checked_in,
        "name": current_barber.name
    }

@app.delete("/appointments/{appt_id}")
def delete_appointment(appt_id: int, session: Session = Depends(get_session)):
    # Public for now (Phase 1/2) - Ideally protect with get_current_admin later
    appt = session.get(Appointment, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    session.delete(appt)
    session.commit()
    return {"message": "Deleted"}
