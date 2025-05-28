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
OUTPUT_DIR = os.getenv("OUTPUT_DIR")

PROMPT_PREFIX = os.getenv("PROMPT_PREFIX")

QUIZZES_TOPICS_STR = os.getenv("QUIZZES_TOPICS_LIST", "Общая эрудиция")  # По умолчанию одна тема
QUIZZES_COUNTS_STR = os.getenv("QUIZZES_COUNTS_LIST", "3")  # По умолчанию 3 квиза для первой темы

QUIZZES_LANGUAGE = os.getenv("QUIZZES_LANGUAGE", "ru")
QUIZZES_DIFFICULTY = os.getenv("QUIZZES_DIFFICULTY", "medium")

if not OUTPUT_DIR:
    print("❌ Переменная окружения OUTPUT_DIR не установлена.")
    sys.exit(1)

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Преобразуем строки из .env в списки
try:
    topics_list = [topic.strip() for topic in QUIZZES_TOPICS_STR.split(',')]
    counts_list = [int(count.strip()) for count in QUIZZES_COUNTS_STR.split(',')]
except ValueError:
    print("❌ Ошибка в QUIZZES_COUNTS_LIST: Убедитесь, что все значения являются числами.")
    sys.exit(1)

if len(topics_list) != len(counts_list):
    print("❌ Количество тем в QUIZZES_TOPICS_LIST не совпадает с количеством чисел в QUIZZES_COUNTS_LIST.")
    sys.exit(1)

if not topics_list or not any(topics_list):  # Проверка, что список тем не пустой и не состоит из пустых строк
    print("❌ Список тем QUIZZES_TOPICS_LIST пуст или содержит только пустые строки.")
    sys.exit(1)

print(f"📝 Запланировано к генерации:")
for topic, count in zip(topics_list, counts_list):
    print(f"   - Тема: '{topic}', Количество квизов: {count}")
print("-" * 30)

total_quizzes_generated_count = 0

for topic_idx, current_topic in enumerate(topics_list):
    num_quizzes_for_topic = counts_list[topic_idx]
    print(f"\n🚀 Начинаем генерацию квизов для темы: '{current_topic}' (запланировано {num_quizzes_for_topic})")

    if num_quizzes_for_topic <= 0:
        print(f"⚠️ Для темы '{current_topic}' указано количество квизов {num_quizzes_for_topic}. Пропускаем.")
        continue

    for i in range(num_quizzes_for_topic):
        total_quizzes_generated_count += 1
        print(
            f"🧠 Генерация квиза {i + 1}/{num_quizzes_for_topic} для темы '{current_topic}' (Общий квиз #{total_quizzes_generated_count})...")

        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system",
                     "content": f"Вы - эксперт по созданию квизов. Ваши квизы должны быть на тему: {current_topic}, на языке: {QUIZZES_LANGUAGE}, с уровнем сложности: {QUIZZES_DIFFICULTY}."},
                    {"role": "user", "content": PROMPT_PREFIX},
                ],
                temperature=0.7
            )
        except Exception as e:
            print(f"❌ Ошибка API OpenAI при генерации квиза для темы '{current_topic}': {e}")
            continue  # Переходим к следующему квизу или теме

        quiz_data = response.choices[0].message.content

        try:
            quiz_json = json.loads(quiz_data)
            # Создаем более информативное имя файла
            safe_topic_name = "".join(c if c.isalnum() else "_" for c in current_topic.lower().replace(" ", "_"))
            filename = os.path.join(OUTPUT_DIR, f"quiz_{safe_topic_name}_{i + 1}.json")

            with open(filename, "w", encoding="utf-8") as f:
                json.dump(quiz_json, f, ensure_ascii=False, indent=2)
            print(f"✅ Сохранено: {filename}")
        except json.JSONDecodeError as e:
            print(f"❌ Ошибка парсинга JSON для квиза по теме '{current_topic}': {e}")
            print("Ответ модели:")
            print(quiz_data)
            # Можно сохранить сырой ответ, если парсинг не удался
            error_filename = os.path.join(OUTPUT_DIR, f"error_quiz_{safe_topic_name}_{i + 1}.txt")
            with open(error_filename, "w", encoding="utf-8") as f_err:
                f_err.write(quiz_data)
            print(f"⚠️ Сырой ответ сохранен в: {error_filename}")
        except Exception as e:
            print(f"❌ Непредвиденная ошибка при сохранении файла для темы '{current_topic}': {e}")

print(
    f"\n🎉 Генерация завершена. Всего создано квизов: {total_quizzes_generated_count - (len(topics_list) * num_quizzes_for_topic - total_quizzes_generated_count) if total_quizzes_generated_count > 0 else 0}")
# Коррекция подсчета успешных генераций, если были ошибки API
successful_quizzes = 0
for topic_idx, current_topic in enumerate(topics_list):
    num_quizzes_for_topic = counts_list[topic_idx]
    if num_quizzes_for_topic <= 0:
        continue
    for i in range(num_quizzes_for_topic):
        safe_topic_name = "".join(c if c.isalnum() else "_" for c in current_topic.lower().replace(" ", "_"))
        expected_filename = os.path.join(OUTPUT_DIR, f"quiz_{safe_topic_name}_{i + 1}.json")
        if os.path.exists(expected_filename):
            successful_quizzes += 1

print(f"✅ Успешно сохранено JSON файлов: {successful_quizzes}")
