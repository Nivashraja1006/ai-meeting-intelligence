"""Smoke tests for POST /meetings/analyze — run while uvicorn is up on port 8000."""
import json
import sys

import httpx

URL = "http://127.0.0.1:8000/meetings/analyze"

CASES = [
    (
        "VALID — realistic meeting with action items and decisions",
        {
            "transcript": (
                "Sarah (PM): Thanks everyone. We need to finalize the Q3 launch plan today. "
                "Mike (Eng): I can have the API endpoints ready by March 15 if we lock the schema today. "
                "Sarah: Agreed — we decided to ship the MVP without the analytics dashboard. "
                "Lisa (Design): I'll send updated mockups to Mike by end of week. "
                "Sarah: Mike, please write integration tests before the March 15 deadline. "
                "Mike: Will do. Open question: do we need legal review before beta?"
            ),
        },
    ),
    (
        "INVALID — transcript under 50 characters",
        {"transcript": "Short meeting. Done."},
    ),
    (
        "INVALID — empty transcript",
        {"transcript": ""},
    ),
    (
        "VALID — no clear action items (discussion only)",
        {
            "transcript": (
                "Alex: I read an interesting article about AI regulation in the EU this morning. "
                "Jordan: Yeah, the landscape is shifting quickly — hard to predict what compliance will look like. "
                "Alex: We mostly agreed the industry is moving faster than policymakers. "
                "Jordan: True. Nobody assigned any tasks; we just shared perspectives for about twenty minutes."
            ),
        },
    ),
]


def main() -> int:
    results: list[dict] = []

    with httpx.Client(timeout=120.0) as client:
        for label, payload in CASES:
            print(f"\n{'=' * 72}")
            print(label)
            print("=" * 72)
            try:
                response = client.post(URL, json=payload)
            except httpx.ConnectError as exc:
                print(f"CONNECTION ERROR: {exc}")
                print("Is uvicorn running on port 8000?")
                return 1

            print(f"Status: {response.status_code}")
            try:
                body = response.json()
                print("Body:")
                print(json.dumps(body, indent=2))
            except json.JSONDecodeError:
                print(f"Body (raw): {response.text}")

            results.append(
                {"label": label, "status": response.status_code, "body": response.text}
            )

    print(f"\n{'=' * 72}")
    print(f"Completed {len(results)} test case(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
