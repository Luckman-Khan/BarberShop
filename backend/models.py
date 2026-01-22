from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Barber(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    is_active: bool = True

class Appointment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    barber_id: int = Field(foreign_key="barber.id")
    customer_name: str
    time_slot: datetime  # e.g., 2026-01-25 10:00:00

class Shift(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    barber_id: int = Field(foreign_key="barber.id")
    weekday: int  # 0=Monday, 6=Sunday
    start_hour: int # e.g., 9 for 09:00
    end_hour: int   # e.g., 17 for 17:00

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True)
    password_hash: str
    role: str # "owner" or "barber"
    barber_id: Optional[int] = Field(default=None, foreign_key="barber.id")
