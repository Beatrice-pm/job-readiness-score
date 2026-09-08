// Job-Readiness Score — v1
// All scoring happens right here in the browser. Nothing is sent to a server
// and nothing is saved — refreshing the page clears everything.

const VAGUE_SKILLS = [
  "hardworking", "hard worker", "team player", "motivated", "fast learner",
  "good communication", "communication skills", "passionate", "dedicated",
  "detail oriented", "detail-oriented", "punctual", "reliable", "responsible",
  "self motivated", "self-motivated", "problem solver", "problem solving"
];

// Maps a target role to the skills typically relevant to it. `keywords` are
// lowercase fragments used for matching (both the role text and each listed
// skill are checked against these); `examples` are clean display versions
// shown in suggestion text. This list can't cover every job title — when no
// category matches, we fall back to scoring skills on specificity alone.
const ROLE_CATEGORIES = [
  {
    name: "Skilled Trades & Construction",
    keywords: ["plumb", "pipefit", "electrician", "electrical", "wiring", "carpente", "welder", "welding", "mason", "construction", "hvac", "mechanic", "automotive", "paint", "tiling", "roofing", "scaffold"],
    examples: ["plumbing", "electrical wiring", "carpentry", "welding", "HVAC repair"]
  },
  {
    name: "Software & IT",
    keywords: ["javascript", "python", "java", "sql", "html", "css", "react", "node", "programming", "software", "developer", "data analy", "power bi", "tableau", "networking", "cybersecurity", "it support", "cloud", "aws", "database", "coding", "web develop", "app develop", "devops"],
    examples: ["SQL", "Python", "data analysis", "cloud platforms (AWS)", "IT support"]
  },
  {
    name: "Sales & Customer Service",
    keywords: ["sales", "customer service", "crm", "negotiat", "upsell", "retail", "cashier", "call cent", "telemarketing", "client relations", "account manage", "business development"],
    examples: ["CRM software", "negotiation", "customer service", "retail sales"]
  },
  {
    name: "Marketing & Social Media",
    keywords: ["marketing", "social media", "seo", "content creation", "content writing", "copywriting", "branding", "digital marketing", "google ads", "canva", "influencer", "community manage"],
    examples: ["social media management", "SEO", "content creation", "Canva"]
  },
  {
    name: "Administration & Office",
    keywords: ["administra", "data entry", "scheduling", "microsoft office", "office manage", "filing", "bookkeeping", "correspondence", "receptionist", "executive assistant", "secretary", "clerical"],
    examples: ["Microsoft Office", "data entry", "scheduling", "office administration"]
  },
  {
    name: "Healthcare & Caregiving",
    keywords: ["nurs", "patient care", "first aid", "caregiv", "phlebotomy", "medical", "healthcare", "chw", "midwife", "clinical", "pharmac", "physiotherap"],
    examples: ["patient care", "first aid", "clinical experience"]
  },
  {
    name: "Education & Training",
    keywords: ["teach", "tutor", "curriculum", "classroom", "lesson plan", "mentor", "instructor", "trainer", "facilitat"],
    examples: ["lesson planning", "classroom management", "tutoring"]
  },
  {
    name: "Hospitality & Food Service",
    keywords: ["cook", "culinary", "chef", "food safety", "waitstaff", "waiter", "waitress", "bartend", "hospitality", "hotel", "barista", "catering", "housekeeping"],
    examples: ["food safety", "customer service", "barista skills", "catering"]
  },
  {
    name: "Logistics & Driving",
    keywords: ["driv", "logistics", "warehouse", "forklift", "delivery", "supply chain", "inventory", "dispatch", "courier", "fleet"],
    examples: ["driving license", "warehouse management", "logistics coordination"]
  },
  {
    name: "Finance & Accounting",
    keywords: ["account", "bookkeeping", "financial analy", "auditing", "taxation", "budget", "quickbooks", "payroll", "finance"],
    examples: ["bookkeeping", "Excel", "financial reporting", "QuickBooks"]
  },
  {
    name: "Design & Creative",
    keywords: ["graphic design", "photoshop", "illustrator", "ui/ux", "ux design", "ui design", "figma", "video editing", "photography", "animation", "creative direct"],
    examples: ["graphic design", "Figma", "Adobe Photoshop", "video editing"]
  },
  {
    name: "Agriculture",
    keywords: ["farm", "agricultur", "crop", "livestock", "irrigation", "agronom", "horticulture"],
    examples: ["crop management", "irrigation", "livestock care"]
  }
];

function findRoleCategory(roleText) {
  const lower = roleText.toLowerCase();
  return ROLE_CATEGORIES.find(cat => cat.keywords.some(k => lower.includes(k))) || null;
}

function skillMatchesCategory(skillLower, category) {
  return category.keywords.some(k => skillLower.includes(k) || k.includes(skillLower));
}

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
  "none": 6,
  "secondary": 10,
  "vocational": 14,
  "bachelors": 17,
  "masters": 20
};

const READINESS_POINTS = {
  "yes": 15,
  "progress": 8,
  "no": 0
};

const MAX_POINTS = {
  skills: 20,
  experience: 25,
  education: 20,
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
  const category = isMeaningful(data.role) ? findRoleCategory(data.role) : null;

  let relevantSkills = validSkills;
  if (category) {
    relevantSkills = validSkills.filter(s => skillMatchesCategory(s.toLowerCase(), category));
  }
  const skillsPoints = Math.round((Math.min(relevantSkills.length, 5) / 5) * MAX_POINTS.skills);

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

  return { total, buckets, validSkills, relevantSkills, category };
}

function scoreTier(total) {
  if (total >= 85) return { label: "Job Ready!", color: "green" };
  if (total >= 65) return { label: "Almost Ready", color: "blue" };
  if (total >= 40) return { label: "Getting There", color: "orange" };
  return { label: "Needs Work", color: "red" };
}

function buildSuggestions(data, result) {
  const suggestions = [];
  const { buckets, validSkills, relevantSkills, category } = result;
  const role = isMeaningful(data.role) ? data.role.trim() : "your target role";

  const candidates = [];

  if (buckets.skills.points < buckets.skills.max) {
    let text;
    if (validSkills.length === 0) {
      text = `You haven't listed any specific skills yet. Add 3–5 concrete skills relevant to "${role}" — think tools, software, or measurable abilities rather than personality traits.`;
    } else if (category && relevantSkills.length === 0) {
      text = `None of your listed skills matched what's typically relevant to "${role}" (${category.name}). Consider adding skills like ${category.examples.slice(0, 3).join(", ")} — or double check your target role is set correctly.`;
    } else if (category) {
      const needed = 5 - relevantSkills.length;
      text = `You listed ${relevantSkills.length} skill${relevantSkills.length === 1 ? "" : "s"} relevant to "${role}". Add ${Math.max(needed, 1)} more — e.g. ${category.examples.slice(0, 3).join(", ")}.`;
    } else {
      const needed = 5 - validSkills.length;
      text = `You listed ${validSkills.length} specific skill${validSkills.length === 1 ? "" : "s"}. We couldn't automatically match "${role}" to a category to check relevance, so add ${Math.max(needed, 1)} more skills you know are actually used in "${role}" roles.`;
    }
    candidates.push({ pct: buckets.skills.points / buckets.skills.max, text });
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
