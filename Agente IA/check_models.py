import google.generativeai as genai
import os

try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    print("API Key configurada.")
except KeyError:
    print("Error: La variable de entorno 'GEMINI_API_KEY' no está configurada.")
    exit()

print("\nBuscando modelos que soporten 'generateContent'...")
for m in genai.list_models():
  if 'generateContent' in m.supported_generation_methods:
    print(f"- {m.name}")

print("\n¡Usa uno de estos nombres en genai.GenerativeModel()!")