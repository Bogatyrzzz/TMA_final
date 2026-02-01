from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
import httpx
from supabase_client import get_supabase

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

supabase = get_supabase()

# Create the main app without a prefix
app = FastAPI(title="LifeQuest Hero API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    tg_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language_code: str = 'en'

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

class AvatarGenerationRequest(BaseModel):
    user_id: str
    level: int
    prompt: str

# API Endpoints

@api_router.get("/")
async def root():
    return {"message": "LifeQuest Hero API v1.0", "status": "ready"}

@api_router.post("/users/register", response_model=User)
async def register_user(user_data: UserCreate):
    """Register or get existing user"""
    try:
        # Check if user exists
        result = supabase.table('users').select('*').eq('tg_id', user_data.tg_id).execute()
        
        if result.data and len(result.data) > 0:
            # User exists, return it
            return result.data[0]
        
        # Create new user
        new_user = {
            'tg_id': user_data.tg_id,
            'username': user_data.username,
            'first_name': user_data.first_name,
            'last_name': user_data.last_name,
            'language_code': user_data.language_code,
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
        
        # Trigger avatar generation via n8n webhook if URL is provided
        n8n_webhook = os.environ.get('N8N_WEBHOOK_URL')
        if n8n_webhook and onboarding.selfie_url:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(n8n_webhook, json={
                        'user_id': user_id,
                        'tg_id': tg_id,
                        'selfie_url': onboarding.selfie_url,
                        'branch': onboarding.branch,
                        'gender': onboarding.gender,
                        'age': onboarding.age,
                        'level': 1
                    }, timeout=5.0)
            except Exception as e:
                logging.error(f"Error calling n8n webhook: {e}")
        
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

@api_router.get("/users/{tg_id}/quests", response_model=List[Quest])
async def get_quests(tg_id: int):
    """Get quests for user based on their active branches"""
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
        
        # Get completed quests for today
        today = date.today().isoformat()
        completed_result = supabase.table('user_quests').select('quest_id').eq('user_id', user_id).eq('completion_date', today).execute()
        completed_quest_ids = [q['quest_id'] for q in completed_result.data]
        
        # Mark completed quests
        quests = []
        for quest in quests_result.data:
            quest['is_completed'] = quest['id'] in completed_quest_ids
            quests.append(quest)
        
        return quests
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting quests: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/users/{tg_id}/quests/complete")
async def complete_quest(tg_id: int, request: CompleteQuestRequest):
    """Complete a quest and award XP"""
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
        
        return {
            "success": True,
            "xp_gained": xp_reward,
            "leveled_up": leveled_up,
            "new_level": new_level
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error completing quest: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhooks/avatar-generated")
async def avatar_generated_webhook(data: dict):
    """Webhook to receive generated avatar from n8n"""
    try:
        user_id = data.get('user_id')
        avatar_url = data.get('avatar_url')
        
        if not user_id or not avatar_url:
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
