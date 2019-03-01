from locust import (HttpLocust, TaskSet, TaskSequence, task, seq_task)


class AnonBehavior(TaskSet):

    @task(1)
    def index(self):
        self.client.get("/")


class AnonUser(HttpLocust):
    host = "http://milmovelocal:8080"
    weight = 5  # 5x more likely than other users
    task_set = AnonBehavior


class UserBehavior(TaskSequence):

    login_gov_user = None
    token = None
    user = {}

    def _get_csrf_token(self):
        """
        Pull the CSRF token from the website by hitting the root URL.

        The token is set as a cookie with the name `masked_gorilla_csrf`
        """
        self.client.get('/')
        csrf = self.client.cookies.get('masked_gorilla_csrf')
        self.client.headers.update({'x-csrf-token': csrf})

    def on_start(self):
        """ on_start is called when a Locust start before any task is scheduled """
        self._get_csrf_token()

    def on_stop(self):
        """ on_stop is called when the TaskSet is stopping """
        pass

    @seq_task(1)
    def login(self):
        resp = self.client.post('/devlocal-auth/create')
        try:
            self.login_gov_user = resp.json()
            self.token = self.client.cookies.get('mil_session_token')
        except Exception:
            print('Headers:', self.client.headers)
            print(resp.content)

    @seq_task(2)
    def retrieve_user(self):
        resp = self.client.get("/internal/users/logged_in")
        self.user = resp.json()
        # check response for 200

    @seq_task(3)
    def create_service_member(self):
        payload = {"id": self.user["id"]}
        resp = self.client.post("/internal/service_members", json=payload)
        service_member = resp.json()
        self.user["service_member"] = service_member
        # check response for 201

    @seq_task(4)
    def create_your_profile(self):
        service_member_id = self.user["service_member"]["id"]
        url = "/internal/service_members/" + service_member_id
        profile = {
            "affiliation": "NAVY",  # Rotate
            "edipi": "3333333333",  # Random
            "rank": "E_5",  # Rotate
            "social_security_number": "333-33-3333",  # Random
        }
        self.client.patch(url, json=profile)

    @seq_task(5)
    def create_your_name(self):
        service_member_id = self.user["service_member"]["id"]
        url = "/internal/service_members/" + service_member_id
        profile = {
            "first_name": "Alice",  # Random
            "last_name": "Bob",  # Random
            "middle_name": "Carol",
            "suffix": "",
        }
        self.client.patch(url, json=profile)

    @seq_task(6)
    def logout(self):
        self.client.get("/auth/logout")
        self.login_gov_user = None
        self.token = None
        self.user = {}


class MilMoveUser(HttpLocust):
    host = "http://milmovelocal:8080"
    weight = 1
    task_set = UserBehavior
    min_wait = 1000
    max_wait = 5000
