import requests
import time

BASE_URL = "http://127.0.0.1:8001"

def wait_for_server():
    for _ in range(10):
        try:
            requests.get(f"{BASE_URL}/barbers")
            print("Server is up!")
            return True
        except requests.exceptions.ConnectionError:
            print("Waiting for server...")
            time.sleep(1)
    return False

def login(username, password):
    r = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if r.status_code == 200:
        return r.json()["access_token"]
    return None

def run_tests():
    if not wait_for_server():
        print("Server failed to start.")
        return

    # 1. Test Login (Owner)
    print("\n1. Login as Owner...")
    owner_token = login("owner", "pass")
    if owner_token:
        print("PASS: Owner Login successful.")
    else:
        print("FAIL: Owner Login failed.")
        return

    # 2. Test Login (Barber)
    print("\n2. Login as Barber (Alice)...")
    barber_token = login("alice", "pass")
    if barber_token:
        print("PASS: Barber Login successful.")
    else:
        print("FAIL: Barber Login failed.")

    # 3. Test RBAC: Get Appointments
    # Owner should see all (let's assume there are some or empty list, just check 200)
    print("\n3. Owner: Get Appointments...")
    r = requests.get(f"{BASE_URL}/appointments", headers={"Authorization": f"Bearer {owner_token}"})
    print(f"Owner response: {r.status_code}")
    if r.status_code == 200:
        print("PASS: Owner can fetch appointments.")
    
    # Barber should see 200 too, but filtered logic is backend internal.
    print("\n4. Barber: Get Appointments...")
    r = requests.get(f"{BASE_URL}/appointments", headers={"Authorization": f"Bearer {barber_token}"})
    print(f"Barber response: {r.status_code}")
    if r.status_code == 200:
        print("PASS: Barber can fetch appointments.")

    # 4. Test RBAC: Owner vs Barber Controls
    # Try to delete an appointment (User dummy ID 999 to test permission, expect 404 or 200, but NOT 403)
    # Actually, let's create a booking first to delete.
    # We need a barber ID.
    barbers = requests.get(f"{BASE_URL}/barbers").json()
    bid = barbers[0]['id']
    
    # Book
    print("\n5. Creating dummy booking...")
    requests.post(f"{BASE_URL}/book", params={
        "barber_id": bid, "date": "2026-02-01", "time": "10:00", "name": "TestUser"
    })
    
    # Get appt ID
    r = requests.get(f"{BASE_URL}/appointments", headers={"Authorization": f"Bearer {owner_token}"})
    appts = r.json()
    if not appts:
        print("WARN: No appointments found even after booking.")
        return
    appt_id = appts[-1]['id']
    print(f"Created Appt ID: {appt_id}")

    # Barber tries to delete -> Expect 403
    print("\n6. Barber tries to DELETE...")
    r = requests.delete(f"{BASE_URL}/appointments/{appt_id}", headers={"Authorization": f"Bearer {barber_token}"})
    print(f"Barber Delete Response: {r.status_code}")
    if r.status_code == 403:
        print("PASS: Barber forbid from deleting.")
    else:
        print(f"FAIL: Barber got {r.status_code} (expected 403)")

    # Owner tries to delete -> Expect 200
    print("\n7. Owner tries to DELETE...")
    r = requests.delete(f"{BASE_URL}/appointments/{appt_id}", headers={"Authorization": f"Bearer {owner_token}"})
    print(f"Owner Delete Response: {r.status_code}")
    if r.status_code == 200:
        print("PASS: Owner deleted appointment.")
    else:
         print(f"FAIL: Owner got {r.status_code}")

    print("\nTests Completed.")

if __name__ == "__main__":
    run_tests()
