import requests
import sys
from datetime import datetime, timedelta
import json
import uuid

class HairSalonAPITester:
    def __init__(self):
        self.base_url = "https://snapcut-15.preview.emergentagent.com/api"
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_appointment_id = None
        self.services = []
        self.hairdressers = []
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.headers.get('content-type', '').startswith('application/json'):
                    try:
                        return success, response.json()
                    except:
                        return success, {}
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}

    def seed_database(self):
        """Initialize database with seed data"""
        success, response = self.run_test(
            "Database Seeding",
            "POST",
            "seed",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST", 
            "auth/login",
            200,
            data={"email": "admin@parrucco.it", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained")
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register", 
            200,
            data={
                "email": test_email,
                "password": "testpass123",
                "name": "Test User",
                "phone": "+393331234567"
            }
        )
        if success and 'access_token' in response:
            self.user_token = response['access_token'] 
            self.test_user_id = response['user']['id']
            print(f"   User token obtained")
            return True
        return False

    def test_user_login(self):
        """Test user login with same credentials"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@parrucco.it", "password": "admin123"}
        )
        return success

    def test_get_services(self):
        """Test getting services list"""
        success, response = self.run_test(
            "Get Services",
            "GET",
            "services",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.services = response
            print(f"   Found {len(response)} services")
            return True
        return False

    def test_get_hairdressers(self):
        """Test getting hairdressers list"""
        success, response = self.run_test(
            "Get Hairdressers", 
            "GET",
            "hairdressers",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.hairdressers = response
            print(f"   Found {len(response)} hairdressers")
            return True
        return False

    def test_create_appointment(self):
        """Test creating an appointment"""
        if not self.user_token or not self.services or not self.hairdressers:
            print("❌ Prerequisites not met for appointment creation")
            return False

        # Create appointment for tomorrow
        tomorrow = datetime.now() + timedelta(days=1)
        tomorrow = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)
        
        success, response = self.run_test(
            "Create Appointment",
            "POST", 
            "appointments",
            200,
            data={
                "service_id": self.services[0]['id'],
                "hairdresser_id": self.hairdressers[0]['id'], 
                "date_time": tomorrow.isoformat()
            },
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        if success and 'id' in response:
            self.test_appointment_id = response['id']
            print(f"   Appointment created with ID: {response['id']}")
            return True
        return False

    def test_get_user_appointments(self):
        """Test getting user's appointments"""
        success, response = self.run_test(
            "Get User Appointments",
            "GET",
            "appointments/my", 
            200,
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} appointments for user")
            return True
        return False

    def test_admin_get_appointments(self):
        """Test admin getting all appointments"""
        today = datetime.now().strftime('%Y-%m-%d')
        success, response = self.run_test(
            "Admin Get Today's Appointments",
            "GET",
            f"admin/appointments?date={today}",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} appointments for today")
            return True
        return False

    def test_admin_confirm_appointment(self):
        """Test admin confirming an appointment"""
        if not self.admin_token or not self.test_appointment_id:
            print("❌ Prerequisites not met for appointment confirmation")
            return False

        success, response = self.run_test(
            "Admin Confirm Appointment",
            "PATCH",
            f"admin/appointments/{self.test_appointment_id}/confirm",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success and response.get('status') == 'confirmed':
            print(f"   Appointment status: {response['status']}")
            return True
        return False

    def test_cancel_appointment(self):
        """Test user cancelling their appointment"""
        if not self.user_token or not self.test_appointment_id:
            print("❌ Prerequisites not met for appointment cancellation")
            return False

        success, response = self.run_test(
            "Cancel Appointment",
            "PATCH",
            f"appointments/{self.test_appointment_id}/cancel",
            200,
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        if success and response.get('status') == 'cancelled':
            print(f"   Appointment status: {response['status']}")
            return True
        return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login Test",
            "POST",
            "auth/login",
            401,  # Expecting 401 Unauthorized
            data={"email": "invalid@example.com", "password": "wrongpass"}
        )
        return success

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        success, response = self.run_test(
            "Unauthorized Access Test",
            "GET",
            "appointments/my",
            401  # Expecting 401 Unauthorized
        )
        return success

def main():
    print("🧪 Starting Hair Salon API Tests")
    print("=" * 50)
    
    tester = HairSalonAPITester()
    
    # Test sequence
    test_results = []
    
    # 1. Initialize database
    test_results.append(("Database Seed", tester.seed_database()))
    
    # 2. Authentication tests
    test_results.append(("Admin Login", tester.test_admin_login()))
    test_results.append(("User Registration", tester.test_user_registration()))
    test_results.append(("User Login", tester.test_user_login()))
    test_results.append(("Invalid Login", tester.test_invalid_login()))
    test_results.append(("Unauthorized Access", tester.test_unauthorized_access()))
    
    # 3. Data retrieval tests  
    test_results.append(("Get Services", tester.test_get_services()))
    test_results.append(("Get Hairdressers", tester.test_get_hairdressers()))
    
    # 4. Appointment management tests
    test_results.append(("Create Appointment", tester.test_create_appointment()))
    test_results.append(("Get User Appointments", tester.test_get_user_appointments()))
    
    # 5. Admin functionality tests
    test_results.append(("Admin Get Appointments", tester.test_admin_get_appointments()))
    test_results.append(("Admin Confirm Appointment", tester.test_admin_confirm_appointment()))
    
    # 6. Cancellation test
    test_results.append(("Cancel Appointment", tester.test_cancel_appointment()))
    
    # Print results summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n📈 Total: {tester.tests_passed}/{tester.tests_run} tests passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📊 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} tests failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())