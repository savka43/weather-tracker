<img src="docs/readme.png" alt="Прогноз погоды" width="100%"/>

## Поддерживаемые модели

| Провайдер | `LLM_PROVIDER` |
|---|---|
| Anthropic (Claude) | `anthropic` |
| OpenAI | `openai` |
| Google Gemini | `gemini` |
| DeepSeek | `deepseek` |
| OpenRouter | `openrouter` |
| Mistral | `mistral` |
| Groq | `groq` |
| Ollama (локально) | `ollama` |
| Любой OpenAI-совместимый API | любое имя + `LLM_BASE_URL` |

Модель должна уметь отвечать по JSON-схеме (structured output).

## Как подключить

Впишите в `backend/.env`:

```env
LLM_PROVIDER=anthropic          # провайдер из таблицы
LLM_API_KEY=sk-ant-...          # ключ этого провайдера
LLM_MODEL=claude-sonnet-5-5     # название модели у провайдера
LLM_BASE_URL=                   # только для провайдера не из таблицы
```

Перезапустите бэкенд:

```bash
docker compose up -d --force-recreate backend
```

Без ключа приложение работает без ИИ: показывает среднее по источникам и советы по простым правилам.
