import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the AI Automotive Service Assistant for Track Automotive Automation garage.
Your role is to assist vehicle owners and garage customers with:
1. Understanding common vehicle symptoms (e.g. strange noises, check engine lights, fluid leaks, vibrating steering).
2. Explaining routine maintenance schedules (e.g. oil changes, brake pads, tire rotations, coolant flushes).
3. Guiding users on how to use the Track Automotive application to book appointments, view service reports, and report faults.
4. Explaining typical garage inspection items and repairs.

IMPORTANT SAFETY RULES:
- Always remind the user that AI suggestions are informational and cannot replace a physical mechanical inspection by a certified mechanic.
- If a symptom indicates immediate safety danger (such as complete brake loss, engine overheating steam, or strong fuel smell), urgently advise pulling over safely or having the vehicle towed.
- Never disclose another user's private data, appointments, or vehicle records.
- Be concise, helpful, and professional.
"""

SAFETY_DISCLAIMER = "\n\n*Disclaimer: AI guidance is for informational purposes and does not replace professional hands-on inspection by a qualified mechanic.*"


class BaseAIProvider:
    def generate_response(self, message: str, history: list = None, user_name: str = "") -> str:
        raise NotImplementedError


class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str, model: str = 'gemini-1.5-flash'):
        self.api_key = api_key
        self.model = model

    def generate_response(self, message: str, history: list = None, user_name: str = "") -> str:
        if not self.api_key:
            raise ValueError("Gemini API key is not configured. Please set AI_API_KEY in backend/.env.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        contents = []
        if history:
            for item in history[-6:]:
                role = "user" if item.get('sender') == 'user' else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": item.get('text', '')}]
                })
        
        contents.append({
            "role": "user",
            "parts": [{"text": f"User name: {user_name or 'Customer'}\nQuestion: {message}"}]
        })

        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.5,
                "maxOutputTokens": 600
            }
        }

        response = requests.post(url, json=payload, timeout=12)
        if response.status_code == 200:
            data = response.json()
            try:
                text = data['candidates'][0]['content']['parts'][0]['text']
                return text + SAFETY_DISCLAIMER
            except (KeyError, IndexError):
                raise ValueError("Unexpected response structure from Gemini API.")
        elif response.status_code == 429:
            raise ValueError("AI service rate limit reached. Please wait a moment and try again.")
        else:
            raise ValueError(f"Gemini API returned error ({response.status_code}): {response.text}")


class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: str, model: str = 'gpt-3.5-turbo'):
        self.api_key = api_key
        self.model = model

    def generate_response(self, message: str, history: list = None, user_name: str = "") -> str:
        if not self.api_key:
            raise ValueError("OpenAI API key is not configured. Please set AI_API_KEY in backend/.env.")

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            for item in history[-6:]:
                role = "user" if item.get('sender') == 'user' else "assistant"
                messages.append({"role": role, "content": item.get('text', '')})
        messages.append({"role": "user", "content": f"User: {user_name or 'Customer'}\nMessage: {message}"})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.5
        }

        response = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=12)
        if response.status_code == 200:
            data = response.json()
            text = data['choices'][0]['message']['content']
            return text + SAFETY_DISCLAIMER
        elif response.status_code == 429:
            raise ValueError("OpenAI rate limit exceeded.")
        else:
            raise ValueError(f"OpenAI error ({response.status_code}): {response.text}")


class GroqProvider(BaseAIProvider):
    def __init__(self, api_key: str, model: str = 'llama-3.1-70b-versatile'):
        self.api_key = api_key
        self.model = model

    def generate_response(self, message: str, history: list = None, user_name: str = "") -> str:
        if not self.api_key:
            raise ValueError("Groq API key is not configured. Please set AI_API_KEY in backend/.env.")

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            for item in history[-6:]:
                role = "user" if item.get('sender') == 'user' else "assistant"
                messages.append({"role": role, "content": item.get('text', '')})
        messages.append({"role": "user", "content": f"User: {user_name or 'Customer'}\nMessage: {message}"})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.5
        }

        response = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=12)
        if response.status_code == 200:
            data = response.json()
            text = data['choices'][0]['message']['content']
            return text + SAFETY_DISCLAIMER
        else:
            raise ValueError(f"Groq error ({response.status_code}): {response.text}")


class AutomotiveKnowledgeFallbackProvider(BaseAIProvider):
    """
    Intelligent built-in automotive knowledge provider for testing and development
    when external AI keys are not yet configured.
    """
    def generate_response(self, message: str, history: list = None, user_name: str = "") -> str:
        msg = message.lower()

        if any(w in msg for w in ['oil', 'lube', 'filter']):
            res = (
                "For most modern vehicles, engine oil and filter changes are recommended every 5,000 to 10,000 km "
                "(or 6 to 12 months), depending on whether you use conventional or full-synthetic oil. "
                "Warning signs that your oil needs changing include dark/gritty oil on the dipstick, engine knocking noises, "
                "or the oil pressure light on your dashboard. You can book an oil change directly under the 'Appointments' tab."
            )
        elif any(w in msg for w in ['brake', 'squeak', 'grind', 'stopping']):
            res = (
                "Brake squealing typically indicates worn brake pads reaching the wear indicator tab. "
                "A grinding noise often indicates that pad friction material is completely worn down and the metal backing "
                "is contacting the rotor, which requires immediate attention to prevent rotor damage. "
                "We recommend scheduling a Brake System Inspection in the application immediately."
            )
        elif any(w in msg for w in ['check engine', 'engine light', 'mil', 'diagnostic']):
            res = (
                "A solid Check Engine Light indicates an issue detected by the engine control unit (such as an oxygen sensor, "
                "loose gas cap, mass air flow sensor, or catalytic converter). If the Check Engine Light is FLASHING, that indicates "
                "a severe misfire that can damage the catalytic converter; you should minimize driving and have the vehicle serviced immediately. "
                "You can log a Fault Report or book an Engine Diagnostics appointment through our system."
            )
        elif any(w in msg for w in ['tire', 'tyre', 'pressure', 'alignment', 'tread']):
            res = (
                "Proper tire maintenance includes checking cold tire pressure monthly (specifications are inside the driver's door jamb), "
                "rotating tires every 8,000 to 10,000 km, and replacing tires when tread depth reaches 2mm or less. "
                "Uneven wear usually signals misalignment or suspension wear."
            )
        elif any(w in msg for w in ['appointment', 'book', 'schedule']):
            res = (
                "To book a service appointment: navigate to 'Appointments' in the sidebar, select your registered vehicle, "
                "choose your requested service type and preferred date and time, and add any specific notes. "
                "Our garage team will review and confirm your slot promptly."
            )
        elif any(w in msg for w in ['fault', 'report', 'problem', 'leak']):
            res = (
                "If you notice an unexpected vehicle issue or leak, you can report it via the 'Vehicle Faults' section. "
                "Select the affected vehicle, describe the symptom, and set the severity. "
                "Our mechanics will diagnose the issue and update you through in-app notifications."
            )
        else:
            res = (
                f"Hello {user_name or 'there'}! I am your Track Automotive AI Assistant. "
                "I can help answer questions regarding routine maintenance, strange vehicle sounds, fluid checks, "
                "troubleshooting steps, and how to navigate our booking and repair portal. "
                "How can I assist you with your vehicle today?"
            )

        return res + SAFETY_DISCLAIMER


def get_ai_service() -> BaseAIProvider:
    provider = getattr(settings, 'AI_PROVIDER', 'mock').lower()
    api_key = getattr(settings, 'AI_API_KEY', '')
    model = getattr(settings, 'AI_MODEL', '')

    if provider == 'gemini' and api_key:
        return GeminiProvider(api_key=api_key, model=model or 'gemini-1.5-flash')
    elif provider == 'openai' and api_key:
        return OpenAIProvider(api_key=api_key, model=model or 'gpt-3.5-turbo')
    elif provider == 'groq' and api_key:
        return GroqProvider(api_key=api_key, model=model or 'llama-3.1-70b-versatile')
    else:
        # Default or fallback when API key is not yet set
        return AutomotiveKnowledgeFallbackProvider()
