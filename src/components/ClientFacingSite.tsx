import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  OBSIDIAN_FILTERS,
  OBSIDIAN_PLATES,
  OBSIDIAN_SAMPLES,
  SampleItem,
  PlateItem
} from '../data/obsidianData';
import { generateResumeSvg } from '../utils/obsidianSvg';
import { Lock, Mail, Moon, Sun, Send } from 'lucide-react';
import { EmailInquiryModal, EmailInquiryData } from './EmailInquiryModal';
import Skiper39 from './ui/skiper39';
import '../styles/obsidian.css';

interface ClientFacingSiteProps {
  onOpenAdmin: () => void;
  onInboundLeadSubmitted?: (lead: {
    first: string;
    email: string;
    service: string;
    note: string;
    id: string;
    phone?: string;
    urgency?: string;
  }) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

interface RequestRecord {
  id: string;
  first: string;
  email: string;
  service: string;
  note: string;
  done: boolean;
  at: number;
}

export function ClientFacingSite({
  onOpenAdmin,
  onInboundLeadSubmitted,
  isDarkMode = false,
  onToggleDarkMode
}: ClientFacingSiteProps) {
  // Navigation & scroll progress states
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<'00' | '01' | '02' | '03' | '04' | '05' | '06'>('00');
  const [activeSectionLabel, setActiveSectionLabel] = useState('Front page');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showToTop, setShowToTop] = useState(false);

  // Email Pop-Up Form Fill state attached to the email on the page
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailModalDefaultService, setEmailModalDefaultService] = useState('Résumé Revamp ($99)');

  const handleOpenEmailModal = (defaultService: string = 'Résumé Revamp ($99)') => {
    setEmailModalDefaultService(defaultService);
    setIsEmailModalOpen(true);
  };

  const handleEmailModalSuccess = (inquiry: EmailInquiryData) => {
    if (onInboundLeadSubmitted) {
      onInboundLeadSubmitted({
        first: inquiry.name,
        email: inquiry.email,
        service: inquiry.service,
        note: `${inquiry.message}${inquiry.targetRole ? ` [Target: ${inquiry.targetRole}]` : ''}${inquiry.currentRole ? ` [Current: ${inquiry.currentRole}]` : ''}`,
        id: inquiry.id || `inq-${Date.now()}`,
        phone: inquiry.phone,
        urgency: inquiry.urgency
      });
    }
  };

  // Quote carousel in Section 02
  const quotes = useMemo(() => {
    return OBSIDIAN_SAMPLES.slice(0, 8).map((s) => ({
      q: s.q,
      a: s.a,
      r: s.t
    }));
  }, []);
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Portfolio states in Section 04
  const [portfolioFilter, setPortfolioFilter] = useState('all');
  const [shortlist, setShortlist] = useState<Record<string, { id: string; at: number }>>(() => {
    try {
      const saved = localStorage.getItem('pg_shortlist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [selectedSample, setSelectedSample] = useState<SampleItem | null>(null);

  // Contact form & ledger in Section 06
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formService, setFormService] = useState('Professional Résumé Revamp — $99');
  const [formNote, setFormNote] = useState('');
  const [formStatus, setFormStatus] = useState<{ msg: string; isErr: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<Record<string, RequestRecord>>(() => {
    try {
      const saved = localStorage.getItem('pg_client_requests');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Toast notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Section observer & reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalH = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = totalH > 0 ? Math.min(1, Math.max(0, currentScroll / totalH)) : 0;
      setScrollProgress(progress);
      setShowToTop(currentScroll > 400);

      // Determine active section
      const sections: { id: string; no: '00' | '01' | '02' | '03' | '04' | '05' | '06'; label: string }[] = [
        { id: 'home', no: '00', label: 'Front page' },
        { id: 'work', no: '01', label: 'The Work' },
        { id: 'testimony', no: '02', label: 'Testimony' },
        { id: 'process', no: '03', label: 'Process' },
        { id: 'portfolio', no: '04', label: 'Portfolio' },
        { id: 'pricing', no: '05', label: 'Pricing' },
        { id: 'contact', no: '06', label: 'Contact' }
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180) {
            setActiveSection(sections[i].no);
            setActiveSectionLabel(sections[i].label);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save shortlist & requests to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pg_shortlist', JSON.stringify(shortlist));
    } catch {}
  }, [shortlist]);

  useEffect(() => {
    try {
      localStorage.setItem('pg_client_requests', JSON.stringify(requests));
    } catch {}
  }, [requests]);

  const toggleShortlist = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShortlist((prev) => {
      const updated = { ...prev };
      if (updated[id]) {
        delete updated[id];
        showToast('Removed from your shortlist');
      } else {
        updated[id] = { id, at: Date.now() };
        showToast('Saved to your shortlist');
      }
      return updated;
    });
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied ${label} to clipboard`);
    } catch {
      showToast(`Copy failed`);
    }
  };

  const visibleSamples = useMemo(() => {
    return OBSIDIAN_SAMPLES.filter((s) => {
      if (portfolioFilter === 'all') return true;
      if (portfolioFilter === 'shortlist') return !!shortlist[s.id];
      return s.cat === portfolioFilter;
    });
  }, [portfolioFilter, shortlist]);

  const handleSelectService = (serviceName: string) => {
    setFormService(serviceName);
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const input = document.getElementById('fName');
        input?.focus();
      }, 500);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormStatus({ msg: 'Please enter your first name.', isErr: true });
      return;
    }
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail);
    if (!isValidEmail) {
      setFormStatus({ msg: 'Please enter a valid email address.', isErr: true });
      return;
    }

    setIsSubmitting(true);
    const newId = `req-${Date.now()}`;
    const newRecord: RequestRecord = {
      id: newId,
      first: formName.trim().slice(0, 60),
      email: formEmail.trim().slice(0, 120),
      service: formService,
      note: formNote.trim().slice(0, 800),
      done: false,
      at: Date.now()
    };

    setRequests((prev) => ({ [newId]: newRecord, ...prev }));
    setFormStatus({
      msg: `Thank you, ${newRecord.first} — Nicole will reply within one business day.`,
      isErr: false
    });

    // Notify parent applet to create lead in pipeline and save to Cloud SQL
    if (onInboundLeadSubmitted) {
      onInboundLeadSubmitted({
        first: newRecord.first,
        email: newRecord.email,
        service: newRecord.service,
        note: newRecord.note,
        id: newRecord.id
      });
    }

    // Try posting to /api/leads so it syncs with server-side Cloud SQL
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: newRecord.first,
          headline: `Inbound Client: ${newRecord.service}`,
          location: 'United States / Remote',
          sourceType: 'Inbound Consultation Request',
          sourceContext: `Client request submitted via website form (${newRecord.service})`,
          sourceUrl: 'https://purposeglowcareer.com/#contact',
          rawText: newRecord.note || `Interested in: ${newRecord.service}. Contact: ${newRecord.email}`,
          yearsExperience: 5,
          isHealthcareOrOps: /healthcare|billing|clinic|ops/i.test(`${newRecord.service} ${newRecord.note}`),
          detectedCluster: /student/i.test(newRecord.service) ? 'student_grad' : /scratch/i.test(newRecord.service) ? 'career_pivot' : 'healthcare_rcm',
          recommendedPackageId: /student/i.test(newRecord.service) ? 'student_50' : /scratch/i.test(newRecord.service) ? 'scratch_145' : 'revamp_99',
          status: 'new_signal',
          fitScore: 98
        })
      });
    } catch (err) {
      console.warn('Could not post lead to server:', err);
    }

    setFormName('');
    setFormEmail('');
    setFormNote('');
    setIsSubmitting(false);
  };

  const handleToggleRecordDone = (id: string) => {
    setRequests((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], done: !prev[id].done }
      };
    });
  };

  const handleDeleteRecord = (id: string) => {
    setRequests((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const requestList = useMemo(() => {
    return Object.values(requests).sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [requests]);

  const openRequestsCount = requestList.filter((r) => !r.done).length;

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode
        ? 'dark bg-[#0A0C13] text-[#F3F4F6]'
        : 'bg-[var(--paper)] text-[var(--ink)]'
    } selection:bg-pink-500/30`}>
      {/* SVG Symbol Cache */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <symbol id="i-check" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </symbol>
          <symbol id="i-dash" viewBox="0 0 24 24">
            <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2.2" strokeLinecap="round" />
          </symbol>
          <symbol id="i-star" viewBox="0 0 24 24">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
          </symbol>
        </defs>
      </svg>

      {/* Sticky Masthead with Progress Rule */}
      <header className="masthead">
        <div className="wrap mh-row">
          <a href="#home" className="brand" aria-label="Purpose & Glow — Nicole Gotsch home">
            <span>Purpose <em>&amp;</em> Glow</span>
            <small>Nicole Gotsch</small>
          </a>

          <nav className="nav" aria-label="Primary">
            <a href="#work" aria-current={activeSection === '01'}>The Work</a>
            <a href="#testimony" aria-current={activeSection === '02'}>Testimony</a>
            <a href="#process" aria-current={activeSection === '03'}>Process</a>
            <a href="#portfolio" aria-current={activeSection === '04'}>Portfolio</a>
            <a href="#pricing" aria-current={activeSection === '05'}>Pricing</a>
            <a href="#contact" aria-current={activeSection === '06'}>Contact</a>
          </nav>

          <div className="mh-right">
            <div className="readout" id="readout" aria-live="polite">
              § {activeSection} — <b>{activeSectionLabel}</b>
            </div>

            {/* Dark Mode Toggle */}
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                title={isDarkMode ? "Switch to light mode" : "Switch to dark obsidian mode"}
                aria-label="Toggle dark mode"
                className="p-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-amber-300"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>
            )}

            {/* Quick Email Inquiry Pop-up Button */}
            <button
              type="button"
              onClick={() => handleOpenEmailModal('General Inquiry')}
              title="Pop up message form to email Nicole at ngotsch@outlook.com"
              className="px-3 py-2 text-xs font-semibold text-[#C2185B] dark:text-pink-300 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-950/70 border border-pink-200 dark:border-pink-800/60 rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-[#C2185B] dark:text-pink-400" />
              <span>Email Nicole</span>
            </button>

            {/* Seamless Access to Backend Admin Workbench */}
            <button
              type="button"
              onClick={onOpenAdmin}
              title="Open Backend Admin Studio"
              className="px-3 py-2 text-xs font-semibold text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span>Admin Area</span>
            </button>

            <a href="#contact" className="btn-ink">
              <span>Begin a Consultation</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>

            <button
              type="button"
              className="burger"
              id="burger"
              aria-label="Toggle navigation"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="b-open" viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
              <svg className="b-close" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>

        {/* Reading progress rule */}
        <div className="rule" role="progressbar" aria-label="Reading progress" aria-valuenow={Math.round(scrollProgress * 100)}>
          <div className="rule-fill" id="ruleFill" style={{ transform: `scaleX(${scrollProgress})` }} />
          <div className="ticks" id="ticks">
            {[0, 15, 30, 45, 60, 75, 90].map((leftPct, idx) => (
              <span
                key={leftPct}
                className={`tick ${scrollProgress * 100 >= leftPct ? 'passed' : ''}`}
                style={{ left: `${leftPct}%` }}
              >
                <span className="tip">§ 0{idx}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`} id="mobileNav" aria-label="Mobile">
          <div className="wrap">
            <ul>
              <li><a href="#work" onClick={() => setIsMobileMenuOpen(false)}>The Work <span>§ 01</span></a></li>
              <li><a href="#testimony" onClick={() => setIsMobileMenuOpen(false)}>Testimony <span>§ 02</span></a></li>
              <li><a href="#process" onClick={() => setIsMobileMenuOpen(false)}>Process <span>§ 03</span></a></li>
              <li><a href="#portfolio" onClick={() => setIsMobileMenuOpen(false)}>Portfolio <span>§ 04</span></a></li>
              <li><a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing <span>§ 05</span></a></li>
              <li><a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact <span>§ 06</span></a></li>
              <li className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenEmailModal('Mobile Inbound Inquiry');
                  }}
                  className="w-full text-left py-2 text-base font-semibold text-[#C2185B] flex justify-between items-center"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#C2185B]" />
                    <span>Email Nicole (Pop-up Form)</span>
                  </span>
                  <span className="text-xs font-mono bg-pink-100 text-[#C2185B] px-2 py-0.5 rounded font-medium">Send ↗</span>
                </button>
              </li>
              {onToggleDarkMode && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleDarkMode();
                    }}
                    className="w-full text-left py-2 text-base font-semibold flex justify-between items-center text-slate-700 dark:text-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {isDarkMode ? 'Active' : 'Dark'}
                    </span>
                  </button>
                </li>
              )}
              <li className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full text-left py-2 text-base font-semibold text-slate-900 dark:text-slate-100 flex justify-between items-center"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#C2185B]" />
                    <span>Admin Area</span>
                  </span>
                  <span className="text-xs font-mono bg-pink-100 dark:bg-pink-950 text-[#C2185B] dark:text-pink-300 px-2 py-0.5 rounded font-medium">Studio ↗</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Main Content Landmark */}
      <main id="main">
        {/* Animated Crowd Opener in Purpose & Glow Colors & Theme */}
        <Skiper39
          ctaText="Stand out of the rest of the crowd with Purpose & Glow"
          subText="A résumé problem is rarely an experience problem. It is almost always a translation problem. While hundreds of applicants submit generic duty lists that blend into the crowd, Nicole Gotsch uncovers the exact metrics and achievements that get you noticed."
          onPrimaryClick={() => {
            const el = document.getElementById('contact');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onSecondaryClick={() => {
            const el = document.getElementById('portfolio');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          isDarkMode={isDarkMode}
        />

        {/* Section 00: Hero */}
        <section className="hero" id="home" data-sect data-no="00" data-label="Front page">
          <div className="hero-accent" id="heroAccent" aria-hidden="true">
            <svg viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
              <polygon points="260,0 800,0 800,900 0,900" fill={isDarkMode ? '#131722' : '#FFF0F5'} />
              <polygon points="420,0 800,0 800,900 260,900" fill={isDarkMode ? '#1E2333' : '#FCD6E4'} opacity={isDarkMode ? '.8' : '.6'} />
              <g stroke={isDarkMode ? '#F06292' : '#C2185B'} strokeWidth="1" opacity={isDarkMode ? '.25' : '.6'}>
                <line x1="250" y1="0" x2="250" y2="900" />
                <line x1="290" y1="0" x2="290" y2="900" />
                <line x1="330" y1="0" x2="330" y2="900" />
                <line x1="370" y1="0" x2="370" y2="900" />
                <line x1="410" y1="0" x2="410" y2="900" />
                <line x1="450" y1="0" x2="450" y2="900" />
                <line x1="490" y1="0" x2="490" y2="900" />
                <line x1="530" y1="0" x2="530" y2="900" />
                <line x1="570" y1="0" x2="570" y2="900" />
                <line x1="610" y1="0" x2="610" y2="900" />
                <line x1="650" y1="0" x2="650" y2="900" />
                <line x1="690" y1="0" x2="690" y2="900" />
                <line x1="730" y1="0" x2="730" y2="900" />
                <line x1="770" y1="0" x2="770" y2="900" />
              </g>
            </svg>
          </div>

          <div className="wrap">
            <div className="hero-meta">
              <p className="label"><span>§ 00 — Nicole Gotsch</span><span>Brooklyn Park, Minnesota · Remote Nationwide</span></p>
              <p className="label red"><span>Purpose &amp; Glow Career Solutions</span><span className="num">Est. 2024</span></p>
            </div>

            <div className="hero-grid">
              <h1>
                Your experience deserves <em>a better</em>
                <span className="line2">first page.</span>
              </h1>

              <p className="lead dropcap">
                A résumé problem is rarely an experience problem. It is almost always a translation problem. I write each page from the ground up — interviewing you directly, unearthing the metrics hidden behind daily tasks, and formatting for both human partners and applicant tracking systems.
              </p>

              <aside className="hero-aside">
                <dl>
                  <div>
                    <dt>Practice</dt>
                    <dd>12+ years in healthcare operations, revenue cycle, clinic administration, and corporate governance.</dd>
                  </div>
                  <div>
                    <dt>Turnaround</dt>
                    <dd>24–48 hours for revamps; 3–5 business days for ground-up creations.</dd>
                  </div>
                  <div>
                    <dt>Direct line</dt>
                    <dd>
                      <button
                        type="button"
                        onClick={() => handleOpenEmailModal('General Inquiry / Direct Line')}
                        className="ul font-medium text-left inline-flex items-center gap-1.5 cursor-pointer"
                        title="Click to open pop-up form to email Nicole at ngotsch@outlook.com"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#C2185B]" />
                        <span>ngotsch@outlook.com</span>
                        <span className="text-[10px] bg-pink-100 dark:bg-pink-950/70 text-[#C2185B] dark:text-pink-300 px-1 py-0.2 rounded font-mono font-medium ml-0.5">Form ↗</span>
                      </button>
                    </dd>
                  </div>
                </dl>
              </aside>

              <div className="hero-foot">
                <div className="stats" role="list">
                  <div className="stat" role="listitem">
                    <b>12+</b>
                    <span>Years domain operations expertise</span>
                  </div>
                  <div className="stat" role="listitem">
                    <b>$50</b>
                    <span>Accessible student entry tier</span>
                  </div>
                  <div className="stat" role="listitem">
                    <b>24–48h</b>
                    <span>Turnaround on revamps</span>
                  </div>
                  <div className="stat" role="listitem">
                    <b>100%</b>
                    <span>Ground-up drafting (no AI slop)</span>
                  </div>
                </div>

                <div className="hero-cta">
                  <a href="#contact" className="btn-ink">
                    <span>Begin a Consultation</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </a>
                  <small>Or press <kbd>Shift</kbd> + <kbd>C</kbd> to jump to contact</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 01: The Work */}
        <section className="block" id="work" data-sect data-no="01" data-label="The Work" aria-labelledby="workTitle">
          <div className="wrap block-grid">
            <figure className="fig">
              <div className="fig-frame">
                <img
                  src="https://fcdumxxgjnrnolqkishi.supabase.co/storage/v1/object/public/build-images/live/2026-11-07/b0aa3d10-8171-4bc8-83b6-0ad3c8d9ac27-0.png"
                  alt="Nicole Gotsch reviewing printed resume drafts at her drafting desk"
                  loading="lazy"
                  width="500"
                  height="625"
                />
              </div>
              <figcaption>
                <b>Fig. 01</b>
                <span>Proofing printed drafts line by line before any file is signed off.</span>
              </figcaption>
            </figure>

            <div>
              <div className="sh">
                <p className="label red"><span>§ 01 — The Work</span><span className="num">Transparent services &amp; pricing</span></p>
                <h2 id="workTitle">Written from the <em>ground up</em>, not filled in.</h2>
                <p>
                  Most services sell you a templated layout filled by automated bots. I spend 45 minutes on the phone with you discovering what you actually achieved, how you reduced errors, what revenue you recovered, and how you led teams through friction.
                </p>
              </div>

              {/* 6 Expandable Service Dossiers */}
              <div className="svc" role="list">
                {/* 01. Student */}
                <details open>
                  <summary>
                    <span className="idx">01</span>
                    <span className="nm">Student &amp; Early Career Résumé</span>
                    <span className="pr">$50</span>
                    <svg className="pm" viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" className="v" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </summary>
                  <div className="body">
                    <p>Designed for recent high school, college, and vocational graduates stepping into professional healthcare, clinic, or corporate roles. We translate coursework, capstone projects, practicums, and entry jobs into concrete workplace readiness.</p>
                    <ul>
                      <li>Ground-up structure &amp; formatting</li>
                      <li>Translating practicums &amp; internships</li>
                      <li>ATS keyword optimization</li>
                      <li>2–3 business day turnaround</li>
                    </ul>
                    <div className="mt-4 pt-3 border-t border-[#F0C6D6] dark:border-[#2A3144] flex justify-between items-center">
                      <span className="text-xs text-[#6E5A64] dark:text-slate-400">Perfect for: Grads, apprentices, entry-level</span>
                      <button
                        type="button"
                        onClick={() => handleSelectService('Student & Early Career Résumé — $50')}
                        className="btn-line text-xs py-1.5 px-3"
                      >
                        Select Package →
                      </button>
                    </div>
                  </div>
                </details>

                {/* 02. Revamp */}
                <details>
                  <summary>
                    <span className="idx">02</span>
                    <span className="nm">Professional Résumé Revamp</span>
                    <span className="pr">$99</span>
                    <svg className="pm" viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" className="v" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </summary>
                  <div className="body">
                    <p>Our most popular tier. Ideal for mid-career professionals with 3–10 years of experience who already have a draft that is failing applicant tracking systems or reading like a passive task list rather than a record of accomplishment.</p>
                    <ul>
                      <li>Complete rewrite of passive duty bullets</li>
                      <li>Quantified metric discovery</li>
                      <li>ATS pass guarantee across major platforms</li>
                      <li>Fast 24–48 hour turnaround</li>
                    </ul>
                    <div className="mt-4 pt-3 border-t border-[#F0C6D6] dark:border-[#2A3144] flex justify-between items-center">
                      <span className="text-xs text-[#6E5A64] dark:text-slate-400">Perfect for: Billers, analysts, coordinators, supervisors</span>
                      <button
                        type="button"
                        onClick={() => handleSelectService('Professional Résumé Revamp — $99')}
                        className="btn-line text-xs py-1.5 px-3"
                      >
                        Select Package →
                      </button>
                    </div>
                  </div>
                </details>

                {/* 03. From Scratch */}
                <details>
                  <summary>
                    <span className="idx">03</span>
                    <span className="nm">Created From Scratch</span>
                    <span className="pr">$145</span>
                    <svg className="pm" viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" className="v" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </summary>
                  <div className="body">
                    <p>For tenured professionals (8–15+ years) who haven’t updated their résumé in a decade, are navigating a major industry transition, or need an executive document constructed from a blank slate with zero prior file.</p>
                    <ul>
                      <li>45-minute discovery consultation call</li>
                      <li>Full career trajectory architecture</li>
                      <li>Cross-industry skill translation</li>
                      <li>3–5 business day delivery + 2 revisions</li>
                    </ul>
                    <div className="mt-4 pt-3 border-t border-[#F0C6D6] dark:border-[#2A3144] flex justify-between items-center">
                      <span className="text-xs text-[#6E5A64] dark:text-slate-400">Perfect for: Clinic directors, long-tenured managers, career pivoters</span>
                      <button
                        type="button"
                        onClick={() => handleSelectService('Created From Scratch — $145')}
                        className="btn-line text-xs py-1.5 px-3"
                      >
                        Select Package →
                      </button>
                    </div>
                  </div>
                </details>

                {/* 04. Cover Letter */}
                <details>
                  <summary>
                    <span className="idx">04</span>
                    <span className="nm">Targeted Cover Letter</span>
                    <span className="pr">$45</span>
                    <svg className="pm" viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" className="v" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </summary>
                  <div className="body">
                    <p>A persuasive, tailored narrative aligned directly to a specific target job posting. Explains why you are the exact right candidate without repeating résumé bullets.</p>
                    <ul>
                      <li>Job-description match analysis</li>
                      <li>Compelling opening hook and closing call</li>
                      <li>Editable Word document + clean PDF</li>
                      <li>24-hour turnaround</li>
                    </ul>
                    <div className="mt-4 pt-3 border-t border-[#F0C6D6] dark:border-[#2A3144] flex justify-between items-center">
                      <span className="text-xs text-[#6E5A64] dark:text-slate-400">Add-on or standalone single letter</span>
                      <button
                        type="button"
                        onClick={() => handleSelectService('Targeted Cover Letter — $45')}
                        className="btn-line text-xs py-1.5 px-3"
                      >
                        Select Package →
                      </button>
                    </div>
                  </div>
                </details>

                {/* 05. Interview Coaching */}
                <details>
                  <summary>
                    <span className="idx">05</span>
                    <span className="nm">Interview Preparation Session</span>
                    <span className="pr">$75</span>
                    <svg className="pm" viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" className="v" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </summary>
                  <div className="body">
                    <p>60-minute one-on-one live video interview coaching session. We practice behavioral questions (STAR method), salary negotiation framing, and how to articulate your core career contributions naturally.</p>
                    <ul>
                      <li>60-minute live 1-on-1 coaching video call</li>
                      <li>STAR technique behavioral practice</li>
                      <li>Target company role-play</li>
                      <li>Post-call notes and personalized feedback</li>
                    </ul>
                    <div className="mt-4 pt-3 border-t border-[#F0C6D6] dark:border-[#2A3144] flex justify-between items-center">
                      <span className="text-xs text-[#6E5A64] dark:text-slate-400">1-on-1 coaching session</span>
                      <button
                        type="button"
                        onClick={() => handleSelectService('Interview Preparation Session — $75')}
                        className="btn-line text-xs py-1.5 px-3"
                      >
                        Select Package →
                      </button>
                    </div>
                  </div>
                </details>

                {/* 06. Executive Overhaul */}
                <details>
                  <summary>
                    <span className="idx">06</span>
                    <span className="nm">Strategic Overhaul Package</span>
                    <span className="pr">$239</span>
                    <svg className="pm" viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" className="v" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </summary>
                  <div className="body">
                    <p>The complete, white-glove executive suite. Includes Created From Scratch résumé, targeted cover letter, full LinkedIn profile overhaul, and 60-minute interview coaching session.</p>
                    <ul>
                      <li>Complete Created From Scratch résumé ($145 value)</li>
                      <li>Targeted Cover Letter ($45 value)</li>
                      <li>LinkedIn Profile Transformation ($65 value)</li>
                      <li>60-min Interview Coaching ($75 value)</li>
                    </ul>
                    <div className="mt-4 pt-3 border-t border-[#F0C6D6] dark:border-[#2A3144] flex justify-between items-center">
                      <span className="text-xs text-[#6E5A64] dark:text-slate-400">Save $91 across all services combined</span>
                      <button
                        type="button"
                        onClick={() => handleSelectService('Strategic Overhaul Package — $239')}
                        className="btn-line text-xs py-1.5 px-3"
                      >
                        Select Package →
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* Section 02: Testimony */}
        <section className="block" id="testimony" data-sect data-no="02" data-label="Testimony" aria-labelledby="testTitle">
          <div className="wrap block-grid flip">
            <figure className="fig">
              <div className="fig-frame">
                <img
                  src="https://fcdumxxgjnrnolqkishi.supabase.co/storage/v1/object/public/build-images/live/2026-11-07/b0aa3d10-8171-4bc8-83b6-0ad3c8d9ac27-2.png"
                  alt="Candidate review session with proof sheets and notes"
                  loading="lazy"
                  width="500"
                  height="625"
                />
              </div>
              <figcaption>
                <b>Fig. 02</b>
                <span>Every review is backed by documented client offers and verified career transitions.</span>
              </figcaption>
            </figure>

            <div>
              <div className="sh">
                <p className="label red"><span>§ 02 — Testimony</span><span className="num">Client outcomes</span></p>
                <h2 id="testTitle">In their words, <em>after the offer</em>.</h2>
                <p>Real quotes from healthcare operators, legal professionals, and career pivoters who trusted Purpose &amp; Glow with their next chapter.</p>
              </div>

              <div className="quote-wrap">
                <svg className="qm" viewBox="0 0 44 36" aria-hidden="true"><path d="M0 20C0 8 8 0 18 0v8c-6 0-9 4-9 10h9v18H0V20zm26 0C26 8 34 0 44 0v8c-6 0-9 4-9 10h9v18H26V20z" fill="#C2185B" /></svg>
                <blockquote id="bigQuote">
                  <p id="qText">“{quotes[quoteIdx]?.q}”</p>
                  <footer>
                    <div>
                      <cite id="qWho">{quotes[quoteIdx]?.a}</cite>
                      <span id="qRole" className="role">{quotes[quoteIdx]?.r}</span>
                    </div>
                    <div className="q-ctrl">
                      <button
                        type="button"
                        id="qPrev"
                        aria-label="Previous quote"
                        onClick={() => setQuoteIdx((quoteIdx - 1 + quotes.length) % quotes.length)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                      </button>
                      <span id="qCount" className="num">
                        <b>{String(quoteIdx + 1).padStart(2, '0')}</b> / {String(quotes.length).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        id="qNext"
                        aria-label="Next quote"
                        onClick={() => setQuoteIdx((quoteIdx + 1) % quotes.length)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* Section 03: Process */}
        <section className="block" id="process" data-sect data-no="03" data-label="Process" aria-labelledby="procTitle">
          <div className="wrap block-grid">
            <figure className="fig">
              <div className="fig-frame">
                <img
                  src="https://fcdumxxgjnrnolqkishi.supabase.co/storage/v1/object/public/build-images/live/2026-11-07/b0aa3d10-8171-4bc8-83b6-0ad3c8d9ac27-1.png"
                  alt="Drafting tools, steel ruler and printed proofs on Nicole's worktable"
                  loading="lazy"
                  width="500"
                  height="625"
                />
              </div>
              <figcaption>
                <b>Fig. 03</b>
                <span>A rigorous four-stage drafting cadence designed for zero guesswork.</span>
              </figcaption>
            </figure>

            <div>
              <div className="sh">
                <p className="label red"><span>§ 03 — Process</span><span className="num">How we work</span></p>
                <h2 id="procTitle">From first call to <em>final file</em>.</h2>
                <p>No cookie-cutter questionnaires. A collaborative dialogue where your true accomplishments are mapped out and distilled into impactful language.</p>
              </div>

              {/* 4-Stage Visual Diagram */}
              <div className="diagram">
                <svg viewBox="0 0 640 150" role="img" aria-labelledby="dgT dgD" id="diagram">
                  <title id="dgT">Four-stage process diagram</title>
                  <desc id="dgD">A line connects four stages in sequence: Consult, Draft, Refine and Deliver.</desc>
                  <path className="track" d="M40 80 C 120 20, 160 20, 230 80 S 340 140, 410 80 S 520 20, 600 80" />
                  <path className="fill" id="dgPath" d="M40 80 C 120 20, 160 20, 230 80 S 340 140, 410 80 S 520 20, 600 80" style={{ strokeDasharray: 600, strokeDashoffset: Math.max(0, 600 - scrollProgress * 1200) }} />
                  <g className="node">
                    <circle cx="40" cy="80" r="14" fill="#FFFFFF" stroke="#C2185B" strokeWidth="2" />
                    <text x="40" y="84" textAnchor="middle" fontSize="11" fontWeight="700" fill="#C2185B" fontFamily="Inter, sans-serif">01</text>
                  </g>
                  <g className="node">
                    <circle cx="230" cy="80" r="14" fill="#FFFFFF" stroke="#C2185B" strokeWidth="2" />
                    <text x="230" y="84" textAnchor="middle" fontSize="11" fontWeight="700" fill="#C2185B" fontFamily="Inter, sans-serif">02</text>
                  </g>
                  <g className="node">
                    <circle cx="410" cy="80" r="14" fill="#FFFFFF" stroke="#C2185B" strokeWidth="2" />
                    <text x="410" y="84" textAnchor="middle" fontSize="11" fontWeight="700" fill="#C2185B" fontFamily="Inter, sans-serif">03</text>
                  </g>
                  <g className="node">
                    <circle cx="600" cy="80" r="14" fill="#FFFFFF" stroke="#C2185B" strokeWidth="2" />
                    <text x="600" y="84" textAnchor="middle" fontSize="11" fontWeight="700" fill="#C2185B" fontFamily="Inter, sans-serif">04</text>
                  </g>
                </svg>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#F0C6D6] dark:border-[#2A3144]">
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-[#C2185B] dark:text-pink-400 block mb-1">01. Discovery</span>
                    <p className="text-xs text-[#4A3F45] dark:text-slate-300 leading-relaxed">45-minute deep discovery call uncovering hidden dollars, percentages, and leadership wins.</p>
                  </div>
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-[#C2185B] dark:text-pink-400 block mb-1">02. First Proof</span>
                    <p className="text-xs text-[#4A3F45] dark:text-slate-300 leading-relaxed">Complete ground-up draft delivered in Word &amp; PDF within 24–48 hours for review.</p>
                  </div>
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-[#C2185B] dark:text-pink-400 block mb-1">03. Calibration</span>
                    <p className="text-xs text-[#4A3F45] dark:text-slate-300 leading-relaxed">Line-by-line fine tuning and feedback incorporation until every bullet point sparkles.</p>
                  </div>
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-[#C2185B] dark:text-pink-400 block mb-1">04. Dossier Delivery</span>
                    <p className="text-xs text-[#4A3F45] dark:text-slate-300 leading-relaxed">Final ATS-certified files, source documents, and job-application guidelines delivered.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 04: Portfolio */}
        <section className="block" id="portfolio" data-sect data-no="04" data-label="Portfolio" aria-labelledby="pfTitle">
          <div className="wrap">
            <div className="sh">
              <p className="label red"><span>§ 04 — Portfolio</span><span className="num">Transformation archives</span></p>
              <h2 id="pfTitle">An index of <em>finished pages</em>.</h2>
              <p>Explore real résumé transformations across healthcare, executive management, clinical operations, technology, and career pivots.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="filters" role="group" aria-label="Filter portfolio" id="filters">
              {OBSIDIAN_FILTERS.map(([key, label]) => {
                const isShortlist = key === 'shortlist';
                const count = isShortlist ? Object.keys(shortlist).length : key === 'all' ? OBSIDIAN_SAMPLES.length : OBSIDIAN_SAMPLES.filter((s) => s.cat === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`f-btn ${portfolioFilter === key ? 'active' : ''}`}
                    aria-pressed={portfolioFilter === key}
                    onClick={() => setPortfolioFilter(key)}
                  >
                    <span>{label}</span>
                    {count > 0 && <span className="c">{count}</span>}
                  </button>
                );
              })}
            </div>

            <div className="pf-meta">
              <span id="pfCount">
                Showing <strong>{visibleSamples.length}</strong> of {OBSIDIAN_SAMPLES.length} samples
              </span>
              <span>Click any entry to inspect its miniature dossier &amp; metrics</span>
            </div>

            {/* Portfolio Sample List */}
            <ul className="pf-list" id="pfList">
              {visibleSamples.length === 0 ? (
                <li className="pf-empty">
                  {portfolioFilter === 'shortlist' ? 'Your shortlist is empty. Star any sample to keep it here.' : 'No samples found in this category.'}
                </li>
              ) : (
                visibleSamples.map((sample, idx) => {
                  const isStarred = !!shortlist[sample.id];
                  return (
                    <li key={sample.id} className="pf-row cursor-pointer group" onClick={() => setSelectedSample(sample)}>
                      <span className="pf-no">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="pf-main">
                        <span className="pf-cat">{sample.cl}</span>
                        <h3>{sample.t}</h3>
                        <p>{sample.d}</p>
                      </div>
                      <dl className="pf-metrics">
                        {sample.m.map(([num, lbl]) => (
                          <div key={lbl}>
                            <dd>{num}</dd>
                            <dt>{lbl}</dt>
                          </div>
                        ))}
                      </dl>
                      <div className="pf-actions">
                        <button
                          type="button"
                          className="btn-line"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSample(sample);
                          }}
                        >
                          Inspect Dossier →
                        </button>
                        <button
                          type="button"
                          className="star-btn"
                          aria-pressed={isStarred}
                          aria-label={`Star ${sample.t} to shortlist`}
                          onClick={(e) => toggleShortlist(sample.id, e)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star" /></svg>
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>

            {/* Horizontal Plate Styles Strip */}
            <div className="plates-head" id="styles">
              <div>
                <p className="label red"><span>Layout Typologies</span></p>
                <h3>Six bespoke typography plate formats.</h3>
              </div>
              <p>Every résumé is crafted according to strict layout rules calibrated for your specific industry.</p>
            </div>

            <div className="plates" id="plates" tabIndex={0} role="region" aria-label="Résumé style plates">
              {OBSIDIAN_PLATES.map((plate) => {
                const plateSvg = generateResumeSvg(plate.st, plate.who, plate.role, isDarkMode);
                return (
                  <figure key={plate.st} className="plate">
                    <button
                      type="button"
                      className="plate-btn"
                      onClick={() => {
                        const matched = OBSIDIAN_SAMPLES.find((s) => s.st === plate.st) || OBSIDIAN_SAMPLES[0];
                        setSelectedSample(matched);
                      }}
                    >
                      <div className="plate-sheet" dangerouslySetInnerHTML={{ __html: plateSvg }} />
                    </button>
                    <figcaption>
                      <b>{plate.t}</b>
                      <i>{plate.cl}</i>
                      <p className="text-xs text-slate-500 mt-1">{plate.d}</p>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 05: Pricing */}
        <section className="block" id="pricing" data-sect data-no="05" data-label="Pricing" aria-labelledby="prTitle">
          <div className="wrap">
            <div className="sh">
              <p className="label red"><span>§ 05 — Pricing</span><span className="num">Transparent matrix</span></p>
              <h2 id="prTitle">Compare, line by line. <em>No surprises.</em></h2>
              <p>Clear, fixed pricing. What you see is what you pay. No recurring retainers or hidden document fees.</p>
            </div>

            <div className="table-wrap" tabIndex={0} role="region" aria-label="Pricing comparison table">
              <table className="cmp">
                <thead>
                  <tr>
                    <th scope="col">Feature / Deliverable</th>
                    <th scope="col">
                      <span className="plan">Student &amp; Early Grad</span>
                      <span className="price">$50</span>
                      <span className="who">0–2 yrs exp</span>
                    </th>
                    <th scope="col" className="hot">
                      <span className="flag">Most Popular</span>
                      <span className="plan">Professional Revamp</span>
                      <span className="price">$99</span>
                      <span className="who">3–10 yrs exp</span>
                    </th>
                    <th scope="col">
                      <span className="plan">Created From Scratch</span>
                      <span className="price">$145</span>
                      <span className="who">8–15+ yrs or pivot</span>
                    </th>
                    <th scope="col">
                      <span className="plan">Strategic Overhaul</span>
                      <span className="price">$239</span>
                      <span className="who">Executive Suite</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Discovery Consultation Call</th>
                    <td className="no"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                  </tr>
                  <tr>
                    <th scope="row">Turnaround Guarantee</th>
                    <td className="n">2–3 Days</td>
                    <td className="n hot font-bold text-[#C2185B]">24–48 Hours</td>
                    <td className="n">3–5 Days</td>
                    <td className="n">5–7 Days</td>
                  </tr>
                  <tr>
                    <th scope="row">ATS Keyword Optimization</th>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                    <td className="hot"><svg aria-label="Included"><use href="#i-check" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                  </tr>
                  <tr>
                    <th scope="row">Metric Discovery &amp; Quantified Bullets</th>
                    <td className="no"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td className="hot"><svg aria-label="Included"><use href="#i-check" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                  </tr>
                  <tr>
                    <th scope="row">Targeted Cover Letter Included</th>
                    <td className="no"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td className="no hot"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td className="no"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                  </tr>
                  <tr>
                    <th scope="row">LinkedIn Profile Transformation</th>
                    <td className="no"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td className="no hot"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td className="no"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                  </tr>
                  <tr>
                    <th scope="row">60-Min Interview Coaching Session</th>
                    <td className="no"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td className="no hot"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td className="no"><svg aria-label="Not included"><use href="#i-dash" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                  </tr>
                  <tr>
                    <th scope="row">Editable Source File (.docx + .pdf)</th>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                    <td className="hot"><svg aria-label="Included"><use href="#i-check" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                    <td><svg aria-label="Included"><use href="#i-check" /></svg></td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td></td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleSelectService('Student & Early Career Résumé — $50')}
                        className="btn-line"
                      >
                        Choose $50
                      </button>
                    </td>
                    <td className="hot">
                      <button
                        type="button"
                        onClick={() => handleSelectService('Professional Résumé Revamp — $99')}
                        className="btn-ink"
                      >
                        Choose $99
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleSelectService('Created From Scratch — $145')}
                        className="btn-line"
                      >
                        Choose $145
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleSelectService('Strategic Overhaul Package — $239')}
                        className="btn-line"
                      >
                        Choose $239
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 4 Add-ons */}
            <div className="addons">
              <div className="addon">
                <b><span>24-Hour Rush Delivery</span> <span>+$35</span></b>
                <p>Need your draft tomorrow morning? Guaranteed 24-hour turnaround on revamps.</p>
              </div>
              <div className="addon">
                <b><span>LinkedIn Profile Overhaul</span> <span>$65</span></b>
                <p>Headline, About section, featured projects, and skill alignment optimized for recruiter searches.</p>
              </div>
              <div className="addon">
                <b><span>Targeted Cover Letter</span> <span>$45</span></b>
                <p>Custom tailored narrative written specifically for a dream position.</p>
              </div>
              <div className="addon">
                <b><span>60-Min Interview Coaching</span> <span>$75</span></b>
                <p>STAR behavioral role-play, confidence building, and negotiation strategy with Nicole.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 06: Contact */}
        <section className="block" id="contact" data-sect data-no="06" data-label="Contact" aria-labelledby="ctTitle">
          <div className="wrap">
            <div className="sh">
              <p className="label red"><span>§ 06 — Contact</span><span className="num">Direct communication</span></p>
              <h2 id="ctTitle">Let's write the <em>next</em> chapter.</h2>
            </div>

            <div className="contact-grid">
              {/* Nicole's Direct Card */}
              <div className="card-nicole">
                <p className="label">Your writer</p>
                <div className="mono">
                  <svg viewBox="0 0 72 72" aria-hidden="true">
                    <rect x=".75" y=".75" width="70.5" height="70.5" fill="#FFF0F5" stroke="#2D2D2D" strokeWidth="1.5" />
                    <rect x="0" y="0" width="72" height="4" fill="#C2185B" />
                    <text x="36" y="48" textAnchor="middle" fontFamily="Playfair Display,Georgia,serif" fontWeight="700" fontSize="30" fill="#C2185B">NG</text>
                  </svg>
                  <div>
                    <h3>Nicole Gotsch</h3>
                    <p className="role">Founder &amp; Principal Résumé Writer, Purpose &amp; Glow Career Solutions</p>
                  </div>
                </div>

                <div className="avail">
                  <i></i>
                  <span>Available for immediate booking · Reply within 1 business day</span>
                </div>

                <div className="c-rows">
                    <div className="c-row">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      <div>
                        <span className="k">Email</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEmailModal('Direct Consultation Request')}
                          className="v ul font-medium text-left inline-flex items-center gap-1.5 cursor-pointer"
                          title="Click to open form to send message to ngotsch@outlook.com"
                        >
                          <span>ngotsch@outlook.com</span>
                          <span className="text-[10px] bg-pink-100 dark:bg-pink-950/70 text-[#C2185B] dark:text-pink-300 px-1.5 py-0.5 rounded font-mono font-medium">Send Message ↗</span>
                        </button>
                      </div>
                      <button type="button" className="copy" onClick={() => handleCopy('ngotsch@outlook.com', 'email')}>
                        Copy
                      </button>
                    </div>

                  <div className="c-row">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
                    <div>
                      <span className="k">Location</span>
                      <span className="v">Brooklyn Park, MN · Remote Nationwide</span>
                    </div>
                  </div>

                  <div className="c-row">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <div>
                      <span className="k">Turnaround</span>
                      <span className="v">24–48 Hours on Revamps</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultation Request Form */}
              <div className="form">
                <p className="label">Book a service or consultation</p>
                <h3>Tell me about your target role.</h3>
                <p>Fill out this brief note and Nicole will respond directly with availability and next steps.</p>

                <form onSubmit={handleContactSubmit} id="reqForm">
                  <div className="fields">
                    <div className="field">
                      <label htmlFor="fName">Your First Name</label>
                      <input
                        type="text"
                        id="fName"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Courtney"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="fEmail">Email Address</label>
                      <input
                        type="email"
                        id="fEmail"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="e.g. courtney@example.com"
                      />
                    </div>

                    <div className="field full">
                      <label htmlFor="fService">Service Desired</label>
                      <select
                        id="fService"
                        value={formService}
                        onChange={(e) => setFormService(e.target.value)}
                      >
                        <option value="Professional Résumé Revamp — $99">Professional Résumé Revamp — $99</option>
                        <option value="Student &amp; Early Career Résumé — $50">Student &amp; Early Career Résumé — $50</option>
                        <option value="Created From Scratch — $145">Created From Scratch — $145</option>
                        <option value="Targeted Cover Letter — $45">Targeted Cover Letter — $45</option>
                        <option value="Interview Preparation Session — $75">Interview Preparation Session — $75</option>
                        <option value="Strategic Overhaul Package — $239">Strategic Overhaul Package — $239</option>
                        <option value="Complimentary 15-Minute Strategy Call">Complimentary 15-Minute Strategy Call</option>
                      </select>
                    </div>

                    <div className="field full">
                      <label htmlFor="fNote">Current Situation &amp; Target Roles</label>
                      <textarea
                        id="fNote"
                        rows={3}
                        value={formNote}
                        onChange={(e) => setFormNote(e.target.value)}
                        placeholder="Briefly describe your background, current title, and what roles you are targeting..."
                      />
                    </div>
                  </div>

                  <div className="form-foot">
                    <div className="form-status" id="formStatus">
                      {formStatus && (
                        <span className={formStatus.isErr ? 'text-[#C2185B] font-medium' : 'text-emerald-800 font-semibold'}>
                          {formStatus.msg}
                        </span>
                      )}
                    </div>
                    <button type="submit" className="btn-ink" disabled={isSubmitting}>
                      <span>{isSubmitting ? 'Sending Request...' : 'Send Consultation Request'}</span>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </button>
                  </div>
                </form>

                {/* Ledger of Recent Submissions */}
                <div className="ledger">
                  <div className="ledger-head">
                    <h4 id="ledgerTitle">Recent Client Inquiries</h4>
                    <span id="ledgerCount" className="num text-xs text-[#6E5A64]">
                      {openRequestsCount} open · {requestList.length} total
                    </span>
                  </div>
                  <ul id="ledgerList">
                    {requestList.length === 0 ? (
                      <li><span className="empty">No inquiries yet — yours will appear here.</span></li>
                    ) : (
                      requestList.slice(0, 6).map((req) => (
                        <li key={req.id} className={req.done ? 'done' : ''}>
                          <span className="d">{new Date(req.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          <span className="who"><b>{req.first}</b> <span>— {req.service}</span></span>
                          <span className="acts">
                            <button
                              type="button"
                              className="mini"
                              onClick={() => handleToggleRecordDone(req.id)}
                            >
                              {req.done ? 'Reopen' : 'Mark reviewed'}
                            </button>
                            <button
                              type="button"
                              className="mini text-slate-400 hover:text-red-600"
                              onClick={() => handleDeleteRecord(req.id)}
                              aria-label="Remove request"
                            >
                              Remove
                            </button>
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Lightbox Dossier Modal */}
      {selectedSample && (
        <div className="lb open" id="lb" role="dialog" aria-modal="true" aria-labelledby="lbTitle">
          <div className="lb-panel">
            <button
              type="button"
              className="sq lb-close"
              id="lbClose"
              aria-label="Close dossier"
              onClick={() => setSelectedSample(null)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>

            <div
              className="lb-sheet"
              id="lbSheet"
              dangerouslySetInnerHTML={{
                __html: generateResumeSvg(selectedSample.st, selectedSample.who, selectedSample.t, isDarkMode)
              }}
            />

            <div className="lb-body">
              <span id="lbCat" className="label red">{selectedSample.cl} · Plate Typology</span>
              <h2 id="lbTitle">{selectedSample.t}</h2>
              <p className="role text-sm text-[#4A3F45] dark:text-slate-300 mt-1 font-medium">{selectedSample.who} · Completed Transformation</p>
              <p id="lbDesc" className="desc text-sm leading-relaxed mt-3">{selectedSample.d}</p>

              <blockquote id="lbQuote">
                <p>“{selectedSample.q}”</p>
                <span>— {selectedSample.a}</span>
              </blockquote>

              <dl className="lb-metrics" id="lbMetrics">
                {selectedSample.m.map(([num, lbl]) => (
                  <div key={lbl}>
                    <dd>{num}</dd>
                    <dt>{lbl}</dt>
                  </div>
                ))}
              </dl>

              <div className="lb-actions" id="lbActions">
                <button
                  type="button"
                  className="btn-ink"
                  onClick={() => {
                    const sample = selectedSample;
                    setSelectedSample(null);
                    handleSelectService(`Custom Résumé: ${sample.t} (${sample.cl})`);
                  }}
                >
                  Request Similar Transformation →
                </button>
                <button
                  type="button"
                  className="star-btn"
                  aria-pressed={!!shortlist[selectedSample.id]}
                  onClick={(e) => toggleShortlist(selectedSample.id, e)}
                  title="Bookmark to shortlist"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star" /></svg>
                </button>
              </div>

              <div className="lb-nav">
                <button
                  type="button"
                  className="btn-line text-xs py-1 px-3"
                  onClick={() => {
                    const idx = OBSIDIAN_SAMPLES.findIndex((s) => s.id === selectedSample.id);
                    const prevIdx = (idx - 1 + OBSIDIAN_SAMPLES.length) % OBSIDIAN_SAMPLES.length;
                    setSelectedSample(OBSIDIAN_SAMPLES[prevIdx]);
                  }}
                >
                  ← Previous Sample
                </button>
                <span className="num text-xs text-[#6E5A64]">
                  {OBSIDIAN_SAMPLES.findIndex((s) => s.id === selectedSample.id) + 1} of {OBSIDIAN_SAMPLES.length}
                </span>
                <button
                  type="button"
                  className="btn-line text-xs py-1 px-3"
                  onClick={() => {
                    const idx = OBSIDIAN_SAMPLES.findIndex((s) => s.id === selectedSample.id);
                    const nextIdx = (idx + 1) % OBSIDIAN_SAMPLES.length;
                    setSelectedSample(OBSIDIAN_SAMPLES[nextIdx]);
                  }}
                >
                  Next Sample →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Back to Top Button */}
      <button
        type="button"
        className={`to-top ${showToTop ? 'show' : ''}`}
        id="toTop"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </button>

      {/* Toast Notification */}
      <div className={`toast ${toastMsg ? 'show' : ''}`} id="toast" role="status">
        {toastMsg}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <a href="#home" className="brand">
                <span>Purpose <em>&amp;</em> Glow</span>
                <small>Career Solutions</small>
              </a>
              <p>Professional résumé writing, career consulting, and interview coaching founded and led by Nicole Gotsch in Brooklyn Park, Minnesota.</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded shadow-xs cursor-pointer transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  <span>Open Backend Admin Studio</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400">→</span>
                </button>
              </div>
            </div>

            <div>
              <h4>Services</h4>
              <ul>
                <li><a href="#work" className="ul">Student Résumé ($50)</a></li>
                <li><a href="#work" className="ul">Résumé Revamp ($99)</a></li>
                <li><a href="#work" className="ul">Created From Scratch ($145)</a></li>
                <li><a href="#work" className="ul">Targeted Cover Letter ($45)</a></li>
                <li><a href="#work" className="ul">Interview Coaching ($75)</a></li>
                <li><a href="#work" className="ul">Strategic Overhaul ($239)</a></li>
              </ul>
            </div>

            <div>
              <h4>Direct Contact</h4>
              <ul>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenEmailModal('Footer Direct Inquiry')}
                    className="ul text-left inline-flex items-center gap-1 cursor-pointer font-medium"
                    title="Click to open form to email Nicole at ngotsch@outlook.com"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#C2185B]" />
                    <span>ngotsch@outlook.com</span>
                    <span className="text-[10px] bg-pink-100 dark:bg-pink-950/70 text-[#C2185B] dark:text-pink-300 px-1.5 py-0.2 rounded font-mono ml-1">Send Message ↗</span>
                  </button>
                </li>
                <li>Brooklyn Park, MN</li>
                <li>Hours: Mon–Fri 8am–6pm CT</li>
                <li><a href="#contact" className="ul">Schedule a Consultation</a></li>
                <li><a href="https://purposeglowcareer.com/" target="_blank" rel="noopener noreferrer" className="ul">purposeglowcareer.com ↗</a></li>
              </ul>
            </div>
          </div>

          <div className="foot-base">
            <span>© {new Date().getFullYear()} Purpose &amp; Glow Career Solutions. All rights reserved.</span>
            <span>Nicole Gotsch · Professional Résumés Built From The Ground Up</span>
          </div>
        </div>
      </footer>

      {/* Pop-Up Form Fill Attached to the Email on the Page */}
      <EmailInquiryModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSubmitSuccess={handleEmailModalSuccess}
        defaultService={emailModalDefaultService}
        recipientEmail="ngotsch@outlook.com"
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
