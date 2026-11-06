# YuvaHive Daily Quiz Bot

A MERN-stack admin tool that prepares one coding quiz every day at **9:00 AM IST**
and gives you WhatsApp-ready text to post in your existing group.

Because the official WhatsApp Cloud API cannot post native polls into an arbitrary
existing group, this MVP automates everything up to publishing:

1. At 9:00 AM the scheduler creates the day's quiz.
2. You open the dashboard.
3. Click **Copy question + options** and paste it into the group.
4. Create the native WhatsApp poll with the same four options.
5. Later, click **Copy answer + explanation** and post it.
6. Mark the quiz as posted so your history stays accurate.

## Stack

- **Backend:** Node.js, Express, Mongoose, node-cron
- **Frontend:** React + Vite
- **Database:** MongoDB (optional). If `MONGODB_URI` is empty the app uses a
  local JSON file so you can run it with zero database setup.

## Quick start

Requirements: Node.js 18+.

```powershell
npm install
npm run install:all
npm run dev
```

Open http://localhost:5173 and sign in with the defaults:

```
Email:    admin@yuvahive.com
Password: YuvaHive@123
```

The API runs at http://localhost:5000.

### Configure your own credentials

```powershell
Copy-Item server/.env.example server/.env
```

Edit `server/.env` and change at least `JWT_SECRET`, `ADMIN_EMAIL`, and
`ADMIN_PASSWORD`. Restart the backend after editing.

The client works without a `.env` file. To point it at a different API, copy
`client/.env.example` to `client/.env` and set `VITE_API_URL`.

### Optional: MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/atlas
2. Create a database user and allow your IP.
3. Copy the connection string into `server/.env`:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/yuvahive
```

If Atlas is unreachable, the server logs the error and falls back to the local
file store instead of crashing.

## How the scheduler works

- `QUIZ_CRON=0 9 * * *` with `TIMEZONE=Asia/Kolkata` runs the job daily at 9:00 AM.
- On startup the server also prepares today's quiz if it does not exist.
- The scheduler only runs while the server process is alive. For real daily
  automation, host the app on an always-on machine (VPS, Render, Railway, Fly.io)
  rather than leaving your laptop open.

To test the cron without waiting until 9:00 AM, open the dashboard and click
**Check again**, or call the API:

```powershell
# after logging in and copying the token
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/quizzes/generate `
  -Headers @{ Authorization = "Bearer $token" }
```

## Project structure

```
yuvahive-quiz-bot/
├── package.json              # root scripts (dev, build, install:all)
├── server/
│   ├── .env.example
│   └── src/
│       ├── data/questions.js # curated question bank
│       ├── middleware/auth.js
│       ├── models/Quiz.js
│       ├── routes/auth.js
│       ├── routes/quizzes.js
│       ├── services/quizService.js
│       ├── services/scheduler.js
│       ├── config.js
│       ├── store.js          # Mongo store + local file fallback
│       └── index.js
└── client/
    ├── .env.example
    └── src/
        ├── App.jsx           # login, dashboard, preview, history
        ├── api.js
        ├── main.jsx
        └── style.css
```

## API

All quiz routes require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Get a JWT with the admin email/password |
| GET | `/api/health` | Server status and active store (`file` or `mongo`) |
| GET | `/api/quizzes/today` | Today's quiz (404 if not prepared) |
| GET | `/api/quizzes?limit=100` | Quiz history, newest first |
| POST | `/api/quizzes/generate` | Prepare today's quiz if missing |
| PATCH | `/api/quizzes/:id` | Edit question, code, options, answer or explanation |
| PATCH | `/api/quizzes/:id/status` | Set status to `draft` or `posted` |

Each quiz includes `whatsappQuestion` and `whatsappAnswer` fields so the
dashboard can copy the exact messages.

## Adding questions

Edit `server/src/data/questions.js`. Each entry needs:

```js
{
  id: 'unique-id',
  topic: 'Output Prediction',
  language: 'C++',
  question: 'What will be the output?',
  code: `...optional code...`,
  options: [
    { key: 'A', text: '5' },
    { key: 'B', text: '6' },
    { key: 'C', text: '7' },
    { key: 'D', text: '8' },
  ],
  answer: 'C',
  explanation: 'Why C is correct.',
}
```

The generator rotates through unused questions and cycles once the bank is
exhausted. Double-check every answer key: a wrong key damages trust faster than
a missing quiz.

## Production

Build the frontend once, then start the server. Express automatically serves
`client/dist` when it exists:

```powershell
npm run build
npm start
```

Set environment variables on the host (`PORT`, `JWT_SECRET`, credentials,
`CLIENT_ORIGIN`, `MONGODB_URI`). Use the hosted URL as `CLIENT_ORIGIN` and make
sure the process is always running.

## Troubleshooting

- **Port 5000 already in use:** change `PORT` in `server/.env`.
- **"Cannot reach the API":** confirm the backend terminal shows
  `YuvaHive quiz bot running`.
- **MongoDB error then file store:** that is expected fallback behavior. Fix
  `MONGODB_URI` or remove it to silence the warning.
- **Quiz not created at 9 AM:** the process was probably asleep. Use an
  always-on host, or click **Check again**.

## Recommended next steps

1. AI question generation with deterministic answer validation.
2. Participation tracking and analytics.
3. YuvaHive leaderboard with XP.
4. A supported WhatsApp Business integration if group API access becomes
   available for your account.

Do not use unofficial WhatsApp Web automation for a community you care about:
it can break without notice and put the account at risk.
