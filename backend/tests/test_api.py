"""
LifeQuest Hero API Tests
Tests for user registration, progress, quests, and PRO features
"""
import pytest
import requests
import os

BASE_URL = (
    os.environ.get('BACKEND_URL')
    or os.environ.get('REACT_APP_BACKEND_URL')
    or 'http://localhost:8000'
).rstrip('/')
TEST_TG_ID = 123456789

class TestHealthCheck:
    """API health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert "LifeQuest Hero API" in data["message"]


class TestUserEndpoints:
    """User registration and retrieval tests"""
    
    def test_get_existing_user(self):
        """Test getting existing test user"""
        response = requests.get(f"{BASE_URL}/api/users/{TEST_TG_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["tg_id"] == TEST_TG_ID
        assert "id" in data
        assert "first_name" in data
        assert "age" in data  # Should have age from onboarding
        assert "gender" in data  # Should have gender from onboarding
        assert "strength" in data
        assert "health" in data
        assert "intellect" in data
        assert "agility" in data
        assert "confidence" in data
        assert "stability" in data
        assert "active_branches" in data
        assert isinstance(data["active_branches"], list)
    
    def test_get_nonexistent_user(self):
        """Test getting non-existent user returns 404"""
        response = requests.get(f"{BASE_URL}/api/users/999999999999")
        assert response.status_code == 404
    
    def test_register_user_returns_existing(self):
        """Test registering existing user returns the user"""
        payload = {
            "tg_id": TEST_TG_ID,
            "username": "testuser",
            "first_name": "Test",
            "last_name": "User",
            "language_code": "ru"
        }
        response = requests.post(f"{BASE_URL}/api/users/register", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["tg_id"] == TEST_TG_ID
        assert "id" in data


class TestProgressEndpoints:
    """User progress tests"""
    
    def test_get_progress(self):
        """Test getting user progress"""
        response = requests.get(f"{BASE_URL}/api/users/{TEST_TG_ID}/progress")
        assert response.status_code == 200
        
        data = response.json()
        assert "current_level" in data
        assert "current_xp" in data
        assert "next_level_xp" in data
        assert "total_xp" in data
        assert "goal_progress" in data
        assert isinstance(data["current_level"], int)
        assert isinstance(data["current_xp"], int)
        assert data["current_level"] >= 1
    
    def test_get_progress_nonexistent_user(self):
        """Test getting progress for non-existent user returns 404"""
        response = requests.get(f"{BASE_URL}/api/users/999999999999/progress")
        assert response.status_code == 404


class TestQuestEndpoints:
    """Quest retrieval and completion tests"""
    
    def test_get_quests(self):
        """Test getting quests for user"""
        response = requests.get(f"{BASE_URL}/api/users/{TEST_TG_ID}/quests")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check quest structure
        quest = data[0]
        assert "id" in quest
        assert "title" in quest
        assert "xp_reward" in quest
        assert "branch" in quest
        assert "is_completed" in quest
        assert "is_daily" in quest
    
    def test_get_quests_nonexistent_user(self):
        """Test getting quests for non-existent user returns 404"""
        response = requests.get(f"{BASE_URL}/api/users/999999999999/quests")
        assert response.status_code == 404
    
    def test_complete_quest_invalid_quest_id(self):
        """Test completing non-existent quest returns 404"""
        payload = {"quest_id": "00000000-0000-0000-0000-000000000000"}
        response = requests.post(
            f"{BASE_URL}/api/users/{TEST_TG_ID}/quests/complete",
            json=payload
        )
        assert response.status_code == 404
    
    def test_complete_quest_success(self):
        """Test completing an uncompleted quest"""
        # First get quests to find an uncompleted one
        quests_response = requests.get(f"{BASE_URL}/api/users/{TEST_TG_ID}/quests")
        quests = quests_response.json()
        
        uncompleted = [q for q in quests if not q["is_completed"]]
        if not uncompleted:
            pytest.skip("No uncompleted quests available for testing")
        
        quest = uncompleted[0]
        payload = {"quest_id": quest["id"]}
        
        response = requests.post(
            f"{BASE_URL}/api/users/{TEST_TG_ID}/quests/complete",
            json=payload
        )
        
        # Should succeed or return 400 if already completed today
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] == True
            assert "xp_gained" in data
            assert "leveled_up" in data


class TestProFeatures:
    """PRO subscription tests"""
    
    def test_activate_pro(self):
        """Test activating PRO subscription"""
        response = requests.post(f"{BASE_URL}/api/users/{TEST_TG_ID}/pro/activate")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        
        # Verify user is now PRO
        user_response = requests.get(f"{BASE_URL}/api/users/{TEST_TG_ID}")
        user_data = user_response.json()
        assert user_data["is_pro"] == True
    
    def test_add_branch_as_pro(self):
        """Test adding branch as PRO user"""
        # First ensure user is PRO
        requests.post(f"{BASE_URL}/api/users/{TEST_TG_ID}/pro/activate")
        
        # Add a new branch
        response = requests.post(
            f"{BASE_URL}/api/users/{TEST_TG_ID}/branches/add",
            params={"branch": "mind"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "active_branches" in data


class TestOnboarding:
    """Onboarding endpoint tests"""
    
    def test_onboarding_nonexistent_user(self):
        """Test onboarding for non-existent user returns 404"""
        payload = {
            "age": 25,
            "gender": "male",
            "branch": "power",
            "goal_text": "Test goal",
            "goal_level": 10
        }
        response = requests.post(
            f"{BASE_URL}/api/users/999999999999/onboarding",
            json=payload
        )
        assert response.status_code == 404


class TestWebhooks:
    """Webhook endpoint tests"""
    
    def test_avatar_webhook_missing_fields(self):
        """Test avatar webhook with missing fields returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/webhooks/avatar-generated",
            json={"user_id": "test"}  # Missing avatar_url
        )
        assert response.status_code == 400
