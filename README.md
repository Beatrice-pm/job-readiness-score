# Job-Readiness Score

A free, instant tool for young job seekers in Africa and Europe to check how ready their profile is for the job market, and get specific, actionable feedback.

**Live app:** _(link added once deployed)_

## How it works

Answer 6 short questions (education, experience, skills, target role, location, application readiness) and get:

- A **readiness score out of 100**
- A **breakdown** of how the score was calculated
- **3–5 specific suggestions** to improve it

## How the score is calculated

This is a transparent, rules-based score — not an AI judgment. See the "How is this score calculated?" section on the results page, or [`script.js`](script.js) for the exact logic.

| Category | Max points |
|---|---|
| Skills relevant to target role | 20 |
| Work experience | 25 |
| Education | 20 |
| Profile completeness | 20 |
| Application readiness | 15 |

Skills only count toward the score if they're relevant to the target role — the app matches the role against common job categories (trades, IT, sales, healthcare, product/project management, etc.) and checks listed skills against that category. This prevents unrelated skills (e.g. listing "JavaScript" for a "Plumber" role) from inflating the score. If the role doesn't match any known category, scoring falls back to counting specific skills without a relevance check.

If the target role contains a seniority word ("Senior", "Lead", "Principal", "Director", "Head of", "VP", "Chief") that doesn't match the selected years of experience, the total score is capped (down to as low as 15) regardless of how well other fields score — a title/experience mismatch is a significant red flag in real hiring, not a minor deduction.

## v1 scope

- No login, no accounts, nothing saved — everything runs in your browser
- No AI/LLM parsing (planned for a future version)
- Plain HTML/CSS/JavaScript — no build step, no framework

## Tech

Static site (HTML/CSS/JS), deployed on [Vercel](https://vercel.com).
