"""
MediPT API 성능 측정 (REQ-NF-002 / 평가 5-1 P95 Latency).

locust 부하 테스트 스크립트. 로그인으로 토큰을 받아 인증이 필요한
주요 조회 API의 응답 시간(P95 포함)을 측정한다.

[사용법]
1. 의존성 설치:
   uv pip install locust   (또는 pip install locust)

2. 측정 대상 서버 환경변수 설정 (테스트 계정 필요):
   export MEDIPT_TEST_EMAIL="loadtest@example.com"
   export MEDIPT_TEST_PASSWORD="Password123!"
   export MEDIPT_RECORD_ID=1     # 조회용 진료기록 ID
   export MEDIPT_GUIDE_ID=1      # 조회용 가이드 ID

3. 실행 (배포 환경 대상, 예: EC2):
   locust -f tests/performance/locustfile.py --host http://3.34.130.218:8000

   - 웹 UI(http://localhost:8089)에서 사용자 수·spawn rate 설정 후 시작
   - 또는 헤드리스:
     locust -f tests/performance/locustfile.py --host http://<HOST>:8000 \
            --users 20 --spawn-rate 2 --run-time 2m --headless --csv perf

4. 결과 확인:
   - 웹 UI의 'Statistics' 탭 또는 perf_stats.csv의 '95%' 컬럼이 P95(ms)
   - 평가 기준: 조회 API P95 < 3000ms, 챗봇 메시지 < 5000ms

[주의]
- 챗봇 메시지(POST)는 LLM 호출이라 비용·지연이 크므로 가중치를 낮게 설정함.
  순수 조회 성능(P95 3초) 검증이 주목적.
- 측정은 반드시 배포 환경에서 수행해야 실제 latency를 반영한다.
"""

import os

from locust import HttpUser, between, task

TEST_EMAIL = os.environ.get("MEDIPT_TEST_EMAIL", "loadtest@example.com")
TEST_PASSWORD = os.environ.get("MEDIPT_TEST_PASSWORD", "Password123!")
RECORD_ID = os.environ.get("MEDIPT_RECORD_ID", "1")
GUIDE_ID = os.environ.get("MEDIPT_GUIDE_ID", "1")

API = "/api/v1"


class MediPTUser(HttpUser):
    # 사용자별 요청 간 대기 (1~3초) — 실사용 패턴 근사
    wait_time = between(1, 3)

    def on_start(self):
        """가상 사용자 시작 시 로그인하여 토큰 확보."""
        resp = self.client.post(
            f"{API}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            name="POST /auth/login",
        )
        if resp.status_code == 200:
            token = resp.json().get("access_token")
            self.client.headers.update({"Authorization": f"Bearer {token}"})
        else:
            # 로그인 실패 시 이후 task는 401이 찍힘 → 계정/환경변수 확인 필요
            self.environment.runner.quit()

    # ── 조회 API (P95 < 3초 검증 대상) ──────────────────

    @task(5)
    def search_drugs(self):
        # 약품 검색 (외부 식약처 API 경유 — 지연 주의 대상)
        self.client.get(
            f"{API}/drugs/search?name=타이레놀",
            name="GET /drugs/search",
        )

    @task(4)
    def get_record(self):
        self.client.get(
            f"{API}/records/{RECORD_ID}",
            name="GET /records/{id}",
        )

    @task(4)
    def get_guide(self):
        self.client.get(
            f"{API}/guides/{GUIDE_ID}",
            name="GET /guides/{id}",
        )

    @task(3)
    def list_chat_sessions(self):
        self.client.get(
            f"{API}/chat/sessions",
            name="GET /chat/sessions",
        )

    @task(3)
    def get_health_profile(self):
        self.client.get(
            f"{API}/health-profile",
            name="GET /health-profile",
        )

    @task(2)
    def feedback_summary(self):
        self.client.get(
            f"{API}/feedbacks/summary",
            name="GET /feedbacks/summary",
        )

    @task(2)
    def list_notifications(self):
        self.client.get(
            f"{API}/notifications",
            name="GET /notifications",
        )

    # ── LLM 호출 API (가중치 최소 — 비용·지연 큼, 기준 5초) ──
    # 부하 테스트에서 LLM을 과다 호출하면 비용이 발생하므로 기본 비활성.
    # 챗봇 응답 시간을 측정하려면 아래 주석을 해제하고 가중치를 조정한다.
    #
    # @task(1)
    # def send_chat_message(self):
    #     # 사전에 세션을 만들어 SESSION_ID 환경변수로 주입 필요
    #     session_id = os.environ.get("MEDIPT_SESSION_ID")
    #     if not session_id:
    #         return
    #     self.client.post(
    #         f"{API}/chat/sessions/{session_id}/messages",
    #         json={"message": "이 약 언제 먹어야 하나요?"},
    #         name="POST /chat/sessions/{id}/messages",
    #     )
