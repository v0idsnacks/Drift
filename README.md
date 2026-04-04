# Drift

> Paste any text. Watch truth decay.

Live demo: [drift.vercel.app](https://drift.vercel.app)

## What It Does

Drift is a sequential multi-LLM simulation of information decay. A single source moves through a chain of personas, and each persona only sees the previous persona's output. The result is a readable record of how tone, certainty, and facts mutate as a message spreads.

## Architecture

```text
                    +----------------------+
                    |  User input / URL    |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |  Source extraction   |
                    |  + validation        |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |  Content analyzer    |
                    |  chooses chain spec  |
                    +----------+-----------+
                               |
                               v
           +-----------------------------------------------+
           | Sequential cascade engine                     |
           | persona 1 -> persona 2 -> persona 3 -> ...   |
           +----------------------+------------------------+
                                  |
                                  v
                    +----------------------+
                    | Metrics + damage     |
                    | fidelity / framing   |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    | Result pages         |
                    | river / timeline /   |
                    | damage report        |
                    +----------------------+
```

## Setup

1. Install dependencies.
2. Create a local env file.
3. Add your API key.
4. Run the app.

```bash
npm install
copy .env.local.example .env.local
# add ANTHROPIC_API_KEY to .env.local

npm run dev
```

Production build:

```bash
npm run build
npm run start
```

## Tech Stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Motion | Framer Motion |
| Validation | Zod |
| Content extraction | Cheerio |
| LLM integration | Anthropic SDK + OpenRouter helpers in repo |
| Storage | `os.tmpdir()` backed session files plus pinned JSON demo fixtures |

## Project Notes

- Example sessions for the landing page live in [`data/examples`](./data/examples).
- Shareable live sessions are stored in temp storage and may expire after a short time.
- The result route supports three views: river, timeline, and damage report.
