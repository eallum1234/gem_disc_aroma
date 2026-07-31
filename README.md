# PPS DiSC Internal Prototype

Instructor-facing PPS DiSC prototype.

The instructor creates a test room, shares a participant link, and reviews participant status and team analysis. Participants use a separate screen and only complete their own test.

## Included

- Instructor test room creation
- Participant test link
- Participant name and team entry
- 28 Most / Least questions
- Duplicate Most / Least prevention in the same question
- Automatic prototype scoring
- Individual result view
- Instructor participant dashboard
- Team analysis
- CSV export
- JSON backup / restore
- Print and browser PDF output
- Supabase-backed shared storage

## Not Included

- RBA
- Insight card recommendation
- AI coach
- Chatbot
- External AI API

## Local Setup

```bash
npm install
```

Create `.env.local` from `.env.example`.

```text
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_public_key
VITE_INSTRUCTOR_PASSWORD=change_this_password
```

Run the app.

```bash
npm run dev
```

Open:

```text
http://localhost:5173/?mode=instructor
```

## Supabase Setup

1. Open your Supabase project.
2. Open SQL Editor.
3. Paste the contents of `supabase-schema.sql`.
4. Run the SQL.
5. Put your project URL and publishable key in `.env.local`.

Do not commit `.env.local` to GitHub.

## GitHub Pages Deployment

This project includes `.github/workflows/deploy.yml`.

In GitHub:

1. Open the repository.
2. Go to `Settings` -> `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Go to `Settings` -> `Secrets and variables` -> `Actions`.
5. Add these repository secrets:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_INSTRUCTOR_PASSWORD
```

6. Push to the `main` branch.
7. Open the `Actions` tab and wait for `Deploy to GitHub Pages` to finish.

The site URL will look like:

```text
https://YOUR_GITHUB_ID.github.io/YOUR_REPOSITORY_NAME/
```

Instructor screen:

```text
https://YOUR_GITHUB_ID.github.io/YOUR_REPOSITORY_NAME/?mode=instructor
```

## App Flow

1. Instructor opens the instructor screen.
2. Instructor creates a test room.
3. Instructor copies the participant link.
4. Participant opens the link and enters their name.
5. Participant completes their own test.
6. Instructor sees participant status and team analysis.

## Important Notes

This is a prototype. The Supabase table is a simple shared app state store. The participant UI does not show other participants, but full production security would require login, permissions, and a server-side API.

Current scoring is prototype raw scoring. Before production use, verify the official scoring key, conversion tables, graph rules, and final pattern rules against authorized materials and hand-scored samples.
