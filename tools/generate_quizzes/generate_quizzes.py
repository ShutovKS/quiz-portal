import json
import os
import sys

import dotenv
from openai import OpenAI

dotenv.load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL")
)

MODEL = os.getenv("MODEL")
NUM_QUIZZES = int(os.getenv("NUM_QUIZZES", 3))
OUTPUT_DIR = os.getenv("OUTPUT_DIR")
USER_EMAIL = os.getenv("USER_EMAIL")

PROMPT_PREFIX = os.getenv("PROMPT_PREFIX")
QUIZZES_TOPIC = os.getenv("QUIZZES_TOPIC")
QUIZZES_LANGUAGE = os.getenv("QUIZZES_LANGUAGE", "ru")
QUIZZES_DIFFICULTY = os.getenv("QUIZZES_DIFFICULTY", "medium")

if not OUTPUT_DIR:
    print("❌ Переменная окружения OUTPUT_DIR не установлена.")
    sys.exit(1)

os.makedirs(OUTPUT_DIR, exist_ok=True)

for i in range(NUM_QUIZZES):
    print(f"🧠 Генерация квиза {i + 1}/{NUM_QUIZZES}...")
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"Вы - эксперт по созданию квизов. Ваши квизы должны быть на тему: {QUIZZES_TOPIC}, на языке: {QUIZZES_LANGUAGE}, с уровнем сложности: {QUIZZES_DIFFICULTY}."},
            {"role": "user", "content": PROMPT_PREFIX},
        ],
        temperature=0.7
    )

    quiz_data = response.choices[0].message.content

    try:
        quiz_json = json.loads(quiz_data)
        filename = os.path.join(OUTPUT_DIR, f"quiz_{i + 1}.json")
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(quiz_json, f, ensure_ascii=False, indent=2)
        print(f"✅ Сохранено: {filename}")
    except json.JSONDecodeError as e:
        print(f"❌ Ошибка парсинга JSON: {e}")
        print("Ответ модели:")
        print(quiz_data)
