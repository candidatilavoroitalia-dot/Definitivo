"""
Backend API Tests for Bug Fixes:
1. Slot validation - prevent double booking
2. Admin reschedule appointments
3. Admin delete appointments
4. Admin cancel appointments
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@parrucco.it"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = "testslot@test.com"
TEST_USER_PASSWORD = "test123"


class TestSlotValidation:
    """Test that occupied slots cannot be double-booked"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture
    def user1_token(self):
        """Get or create first test user"""
        # Try login first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "slottest_user1@test.com",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        
        # Register new user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "slottest_user1@test.com",
            "password": "test123",
            "name": "Slot Test User 1",
            "phone": "+393331111111"
        })
        assert response.status_code == 200, f"User1 registration failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture
    def user2_token(self):
        """Get or create second test user"""
        # Try login first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "slottest_user2@test.com",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        
        # Register new user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "slottest_user2@test.com",
            "password": "test123",
            "name": "Slot Test User 2",
            "phone": "+393332222222"
        })
        assert response.status_code == 200, f"User2 registration failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture
    def service_and_hairdresser(self):
        """Get first service and hairdresser"""
        services = requests.get(f"{BASE_URL}/api/services").json()
        hairdressers = requests.get(f"{BASE_URL}/api/hairdressers").json()
        assert len(services) > 0, "No services found"
        assert len(hairdressers) > 0, "No hairdressers found"
        return services[0], hairdressers[0]
    
    def test_double_booking_same_slot_fails(self, user1_token, user2_token, service_and_hairdresser, admin_token):
        """
        BUG FIX TEST: When user1 books a slot, user2 should NOT be able to book the same slot
        """
        service, hairdresser = service_and_hairdresser
        
        # Find a future date (skip Sunday)
        future_date = datetime.now() + timedelta(days=3)
        while future_date.weekday() == 6:  # Skip Sunday
            future_date = future_date + timedelta(days=1)
        
        # Use a specific time slot
        appointment_time = future_date.replace(hour=11, minute=0, second=0, microsecond=0)
        
        # User 1 books the slot
        headers1 = {"Authorization": f"Bearer {user1_token}"}
        response1 = requests.post(f"{BASE_URL}/api/appointments",
            json={
                "service_id": service["id"],
                "hairdresser_id": hairdresser["id"],
                "date_time": appointment_time.isoformat()
            },
            headers=headers1
        )
        
        assert response1.status_code == 200, f"User1 booking failed: {response1.text}"
        appointment1 = response1.json()
        print(f"✓ User1 successfully booked slot at {appointment_time.strftime('%Y-%m-%d %H:%M')}")
        
        # User 2 tries to book the SAME slot - should FAIL
        headers2 = {"Authorization": f"Bearer {user2_token}"}
        response2 = requests.post(f"{BASE_URL}/api/appointments",
            json={
                "service_id": service["id"],
                "hairdresser_id": hairdresser["id"],
                "date_time": appointment_time.isoformat()
            },
            headers=headers2
        )
        
        # This should fail with 400 error
        assert response2.status_code == 400, f"Double booking should fail! Got status {response2.status_code}: {response2.text}"
        
        error_detail = response2.json().get("detail", "")
        assert "disponibile" in error_detail.lower() or "orario" in error_detail.lower(), \
            f"Error message should mention slot not available: {error_detail}"
        
        print(f"✓ User2 correctly rejected from booking same slot - Error: {error_detail}")
        
        # Cleanup: Delete the appointment
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        requests.delete(f"{BASE_URL}/api/admin/appointments/{appointment1['id']}", headers=admin_headers)
        print(f"✓ Cleanup: Deleted test appointment {appointment1['id']}")
    
    def test_availability_excludes_booked_slots(self, user1_token, service_and_hairdresser, admin_token):
        """
        Test that /api/availability endpoint correctly excludes booked slots
        """
        service, hairdresser = service_and_hairdresser
        
        # Find a future date (skip Sunday)
        future_date = datetime.now() + timedelta(days=4)
        while future_date.weekday() == 6:
            future_date = future_date + timedelta(days=1)
        
        date_str = future_date.strftime('%Y-%m-%d')
        
        # Check availability BEFORE booking
        avail_before = requests.post(f"{BASE_URL}/api/availability", json={
            "date": date_str,
            "service_id": service["id"],
            "hairdresser_id": hairdresser["id"]
        })
        assert avail_before.status_code == 200
        slots_before = avail_before.json()["available_slots"]
        
        # Book a slot (10:00)
        appointment_time = future_date.replace(hour=10, minute=0, second=0, microsecond=0)
        headers = {"Authorization": f"Bearer {user1_token}"}
        
        book_response = requests.post(f"{BASE_URL}/api/appointments",
            json={
                "service_id": service["id"],
                "hairdresser_id": hairdresser["id"],
                "date_time": appointment_time.isoformat()
            },
            headers=headers
        )
        
        if book_response.status_code != 200:
            pytest.skip(f"Could not book appointment: {book_response.text}")
        
        appointment = book_response.json()
        print(f"✓ Booked slot at 10:00 on {date_str}")
        
        # Check availability AFTER booking
        avail_after = requests.post(f"{BASE_URL}/api/availability", json={
            "date": date_str,
            "service_id": service["id"],
            "hairdresser_id": hairdresser["id"]
        })
        assert avail_after.status_code == 200
        slots_after = avail_after.json()["available_slots"]
        
        # 10:00 should NOT be in available slots anymore
        assert "10:00" not in slots_after, f"10:00 should not be available after booking! Available: {slots_after}"
        print(f"✓ Slot 10:00 correctly removed from availability")
        
        # Cleanup
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        requests.delete(f"{BASE_URL}/api/admin/appointments/{appointment['id']}", headers=admin_headers)


class TestAdminReschedule:
    """Test admin can reschedule (move) appointments"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "reschedule_test@test.com",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "reschedule_test@test.com",
            "password": "test123",
            "name": "Reschedule Test User",
            "phone": "+393333333333"
        })
        return response.json()["access_token"]
    
    def test_admin_can_reschedule_appointment(self, admin_token, user_token):
        """
        BUG FIX TEST: Admin should be able to move/reschedule appointments
        """
        services = requests.get(f"{BASE_URL}/api/services").json()
        hairdressers = requests.get(f"{BASE_URL}/api/hairdressers").json()
        
        # Create an appointment
        future_date = datetime.now() + timedelta(days=5)
        while future_date.weekday() == 6:
            future_date = future_date + timedelta(days=1)
        
        original_time = future_date.replace(hour=14, minute=0, second=0, microsecond=0)
        
        user_headers = {"Authorization": f"Bearer {user_token}"}
        create_response = requests.post(f"{BASE_URL}/api/appointments",
            json={
                "service_id": services[0]["id"],
                "hairdresser_id": hairdressers[0]["id"],
                "date_time": original_time.isoformat()
            },
            headers=user_headers
        )
        
        if create_response.status_code != 200:
            pytest.skip(f"Could not create appointment: {create_response.text}")
        
        appointment = create_response.json()
        print(f"✓ Created appointment at {original_time.strftime('%Y-%m-%d %H:%M')}")
        
        # Admin reschedules to new time
        new_time = future_date.replace(hour=16, minute=30, second=0, microsecond=0)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        reschedule_response = requests.patch(
            f"{BASE_URL}/api/admin/appointments/{appointment['id']}",
            json={"date_time": new_time.isoformat()},
            headers=admin_headers
        )
        
        assert reschedule_response.status_code == 200, f"Reschedule failed: {reschedule_response.text}"
        
        updated = reschedule_response.json()
        updated_time = datetime.fromisoformat(updated["date_time"].replace("Z", "+00:00"))
        
        # Verify time was changed
        assert updated_time.hour == 16, f"Hour should be 16, got {updated_time.hour}"
        assert updated_time.minute == 30, f"Minute should be 30, got {updated_time.minute}"
        
        print(f"✓ Admin successfully rescheduled appointment to {new_time.strftime('%Y-%m-%d %H:%M')}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/appointments/{appointment['id']}", headers=admin_headers)
    
    def test_admin_reschedule_validates_slot_availability(self, admin_token, user_token):
        """
        Test that admin cannot reschedule to an already occupied slot
        """
        services = requests.get(f"{BASE_URL}/api/services").json()
        hairdressers = requests.get(f"{BASE_URL}/api/hairdressers").json()
        
        future_date = datetime.now() + timedelta(days=6)
        while future_date.weekday() == 6:
            future_date = future_date + timedelta(days=1)
        
        # Create first appointment at 15:00
        time1 = future_date.replace(hour=15, minute=0, second=0, microsecond=0)
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        resp1 = requests.post(f"{BASE_URL}/api/appointments",
            json={
                "service_id": services[0]["id"],
                "hairdresser_id": hairdressers[0]["id"],
                "date_time": time1.isoformat()
            },
            headers=user_headers
        )
        
        if resp1.status_code != 200:
            pytest.skip(f"Could not create first appointment: {resp1.text}")
        
        apt1 = resp1.json()
        
        # Create second appointment at 17:00
        time2 = future_date.replace(hour=17, minute=0, second=0, microsecond=0)
        resp2 = requests.post(f"{BASE_URL}/api/appointments",
            json={
                "service_id": services[0]["id"],
                "hairdresser_id": hairdressers[0]["id"],
                "date_time": time2.isoformat()
            },
            headers=user_headers
        )
        
        if resp2.status_code != 200:
            # Cleanup first appointment
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            requests.delete(f"{BASE_URL}/api/admin/appointments/{apt1['id']}", headers=admin_headers)
            pytest.skip(f"Could not create second appointment: {resp2.text}")
        
        apt2 = resp2.json()
        print(f"✓ Created two appointments at 15:00 and 17:00")
        
        # Try to reschedule apt2 to 15:00 (occupied by apt1) - should FAIL
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        reschedule_response = requests.patch(
            f"{BASE_URL}/api/admin/appointments/{apt2['id']}",
            json={"date_time": time1.isoformat()},
            headers=admin_headers
        )
        
        assert reschedule_response.status_code == 400, \
            f"Reschedule to occupied slot should fail! Got {reschedule_response.status_code}: {reschedule_response.text}"
        
        print(f"✓ Admin correctly prevented from rescheduling to occupied slot")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/appointments/{apt1['id']}", headers=admin_headers)
        requests.delete(f"{BASE_URL}/api/admin/appointments/{apt2['id']}", headers=admin_headers)


class TestAdminDelete:
    """Test admin can permanently delete appointments"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "delete_test@test.com",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "delete_test@test.com",
            "password": "test123",
            "name": "Delete Test User",
            "phone": "+393334444444"
        })
        return response.json()["access_token"]
    
    def test_admin_can_delete_appointment(self, admin_token, user_token):
        """
        BUG FIX TEST: Admin should be able to permanently delete appointments
        """
        services = requests.get(f"{BASE_URL}/api/services").json()
        hairdressers = requests.get(f"{BASE_URL}/api/hairdressers").json()
        
        future_date = datetime.now() + timedelta(days=7)
        while future_date.weekday() == 6:
            future_date = future_date + timedelta(days=1)
        
        appointment_time = future_date.replace(hour=9, minute=30, second=0, microsecond=0)
        
        # Create appointment
        user_headers = {"Authorization": f"Bearer {user_token}"}
        create_response = requests.post(f"{BASE_URL}/api/appointments",
            json={
                "service_id": services[0]["id"],
                "hairdresser_id": hairdressers[0]["id"],
                "date_time": appointment_time.isoformat()
            },
            headers=user_headers
        )
        
        if create_response.status_code != 200:
            pytest.skip(f"Could not create appointment: {create_response.text}")
        
        appointment = create_response.json()
        apt_id = appointment["id"]
        print(f"✓ Created appointment {apt_id}")
        
        # Admin deletes the appointment
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/appointments/{apt_id}",
            headers=admin_headers
        )
        
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        print(f"✓ Admin successfully deleted appointment {apt_id}")
        
        # Verify appointment no longer exists
        all_appointments = requests.get(f"{BASE_URL}/api/admin/appointments", headers=admin_headers).json()
        apt_ids = [a["id"] for a in all_appointments]
        
        assert apt_id not in apt_ids, f"Appointment {apt_id} should be deleted but still exists!"
        print(f"✓ Verified appointment {apt_id} no longer exists in database")
    
    def test_delete_nonexistent_appointment_returns_404(self, admin_token):
        """Test that deleting non-existent appointment returns 404"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/appointments/nonexistent-id-12345",
            headers=admin_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete non-existent appointment correctly returns 404")


class TestAdminCancel:
    """Test admin can cancel appointments (change status)"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "cancel_test@test.com",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "cancel_test@test.com",
            "password": "test123",
            "name": "Cancel Test User",
            "phone": "+393335555555"
        })
        return response.json()["access_token"]
    
    def test_admin_can_cancel_appointment(self, admin_token, user_token):
        """
        BUG FIX TEST: Admin should be able to cancel appointments (change status to cancelled)
        """
        services = requests.get(f"{BASE_URL}/api/services").json()
        hairdressers = requests.get(f"{BASE_URL}/api/hairdressers").json()
        
        future_date = datetime.now() + timedelta(days=8)
        while future_date.weekday() == 6:
            future_date = future_date + timedelta(days=1)
        
        appointment_time = future_date.replace(hour=10, minute=30, second=0, microsecond=0)
        
        # Create appointment
        user_headers = {"Authorization": f"Bearer {user_token}"}
        create_response = requests.post(f"{BASE_URL}/api/appointments",
            json={
                "service_id": services[0]["id"],
                "hairdresser_id": hairdressers[0]["id"],
                "date_time": appointment_time.isoformat()
            },
            headers=user_headers
        )
        
        if create_response.status_code != 200:
            pytest.skip(f"Could not create appointment: {create_response.text}")
        
        appointment = create_response.json()
        apt_id = appointment["id"]
        assert appointment["status"] == "pending", f"Initial status should be pending, got {appointment['status']}"
        print(f"✓ Created appointment {apt_id} with status 'pending'")
        
        # Admin cancels the appointment
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        cancel_response = requests.patch(
            f"{BASE_URL}/api/admin/appointments/{apt_id}",
            json={"status": "cancelled"},
            headers=admin_headers
        )
        
        assert cancel_response.status_code == 200, f"Cancel failed: {cancel_response.text}"
        
        cancelled = cancel_response.json()
        assert cancelled["status"] == "cancelled", f"Status should be 'cancelled', got {cancelled['status']}"
        print(f"✓ Admin successfully cancelled appointment {apt_id}")
        
        # Verify cancelled slot is now available again
        date_str = future_date.strftime('%Y-%m-%d')
        avail_response = requests.post(f"{BASE_URL}/api/availability", json={
            "date": date_str,
            "service_id": services[0]["id"],
            "hairdresser_id": hairdressers[0]["id"]
        })
        
        if avail_response.status_code == 200:
            slots = avail_response.json()["available_slots"]
            # 10:30 should be available again since appointment was cancelled
            assert "10:30" in slots, f"10:30 should be available after cancellation! Available: {slots}"
            print(f"✓ Slot 10:30 correctly available again after cancellation")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/appointments/{apt_id}", headers=admin_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
