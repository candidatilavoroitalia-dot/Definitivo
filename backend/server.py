from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from twilio.rest import Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Twilio settings
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.environ.get('TWILIO_WHATSAPP_NUMBER')

# Initialize Twilio client if credentials are available
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logging.info("Twilio client initialized successfully")
    except Exception as e:
        logging.warning(f"Failed to initialize Twilio client: {e}")

# Scheduler
scheduler = AsyncIOScheduler()

security = HTTPBearer()

# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    logging.info("Scheduler started")
    yield
    scheduler.shutdown()
    logging.info("Scheduler stopped")
    client.close()

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str = Field(..., pattern=r'^\+\d{1,15}$')

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    phone: str
    is_admin: bool = False

class TokenResponse(BaseModel):
    access_token: str
    user: User

class Hairdresser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    specialties: List[str]

class HairdresserCreate(BaseModel):
    name: str
    specialties: List[str]

class HairdresserUpdate(BaseModel):
    name: Optional[str] = None
    specialties: Optional[List[str]] = None

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "app_settings"
    hero_title: str
    hero_subtitle: str
    hero_description: str
    hero_image_url: str
    time_slots: List[str]
    admin_phone: str

class SettingsUpdate(BaseModel):
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_description: Optional[str] = None
    hero_image_url: Optional[str] = None
    time_slots: Optional[List[str]] = None
    admin_phone: Optional[str] = None

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    duration_minutes: int
    price: float
    description: str

class ServiceCreate(BaseModel):
    name: str
    duration_minutes: int
    price: float
    description: str

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    description: Optional[str] = None

class AppointmentCreate(BaseModel):
    hairdresser_id: str
    service_id: str
    date_time: datetime

class AppointmentUpdate(BaseModel):
    date_time: Optional[datetime] = None
    status: Optional[str] = None

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    user_phone: str
    hairdresser_id: str
    hairdresser_name: str
    service_id: str
    service_name: str
    date_time: datetime
    status: str  # pending, confirmed, cancelled
    created_at: datetime

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str, email: str, is_admin: bool) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = {
        "sub": user_id,
        "email": email,
        "is_admin": is_admin,
        "exp": expire
    }
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def send_whatsapp_message(to_number: str, message: str) -> dict:
    if not twilio_client or not TWILIO_WHATSAPP_NUMBER:
        logging.warning("Twilio not configured, skipping WhatsApp message")
        return {"success": False, "error": "Twilio not configured"}
    
    try:
        message_obj = twilio_client.messages.create(
            from_=f"whatsapp:{TWILIO_WHATSAPP_NUMBER}",
            body=message,
            to=f"whatsapp:{to_number}"
        )
        logging.info(f"WhatsApp message sent to {to_number}. SID: {message_obj.sid}")
        return {"success": True, "message_sid": message_obj.sid}
    except Exception as e:
        logging.error(f"Failed to send WhatsApp message: {e}")
        return {"success": False, "error": str(e)}

def schedule_appointment_reminder(appointment: dict):
    # Send reminder 1 hour before appointment
    reminder_time = appointment["date_time"] - timedelta(hours=1)
    
    # If appointment is less than 1 hour away, send reminder in 10 seconds
    if reminder_time <= datetime.now(timezone.utc):
        reminder_time = datetime.now(timezone.utc) + timedelta(seconds=10)
    
    message = (
        f"🔔 Promemoria Appuntamento\n\n"
        f"Ciao {appointment['user_name']}!\n\n"
        f"Ti ricordiamo che tra 1 ora hai un appuntamento:\n"
        f"📅 {appointment['date_time'].strftime('%d/%m/%Y')}\n"
        f"⏰ {appointment['date_time'].strftime('%H:%M')}\n"
        f"✂️ {appointment['service_name']}\n"
        f"👤 con {appointment['hairdresser_name']}\n\n"
        f"Ti aspettiamo!"
    )
    
    scheduler.add_job(
        send_whatsapp_message,
        "date",
        run_date=reminder_time,
        args=[appointment["user_phone"], message],
        id=f"reminder_{appointment['id']}",
        replace_existing=True
    )
    logging.info(f"Scheduled 1-hour reminder for appointment {appointment['id']} at {reminder_time}")

async def send_appointment_confirmation(appointment: dict):
    """Send immediate confirmation to client when booking"""
    message = (
        f"✅ Appuntamento Confermato!\n\n"
        f"Ciao {appointment['user_name']},\n\n"
        f"Il tuo appuntamento è stato prenotato con successo:\n\n"
        f"📅 Data: {appointment['date_time'].strftime('%d/%m/%Y')}\n"
        f"⏰ Ora: {appointment['date_time'].strftime('%H:%M')}\n"
        f"✂️ Servizio: {appointment['service_name']}\n"
        f"👤 Parrucchiere: {appointment['hairdresser_name']}\n\n"
        f"Riceverai un promemoria 1 ora prima dell'appuntamento.\n\n"
        f"A presto! 💇"
    )
    send_whatsapp_message(appointment["user_phone"], message)

async def notify_admin_new_appointment(appointment: dict):
    """Notify admin about new appointment"""
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if settings and settings.get("admin_phone"):
        message = (
            f"🔔 Nuovo Appuntamento!\n\n"
            f"Cliente: {appointment['user_name']}\n"
            f"Telefono: {appointment['user_phone']}\n"
            f"📅 {appointment['date_time'].strftime('%d/%m/%Y alle %H:%M')}\n"
            f"✂️ {appointment['service_name']}\n"
            f"👤 {appointment['hairdresser_name']}\n\n"
            f"⚠️ Da confermare nel pannello admin"
        )
        send_whatsapp_message(settings["admin_phone"], message)
        logging.info(f"Admin notified about new appointment {appointment['id']}")

# Auth routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_access_token(user_id, user_data.email, False)
    user = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        is_admin=False
    )
    
    return TokenResponse(access_token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user["id"], user["email"], user.get("is_admin", False))
    user_obj = User(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        phone=user["phone"],
        is_admin=user.get("is_admin", False)
    )
    
    return TokenResponse(access_token=token, user=user_obj)

# Services routes
@api_router.get("/services", response_model=List[Service])
async def get_services():
    services = await db.services.find({}, {"_id": 0}).to_list(100)
    return services

# Hairdressers routes
@api_router.get("/hairdressers", response_model=List[Hairdresser])
async def get_hairdressers():
    hairdressers = await db.hairdressers.find({}, {"_id": 0}).to_list(100)
    return hairdressers

# Appointments routes
@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appointment_data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    # Ensure appointment_data.date_time is timezone-aware
    if appointment_data.date_time.tzinfo is None:
        appointment_data.date_time = appointment_data.date_time.replace(tzinfo=timezone.utc)
    
    if appointment_data.date_time <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Appointment time must be in the future")
    
    # Get user details
    user = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get hairdresser details
    hairdresser = await db.hairdressers.find_one({"id": appointment_data.hairdresser_id}, {"_id": 0})
    if not hairdresser:
        raise HTTPException(status_code=404, detail="Hairdresser not found")
    
    # Get service details
    service = await db.services.find_one({"id": appointment_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    appointment_id = str(uuid.uuid4())
    appointment_doc = {
        "id": appointment_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_phone": user["phone"],
        "hairdresser_id": hairdresser["id"],
        "hairdresser_name": hairdresser["name"],
        "service_id": service["id"],
        "service_name": service["name"],
        "date_time": appointment_data.date_time.isoformat(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.appointments.insert_one(appointment_doc)
    
    # Schedule WhatsApp reminder (1 hour before)
    appointment_for_reminder = appointment_doc.copy()
    appointment_for_reminder["date_time"] = appointment_data.date_time
    schedule_appointment_reminder(appointment_for_reminder)
    
    # Send immediate confirmation to client
    await send_appointment_confirmation(appointment_for_reminder)
    
    # Notify admin about new appointment
    await notify_admin_new_appointment(appointment_for_reminder)
    
    # Convert ISO strings back to datetime for response
    appointment_doc["date_time"] = appointment_data.date_time
    appointment_doc["created_at"] = datetime.fromisoformat(appointment_doc["created_at"])
    
    return Appointment(**appointment_doc)

@api_router.get("/appointments/my", response_model=List[Appointment])
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    appointments = await db.appointments.find(
        {"user_id": current_user["sub"]},
        {"_id": 0}
    ).sort("date_time", -1).to_list(100)
    
    for apt in appointments:
        apt["date_time"] = datetime.fromisoformat(apt["date_time"])
        apt["created_at"] = datetime.fromisoformat(apt["created_at"])
    
    return appointments

@api_router.patch("/appointments/{appointment_id}/cancel", response_model=Appointment)
async def cancel_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment["user_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": "cancelled"}}
    )
    
    appointment["status"] = "cancelled"
    appointment["date_time"] = datetime.fromisoformat(appointment["date_time"])
    appointment["created_at"] = datetime.fromisoformat(appointment["created_at"])
    
    # Send cancellation message
    message = f"Il tuo appuntamento del {appointment['date_time'].strftime('%d/%m/%Y alle %H:%M')} è stato cancellato."
    send_whatsapp_message(appointment["user_phone"], message)
    
    return Appointment(**appointment)

@api_router.patch("/appointments/{appointment_id}/reschedule", response_model=Appointment)
async def reschedule_appointment(appointment_id: str, new_date_time: datetime, current_user: dict = Depends(get_current_user)):
    # Ensure new_date_time is timezone-aware
    if new_date_time.tzinfo is None:
        new_date_time = new_date_time.replace(tzinfo=timezone.utc)
    
    if new_date_time <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Appointment time must be in the future")
    
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment["user_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"date_time": new_date_time.isoformat()}}
    )
    
    appointment["date_time"] = new_date_time
    appointment["created_at"] = datetime.fromisoformat(appointment["created_at"])
    
    # Reschedule reminder
    schedule_appointment_reminder(appointment)
    
    # Send confirmation message
    message = f"Il tuo appuntamento è stato riprogrammato per il {new_date_time.strftime('%d/%m/%Y alle %H:%M')}."
    send_whatsapp_message(appointment["user_phone"], message)
    
    return Appointment(**appointment)

# Admin routes
@api_router.get("/admin/appointments", response_model=List[Appointment])
async def get_all_appointments(date: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_admin_user)):
    query = {}
    if date:
        # Filter by date (today)
        start = datetime.fromisoformat(date).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        query = {
            "date_time": {
                "$gte": start.isoformat(),
                "$lt": end.isoformat()
            }
        }
    
    if status:
        query["status"] = status
    
    appointments = await db.appointments.find(query, {"_id": 0}).sort("date_time", 1).to_list(1000)
    
    for apt in appointments:
        apt["date_time"] = datetime.fromisoformat(apt["date_time"])
        apt["created_at"] = datetime.fromisoformat(apt["created_at"])
    
    return appointments

@api_router.patch("/admin/appointments/{appointment_id}/confirm", response_model=Appointment)
async def confirm_appointment(appointment_id: str, current_user: dict = Depends(get_admin_user)):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": "confirmed"}}
    )
    
    appointment["status"] = "confirmed"
    appointment["date_time"] = datetime.fromisoformat(appointment["date_time"])
    appointment["created_at"] = datetime.fromisoformat(appointment["created_at"])
    
    # Send confirmation message
    message = f"Il tuo appuntamento del {appointment['date_time'].strftime('%d/%m/%Y alle %H:%M')} è stato confermato!"
    send_whatsapp_message(appointment["user_phone"], message)
    
    return Appointment(**appointment)

@api_router.patch("/admin/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(appointment_id: str, update_data: AppointmentUpdate, current_user: dict = Depends(get_admin_user)):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_dict = {}
    if update_data.date_time:
        # Ensure date_time is timezone-aware
        if update_data.date_time.tzinfo is None:
            update_data.date_time = update_data.date_time.replace(tzinfo=timezone.utc)
        
        if update_data.date_time <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Appointment time must be in the future")
        update_dict["date_time"] = update_data.date_time.isoformat()
        appointment["date_time"] = update_data.date_time
    
    if update_data.status:
        update_dict["status"] = update_data.status
        appointment["status"] = update_data.status
    
    if update_dict:
        await db.appointments.update_one(
            {"id": appointment_id},
            {"$set": update_dict}
        )
    
    if "date_time" not in update_dict:
        appointment["date_time"] = datetime.fromisoformat(appointment["date_time"])
    
    appointment["created_at"] = datetime.fromisoformat(appointment["created_at"])
    
    return Appointment(**appointment)

@api_router.delete("/admin/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.appointments.delete_one({"id": appointment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted"}

# Admin Services Management
@api_router.post("/admin/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: dict = Depends(get_admin_user)):
    service_id = str(uuid.uuid4())
    service_doc = {
        "id": service_id,
        **service_data.model_dump()
    }
    await db.services.insert_one(service_doc)
    return Service(**service_doc)

@api_router.put("/admin/services/{service_id}", response_model=Service)
async def update_service(service_id: str, update_data: ServiceUpdate, current_user: dict = Depends(get_admin_user)):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await db.services.update_one({"id": service_id}, {"$set": update_dict})
        service.update(update_dict)
    
    return Service(**service)

@api_router.delete("/admin/services/{service_id}")
async def delete_service(service_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

# Admin Hairdressers Management
@api_router.post("/admin/hairdressers", response_model=Hairdresser)
async def create_hairdresser(hairdresser_data: HairdresserCreate, current_user: dict = Depends(get_admin_user)):
    hairdresser_id = str(uuid.uuid4())
    hairdresser_doc = {
        "id": hairdresser_id,
        **hairdresser_data.model_dump()
    }
    await db.hairdressers.insert_one(hairdresser_doc)
    return Hairdresser(**hairdresser_doc)

@api_router.put("/admin/hairdressers/{hairdresser_id}", response_model=Hairdresser)
async def update_hairdresser(hairdresser_id: str, update_data: HairdresserUpdate, current_user: dict = Depends(get_admin_user)):
    hairdresser = await db.hairdressers.find_one({"id": hairdresser_id}, {"_id": 0})
    if not hairdresser:
        raise HTTPException(status_code=404, detail="Hairdresser not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await db.hairdressers.update_one({"id": hairdresser_id}, {"$set": update_dict})
        hairdresser.update(update_dict)
    
    return Hairdresser(**hairdresser)

@api_router.delete("/admin/hairdressers/{hairdresser_id}")
async def delete_hairdresser(hairdresser_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.hairdressers.delete_one({"id": hairdresser_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hairdresser not found")
    return {"message": "Hairdresser deleted"}

# Admin Settings Management
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        default_settings = {
            "id": "app_settings",
            "hero_title": "Il Tuo Salone, Sempre Disponibile",
            "hero_subtitle": "",
            "hero_description": "Prenota il tuo appuntamento in pochi secondi. Ricevi promemoria su WhatsApp. Gestisci tutto dal tuo telefono.",
            "hero_image_url": "https://images.pexels.com/photos/7195799/pexels-photo-7195799.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            "time_slots": [
                "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                "17:00", "17:30", "18:00"
            ]
        }
        return Settings(**default_settings)
    
    # Ensure hero_image_url exists (for backward compatibility)
    if "hero_image_url" not in settings:
        settings["hero_image_url"] = "https://images.pexels.com/photos/7195799/pexels-photo-7195799.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
        # Update database with new field
        await db.settings.update_one(
            {"id": "app_settings"},
            {"$set": {"hero_image_url": settings["hero_image_url"]}}
        )
    
    return Settings(**settings)

@api_router.put("/admin/settings", response_model=Settings)
async def update_settings(update_data: SettingsUpdate, current_user: dict = Depends(get_admin_user)):
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not settings:
        # Create new settings
        settings_doc = {
            "id": "app_settings",
            "hero_title": update_data.hero_title or "Il Tuo Salone, Sempre Disponibile",
            "hero_subtitle": update_data.hero_subtitle or "",
            "hero_description": update_data.hero_description or "Prenota il tuo appuntamento in pochi secondi.",
            "hero_image_url": update_data.hero_image_url or "https://images.pexels.com/photos/7195799/pexels-photo-7195799.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            "time_slots": update_data.time_slots or [
                "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                "17:00", "17:30", "18:00"
            ]
        }
        await db.settings.insert_one(settings_doc)
        return Settings(**settings_doc)
    else:
        if update_dict:
            await db.settings.update_one({"id": "app_settings"}, {"$set": update_dict})
            settings.update(update_dict)
        return Settings(**settings)

# Seed data endpoint (for development)
@api_router.post("/seed")
async def seed_data():
    # Create admin user
    admin_exists = await db.users.find_one({"email": "admin@parrucco.it"})
    if not admin_exists:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@parrucco.it",
            "password_hash": hash_password("admin123"),
            "name": "Amministratore",
            "phone": "+393331234567",
            "is_admin": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
    
    # Create services
    services_count = await db.services.count_documents({})
    if services_count == 0:
        services = [
            {
                "id": str(uuid.uuid4()),
                "name": "Taglio Uomo",
                "duration_minutes": 30,
                "price": 25.0,
                "description": "Taglio classico o moderno"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Taglio Donna",
                "duration_minutes": 45,
                "price": 35.0,
                "description": "Taglio e styling"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Colore",
                "duration_minutes": 90,
                "price": 60.0,
                "description": "Colorazione completa"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Piega",
                "duration_minutes": 30,
                "price": 20.0,
                "description": "Piega con phon"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Trattamento",
                "duration_minutes": 60,
                "price": 45.0,
                "description": "Trattamento per capelli"
            }
        ]
        await db.services.insert_many(services)
    
    # Create hairdressers
    hairdressers_count = await db.hairdressers.count_documents({})
    if hairdressers_count == 0:
        hairdressers = [
            {
                "id": str(uuid.uuid4()),
                "name": "Marco Rossi",
                "specialties": ["Taglio Uomo", "Taglio Donna"]
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Laura Bianchi",
                "specialties": ["Colore", "Trattamento"]
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Giuseppe Verdi",
                "specialties": ["Taglio Uomo", "Piega"]
            }
        ]
        await db.hairdressers.insert_many(hairdressers)
    
    return {"message": "Database seeded successfully"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
