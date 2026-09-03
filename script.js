// Job-Readiness Score — v1
// All scoring happens right here in the browser. Nothing is sent to a server
// and nothing is saved — refreshing the page clears everything.

const VAGUE_SKILLS = [
  "hardworking", "hard worker", "team player", "motivated", "fast learner",
  "good communication", "communication skills", "passionate", "dedicated",
  "detail oriented", "detail-oriented", "punctual", "reliable", "responsible",
  "self motivated", "self-motivated", "problem solver", "problem solving"
];

const EXPERIENCE_POINTS = {
  "0": 5,
  "lt1": 12,
  "1-3": 18,
  "3-5": 22,
  "5plus": 25
};

const EXPERIENCE_LABELS = {
  "0": "0 years",
  "lt1": "less than 1 year",
  "1-3": "1–3 years",
  "3-5": "3–5 years",
  "5plus": "5+ years"
};

const EDUCATION_POINTS = {
  "none": 5,
  "secondary": 8,
  "vocational": 11,
  "bachelors": 13,
  "masters": 15
};

const READINESS_POINTS = {
  "yes": 15,
  "progress": 8,
  "no": 0
};

const MAX_POINTS = {
  skills: 25,
  experience: 25,
  education: 15,
  completeness: 20,
  readiness: 15
};

const BAR_LABELS = {
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  completeness: "Profile completeness",
  readiness: "Application readiness"
};

const GENERAL_TIPS = [
  "Tailor your CV to each specific job description before applying — matching the employer's wording helps you pass initial screening.",
  "Ask a mentor, teacher, or peer to review your CV for clarity and typos before you send it out.",
  "Practice explaining your experience and skills in 1–2 sentences — you'll need this for interviews and networking."
];

function parseSkills(raw) {
  const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
  const seen = new Set();
  const valid = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (part.length <= 2) continue;
    if (VAGUE_SKILLS.includes(lower)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    valid.push(part);
  }
  return valid;
}

function isMeaningful(value) {
  if (!value) return false;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length <= 1) return false;
  if (["n/a", "na", "none", "-", "nil"].includes(trimmed)) return false;
  return true;
}

function scoreProfile(data) {
  const validSkills = parseSkills(data.skills);
  const skillsPoints = Math.round((Math.min(validSkills.length, 5) / 5) * MAX_POINTS.skills);

  const experiencePoints = EXPERIENCE_POINTS[data.experience] || 0;
  const educationPoints = EDUCATION_POINTS[data.education] || 0;
  const readinessPoints = READINESS_POINTS[data.readiness] || 0;

  const fieldsFilled = [
    Boolean(data.education),
    Boolean(data.experience),
    validSkills.length > 0,
    isMeaningful(data.role),
    isMeaningful(data.location),
    Boolean(data.readiness)
  ].filter(Boolean).length;
  const completenessPoints = Math.round((fieldsFilled / 6) * MAX_POINTS.completeness);

  const buckets = {
    skills: { points: skillsPoints, max: MAX_POINTS.skills },
    experience: { points: experiencePoints, max: MAX_POINTS.experience },
    education: { points: educationPoints, max: MAX_POINTS.education },
    completeness: { points: completenessPoints, max: MAX_POINTS.completeness },
    readiness: { points: readinessPoints, max: MAX_POINTS.readiness }
  };

  const total = Object.values(buckets).reduce((sum, b) => sum + b.points, 0);

  return { total, buckets, validSkills };
}

function scoreTier(total) {
  if (total >= 85) return { label: "Job Ready!", color: "green" };
  if (total >= 65) return { label: "Almost Ready", color: "blue" };
  if (total >= 40) return { label: "Getting There", color: "orange" };
  return { label: "Needs Work", color: "red" };
}

function buildSuggestions(data, result) {
  const suggestions = [];
  const { buckets, validSkills } = result;
  const role = isMeaningful(data.role) ? data.role.trim() : "your target role";

  const candidates = [];

  if (buckets.skills.points < buckets.skills.max) {
    const needed = 5 - validSkills.length;
    candidates.push({
      pct: buckets.skills.points / buckets.skills.max,
      text: validSkills.length === 0
        ? `You haven't listed any specific skills yet. Add 3–5 concrete skills relevant to "${role}" — think tools, software, or measurable abilities (e.g. "Excel", "SQL", "customer onboarding") rather than personality traits.`
        : `You listed ${validSkills.length} specific skill${validSkills.length === 1 ? "" : "s"}. Add ${Math.max(needed, 1)} more relevant to "${role}" to strengthen this section.`
    });
  }

  if (buckets.experience.points < buckets.experience.max) {
    candidates.push({
      pct: buckets.experience.points / buckets.experience.max,
      text: (data.experience === "0" || data.experience === "lt1")
        ? `You're early in your career — that's completely normal. List internships, volunteer work, class projects, or freelance gigs as experience; employers value what you've actually done over your job title.`
        : `Add more detail to your work history where possible — specific achievements and responsibilities make your experience easier to evaluate.`
    });
  }

  if (buckets.education.points < buckets.education.max) {
    candidates.push({
      pct: buckets.education.points / buckets.education.max,
      text: `Consider listing any completed courses, certificates, or training (even free online ones) — they show initiative even if you don't have a formal degree.`
    });
  }

  if (buckets.completeness.points < buckets.completeness.max) {
    candidates.push({
      pct: buckets.completeness.points / buckets.completeness.max,
      text: `Fill in every field with real, specific detail — a clear target role and location (even "Remote") makes it much easier for employers to match you to jobs.`
    });
  }

  if (buckets.readiness.points < buckets.readiness.max) {
    candidates.push({
      pct: buckets.readiness.points / buckets.readiness.max,
      text: data.readiness === "no"
        ? `Get a CV or LinkedIn profile ready before you start applying — employers can't consider you without one. This is often the single biggest blocker to landing interviews.`
        : `Finish setting up your CV or LinkedIn profile — you're partway there, and employers will want a link or document to review.`
    });
  }

  candidates.sort((a, b) => a.pct - b.pct);
  const picked = candidates.slice(0, 5).map(c => c.text);

  let i = 0;
  while (picked.length < 3 && i < GENERAL_TIPS.length) {
    picked.push(GENERAL_TIPS[i]);
    i++;
  }

  return picked.slice(0, 5);
}

function renderResults(data, result) {
  const tier = scoreTier(result.total);

  const scoreNumberEl = document.getElementById("score-number");
  scoreNumberEl.textContent = result.total;
  scoreNumberEl.className = "score-number " + tier.color;

  document.getElementById("score-label").textContent = tier.label;

  const breakdownEl = document.getElementById("breakdown");
  breakdownEl.innerHTML = "";
  for (const key of Object.keys(result.buckets)) {
    const bucket = result.buckets[key];
    const pct = Math.round((bucket.points / bucket.max) * 100);

    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-label">
        <span>${BAR_LABELS[key]}</span>
        <span class="bar-points">${bucket.points}/${bucket.max}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%"></div>
      </div>
    `;
    breakdownEl.appendChild(row);
  }

  const suggestions = buildSuggestions(data, result);
  const listEl = document.getElementById("suggestions-list");
  listEl.innerHTML = "";
  for (const text of suggestions) {
    const li = document.createElement("li");
    li.textContent = text;
    listEl.appendChild(li);
  }

  document.getElementById("readiness-form").hidden = true;
  document.getElementById("results").hidden = false;
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;

  const data = {
    education: form.education.value,
    experience: form.experience.value,
    skills: form.skills.value,
    role: form.role.value,
    location: form.location.value,
    readiness: form.readiness.value
  };

  if (!data.education || !data.experience || !data.readiness || !data.skills.trim() || !data.role.trim() || !data.location.trim()) {
    form.reportValidity();
    return;
  }

  const result = scoreProfile(data);
  renderResults(data, result);
}

function handleStartOver() {
  document.getElementById("readiness-form").reset();
  document.getElementById("readiness-form").hidden = false;
  document.getElementById("results").hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("readiness-form").addEventListener("submit", handleSubmit);
document.getElementById("start-over").addEventListener("click", handleStartOver);
