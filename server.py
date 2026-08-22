import os
import requests

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

load_dotenv()

SNAPSERVE_API_KEY = os.getenv("SNAPSERVE_API_KEY")

if not SNAPSERVE_API_KEY:
    raise RuntimeError("SNAPSERVE_API_KEY is missing from .env")

app = FastAPI()


class CallRequest(BaseModel):
    agent_id: int
    phone_number: str


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

    print(
        f"📞 Starting call to {request.phone_number}"
    )

    response = requests.post(
        "https://app.snapserve.ai/api/calls/outbound",

        headers={
            "Authorization": f"Bearer {SNAPSERVE_API_KEY}",
            "Content-Type": "application/json",
        },

        json={
            "agentId": request.agent_id,
            "toNumber": request.phone_number,
        },

        timeout=30,
    )

    print("SnapServe:", response.status_code)
    print(response.text)

    if not response.ok:
        return {
            "status": "error",
            "message": response.text,
        }

    return response.json()
