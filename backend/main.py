from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import datetime, timedelta
from typing import List, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from .database import create_db_and_tables, get_session
from .models import Barber, Appointment, Shift, User
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Auth Configuration
SECRET_KEY = "mysecretkey" # In production, use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_path):
    app.mount("/static", StaticFiles(directory=static_path), name="static")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise credentials_exception
    return user

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Create initial Barbers and Users if not exist
    with Session(get_session().__next__().bind) as session: # Hacky way to get session inside startup
        if not session.exec(select(Barber)).first():
            b1 = Barber(name="Alice")
            b2 = Barber(name="Bob")
            session.add(b1)
            session.add(b2)
            session.commit()
            session.refresh(b1)
        
        # Check and create Users
        if not session.exec(select(User)).first():
            # Ensure we have a barber for linking (Alice)
            alice = session.exec(select(Barber).where(Barber.name == "Alice")).first()
            alice_id = alice.id if alice else None
            
            # Owner
            owner = User(username="owner", password_hash=get_password_hash("pass"), role="owner")
            session.add(owner)
            
            # Barber User (Alice)
            if alice_id:
                barber_user = User(username="alice", password_hash=get_password_hash("pass"), role="barber", barber_id=alice_id)
                session.add(barber_user)
            
            session.commit()

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

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
def create_shift(shift: Shift, session: Session = Depends(get_session)): # Ideally protect this too
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

@app.get("/appointments", response_model=List[Appointment])
def get_all_appointments(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if current_user.role == "owner":
        return session.exec(select(Appointment)).all()
    elif current_user.role == "barber":
        if current_user.barber_id:
             return session.exec(select(Appointment).where(Appointment.barber_id == current_user.barber_id)).all()
        else:
            return [] # Barber user but not linked to a barber?
    return []

@app.delete("/appointments/{appt_id}")
def delete_appointment(appt_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    appt = session.get(Appointment, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    session.delete(appt)
    session.commit()
    return {"message": "Deleted"}
