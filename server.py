import logging
import os
import requests

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

load_dotenv()

SNAPSERVE_OUTBOUND_CALL_URL = "https://app.snapserve.ai/api/calls/outbound"

app = FastAPI()
logger = logging.getLogger(__name__)


class CallRequest(BaseModel):
    agent_id: int = Field(gt=0)
    phone_number: str = Field(min_length=8, max_length=32)


def get_snapserve_api_key() -> str:
    api_key = os.getenv("SNAPSERVE_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="SNAPSERVE_API_KEY is not configured.",
        )

    return api_key


def create_snapserve_call(request: CallRequest) -> dict:
    response = requests.post(
        SNAPSERVE_OUTBOUND_CALL_URL,
        headers={
            "Authorization": f"Bearer {get_snapserve_api_key()}",
            "Content-Type": "application/json",
        },
        json={
            "agentId": request.agent_id,
            "toNumber": request.phone_number,
        },
        timeout=30,
    )

    if not response.ok:
        logger.warning(
            "SnapServe outbound call failed with status %s: %s",
            response.status_code,
            response.text,
        )
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text or "SnapServe call failed.",
        )

    try:
        return response.json()
    except ValueError as exc:
        logger.exception("SnapServe returned a non-JSON response")
        raise HTTPException(
            status_code=502,
            detail="SnapServe returned an invalid response.",
        ) from exc


@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Ams Hackathon</title>

        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 500px;
                margin: 100px auto;
                text-align: center;
            }

            input {
                width: 90%;
                padding: 14px;
                font-size: 18px;
                margin: 10px 0;
                box-sizing: border-box;
            }

            button {
                padding: 14px 30px;
                font-size: 18px;
                cursor: pointer;
                border: none;
                border-radius: 8px;
                margin-top: 10px;
            }

            #status {
                margin-top: 25px;
                font-size: 16px;
            }
        </style>
    </head>

    <body>

        <h1>📞 Agent caller</h1>

        <p>Enter the agent ID and phone number.</p>

        <input
            id="agentId"
            type="number"
            placeholder="Agent ID"
        />

        <input
            id="phone"
            type="tel"
            placeholder="+919876543210"
        />

        <br>

        <button onclick="makeCall()">
            📞 Call
        </button>

        <div id="status"></div>

        <script>
            async function makeCall() {

                const agentId =
                    document.getElementById("agentId").value;

                const phone =
                    document.getElementById("phone").value;

                const status =
                    document.getElementById("status");

                if (!agentId) {
                    status.innerText = "Please enter an agent ID.";
                    return;
                }

                if (!phone) {
                    status.innerText = "Please enter a phone number.";
                    return;
                }

                status.innerText = "Starting call...";

                try {

                    const response = await fetch("/call", {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            agent_id: Number(agentId),
                            phone_number: phone
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.detail || "Call failed"
                        );
                    }

                    status.innerText =
                        "📞 Call started! Call ID: " + data.id;

                    console.log(data);

                } catch (error) {

                    console.error(error);

                    status.innerText =
                        "❌ " + error.message;
                }
            }
        </script>

    </body>
    </html>
    """


@app.post("/call")
async def make_call(request: CallRequest):
    logger.info("Starting SnapServe call to %s", request.phone_number)

    try:
        return await run_in_threadpool(create_snapserve_call, request)
    except requests.RequestException as exc:
        logger.exception("SnapServe request failed")
        raise HTTPException(
            status_code=502,
            detail="Could not reach SnapServe.",
        ) from exc
