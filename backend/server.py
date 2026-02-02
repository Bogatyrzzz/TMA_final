from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
import os
import asyncio
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
from time import perf_counter
import httpx
from supabase_client import get_supabase

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

supabase = get_supabase()

# Create the main app without a prefix
app = FastAPI(title="LifeQuest Hero API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

REQUEST_COUNT = 0
ERROR_COUNT = 0
START_TIME = datetime.utcnow()
BONUS_DAILY_TITLE = "⭐ Выполни все daily квесты"

@app.middleware("http")
async def log_requests(request: Request, call_next):
    global REQUEST_COUNT, ERROR_COUNT
    start_time = perf_counter()
    response = await call_next(request)
    duration = perf_counter() - start_time
    REQUEST_COUNT += 1
    if response.status_code >= 500:
        ERROR_COUNT += 1
    logging.getLogger("lifequest").info(f"{request.method} {request.url.path} {response.status_code} {duration:.3f}")
    return response

# Models
class UserCreate(BaseModel):
    tg_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language_code: str = 'en'
    avatar_url: Optional[str] = None

class OnboardingData(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    branch: str = 'power'
    goal_text: Optional[str] = None
    goal_level: int = 10
    selfie_url: Optional[str] = None

class User(BaseModel):
    id: str
    tg_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    active_branches: List[str] = ['power']
    is_pro: bool = False
    strength: int = 1
    health: int = 1
    intellect: int = 1
    agility: int = 1
    confidence: int = 1
    stability: int = 1
    avatar_url: Optional[str] = None

class Progress(BaseModel):
    current_level: int = 1
    current_xp: int = 0
    next_level_xp: int = 100
    total_xp: int = 0
    goal_text: Optional[str] = None
    goal_level: int = 10
    goal_progress: int = 0

class Goal(BaseModel):
    id: str
    goal_text: Optional[str] = None
    goal_level: int = 10
    is_completed: bool = False
    completed_at: Optional[str] = None
    notified_at: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
    created_at: Optional[str] = None

class Quest(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    branch: str
    xp_reward: int = 20
    category: str
    is_daily: bool = True
    is_completed: bool = False

class CompleteQuestRequest(BaseModel):
    quest_id: str

class GoalUpdate(BaseModel):
    goal_text: Optional[str] = None
    goal_level: int = 10
    is_completed: Optional[bool] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
    completed_at: Optional[str] = None
    notified_at: Optional[str] = None

class GoalCreate(BaseModel):
    goal_text: Optional[str] = None
    goal_level: int = 10
    notes: Optional[str] = None
    image_url: Optional[str] = None

class AvatarGenerationRequest(BaseModel):
    user_id: str
    level: int
    prompt: str

# API Endpoints

@api_router.get("/")
async def root():
    return {"message": "LifeQuest Hero API v1.0", "status": "ready"}

@api_router.get("/health")
async def health():
    uptime_seconds = int((datetime.utcnow() - START_TIME).total_seconds())
    return {"status": "ok", "uptime_seconds": uptime_seconds, "timestamp": datetime.utcnow().isoformat()}

@api_router.get("/ready")
async def ready():
    try:
        supabase.table('users').select('id').limit(1).execute()
        return {"status": "ok"}
    except Exception:
        raise HTTPException(status_code=503, detail="not ready")

@api_router.get("/metrics")
async def metrics():
    return {
        "requests_total": REQUEST_COUNT,
        "errors_total": ERROR_COUNT,
        "uptime_seconds": int((datetime.utcnow() - START_TIME).total_seconds())
    }

@api_router.post("/users/register", response_model=User)
async def register_user(user_data: UserCreate):
    """Register or get existing user"""
    try:
        # Check if user exists
        result = supabase.table('users').select('*').eq('tg_id', user_data.tg_id).execute()
        
        if result.data and len(result.data) > 0:
            existing_user = result.data[0]
            avatar_url = existing_user.get('avatar_url')
            if avatar_url and "supabase" not in avatar_url:
                supabase.table('users').update({
                    'avatar_url': None,
                    'updated_at': datetime.utcnow().isoformat()
                }).eq('id', existing_user['id']).execute()
                existing_user['avatar_url'] = None
            return existing_user
        
        incoming_avatar_url = user_data.avatar_url
        sanitized_avatar_url = incoming_avatar_url if incoming_avatar_url and "supabase" in incoming_avatar_url else None

        # Create new user
        new_user = {
            'tg_id': user_data.tg_id,
            'username': user_data.username,
            'first_name': user_data.first_name,
            'last_name': user_data.last_name,
            'language_code': user_data.language_code,
            'avatar_url': sanitized_avatar_url,
            'active_branches': ['power'],
            'is_pro': False,
            'strength': 1,
            'health': 1,
            'intellect': 1,
            'agility': 1,
            'confidence': 1,
            'stability': 1
        }
        
        user_result = supabase.table('users').insert(new_user).execute()
        created_user = user_result.data[0]
        
        # Create progress record
        progress = {
            'user_id': created_user['id'],
            'current_level': 1,
            'current_xp': 0,
            'next_level_xp': 100,
            'total_xp': 0
        }
        supabase.table('progress').insert(progress).execute()
        
        return created_user
        
    except Exception as e:
        logging.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def trigger_n8n_webhook(n8n_webhook: str, payload: dict, user_id: str, tg_id: int):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(n8n_webhook, json=payload, timeout=20.0)
            logging.getLogger("lifequest").info(
                f"n8n webhook {response.status_code} user_id={user_id} tg_id={tg_id}"
            )
    except Exception as e:
        logging.error(f"Error calling n8n webhook: {e}")

@api_router.post("/users/{tg_id}/onboarding")
async def complete_onboarding(tg_id: int, onboarding: OnboardingData):
    """Complete onboarding process"""
    try:
        # Get user
        result = supabase.table('users').select('id').eq('tg_id', tg_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = result.data[0]['id']
        
        # Update user data
        user_update = {
            'age': onboarding.age,
            'gender': onboarding.gender,
            'active_branches': [onboarding.branch],
            'selfie_url': onboarding.selfie_url,
            'updated_at': datetime.utcnow().isoformat()
        }
        supabase.table('users').update(user_update).eq('tg_id', tg_id).execute()
        
        # Update progress with goal
        progress_update = {
            'goal_text': onboarding.goal_text,
            'goal_level': onboarding.goal_level,
            'updated_at': datetime.utcnow().isoformat()
        }
        supabase.table('progress').update(progress_update).eq('user_id', user_id).execute()

        if onboarding.goal_text:
            supabase.table('goals').insert({
                'user_id': user_id,
                'goal_text': onboarding.goal_text,
                'goal_level': onboarding.goal_level
            }).execute()
        
        # Trigger avatar generation via n8n webhook
        n8n_webhook = os.environ.get('N8N_WEBHOOK_URL')
        if n8n_webhook:
            payload = {
                'user_id': user_id,
                'tg_id': tg_id,
                'selfie_url': onboarding.selfie_url,
                'branch': onboarding.branch,
                'gender': onboarding.gender,
                'age': onboarding.age,
                'level': 1
            }
            asyncio.create_task(trigger_n8n_webhook(n8n_webhook, payload, user_id, tg_id))
        else:
            logging.getLogger("lifequest").warning("N8N_WEBHOOK_URL is not set")
        
        return {"success": True, "message": "Onboarding completed"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error completing onboarding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{tg_id}", response_model=User)
async def get_user(tg_id: int):
    """Get user by Telegram ID"""
    try:
        result = supabase.table('users').select('*').eq('tg_id', tg_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update last active
        supabase.table('users').update({'last_active_at': datetime.utcnow().isoformat()}).eq('tg_id', tg_id).execute()
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/users/{username}/delete-by-username")
async def delete_user_by_username(username: str):
    """Delete user by username (for testing purposes)"""
    try:
        # Find user by username
        result = supabase.table('users').select('id, tg_id').eq('username', username).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = result.data[0]['id']
        tg_id = result.data[0]['tg_id']
        
        # Delete user_quests
        supabase.table('user_quests').delete().eq('user_id', user_id).execute()
        
        # Delete progress
        supabase.table('progress').delete().eq('user_id', user_id).execute()
        
        # Delete user
        supabase.table('users').delete().eq('id', user_id).execute()
        
        return {"success": True, "message": f"User @{username} (tg_id: {tg_id}) deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{tg_id}/progress", response_model=Progress)
async def get_progress(tg_id: int):
    """Get user progress"""
    try:
        # Get user ID
        user_result = supabase.table('users').select('id').eq('tg_id', tg_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        
        # Get progress
        result = supabase.table('progress').select('*').eq('user_id', user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Progress not found")
        
        progress = result.data[0]
        # Calculate goal progress
        progress['goal_progress'] = int((progress['current_level'] / progress.get('goal_level', 10)) * 100)
        
        return progress
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{tg_id}/goals", response_model=List[Goal])
async def get_goals(tg_id: int):
    try:
        user_result = supabase.table('users').select('id').eq('tg_id', tg_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        goals_result = supabase.table('goals').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        return goals_result.data or []
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting goals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/users/{tg_id}/goals", response_model=Goal)
async def create_goal(tg_id: int, goal: GoalCreate):
    try:
        user_result = supabase.table('users').select('id').eq('tg_id', tg_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        insert_payload = {
            'user_id': user_id,
            'goal_text': goal.goal_text,
            'goal_level': goal.goal_level,
            'notes': goal.notes,
            'image_url': goal.image_url
        }
        result = supabase.table('goals').insert(insert_payload).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/users/{tg_id}/goals/{goal_id}", response_model=Goal)
async def update_goal(tg_id: int, goal_id: str, goal: GoalUpdate):
    try:
        user_result = supabase.table('users').select('id').eq('tg_id', tg_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        update_payload = {
            'goal_text': goal.goal_text,
            'goal_level': goal.goal_level,
            'is_completed': goal.is_completed,
            'notes': goal.notes,
            'image_url': goal.image_url,
            'completed_at': goal.completed_at,
            'notified_at': goal.notified_at,
            'updated_at': datetime.utcnow().isoformat()
        }
        update_payload = {key: value for key, value in update_payload.items() if value is not None}
        
        result = supabase.table('goals').update(update_payload).eq('id', goal_id).eq('user_id', user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Goal not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/users/{tg_id}/goals/{goal_id}/complete", response_model=Goal)
async def complete_goal(tg_id: int, goal_id: str):
    try:
        user_result = supabase.table('users').select('id').eq('tg_id', tg_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        now = datetime.utcnow().isoformat()
        result = supabase.table('goals').update({
            'is_completed': True,
            'completed_at': now,
            'updated_at': now
        }).eq('id', goal_id).eq('user_id', user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Goal not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error completing goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def send_goal_achieved_notification(tg_id: int, goal_text: str, level: int):
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not token:
        logging.warning("TELEGRAM_BOT_TOKEN not set")
        return
    message = f"🎁 Ты достиг уровня {level} и заслужил: {goal_text}"
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    async with httpx.AsyncClient() as client:
        await client.post(url, json={"chat_id": tg_id, "text": message}, timeout=10.0)

@api_router.post("/users/{tg_id}/goals/{goal_id}/notify")
async def notify_goal(tg_id: int, goal_id: str):
    try:
        user_result = supabase.table('users').select('id').eq('tg_id', tg_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        goal_result = supabase.table('goals').select('*').eq('id', goal_id).eq('user_id', user_id).execute()
        if not goal_result.data:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        goal = goal_result.data[0]
        await send_goal_achieved_notification(tg_id, goal.get('goal_text') or 'Цель', goal.get('goal_level') or 1)
        supabase.table('goals').update({
            'notified_at': datetime.utcnow().isoformat()
        }).eq('id', goal_id).execute()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error sending goal notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{tg_id}/daily-xp")
async def get_daily_xp(tg_id: int):
    try:
        user_result = supabase.table('users').select('id, active_branches').eq('tg_id', tg_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_result.data[0]
        branches = user['active_branches']
        quest_branches = branches + ['global']
        quests_result = supabase.table('quests').select('title, xp_reward').in_('branch', quest_branches).eq('is_daily', True).execute()
        quests = quests_result.data or []
        bonus_quest = next((quest for quest in quests if quest.get('title') == BONUS_DAILY_TITLE), None)
        daily_quests = [quest for quest in quests if quest.get('title') != BONUS_DAILY_TITLE]
        daily_xp = sum(quest.get('xp_reward', 0) for quest in daily_quests)
        bonus_xp = bonus_quest.get('xp_reward', 0) if bonus_quest else 0
        return {
            "daily_xp": daily_xp + bonus_xp,
            "daily_quest_count": len(daily_quests),
            "bonus_xp": bonus_xp
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting daily xp: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/users/{tg_id}/goal")
async def update_goal(tg_id: int, goal: GoalUpdate):
    try:
        user_result = supabase.table('users').select('id').eq('tg_id', tg_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        update_payload = {
            'goal_text': goal.goal_text,
            'goal_level': goal.goal_level,
            'updated_at': datetime.utcnow().isoformat()
        }
        supabase.table('progress').update(update_payload).eq('user_id', user_id).execute()
        
        progress_result = supabase.table('progress').select('*').eq('user_id', user_id).execute()
        if not progress_result.data:
            raise HTTPException(status_code=404, detail="Progress not found")
        
        progress = progress_result.data[0]
        progress['goal_progress'] = int((progress['current_level'] / progress.get('goal_level', 10)) * 100)
        
        return {"success": True, "progress": progress}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{tg_id}/quests", response_model=List[Quest])
async def get_quests(tg_id: int):
    """Get quests for user based on their active branches"""
    start_time = perf_counter()
    try:
        # Get user and their branches
        user_result = supabase.table('users').select('id, active_branches').eq('tg_id', tg_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_result.data[0]
        user_id = user['id']
        branches = user['active_branches']
        
        # Get quests for user's branches + global
        quest_branches = branches + ['global']
        quests_result = supabase.table('quests').select('*').in_('branch', quest_branches).eq('is_daily', True).execute()
        filtered_quests = [quest for quest in quests_result.data if quest.get('title') != BONUS_DAILY_TITLE]
        
        # Get completed quests for today
        today = date.today().isoformat()
        completed_result = supabase.table('user_quests').select('quest_id').eq('user_id', user_id).eq('completion_date', today).execute()
        completed_quest_ids = [q['quest_id'] for q in completed_result.data]
        
        # Mark completed quests
        quests = []
        for quest in filtered_quests:
            quest['is_completed'] = quest['id'] in completed_quest_ids
            quests.append(quest)
        
        return quests
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting quests: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        duration = perf_counter() - start_time
        logging.getLogger("lifequest").info(f"get_quests {tg_id} {duration:.3f}")

@api_router.post("/users/{tg_id}/quests/complete")
async def complete_quest(tg_id: int, request: CompleteQuestRequest):
    """Complete a quest and award XP"""
    start_time = perf_counter()
    try:
        # Get user
        user_result = supabase.table('users').select('id, active_branches').eq('tg_id', tg_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_result.data[0]
        user_id = user['id']
        
        # Check if quest already completed today
        today = date.today().isoformat()
        completed_check = supabase.table('user_quests').select('id').eq('user_id', user_id).eq('quest_id', request.quest_id).eq('completion_date', today).execute()
        
        if completed_check.data:
            raise HTTPException(status_code=400, detail="Quest already completed today")
        
        # Get quest details
        quest_result = supabase.table('quests').select('*').eq('id', request.quest_id).execute()
        if not quest_result.data:
            raise HTTPException(status_code=404, detail="Quest not found")
        
        quest = quest_result.data[0]
        xp_reward = quest['xp_reward']
        
        # Mark quest as completed
        supabase.table('user_quests').insert({
            'user_id': user_id,
            'quest_id': request.quest_id,
            'completion_date': today,
            'is_today': True
        }).execute()
        
        # Add XP and check for level up
        result = supabase.rpc('add_xp_and_check_level', {
            'p_user_id': user_id,
            'p_xp_amount': xp_reward
        }).execute()
        
        level_up_data = result.data[0] if result.data else None
        leveled_up = level_up_data['leveled_up'] if level_up_data else False
        new_level = level_up_data['new_level'] if level_up_data else 1
        bonus_awarded = False
        bonus_xp = 0
        bonus_leveled_up = False
        bonus_new_level = None
        
        # If leveled up, update stats
        if leveled_up:
            branches = user['active_branches']
            supabase.rpc('update_stats_on_levelup', {
                'p_user_id': user_id,
                'p_branches': branches
            }).execute()
            
            # Trigger avatar regeneration every 5 levels
            if new_level % 5 == 0:
                n8n_webhook = os.environ.get('N8N_WEBHOOK_URL')
                if n8n_webhook:
                    try:
                        user_full = supabase.table('users').select('*').eq('id', user_id).execute()
                        user_data = user_full.data[0] if user_full.data else {}
                        
                        async with httpx.AsyncClient() as client:
                            await client.post(n8n_webhook, json={
                                'user_id': user_id,
                                'tg_id': tg_id,
                                'selfie_url': user_data.get('selfie_url'),
                                'branch': branches[0] if branches else 'power',
                                'gender': user_data.get('gender'),
                                'age': user_data.get('age'),
                                'level': new_level
                            }, timeout=5.0)
                    except Exception as e:
                        logging.error(f"Error calling n8n webhook for avatar: {e}")

        quest_branches = user['active_branches'] + ['global']
        all_quests_result = supabase.table('quests').select('*').in_('branch', quest_branches).eq('is_daily', True).execute()
        all_quests = all_quests_result.data or []
        bonus_quest = next((quest for quest in all_quests if quest.get('title') == BONUS_DAILY_TITLE), None)
        daily_quest_ids = [quest['id'] for quest in all_quests if quest.get('title') != BONUS_DAILY_TITLE]
        completed_today_result = supabase.table('user_quests').select('quest_id').eq('user_id', user_id).eq('completion_date', today).execute()
        completed_today = completed_today_result.data or []
        completed_today_ids = {quest['quest_id'] for quest in completed_today}

        if daily_quest_ids and all(quest_id in completed_today_ids for quest_id in daily_quest_ids) and bonus_quest:
            bonus_xp = bonus_quest.get('xp_reward', 0)
            bonus_quest_id = bonus_quest['id']
            bonus_check = supabase.table('user_quests').select('id').eq('user_id', user_id).eq('quest_id', bonus_quest_id).eq('completion_date', today).execute()
            if not bonus_check.data:
                supabase.table('user_quests').insert({
                    'user_id': user_id,
                    'quest_id': bonus_quest_id,
                    'completion_date': today,
                    'is_today': True
                }).execute()
                bonus_result = supabase.rpc('add_xp_and_check_level', {
                    'p_user_id': user_id,
                    'p_xp_amount': bonus_xp
                }).execute()
                bonus_level_up_data = bonus_result.data[0] if bonus_result.data else None
                bonus_leveled_up = bonus_level_up_data['leveled_up'] if bonus_level_up_data else False
                bonus_new_level = bonus_level_up_data['new_level'] if bonus_level_up_data else None
                bonus_awarded = True

                if bonus_leveled_up:
                    branches = user['active_branches']
                    supabase.rpc('update_stats_on_levelup', {
                        'p_user_id': user_id,
                        'p_branches': branches
                    }).execute()
                    
                    if bonus_new_level and bonus_new_level % 5 == 0:
                        n8n_webhook = os.environ.get('N8N_WEBHOOK_URL')
                        if n8n_webhook:
                            try:
                                user_full = supabase.table('users').select('*').eq('id', user_id).execute()
                                user_data = user_full.data[0] if user_full.data else {}
                                
                                async with httpx.AsyncClient() as client:
                                    await client.post(n8n_webhook, json={
                                        'user_id': user_id,
                                        'tg_id': tg_id,
                                        'selfie_url': user_data.get('selfie_url'),
                                        'branch': branches[0] if branches else 'power',
                                        'gender': user_data.get('gender'),
                                        'age': user_data.get('age'),
                                        'level': bonus_new_level
                                    }, timeout=5.0)
                            except Exception as e:
                                logging.error(f"Error calling n8n webhook for avatar: {e}")
        
        effective_level = max(new_level, bonus_new_level or new_level)
        goals_result = supabase.table('goals').select('*').eq('user_id', user_id).eq('is_completed', False).execute()
        goals_data = goals_result.data or []
        achieved_goals = [
            goal for goal in goals_data
            if (goal.get('goal_level') or 1) <= effective_level and goal.get('notified_at') is None
        ]

        for goal in achieved_goals:
            try:
                await send_goal_achieved_notification(tg_id, goal.get('goal_text') or 'Цель', effective_level)
                supabase.table('goals').update({
                    'notified_at': datetime.utcnow().isoformat()
                }).eq('id', goal['id']).execute()
            except Exception as e:
                logging.error(f"Error sending goal achieved notification: {e}")

        return {
            "success": True,
            "xp_gained": xp_reward,
            "leveled_up": leveled_up,
            "new_level": new_level,
            "bonus_awarded": bonus_awarded,
            "bonus_xp": bonus_xp,
            "bonus_leveled_up": bonus_leveled_up,
            "bonus_new_level": bonus_new_level,
            "achieved_goals": achieved_goals
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error completing quest: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        duration = perf_counter() - start_time
        logging.getLogger("lifequest").info(f"complete_quest {tg_id} {request.quest_id} {duration:.3f}")

@api_router.post("/webhooks/avatar-generated")
async def avatar_generated_webhook(data: dict):
    """Webhook to receive generated avatar from n8n"""
    try:
        # Логируем полученные данные
        logging.info(f"Avatar webhook received data: {data}")
        
        user_id = data.get('user_id')
        avatar_url = data.get('avatar_url')
        
        if not user_id or not avatar_url:
            logging.error(f"Missing fields - user_id: {user_id}, avatar_url: {avatar_url}")
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Update user avatar
        supabase.table('users').update({
            'avatar_url': avatar_url,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', user_id).execute()
        
        # Log avatar generation
        supabase.table('avatar_generations').insert({
            'user_id': user_id,
            'level': data.get('level', 1),
            'avatar_url': avatar_url,
            'generation_status': 'completed'
        }).execute()
        
        logging.info(f"Avatar updated for user {user_id}: {avatar_url}")
        return {"success": True, "message": "Avatar updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error processing avatar webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/users/{tg_id}/pro/activate")
async def activate_pro(tg_id: int):
    """Activate PRO subscription (called after successful payment)"""
    try:
        # In production, this would be called by Telegram payment webhook
        # For now, simple activation
        supabase.table('users').update({
            'is_pro': True,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('tg_id', tg_id).execute()
        
        return {"success": True, "message": "PRO activated"}
        
    except Exception as e:
        logging.error(f"Error activating PRO: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/users/{tg_id}/branches/add")
async def add_branch(tg_id: int, branch: str):
    """Add a branch to user's active branches (PRO feature)"""
    try:
        # Get user
        result = supabase.table('users').select('*').eq('tg_id', tg_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = result.data[0]
        
        if not user['is_pro']:
            raise HTTPException(status_code=403, detail="PRO subscription required")
        
        # Add branch if not already active
        branches = user.get('active_branches', [])
        if branch not in branches:
            branches.append(branch)
            supabase.table('users').update({
                'active_branches': branches,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('tg_id', tg_id).execute()
        
        return {"success": True, "active_branches": branches}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error adding branch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
logger = logging.getLogger("lifequest")
