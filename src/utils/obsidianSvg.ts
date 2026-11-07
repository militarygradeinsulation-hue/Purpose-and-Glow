/**
 * Vector SVG Résumé Sheet Generator for Purpose & Glow
 * Produces ultra-crisp, realistic executive résumé sheets with genuine typography,
 * quantifiable achievement bullets, skills tags, and professional editorial layouts.
 */

function esc(s: string | null | undefined): string {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c;
  });
}

function rng(seed: number) {
  let s = seed % 233280;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function seedOf(str: string) {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h + 1;
}

interface TxtOpts {
  anchor?: string;
  font?: string;
  ls?: number;
  bold?: boolean | number;
  italic?: boolean;
  opacity?: number;
}

function txt(x: number, y: number, t: string, size: number, fill: string, opts: TxtOpts = {}) {
  const anchorAttr = opts.anchor ? ` text-anchor="${opts.anchor}"` : '';
  const fontAttr = ` font-family="${opts.font || 'Inter,system-ui,sans-serif'}"`;
  const sizeAttr = ` font-size="${size}"`;
  const lsAttr = opts.ls ? ` letter-spacing="${opts.ls}"` : '';
  const boldAttr = opts.bold ? ' font-weight="700"' : '';
  const italicAttr = opts.italic ? ' font-style="italic"' : '';
  const opAttr = opts.opacity ? ` opacity="${opts.opacity}"` : '';
  return `<text x="${x}" y="${y}"${anchorAttr}${fontAttr}${sizeAttr}${lsAttr}${boldAttr}${italicAttr}${opAttr} fill="${fill}">${esc(t)}</text>`;
}

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

export function generateResumeSvg(st: string, name: string, role: string, isDark: boolean = false): string {
  const RED = isDark ? '#F06292' : '#C2185B';
  const RED_DEEP = isDark ? '#EC407A' : '#9C1450';
  const INK = isDark ? '#F3F4F6' : '#111827';
  const INK_MUTED = isDark ? '#D1D5DB' : '#374151';
  const GREY_LIGHT = isDark ? '#9CA3AF' : '#6B7280';
  const RULE_COLOR = isDark ? '#2B3144' : '#E5E7EB';
  const BRAND_PINK = isDark ? '#221927' : '#FFF0F5';
  const BRAND_BORDER = isDark ? '#4E2138' : '#F0C6D6';
  const PAPER_BG = isDark ? '#131722' : '#FFFFFF';
  const PAPER_BORDER = isDark ? '#2A3248' : '#E2E8F0';
  const SIDEBAR_BG = isDark ? '#191D2B' : '#F8FAFC';

  const r = rng(seedOf(name + st));
  let b = '';
  const N = name.toUpperCase();
  const R = role.toUpperCase();

  // Background Paper texture with subtle border
  b += `<rect width="320" height="420" fill="${PAPER_BG}"/>`;
  b += `<rect x="0.5" y="0.5" width="319" height="419" fill="none" stroke="${PAPER_BORDER}" stroke-width="1"/>`;

  if (st === 'classic') {
    // Elegant Classic Executive / Legal / Healthcare Director Layout
    b += `<rect x="22" y="18" width="276" height="3" fill="${RED}"/>`;
    b += txt(160, 42, N, 14, INK, { font: SERIF, bold: 1, anchor: 'middle', ls: 2.2 });
    b += txt(160, 56, R, 7.5, RED, { font: SANS, bold: 1, anchor: 'middle', ls: 1.4 });
    b += txt(160, 68, 'MINNEAPOLIS, MN · (612) 555-0142 · NGOTSCH@PURPOSEGLOW.COM', 5.5, GREY_LIGHT, { font: SANS, anchor: 'middle', ls: 0.8 });
    b += `<line x1="22" y1="76" x2="298" y2="76" stroke="${RED}" stroke-width="1.2"/>`;
    b += `<line x1="22" y1="78.5" x2="298" y2="78.5" stroke="${BRAND_BORDER}" stroke-width="0.6"/>`;

    // Executive Summary
    b += txt(22, 92, 'EXECUTIVE SUMMARY', 7.5, RED, { font: SANS, bold: 1, ls: 1.2 });
    b += txt(22, 102, 'Tenured healthcare operations and revenue cycle leader with 12+ years driving clinic throughput,', 5.8, INK_MUTED, { font: SANS });
    b += txt(22, 111, 'recovering $180k+ in overturned denials, and transforming task lists into verifiable contribution metrics.', 5.8, INK_MUTED, { font: SANS });

    // Core Competencies Pills
    b += txt(22, 126, 'CORE COMPETENCIES', 7.5, RED, { font: SANS, bold: 1, ls: 1.2 });
    const skills = ['Revenue Cycle Management', 'Clean-Claim Rate (98.4%)', 'Epic EHR / Cerner', 'Denials & Appeals', 'Clinic Operations', 'HIPAA Compliance'];
    let px = 22;
    let py = 134;
    skills.forEach((sk) => {
      const w = sk.length * 4.4 + 10;
      if (px + w > 298) { px = 22; py += 14; }
      b += `<rect x="${px}" y="${py}" width="${w}" height="11" rx="2" fill="${BRAND_PINK}" stroke="${BRAND_BORDER}" stroke-width="0.8"/>`;
      b += txt(px + w / 2, py + 8, sk, 5.2, INK, { font: SANS, bold: 1, anchor: 'middle' });
      px += w + 6;
    });

    // Professional Experience
    py += 24;
    b += txt(22, py, 'PROFESSIONAL EXPERIENCE', 7.5, RED, { font: SANS, bold: 1, ls: 1.2 });
    b += `<line x1="22" y1="${py + 3}" x2="298" y2="${py + 3}" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;

    // Job 1
    py += 14;
    b += txt(22, py, 'SENIOR CLINIC OPERATIONS & RCM DIRECTOR', 7.5, INK, { font: SANS, bold: 1 });
    b += txt(298, py, '2020 – PRESENT', 6, RED, { font: SANS, bold: 1, anchor: 'end' });
    py += 10;
    b += txt(22, py, 'Twin Cities Metro Health System · Minneapolis, MN', 6, GREY_LIGHT, { font: SANS, italic: true });
    py += 10;
    b += `<circle cx="26" cy="${py - 2}" r="1.5" fill="${RED}"/>` + txt(32, py, 'Directed revenue cycle and clinic intake workflows across 18 FTEs and 14 clinic providers.', 5.7, INK_MUTED, { font: SANS });
    py += 9;
    b += `<circle cx="26" cy="${py - 2}" r="1.5" fill="${RED}"/>` + txt(32, py, 'Overturned $184,000+ in denied appeals in 90 days, cutting appeal turnaround from 14 to 4 days.', 5.7, INK_MUTED, { font: SANS, bold: 1 });
    py += 9;
    b += `<circle cx="26" cy="${py - 2}" r="1.5" fill="${RED}"/>` + txt(32, py, 'Elevated clean-claim first-pass submission rate to 98.6% across commercial and Medicare claims.', 5.7, INK_MUTED, { font: SANS });

    // Job 2
    py += 16;
    b += txt(22, py, 'REVENUE CYCLE SUPERVISOR & CODING LEAD', 7.5, INK, { font: SANS, bold: 1 });
    b += txt(298, py, '2016 – 2020', 6, GREY_LIGHT, { font: SANS, anchor: 'end' });
    py += 10;
    b += txt(22, py, 'Allina Health Outpatient Services · St. Paul, MN', 6, GREY_LIGHT, { font: SANS, italic: true });
    py += 10;
    b += `<circle cx="26" cy="${py - 2}" r="1.5" fill="${RED}"/>` + txt(32, py, 'Supervised 9 medical billers; reduced 90+ day aging accounts balance by 34% within 6 months.', 5.7, INK_MUTED, { font: SANS, bold: 1 });
    py += 9;
    b += `<circle cx="26" cy="${py - 2}" r="1.5" fill="${RED}"/>` + txt(32, py, 'Managed weekly chart auditing and billing QA protocols, achieving 100% audit compliance.', 5.7, INK_MUTED, { font: SANS });

    // Education & Credentials
    py += 18;
    b += txt(22, py, 'EDUCATION & CERTIFICATIONS', 7.5, RED, { font: SANS, bold: 1, ls: 1.2 });
    b += `<line x1="22" y1="${py + 3}" x2="298" y2="${py + 3}" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;
    py += 13;
    b += txt(22, py, 'B.S. in Health Services Management · University of Minnesota', 6.2, INK, { font: SANS, bold: 1 });
    py += 9;
    b += txt(22, py, 'Certified Professional Coder (CPC) · AAPC Credentialed · Epic Resolute Hospital Billing Certified', 5.6, GREY_LIGHT, { font: SANS });

  } else if (st === 'modern') {
    // Modern Two-Column Layout with High-Contrast Left Sidebar
    b += `<rect x="0" y="0" width="105" height="420" fill="${SIDEBAR_BG}"/>`;
    b += `<line x1="105" y1="0" x2="105" y2="420" stroke="${RULE_COLOR}" stroke-width="1"/>`;
    b += `<rect x="0" y="0" width="105" height="4" fill="${RED}"/>`;

    // Sidebar: Initials Monogram Badge
    b += `<circle cx="52" cy="42" r="22" fill="${BRAND_PINK}" stroke="${RED}" stroke-width="1.5"/>`;
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PG';
    b += txt(52, 48, initials, 13, RED, { font: SERIF, bold: 1, anchor: 'middle' });

    // Sidebar Contact
    let sy = 82;
    b += txt(14, sy, 'CONTACT', 7, RED, { font: SANS, bold: 1, ls: 1.2 });
    b += `<line x1="14" y1="${sy + 3}" x2="92" y2="${sy + 3}" stroke="${BRAND_BORDER}" stroke-width="0.8"/>`;
    sy += 12;
    b += txt(14, sy, 'Minneapolis, MN', 5.5, INK, { font: SANS, bold: 1 });
    sy += 9;
    b += txt(14, sy, '(612) 555-0142', 5.5, GREY_LIGHT, { font: SANS });
    sy += 9;
    b += txt(14, sy, 'candidate@gmail.com', 5.2, GREY_LIGHT, { font: SANS });
    sy += 9;
    b += txt(14, sy, 'linkedin.com/in/profile', 5.2, RED, { font: SANS });

    // Sidebar Skills
    sy += 20;
    b += txt(14, sy, 'EXPERTISE', 7, RED, { font: SANS, bold: 1, ls: 1.2 });
    b += `<line x1="14" y1="${sy + 3}" x2="92" y2="${sy + 3}" stroke="${BRAND_BORDER}" stroke-width="0.8"/>`;
    const sideSkills = ['Denials Recovery', 'Epic Systems', 'Clean Claims', 'Clinic Intake', 'HIPAA Audits', 'Staff Coaching', 'AthenaHealth'];
    sideSkills.forEach((sk) => {
      sy += 12;
      b += txt(14, sy, sk, 5.4, INK_MUTED, { font: SANS, bold: 1 });
      b += `<rect x="14" y="${sy + 3}" width="78" height="2" fill="${RULE_COLOR}"/>`;
      b += `<rect x="14" y="${sy + 3}" width="${Math.round(48 + r() * 28)}" height="2" fill="${RED}"/>`;
    });

    // Sidebar Education
    sy += 22;
    b += txt(14, sy, 'EDUCATION', 7, RED, { font: SANS, bold: 1, ls: 1.2 });
    b += `<line x1="14" y1="${sy + 3}" x2="92" y2="${sy + 3}" stroke="${BRAND_BORDER}" stroke-width="0.8"/>`;
    sy += 12;
    b += txt(14, sy, 'B.S. Healthcare Mgt', 5.6, INK, { font: SANS, bold: 1 });
    sy += 8;
    b += txt(14, sy, 'Univ of Minnesota', 5.2, GREY_LIGHT, { font: SANS });
    sy += 10;
    b += txt(14, sy, 'CPC Certified (AAPC)', 5.4, RED, { font: SANS, bold: 1 });

    // Main Right Column Header
    b += txt(120, 36, N, 14, INK, { font: SANS, bold: 1 });
    b += txt(120, 48, R, 7.5, RED, { font: SANS, bold: 1, ls: 1 });
    b += txt(120, 58, 'Proven track record of turning daily duties into high-impact operational achievements.', 5.6, GREY_LIGHT, { font: SANS, italic: true });
    b += `<line x1="120" y1="66" x2="306" y2="66" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;

    // Career Profile
    let ry = 78;
    b += txt(120, ry, 'EXECUTIVE PROFILE', 7.5, RED, { font: SANS, bold: 1, ls: 1 });
    ry += 10;
    b += txt(120, ry, 'Dynamic healthcare leader specialized in revenue cycle optimization and clinic workflow design.', 5.7, INK_MUTED, { font: SANS });
    ry += 9;
    b += txt(120, ry, 'Known for eliminating communication bottlenecks and translating clinical grit into career growth.', 5.7, INK_MUTED, { font: SANS });

    // Experience
    ry += 18;
    b += txt(120, ry, 'KEY EXPERIENCE & METRICS', 7.5, RED, { font: SANS, bold: 1, ls: 1 });
    b += `<line x1="120" y1="${ry + 3}" x2="306" y2="${ry + 3}" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;

    ry += 14;
    b += txt(120, ry, 'LEAD REVENUE CYCLE & CLINIC SUPERVISOR', 7.2, INK, { font: SANS, bold: 1 });
    b += txt(306, ry, '2021 – PRESENT', 5.8, RED, { font: SANS, bold: 1, anchor: 'end' });
    ry += 9;
    b += txt(120, ry, 'Metro Health Clinics · St. Paul, MN', 5.6, GREY_LIGHT, { font: SANS, italic: true });
    ry += 10;
    b += `<rect x="120" y="${ry - 3}" width="3" height="3" fill="${RED}"/>` + txt(128, ry, 'Recovered $184,000+ in denied claims by restructuring multi-payer appeal workflows.', 5.7, INK_MUTED, { font: SANS, bold: 1 });
    ry += 9;
    b += `<rect x="120" y="${ry - 3}" width="3" height="3" fill="${RED}"/>` + txt(128, ry, 'Trained 18 patient access coordinators in Epic EHR, reducing scheduling errors by 42%.', 5.7, INK_MUTED, { font: SANS });
    ry += 9;
    b += `<rect x="120" y="${ry - 3}" width="3" height="3" fill="${RED}"/>` + txt(128, ry, 'Maintained clean claim submission rate above 98.5% across 22,000 annual patient visits.', 5.7, INK_MUTED, { font: SANS });

    ry += 16;
    b += txt(120, ry, 'SENIOR BILLING & PRIOR-AUTH SPECIALIST', 7.2, INK, { font: SANS, bold: 1 });
    b += txt(306, ry, '2017 – 2021', 5.8, GREY_LIGHT, { font: SANS, anchor: 'end' });
    ry += 9;
    b += txt(120, ry, 'Allina Health Partners · Minneapolis, MN', 5.6, GREY_LIGHT, { font: SANS, italic: true });
    ry += 10;
    b += `<rect x="120" y="${ry - 3}" width="3" height="3" fill="${RED}"/>` + txt(128, ry, 'Spearheaded prior-authorization expediting, reducing approval lag from 5 days to 24 hours.', 5.7, INK_MUTED, { font: SANS, bold: 1 });
    ry += 9;
    b += `<rect x="120" y="${ry - 3}" width="3" height="3" fill="${RED}"/>` + txt(128, ry, 'Audited 120+ clinical charts monthly for ICD-10-CM and CPT coding accuracy.', 5.7, INK_MUTED, { font: SANS });

    ry += 16;
    b += txt(120, ry, 'KEY LEADERSHIP IMPACT', 7.5, RED, { font: SANS, bold: 1, ls: 1 });
    ry += 10;
    b += `<rect x="120" y="${ry - 3}" width="3" height="3" fill="${RED}"/>` + txt(128, ry, 'Recipient of 2023 Operational Excellence Award for cross-functional clinical leadership.', 5.7, INK, { font: SANS, bold: 1 });

  } else if (st === 'ats') {
    // Clean, Ultra-Readable ATS-Friendly Single Column Format
    b += txt(22, 34, N, 15, INK, { font: SANS, bold: 1 });
    b += txt(22, 47, R + ' · HEALTHCARE OPERATIONS & RCM', 7.5, RED, { font: SANS, bold: 1, ls: 1 });
    b += txt(22, 58, 'Minneapolis, MN · (612) 555-0142 · professional@email.com · linkedin.com/in/pro', 5.8, GREY_LIGHT, { font: SANS });
    b += `<line x1="22" y1="65" x2="298" y2="65" stroke="${INK}" stroke-width="1.2"/>`;

    let ay = 78;
    b += txt(22, ay, 'PROFESSIONAL SUMMARY', 8, INK, { font: SANS, bold: 1, ls: 1 });
    b += `<line x1="22" y1="${ay + 2}" x2="298" y2="${ay + 2}" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;
    ay += 11;
    b += txt(22, ay, 'Targeted Healthcare Operations Leader with 10+ years of proven success overturning denials,', 5.8, INK_MUTED, { font: SANS });
    ay += 9;
    b += txt(22, ay, 'accelerating prior-auth approvals, and building high-performing patient access teams.', 5.8, INK_MUTED, { font: SANS });

    ay += 16;
    b += txt(22, ay, 'AREAS OF EXPERTISE & KEYWORDS', 8, INK, { font: SANS, bold: 1, ls: 1 });
    b += `<line x1="22" y1="${ay + 2}" x2="298" y2="${ay + 2}" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;
    ay += 11;
    b += txt(22, ay, '• Revenue Cycle (RCM) • Epic EHR Resolute • Denial Management • Clean Claims (98.6%)', 5.8, INK, { font: SANS, bold: 1 });
    ay += 9;
    b += txt(22, ay, '• Outpatient Clinic Ops • HIPAA Compliance • ICD-10-CM / CPT • Staff Supervision (18 FTEs)', 5.8, INK, { font: SANS, bold: 1 });

    ay += 18;
    b += txt(22, ay, 'PROFESSIONAL EXPERIENCE', 8, INK, { font: SANS, bold: 1, ls: 1 });
    b += `<line x1="22" y1="${ay + 2}" x2="298" y2="${ay + 2}" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;

    ay += 12;
    b += txt(22, ay, 'CLINICAL OPERATIONS MANAGER', 7.5, INK, { font: SANS, bold: 1 });
    b += txt(298, ay, '01/2021 – PRESENT', 6, RED, { font: SANS, bold: 1, anchor: 'end' });
    ay += 9;
    b += txt(22, ay, 'University of Minnesota Physicians · Minneapolis, MN', 6, GREY_LIGHT, { font: SANS, italic: true });
    ay += 10;
    b += txt(24, ay, '• Overturned $184,000+ in complex clinical denials, improving quarterly cash flow by 18%.', 5.8, INK_MUTED, { font: SANS, bold: 1 });
    ay += 9;
    b += txt(24, ay, '• Managed clinic operations for 14 specialty providers, expanding patient volume by 24%.', 5.8, INK_MUTED, { font: SANS });
    ay += 9;
    b += txt(24, ay, '• Standardized clinical intake workflows in Epic EHR, reducing check-in wait time by 45%.', 5.8, INK_MUTED, { font: SANS });

    ay += 16;
    b += txt(22, ay, 'REVENUE CYCLE & BILLING SUPERVISOR', 7.5, INK, { font: SANS, bold: 1 });
    b += txt(298, ay, '06/2017 – 12/2020', 6, GREY_LIGHT, { font: SANS, anchor: 'end' });
    ay += 9;
    b += txt(22, ay, 'HealthPartners Outpatient Clinics · Bloomington, MN', 6, GREY_LIGHT, { font: SANS, italic: true });
    ay += 10;
    b += txt(24, ay, '• Reduced aging accounts receivable (>90 days) from 28% to 14% within 9 months.', 5.8, INK_MUTED, { font: SANS, bold: 1 });
    ay += 9;
    b += txt(24, ay, '• Supervised 8 billing specialists and conducted monthly QA coding reviews.', 5.8, INK_MUTED, { font: SANS });

    ay += 18;
    b += txt(22, ay, 'EDUCATION & CREDENTIALS', 8, INK, { font: SANS, bold: 1, ls: 1 });
    b += `<line x1="22" y1="${ay + 2}" x2="298" y2="${ay + 2}" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;
    ay += 12;
    b += txt(22, ay, 'Bachelor of Science (B.S.) in Health Services Management · 3.85 GPA', 6, INK, { font: SANS, bold: 1 });
    ay += 9;
    b += txt(22, ay, 'Certified Professional Coder (CPC) · AAPC Credentialed', 6, RED, { font: SANS, bold: 1 });

  } else {
    // Ground-Up Career Overhaul & Student / High-Impact Format
    b += `<rect x="0" y="0" width="320" height="60" fill="${BRAND_PINK}"/>`;
    b += `<line x1="0" y1="60" x2="320" y2="60" stroke="${BRAND_BORDER}" stroke-width="1"/>`;
    b += txt(22, 30, N, 14, INK, { font: SERIF, bold: 1 });
    b += txt(22, 44, R, 7.5, RED, { font: SANS, bold: 1, ls: 1 });
    b += txt(298, 36, 'PURPOSE & GLOW VERIFIED TRANSFORMATION', 5.5, RED, { font: SANS, bold: 1, anchor: 'end' });
    b += txt(298, 46, 'Minneapolis, MN · Nicole Gotsch Client Showcase', 5.2, GREY_LIGHT, { font: SANS, anchor: 'end' });

    let gy = 80;
    b += txt(22, gy, 'EXECUTIVE PROFILE & STRATEGIC PIVOT', 7.5, RED, { font: SANS, bold: 1, ls: 1 });
    b += `<line x1="22" y1="${gy + 3}" x2="298" y2="${gy + 3}" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;
    gy += 12;
    b += txt(22, gy, 'Transformational career leader translating 12+ years of operational tenure into high-impact healthcare governance.', 5.8, INK_MUTED, { font: SANS });
    gy += 9;
    b += txt(22, gy, 'Rebuilt from the ground up to replace routine duties with $180k+ revenue impact and throughput gains.', 5.8, INK_MUTED, { font: SANS });

    // Key Highlights Box
    gy += 14;
    b += `<rect x="22" y="${gy}" width="276" height="34" rx="4" fill="${BRAND_PINK}" stroke="${BRAND_BORDER}" stroke-width="0.8"/>`;
    b += txt(32, gy + 12, 'KEY TRANSFORMATION HIGHLIGHTS (BEFORE VS. AFTER):', 6, RED, { font: SANS, bold: 1 });
    b += txt(32, gy + 22, '• Before: "Responsible for billing and staff scheduling" (Passive Duty List)', 5.3, GREY_LIGHT, { font: SANS });
    b += txt(32, gy + 29, '• After: "Overturned $184k in denials; reduced prior-auth turnaround to 24 hrs" (Quantified Contribution)', 5.5, INK, { font: SANS, bold: 1 });

    gy += 46;
    b += txt(22, gy, 'CAREER TRAJECTORY & DEMONSTRATED IMPACT', 7.5, RED, { font: SANS, bold: 1, ls: 1 });
    b += `<line x1="22" y1="${gy + 3}" x2="298" y2="${gy + 3}" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;

    gy += 13;
    b += txt(22, gy, 'DIRECTOR OF CLINICAL PRACTICE MANAGEMENT', 7.5, INK, { font: SANS, bold: 1 });
    b += txt(298, gy, '2020 – PRESENT', 6, RED, { font: SANS, bold: 1, anchor: 'end' });
    gy += 9;
    b += txt(22, gy, 'Regional Healthcare Operations Network · Minneapolis, MN', 6, GREY_LIGHT, { font: SANS, italic: true });
    gy += 10;
    b += `<circle cx="26" cy="${gy - 2}" r="1.5" fill="${RED}"/>` + txt(32, gy, 'Architected outpatient clinical empanelment for 18 clinics, growing provider capacity by 31%.', 5.7, INK_MUTED, { font: SANS });
    gy += 9;
    b += `<circle cx="26" cy="${gy - 2}" r="1.5" fill="${RED}"/>` + txt(32, gy, 'Recovered $184,000+ in blocked hospital revenue via strategic payer appeals and coding redesign.', 5.7, INK_MUTED, { font: SANS, bold: 1 });

    gy += 16;
    b += txt(22, gy, 'CLINIC OPERATIONS SUPERVISOR', 7.5, INK, { font: SANS, bold: 1 });
    b += txt(298, gy, '2016 – 2020', 6, GREY_LIGHT, { font: SANS, anchor: 'end' });
    gy += 9;
    b += txt(22, gy, 'Allina Health Outpatient Services · St. Paul, MN', 6, GREY_LIGHT, { font: SANS, italic: true });
    gy += 10;
    b += `<circle cx="26" cy="${gy - 2}" r="1.5" fill="${RED}"/>` + txt(32, gy, 'Led 18 medical assistants and patient access specialists with 96% staff retention over 4 years.', 5.7, INK_MUTED, { font: SANS, bold: 1 });

    gy += 18;
    b += txt(22, gy, 'CREDENTIALS, DEGREES & AFFILIATIONS', 7.5, RED, { font: SANS, bold: 1, ls: 1 });
    b += `<line x1="22" y1="${gy + 3}" x2="298" y2="${gy + 3}" stroke="${RULE_COLOR}" stroke-width="0.8"/>`;
    gy += 12;
    b += txt(22, gy, 'B.S. in Health Services Management · CPC Certified Professional Coder', 6, INK, { font: SANS, bold: 1 });
    gy += 8;
    b += txt(22, gy, 'Epic Certified (Cadence & Resolute) · Minnesota Healthcare Leaders Association', 5.5, GREY_LIGHT, { font: SANS });
  }

  // Subtle Purpose & Glow authentic certification seal in bottom right corner
  b += `<g transform="translate(272, 382)">`;
  b += `<circle cx="16" cy="16" r="14" fill="${BRAND_PINK}" stroke="${RED}" stroke-width="0.8"/>`;
  b += `<circle cx="16" cy="16" r="11" fill="none" stroke="${RED}" stroke-width="0.4" stroke-dasharray="2 1"/>`;
  b += txt(16, 15, 'P&G', 6, RED, { font: SERIF, bold: 1, anchor: 'middle' });
  b += txt(16, 21, 'VERIFIED', 3.5, RED_DEEP, { font: SANS, bold: 1, anchor: 'middle', ls: 0.8 });
  b += `</g>`;

  return `<svg viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(st + ' résumé layout for ' + name + ', ' + role)}">${b}</svg>`;
}
