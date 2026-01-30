"""
Backend API Tests for Hair Salon Booking App
Tests: Auth, Services, Hairdressers, Availability, Appointments, Admin
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@parrucco.it"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = f"test_user_{datetime.now().strftime('%Y%m%d%H%M%S')}@test.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Test User"
TEST_USER_PHONE = "+393331234567"


class TestHealthAndSettings:
    """Test basic API health and settings endpoints"""
    
    def test_settings_endpoint(self):
        """GET /api/settings should return app settings"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "time_slots" in data
        assert "working_days" in data
        assert "hero_title" in data
        assert isinstance(data["time_slots"], list)
        assert len(data["time_slots"]) > 0
        print(f"✓ Settings endpoint working - {len(data['time_slots'])} time slots configured")


class TestPublicEndpoints:
    """Test public endpoints (no auth required)"""
    
    def test_get_services(self):
        """GET /api/services should return list of services"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Validate service structure
        service = data[0]
        assert "id" in service
        assert "name" in service
        assert "duration_minutes" in service
        assert "price" in service
        print(f"✓ Services endpoint working - {len(data)} services found")
        return data
    
    def test_get_hairdressers(self):
        """GET /api/hairdressers should return list of hairdressers"""
        response = requests.get(f"{BASE_URL}/api/hairdressers")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Validate hairdresser structure
        hairdresser = data[0]
        assert "id" in hairdresser
        assert "name" in hairdresser
        assert "specialties" in hairdresser
        print(f"✓ Hairdressers endpoint working - {len(data)} hairdressers found")
        return data


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_register_new_user(self):
        """POST /api/auth/register should create new user"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME,
            "phone": TEST_USER_PHONE
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        assert data["user"]["name"] == TEST_USER_NAME
        print(f"✓ User registration successful - {TEST_USER_EMAIL}")
        return data
    
    def test_register_duplicate_email(self):
        """POST /api/auth/register with existing email should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "anypassword",
            "name": "Test",
            "phone": "+393331234567"
        })
        assert response.status_code == 400
        print("✓ Duplicate email registration correctly rejected")
    
    def test_login_admin(self):
        """POST /api/auth/login with admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["is_admin"] == True
        print(f"✓ Admin login successful - is_admin: {data['user']['is_admin']}")
        return data
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with wrong password should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")


class TestAvailability:
    """Test availability endpoint"""
    
    def test_check_availability(self):
        """POST /api/availability should return available slots"""
        # Get services and hairdressers first
        services = requests.get(f"{BASE_URL}/api/services").json()
        hairdressers = requests.get(f"{BASE_URL}/api/hairdressers").json()
        
        assert len(services) > 0, "No services found"
        assert len(hairdressers) > 0, "No hairdressers found"
        
        # Get tomorrow's date (to ensure it's a future date)
        tomorrow = datetime.now() + timedelta(days=1)
        # Skip to Monday if tomorrow is Sunday
        if tomorrow.weekday() == 6:  # Sunday
            tomorrow = tomorrow + timedelta(days=1)
        
        date_str = tomorrow.strftime('%Y-%m-%d')
        
        response = requests.post(f"{BASE_URL}/api/availability", json={
            "date": date_str,
            "service_id": services[0]["id"],
            "hairdresser_id": hairdressers[0]["id"]
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "date" in data
        assert "available_slots" in data
        assert data["date"] == date_str
        assert isinstance(data["available_slots"], list)
        print(f"✓ Availability check working - {len(data['available_slots'])} slots available for {date_str}")
        return data
    
    def test_availability_invalid_service(self):
        """POST /api/availability with invalid service should fail"""
        hairdressers = requests.get(f"{BASE_URL}/api/hairdressers").json()
        tomorrow = datetime.now() + timedelta(days=1)
        
        response = requests.post(f"{BASE_URL}/api/availability", json={
            "date": tomorrow.strftime('%Y-%m-%d'),
            "service_id": "invalid-service-id",
            "hairdresser_id": hairdressers[0]["id"]
        })
        assert response.status_code == 404
        print("✓ Invalid service correctly rejected in availability check")


class TestAppointments:
    """Test appointment CRUD operations"""
    
    @pytest.fixture
    def user_token(self):
        """Get user token for authenticated requests"""
        # First try to login with test user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if response.status_code != 200:
            # Register new user if login fails
            unique_email = f"test_apt_{datetime.now().strftime('%Y%m%d%H%M%S%f')}@test.com"
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": unique_email,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME,
                "phone": TEST_USER_PHONE
            })
        
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_create_appointment(self, user_token):
        """POST /api/appointments should create new appointment"""
        services = requests.get(f"{BASE_URL}/api/services").json()
        hairdressers = requests.get(f"{BASE_URL}/api/hairdressers").json()
        
        # Get a future date (skip Sunday)
        future_date = datetime.now() + timedelta(days=2)
        if future_date.weekday() == 6:  # Sunday
            future_date = future_date + timedelta(days=1)
        
        # Set time to 10:00
        appointment_time = future_date.replace(hour=10, minute=0, second=0, microsecond=0)
        
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(f"{BASE_URL}/api/appointments", 
            json={
                "service_id": services[0]["id"],
                "hairdresser_id": hairdressers[0]["id"],
                "date_time": appointment_time.isoformat()
            },
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["status"] == "pending"
        assert data["service_name"] == services[0]["name"]
        assert data["hairdresser_name"] == hairdressers[0]["name"]
        print(f"✓ Appointment created successfully - ID: {data['id']}")
        return data
    
    def test_get_my_appointments(self, user_token):
        """GET /api/appointments/my should return user's appointments"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/appointments/my", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ My appointments endpoint working - {len(data)} appointments found")
        return data
    
    def test_create_appointment_past_date(self, user_token):
        """POST /api/appointments with past date should fail"""
        services = requests.get(f"{BASE_URL}/api/services").json()
        hairdressers = requests.get(f"{BASE_URL}/api/hairdressers").json()
        
        past_date = datetime.now() - timedelta(days=1)
        
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(f"{BASE_URL}/api/appointments",
            json={
                "service_id": services[0]["id"],
                "hairdresser_id": hairdressers[0]["id"],
                "date_time": past_date.isoformat()
            },
            headers=headers
        )
        assert response.status_code == 400
        print("✓ Past date appointment correctly rejected")


class TestAdminEndpoints:
    """Test admin-only endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_admin_get_all_appointments(self, admin_token):
        """GET /api/admin/appointments should return all appointments"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/appointments", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin appointments endpoint working - {len(data)} total appointments")
        return data
    
    def test_admin_filter_by_date(self, admin_token):
        """GET /api/admin/appointments with date filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        today = datetime.now().strftime('%Y-%m-%d')
        
        response = requests.get(f"{BASE_URL}/api/admin/appointments?date={today}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin date filter working - {len(data)} appointments for today")
    
    def test_admin_filter_by_status(self, admin_token):
        """GET /api/admin/appointments with status filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/appointments?status=pending", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # All returned appointments should be pending
        for apt in data:
            assert apt["status"] == "pending"
        print(f"✓ Admin status filter working - {len(data)} pending appointments")
    
    def test_admin_confirm_appointment(self, admin_token):
        """PATCH /api/admin/appointments/{id}/confirm should confirm appointment"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get pending appointments
        response = requests.get(f"{BASE_URL}/api/admin/appointments?status=pending", headers=headers)
        appointments = response.json()
        
        if len(appointments) == 0:
            pytest.skip("No pending appointments to confirm")
        
        apt_id = appointments[0]["id"]
        response = requests.patch(f"{BASE_URL}/api/admin/appointments/{apt_id}/confirm", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "confirmed"
        print(f"✓ Appointment confirmed successfully - ID: {apt_id}")
    
    def test_admin_cancel_appointment(self, admin_token):
        """PATCH /api/admin/appointments/{id} with status=cancelled"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get any non-cancelled appointment
        response = requests.get(f"{BASE_URL}/api/admin/appointments", headers=headers)
        appointments = [a for a in response.json() if a["status"] != "cancelled"]
        
        if len(appointments) == 0:
            pytest.skip("No appointments to cancel")
        
        apt_id = appointments[0]["id"]
        response = requests.patch(f"{BASE_URL}/api/admin/appointments/{apt_id}",
            json={"status": "cancelled"},
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "cancelled"
        print(f"✓ Appointment cancelled successfully - ID: {apt_id}")
    
    def test_non_admin_access_denied(self):
        """Admin endpoints should reject non-admin users"""
        # Register a regular user
        unique_email = f"regular_{datetime.now().strftime('%Y%m%d%H%M%S%f')}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass",
            "name": "Regular User",
            "phone": "+393331234567"
        })
        
        if reg_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        user_token = reg_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {user_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/appointments", headers=headers)
        assert response.status_code == 403
        print("✓ Non-admin access correctly denied")


class TestAdminServicesManagement:
    """Test admin service management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_create_service(self, admin_token):
        """POST /api/admin/services should create new service"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(f"{BASE_URL}/api/admin/services",
            json={
                "name": "TEST_Service",
                "duration_minutes": 45,
                "price": 50.0,
                "description": "Test service description"
            },
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "TEST_Service"
        assert data["duration_minutes"] == 45
        assert data["price"] == 50.0
        print(f"✓ Service created - ID: {data['id']}")
        return data
    
    def test_update_service(self, admin_token):
        """PUT /api/admin/services/{id} should update service"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get existing services
        services = requests.get(f"{BASE_URL}/api/services").json()
        if len(services) == 0:
            pytest.skip("No services to update")
        
        service_id = services[0]["id"]
        original_name = services[0]["name"]
        
        response = requests.put(f"{BASE_URL}/api/admin/services/{service_id}",
            json={"price": 99.99},
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["price"] == 99.99
        assert data["name"] == original_name  # Name unchanged
        print(f"✓ Service updated - ID: {service_id}")


class TestAdminHairdressersManagement:
    """Test admin hairdresser management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_create_hairdresser(self, admin_token):
        """POST /api/admin/hairdressers should create new hairdresser"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(f"{BASE_URL}/api/admin/hairdressers",
            json={
                "name": "TEST_Hairdresser",
                "specialties": ["Taglio", "Colore"]
            },
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "TEST_Hairdresser"
        assert "Taglio" in data["specialties"]
        print(f"✓ Hairdresser created - ID: {data['id']}")
        return data
    
    def test_update_hairdresser(self, admin_token):
        """PUT /api/admin/hairdressers/{id} should update hairdresser"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get existing hairdressers
        hairdressers = requests.get(f"{BASE_URL}/api/hairdressers").json()
        if len(hairdressers) == 0:
            pytest.skip("No hairdressers to update")
        
        hairdresser_id = hairdressers[0]["id"]
        
        response = requests.put(f"{BASE_URL}/api/admin/hairdressers/{hairdresser_id}",
            json={"specialties": ["Taglio Uomo", "Taglio Donna", "Barba"]},
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "Barba" in data["specialties"]
        print(f"✓ Hairdresser updated - ID: {hairdresser_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
