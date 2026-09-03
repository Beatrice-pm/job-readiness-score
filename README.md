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
| Skills listed | 25 |
| Work experience | 25 |
| Education | 15 |
| Profile completeness | 20 |
| Application readiness | 15 |

## v1 scope

- No login, no accounts, nothing saved — everything runs in your browser
- No AI/LLM parsing (planned for a future version)
- Plain HTML/CSS/JavaScript — no build step, no framework

## Tech

Static site (HTML/CSS/JS), deployed on [Vercel](https://vercel.com).
