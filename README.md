# Task Manager API with AI Integration

Node.js, Express, MongoDB Atlas (Mongoose) and the Groq API.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in `MONGO_URI` (Atlas) and `GROQ_API_KEY` (https://console.groq.com/keys)
3. `npm start` (or `npm run dev`)

## Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/tasks | Create task |
| GET | /api/tasks | List tasks |
| GET | /api/tasks/:id | Get one task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/ai/plan-task | AI-generated plan from `{ "description": "..." }` |

## How the AI API was integrated
- Provider: Groq (OpenAI-compatible chat completions endpoint), model `llama-3.3-70b-versatile`.
- The API key lives only in `.env` (git-ignored) and is read server-side via `dotenv`; it is never sent to a client.
- `POST /api/ai/plan-task` validates that `description` is a non-empty string, then calls Groq with a system prompt that demands a JSON object containing `summary`, `priority`, `estimatedHours` and `steps`. `response_format: json_object` and a low temperature keep the output structured.
- The reply is parsed and validated (priority must be low/medium/high, hours a positive number, steps a non-empty string array). Invalid output returns 502.
- Errors: empty description gives 400; missing key gives 500; Groq failure, timeout or unusable output gives 502 with a clear message.

## Postman test checklist
1. POST /api/tasks with `{"title":"Write report","status":"pending"}` returns 201
2. GET /api/tasks returns 200
3. GET /api/tasks/:id returns 200
4. PUT /api/tasks/:id with `{"status":"completed"}` returns 200
5. DELETE /api/tasks/:id returns 200
6. GET /api/tasks/123 returns 400 (invalid ID); GET with a valid but unused ID returns 404
7. POST /api/tasks with `{}` returns 400 (title required); bad status returns 400
8. POST /api/ai/plan-task with a description returns 200 and a plan
9. POST /api/ai/plan-task with `{}` returns 400; with a wrong API key returns 502

## Deployment (Render)
Build command `npm install`, start command `npm start`. Add `MONGO_URI`, `GROQ_API_KEY` and `GROQ_MODEL` as environment variables in the Render dashboard, and allow Render's IPs in Atlas Network Access (0.0.0.0/0 for the assessment).
