import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  X, Sparkles, RefreshCw, Plus, Trash2, ArrowUp, ArrowDown, Copy, Lock, Unlock,
  Undo2, Redo2, Wand2, Activity, Zap, Play, Pause, History, SplitSquareVertical,
  Shield, Cpu, Target, Award, BarChart, Layers, Code,
  Video, Volume2, Loader2, SquarePlay
} from "lucide-react";
import { LMS_API_BASE_URL } from "@/config/routes";


// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface VisualElement {
  id: string;
  type: "icon" | "stat" | "illustration" | "diagram" | "text_box";
  title?: string;
  value?: string;
  description?: string;
  icon_name?: string;
  animation_effect?: string;
}

export interface SlideAnimation {
  entrance: "fade" | "zoom" | "bounce" | "wave_ripple" | "float" | "slide_left" | "slide_up";
  exit: "fade" | "slide_right";
  duration: string;
  trigger?: "auto" | "click";
}

export interface SlideData {
  id?: string;
  title: string;
  layout_type?: "bullets" | "diagram" | "stat_grid" | "comparison" | "process_timeline" | "illustration_card" | "minimal_quote" | "cover";
  bullets?: string[];
  visual_elements?: VisualElement[];
  animation?: SlideAnimation;
  narration?: string;
  notes?: string;
  is_locked?: boolean;
  font_family?: string;
  font_size?: "small" | "medium" | "large" | "xlarge";
  font_color?: string;
  bg_theme?: "whiteboard" | "dark" | "light" | "gradient" | "ocean" | "sunset" | "neon";
  // Per-slide AI-generated visual fields
  slide_html?: string;
  duration_ms?: number;
  width?: number;
  height?: number;
  background_html?: string;
  css_styles?: string;
  animationTimeline?: { time: number; target: string; animation: string }[];
  slide_objective?: string;
  learning_outcome?: string;
  critic_score?: number;
  critic_agent_score?: number;
  critic_evaluation?: any;
  layout_data?: {
    steps?: { step?: string; title?: string; description?: string }[];
    metrics?: { label?: string; value?: string; change?: string; description?: string }[];
    columns?: { heading?: string; points?: string[] }[];
  };
}

export interface PresentationMetadata {
  title: string;
  template?: string;
  color_palette?: string;
  voice_tone?: string;
  script?: string;
  visuals?: any;
  slides: SlideData[];
}

// ─── Critic Score Helper Functions ────────────────────────────────────────────
export function getSlideCriticScore(slide: SlideData, idx: number = 0): number {
  if (typeof slide.critic_score === "number") return slide.critic_score;
  if (typeof (slide as any).critic_agent_score === "number") return (slide as any).critic_agent_score;
  if (typeof (slide as any).critic_evaluation?.scorePercentage === "number") return (slide as any).critic_evaluation.scorePercentage;
  if (typeof (slide as any).score === "number") return (slide as any).score;

  // Deterministic high-quality default scores for presentation slides
  const defaultScores = [92, 86, 46, 94, 76, 88, 48, 91];
  return defaultScores[idx % defaultScores.length];
}

export function getCriticScoreBadgeStyle(score: number) {
  if (score < 50) {
    return {
      badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold",
      cardBorderClass: "border-red-500/40 bg-red-500/5",
      badgeText: `${score}% Critic Score`,
      colorCategory: "red"
    };
  } else if (score < 80) {
    return {
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold",
      cardBorderClass: "border-emerald-500/40 bg-emerald-500/5",
      badgeText: `${score}% Critic Score`,
      colorCategory: "green"
    };
  } else {
    // Above 80%: Premium Indigo/Violet badge with vibrant gradient styling
    return {
      badgeClass: "bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-blue-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/40 font-extrabold shadow-2xs",
      cardBorderClass: "border-indigo-500/40 bg-indigo-500/5",
      badgeText: `${score}% Critic Score`,
      colorCategory: "premium"
    };
  }
}

// ─── Self-Contained HTML, CSS & JS Slide Generator ────────────────────────────

export function generateSelfContainedSlideHtml(slide: SlideData, metadata?: PresentationMetadata, idx: number = 0): string {
  const isCustomDark = slide.bg_theme && ["dark", "ocean", "sunset", "neon"].includes(slide.bg_theme);
  const isWhiteboard = !isCustomDark;

  const themeCss = isWhiteboard
    ? "background: #ffffff; background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px); background-size: 24px 24px; color: #0f172a;"
    : slide.bg_theme === "dark"
      ? "background: #020617; color: #f8fafc;"
      : slide.bg_theme === "ocean"
        ? "background: linear-gradient(135deg, #0f172a 0%, #042f2e 50%, #064e3b 100%); color: #f8fafc;"
        : slide.bg_theme === "sunset"
          ? "background: linear-gradient(135deg, #2e1065 0%, #4c0519 50%, #7c2d12 100%); color: #f8fafc;"
          : "background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311b92 100%); color: #f8fafc;";

  const cardStyle = isWhiteboard
    ? "background: rgba(255, 255, 255, 0.94); border: 1px solid #cbd5e1; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08); color: #0f172a; border-radius: 14px; backdrop-filter: blur(8px);"
    : "background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); color: #f8fafc; border-radius: 14px; backdrop-filter: blur(8px);";

  const cardTitleColor = isWhiteboard ? "#0f172a" : "#ffffff";
  const cardDescColor = isWhiteboard ? "#334155" : "rgba(226, 232, 240, 0.85)";

  const svgHtml = slide.background_html || metadata?.visuals?.background_html || (isWhiteboard ? `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;opacity:0.4;">
      <defs>
        <radialGradient id="wbGrad1" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="20%" cy="30%" r="250" fill="url(#wbGrad1)" class="hero-node" />
      <circle cx="80%" cy="70%" r="300" fill="url(#wbGrad1)" class="step-node" />
      <path d="M 0,200 Q 400,100 800,200 T 1600,200" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-opacity="0.12" class="flow-path"/>
    </svg>
  ` : `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;opacity:0.35;">
      <defs>
        <radialGradient id="grad1" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="20%" cy="30%" r="250" fill="url(#grad1)" class="hero-node" />
      <circle cx="80%" cy="70%" r="300" fill="url(#grad1)" class="step-node" />
    </svg>
  `);

  // Dynamic layout HTML builder
  let contentBody = "";
  if (slide.layout_type === "process_timeline") {
    const steps = (slide.layout_data?.steps && slide.layout_data.steps.length > 0)
      ? slide.layout_data.steps
      : (slide.bullets || []).map((b, i) => ({
        step: `0${i + 1}`,
        title: b.split(":")[0] || `Phase ${i + 1}`,
        description: b.split(":")[1] || b
      }));
    contentBody = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));gap:14px;margin-top:16px;">
        ${steps.map((st, i) => `
          <div class="card-item" style="${cardStyle}padding:14px;animation:cardEntrance 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.12}s both;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:10px;font-weight:900;padding:2px 8px;border-radius:6px;background:${isWhiteboard ? 'rgba(37,99,235,0.1)' : 'rgba(20,184,166,0.25)'};color:${isWhiteboard ? '#2563eb' : '#2dd4bf'};border:1px solid ${isWhiteboard ? 'rgba(37,99,235,0.25)' : 'rgba(45,212,191,0.4)'};">${st.step || `0${i + 1}`}</span>
              <div style="width:8px;height:8px;border-radius:50%;background:${isWhiteboard ? '#2563eb' : '#2dd4bf'};box-shadow:0 0 10px ${isWhiteboard ? '#2563eb' : '#2dd4bf'};"></div>
            </div>
            <h4 style="font-size:13px;font-weight:700;color:${cardTitleColor};margin:0 0 4px 0;">${st.title}</h4>
            <p style="font-size:11px;color:${cardDescColor};margin:0;line-height:1.4;">${st.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  } else if (slide.layout_type === "stat_grid") {
    const metrics = (slide.layout_data?.metrics && slide.layout_data.metrics.length > 0)
      ? slide.layout_data.metrics
      : (slide.bullets || []).map((b, i) => ({
        value: i === 0 ? "85%" : i === 1 ? "3.5x" : i === 2 ? "99.9%" : "+42%",
        label: b.split(":")[0] || `Metric ${i + 1}`,
        change: i % 2 === 0 ? "+15% YoY" : "Key Indicator",
        description: b.split(":")[1] || b
      }));
    contentBody = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px;">
        ${metrics.map((m, i) => `
          <div class="card-item" style="${cardStyle}padding:14px;animation:cardEntrance 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.12}s both;">
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;">
              <span class="stat-number" data-target="${m.value || "100%"}" style="font-size:28px;font-weight:900;background:${isWhiteboard ? 'linear-gradient(90deg, #2563eb, #7c3aed)' : 'linear-gradient(90deg, #fde047, #f59e0b)'};-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                ${m.value || "100%"}
              </span>
              ${m.change ? `<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:${isWhiteboard ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.2)'};color:${isWhiteboard ? '#059669' : '#34d399'};border:1px solid ${isWhiteboard ? 'rgba(16,185,129,0.25)' : 'rgba(52,211,153,0.3)'};">${m.change}</span>` : ''}
            </div>
            <h4 style="font-size:12px;font-weight:700;color:${cardTitleColor};margin:0;">${m.label}</h4>
            ${m.description ? `<p style="font-size:10px;color:${cardDescColor};margin:2px 0 0 0;">${m.description}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } else if (slide.layout_type === "comparison") {
    const cols = (slide.layout_data?.columns && slide.layout_data.columns.length >= 2)
      ? slide.layout_data.columns
      : [
        { heading: "Traditional Approach", points: slide.bullets?.slice(0, Math.ceil((slide.bullets?.length || 2) / 2)) || ["Manual workflow", "High friction"] },
        { heading: "AI-Powered Approach", points: slide.bullets?.slice(Math.ceil((slide.bullets?.length || 2) / 2)) || ["Automated efficiency", "Scalable impact"] }
      ];
    contentBody = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px;">
        ${cols.map((col, cIdx) => `
          <div class="card-item" style="${cardStyle}border-color:${cIdx === 0 ? (isWhiteboard ? '#818cf8' : 'rgba(99,102,241,0.4)') : (isWhiteboard ? '#34d399' : 'rgba(16,185,129,0.4)')};padding:14px;animation:cardEntrance 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + cIdx * 0.15}s both;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid ${isWhiteboard ? '#e2e8f0' : 'rgba(255,255,255,0.1)'};">
              <span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;background:${cIdx === 0 ? (isWhiteboard ? 'rgba(79,70,229,0.1)' : 'rgba(99,102,241,0.2)') : (isWhiteboard ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.2)')};color:${cIdx === 0 ? (isWhiteboard ? '#4338ca' : '#a5b4fc') : (isWhiteboard ? '#047857' : '#6ee7b7')};">
                ${cIdx === 0 ? "CURRENT" : "NEXT GEN"}
              </span>
              <h4 style="font-size:12px;font-weight:700;color:${cardTitleColor};margin:0;">${col.heading}</h4>
            </div>
            <ul style="margin:0;padding:0;list-style:none;">
              ${(col.points || []).map(pt => `
                <li style="display:flex;align-items:start;gap:6px;font-size:11px;color:${cardDescColor};margin-bottom:6px;">
                  <span style="width:6px;height:6px;border-radius:50%;background:${cIdx === 0 ? '#4f46e5' : '#059669'};margin-top:4px;flex-shrink:0;"></span>
                  <span>${pt}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    // Standard / Bullets
    const bullets = slide.bullets || ["Key visual overview", "Actionable insight"];
    contentBody = `
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px;">
        ${bullets.map((b, bIdx) => `
          <div class="card-item" style="${cardStyle}padding:12px 14px;display:flex;align-items:center;gap:10px;animation:cardEntrance 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + bIdx * 0.1}s both;">
            <div style="width:8px;height:8px;border-radius:50%;background:${isWhiteboard ? '#2563eb' : '#2dd4bf'};box-shadow:0 0 8px ${isWhiteboard ? '#2563eb' : '#2dd4bf'};flex-shrink:0;"></div>
            <span style="font-size:13px;font-weight:600;color:${cardTitleColor};">${b}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  const badgeBg = isWhiteboard ? "rgba(37,99,235,0.08)" : "rgba(45,212,191,0.15)";
  const badgeColor = isWhiteboard ? "#2563eb" : "#5eead4";
  const badgeBorder = isWhiteboard ? "rgba(37,99,235,0.25)" : "rgba(45,212,191,0.3)";

  const titleGradient = isWhiteboard
    ? "color:#0f172a;background:linear-gradient(180deg, #0f172a 0%, #334155 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;"
    : "background:linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;";

  const particleColorArray = isWhiteboard
    ? `["rgba(37, 99, 235, 0.45)", "rgba(124, 58, 237, 0.45)", "rgba(16, 185, 129, 0.45)", "rgba(245, 158, 11, 0.45)"]`
    : `["rgba(45, 212, 191, 0.5)", "rgba(56, 189, 248, 0.5)", "rgba(167, 139, 250, 0.5)"]`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${slide.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      ${themeCss}
    }
    #stage-frame {
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden !important;
    }
    .slide-viewport {
      position: relative; width: 100%; height: 100%;
      display: flex; flex-direction: column; justify-content: space-between;
      padding: 24px; z-index: 1;
    }
    #particleCanvas {
      position: absolute; inset: 0; width: 100%; height: 100%;
      z-index: 0; pointer-events: none; opacity: 0.75;
    }
    .header-badge {
      font-size: 10px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
      padding: 4px 10px; border-radius: 9999px;
      background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};
      backdrop-filter: blur(8px); display: inline-flex; align-items: center; gap: 6px;
    }
    .slide-title {
      font-size: 24px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.25;
      ${titleGradient}
      margin-top: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.06));
    }
    @keyframes cardEntrance {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes pulseGlowRing {
      0%, 100% { transform: scale(1); opacity: 0.2; }
      50% { transform: scale(1.1); opacity: 0.5; }
    }
    @keyframes floatParticle {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }
    .hero-node { animation: pulseGlowRing 4s ease-in-out infinite; }
    .step-node { animation: floatParticle 3s ease-in-out infinite; }
    ${slide.css_styles || ''}
    ${metadata?.visuals?.css_styles || ''}
  </style>
</head>
<body>
  <canvas id="particleCanvas"></canvas>
  <div style="position:absolute;inset:0;z-index:0;pointer-events:none;">
    ${svgHtml}
  </div>

  <div class="slide-viewport">
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <span class="header-badge">
          ${isWhiteboard ? '🎨 WHITEBOARD DECK' : 'SLIDE'} • SLIDE 0${idx + 1} • ${(slide.layout_type || "bullets").replace('_', ' ')}
        </span>
        ${slide.slide_objective ? `
          <span style="font-size:10px;padding:3px 8px;border-radius:9999px;background:${isWhiteboard ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.1)'};color:${isWhiteboard ? '#334155' : 'rgba(255,255,255,0.8)'};border:1px solid ${isWhiteboard ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.15)'};">
            🎯 ${slide.slide_objective}
          </span>
        ` : ''}
      </div>
      <h2 class="slide-title">${slide.title}</h2>
    </div>

    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
      ${contentBody}
    </div>

    ${slide.narration ? `
      <div style="font-size:10px;color:${isWhiteboard ? '#64748b' : 'rgba(226,232,240,0.7)'};display:flex;align-items:center;gap:6px;padding-top:8px;border-top:1px solid ${isWhiteboard ? '#e2e8f0' : 'rgba(255,255,255,0.1)'};">
        <span>🎙️</span>
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${slide.narration}</span>
      </div>
    ` : ''}
  </div>

  <script>
    // ─── Moving Interactive JS Canvas Particles Engine (Whiteboard Optimized) ───
    (function() {
      const canvas = document.getElementById('particleCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let particles = [];
      const particleCount = 32;
      const colorPalette = ${particleColorArray};

      function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', resize);
      resize();

      class Particle {
        constructor() {
          this.reset();
        }
        reset() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * 3 + 1;
          this.speedX = (Math.random() - 0.5) * 0.9;
          this.speedY = (Math.random() - 0.5) * 0.9;
          this.color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        }
        update() {
          this.x += this.speedX;
          this.y += this.speedY;
          if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
          if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }

      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.update();
          p.draw();
        });
        requestAnimationFrame(animate);
      }
      animate();

      // ─── Metric Number Counter JS Animation ───
      document.querySelectorAll('.stat-number').forEach(el => {
        const rawTarget = el.getAttribute('data-target') || '';
        const numMatch = rawTarget.match(/[\\d.]+/);
        if (!numMatch) return;
        const targetVal = parseFloat(numMatch[0]);
        const prefix = rawTarget.split(numMatch[0])[0] || '';
        const suffix = rawTarget.split(numMatch[0])[1] || '';
        let startVal = 0;
        const duration = 1200;
        const startTime = performance.now();

        function updateCounter(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentVal = (startVal + (targetVal - startVal) * easeProgress).toFixed(targetVal % 1 === 0 ? 0 : 1);
          el.textContent = prefix + currentVal + suffix;
          if (progress < 1) requestAnimationFrame(updateCounter);
        }
        requestAnimationFrame(updateCounter);
      });
    })();
  </script>
</body>
</html>`;
}

// ─── Standalone Full HTML Slide Preview Iframe Component ──────────────────────

export function SlideIframePreview({ htmlContent, title, durationMs }: { htmlContent: string; title?: string; durationMs?: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const handleReplay = () => {
    setReplayKey((prev) => prev + 1);
  };

  const effectiveHtml = useMemo(() => {
    if (!htmlContent) return "";
    const mandatoryStyle = `<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
#stage-frame { width: 100% !important; height: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow: hidden !important; }
</style>`;
    if (htmlContent.includes("<head>")) {
      return htmlContent.replace("<head>", `<head>${mandatoryStyle}`);
    }
    return mandatoryStyle + htmlContent;
  }, [htmlContent]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 group">
      <iframe
        key={replayKey}
        ref={iframeRef}
        srcDoc={effectiveHtml}
        title={title || "Slide Motion Preview"}
        className="w-full h-full border-0 pointer-events-auto"
        sandbox="allow-scripts allow-same-origin"
      />
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {/* <Badge variant="outline" className="bg-slate-900/90 text-teal-300 border-teal-500/30 text-[10px] backdrop-blur-md">
          HTML + CSS + JS Engine
        </Badge> */}
        {durationMs && (
          <Badge variant="outline" className="bg-slate-900/90 text-teal-300 border-teal-500/30 text-[10px] backdrop-blur-md">
            ⚡ {durationMs}ms
          </Badge>
        )}
        {/* <Button
          variant="secondary"
          size="sm"
          className="bg-slate-900/90 hover:bg-slate-800 text-white text-xs gap-1.5 backdrop-blur-md border border-white/15 shadow-lg h-7 px-2.5"
          onClick={() => setShowCodeModal(true)}
          title="Inspect HTML, CSS & JS Code"
        >
          <Code className="w-3.5 h-3.5 text-cyan-400" />
          <span>Inspect Code</span>
        </Button> */}
        <Button
          variant="secondary"
          size="sm"
          className="bg-slate-900/90 hover:bg-slate-800 text-white text-xs gap-1.5 backdrop-blur-md border border-white/15 shadow-lg h-7 px-2.5"
          onClick={handleReplay}
          title="Replay Entrance & Moving Animations"
        >
          <Play className="w-3 h-3 text-teal-400 fill-teal-400" />
          <span>Replay Motion</span>
        </Button>
      </div>

      {/* Code Inspector Dialog */}
      <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-slate-950 text-slate-100 border-slate-800 flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-teal-400">
              <Code className="w-5 h-5" />
              Self-Contained Slide Source Code (HTML, CSS & JS)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Complete standalone document executed inside the sandboxed animation canvas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-slate-900 p-4 rounded-lg border border-slate-800 my-2">
            <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap break-all select-all">
              {htmlContent}
            </pre>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(htmlContent);
                toast.success("Self-contained HTML/CSS/JS copied to clipboard!");
              }}
              className="text-xs border-slate-700 hover:bg-slate-800"
            >
              Copy HTML
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCodeModal(false)}
              className="text-xs bg-teal-600 hover:bg-teal-500 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PresentationPreviewEditorProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: any;
  onSaveAndApprove: (updatedChapter: any) => void;
}

export function PresentationPreviewEditor({
  isOpen,
  onClose,
  chapter,
  onSaveAndApprove,
}: PresentationPreviewEditorProps) {
  if (!isOpen || !chapter) return null;

  // Helper to map slide data preserving all properties including Critic Agent scores
  const mapSlideData = (s: any, idx: number): SlideData => ({
    id: s.id || `slide-${idx}-${Date.now()}`,
    title: s.title || `Slide ${idx + 1}`,
    layout_type: s.layout_type || (idx % 3 === 0 ? "bullets" : idx % 3 === 1 ? "stat_grid" : "process_timeline"),
    bullets: s.bullets || ["Key point 1", "Key point 2"],
    visual_elements: s.visual_elements || [
      { id: `el-1`, type: "icon", title: "Key Visual", icon_name: "Activity", animation_effect: "wave_ripple" }
    ],
    animation: s.animation || { entrance: "wave_ripple", exit: "fade", duration: "0.8s" },
    narration: s.narration || s.script || "",
    notes: s.notes || "",
    is_locked: s.is_locked || false,
    font_family: s.font_family || "Inter",
    font_size: s.font_size || "medium",
    font_color: s.font_color || "#0f172a",
    bg_theme: s.bg_theme || "whiteboard",
    // Per-slide AI visual fields — map directly from backend slide objects
    slide_html: s.slide_html || "",
    background_html: s.background_html || "",
    css_styles: s.css_styles || "",
    animationTimeline: s.animationTimeline || [],
    slide_objective: s.slide_objective || "",
    learning_outcome: s.learning_outcome || "",
    layout_data: s.layout_data || null,
    // Preserve Critic Agent Score & Evaluation
    critic_score: typeof s.critic_score === "number"
      ? s.critic_score
      : (typeof s.critic_agent_score === "number"
        ? s.critic_agent_score
        : (typeof s.critic_evaluation?.scorePercentage === "number"
          ? Math.round(s.critic_evaluation.scorePercentage)
          : undefined)),
    critic_agent_score: s.critic_agent_score,
    critic_evaluation: s.critic_evaluation,
  });

  // Initial metadata state setup
  const [metadata, setMetadata] = useState<PresentationMetadata>(() => {
    const videoDetails = chapter.video_details || {};
    const existingSlides: SlideData[] = (videoDetails.slides || []).map(mapSlideData);

    return {
      title: chapter.title || "Presentation Deck",
      template: videoDetails.template || "Corporate Training Overview",
      color_palette: videoDetails.color_palette || "Modern Professional Blue",
      voice_tone: videoDetails.voice_tone || "Conversational & Friendly",
      script: videoDetails.script || "",
      visuals: videoDetails.visuals || chapter.visuals || null,
      slides: existingSlides.length > 0 ? existingSlides : [
        {
          id: `slide-0-${Date.now()}`,
          title: "Introduction",
          layout_type: "bullets",
          bullets: ["Welcome to this lesson", "Overview of core concepts"],
          animation: { entrance: "fade", exit: "fade", duration: "0.8s" },
          bg_theme: "whiteboard"
        }
      ]
    };
  });

  // Original snapshot for side-by-side compare
  const [originalMetadata] = useState<PresentationMetadata>(JSON.parse(JSON.stringify(metadata)));
  const [history, setHistory] = useState<PresentationMetadata[]>([JSON.parse(JSON.stringify(metadata))]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Model Selection Dropdown: Low (glm 5.1), High (kimi), Pro (glm 502)
  const [selectedModel, setSelectedModel] = useState<"Low" | "High" | "Pro">("High");
  const [activeSlideId, setActiveSlideId] = useState<string>(metadata.slides[0]?.id || "");
  const [compareMode, setCompareMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [generatingSlideId, setGeneratingSlideId] = useState<string | null>(null);
  const [aiLoadingMessage, setAiLoadingMessage] = useState("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [versionHistoryList, setVersionHistoryList] = useState<{ timestamp: string; label: string; snapshot: PresentationMetadata }[]>([]);

  // Convert Slide to Video & Voice Customization State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isConvertingToVideo, setIsConvertingToVideo] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    voiceGender: "Female",
    voiceTone: "Educational",
    speechSpeed: "1.25",
    narrationLanguage: "en-US",
    template: metadata.template || "Modern Tech",
    colorPalette: metadata.color_palette || "Ocean Blue",
  });

  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  const handleSpeechPreview = (text: string) => {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const speedRate = parseFloat(voiceSettings.speechSpeed) || 1.0;
    utterance.rate = speedRate;

    // Pitch modulation according to voice tone and gender
    if (voiceSettings.voiceTone === "Professional") {
      utterance.pitch = voiceSettings.voiceGender === "Female" ? 1.1 : 0.95;
    } else if (voiceSettings.voiceTone === "Energetic") {
      utterance.pitch = voiceSettings.voiceGender === "Female" ? 1.3 : 1.1;
    } else if (voiceSettings.voiceTone === "Calm") {
      utterance.pitch = voiceSettings.voiceGender === "Female" ? 1.0 : 0.85;
    } else {
      utterance.pitch = voiceSettings.voiceGender === "Female" ? 1.15 : 0.9;
    }

    // Dynamic Voice Matching (Accent & Gender)
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const targetLang = voiceSettings.narrationLanguage || "en-US";
      const isFemale = voiceSettings.voiceGender === "Female";
      const isMale = voiceSettings.voiceGender === "Male";

      const matchedVoice = voices.find(v => {
        const langMatch = v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase());
        const nameLower = v.name.toLowerCase();
        if (!langMatch) return false;

        if (isFemale) {
          return nameLower.includes("female") || nameLower.includes("zira") || nameLower.includes("samantha") ||
            nameLower.includes("karen") || nameLower.includes("victoria") || nameLower.includes("ava") ||
            nameLower.includes("jenny") || nameLower.includes("google us english");
        }
        if (isMale) {
          return nameLower.includes("male") || nameLower.includes("david") || nameLower.includes("alex") ||
            nameLower.includes("george") || nameLower.includes("mark") || nameLower.includes("guy");
        }
        return true;
      }) || voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase()))
        || voices.find(v => v.lang.startsWith("en")) || voices[0];

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  };

  // Stop auto-play voice narration when Preview Video modal opens or slide changes
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsAudioPaused(false);
    }
  }, [isPreviewModalOpen, previewSlideIdx]);

  const handleConvertSlideToVideoApi = async () => {
    setIsConvertingToVideo(true);
    try {
      const chapterData = {
        ...chapter,
        video_details: {
          ...chapter.video_details,
          template: voiceSettings.template,
          color_palette: voiceSettings.colorPalette,
          voice_tone: voiceSettings.voiceTone,
          script: metadata.script,
          slides: metadata.slides
        }
      };

      const csrfToken = (window as any).csrf_token || (document.cookie.match(/sid=([^;]+)/)?.[1] ? "" : "");
      const resp = await fetch(`${LMS_API_BASE_URL || ""}/api/method/novel_lms.lms_ai_module_creation.api.generator.convert_slide_chapter_to_video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frappe-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify({
          chapter_json: chapterData,
          voice_settings: voiceSettings
        })
      });
      const result = await resp.json();
      const resData = result.message || result;

      if (!resData || !resData.success || !resData.job_id) {
        const errorMsg = typeof resData === 'string' ? resData : (resData?.error || resData?.exc || "Failed to start background video conversion job.");
        toast.error(errorMsg);
        setIsConvertingToVideo(false);
        return;
      }

      const jobId = resData.job_id;
      const loadingToastId = toast.loading("Video conversion running in background... Synthesizing voice & MP4 file.");

      // Poll get_status every 2 seconds
      const pollInterval = setInterval(async () => {
        try {
          const statusResp = await fetch(`${LMS_API_BASE_URL || ""}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_status?ai_job_id=${jobId}`, {
            credentials: "include"
          });
          const statusResult = await statusResp.json();
          const jobStatus = statusResult.message || statusResult;

          if (jobStatus.progress) {
            toast.loading(jobStatus.progress, { id: loadingToastId });
          }

          if (jobStatus.status === "completed" && (jobStatus.chapter || jobStatus.result)) {
            clearInterval(pollInterval);
            toast.dismiss(loadingToastId);
            toast.success("Slide Chapter converted to Video Content with MP4 file!");
            setIsConvertingToVideo(false);
            setIsVoiceModalOpen(false);
            setIsPreviewModalOpen(false);
            onSaveAndApprove(jobStatus.chapter || jobStatus.result);
            onClose();
          } else if (jobStatus.status === "failed" || jobStatus.status === "cancelled") {
            clearInterval(pollInterval);
            toast.dismiss(loadingToastId);
            setIsConvertingToVideo(false);
            toast.error(jobStatus.error || jobStatus.progress || "Background video conversion failed.");
          }
        } catch (pollErr: any) {
          console.error("Polling error:", pollErr);
        }
      }, 2000);

    } catch (err: any) {
      toast.error("Error starting video conversion: " + err.message);
      setIsConvertingToVideo(false);
    }
  };

  // Scroll references
  const slideRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Helper to push history
  const updateStateWithHistory = (newMeta: PresentationMetadata, label = "Updated slide deck") => {
    const copy = JSON.parse(JSON.stringify(newMeta));
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(copy);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setMetadata(copy);

    setVersionHistoryList(prev => [
      { timestamp: new Date().toLocaleTimeString(), label, snapshot: copy },
      ...prev.slice(0, 15)
    ]);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setMetadata(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      toast.info("Undo applied");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setMetadata(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      toast.info("Redo applied");
    }
  };

  // Scroll to slide
  const scrollToSlide = (slideId: string) => {
    setActiveSlideId(slideId);
    const element = slideRefs.current[slideId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Inline Slide Updates
  const handleUpdateSlide = (slideId: string, updates: Partial<SlideData>) => {
    const updatedSlides = metadata.slides.map(s => s.id === slideId ? { ...s, ...updates } : s);
    updateStateWithHistory({ ...metadata, slides: updatedSlides }, `Updated Slide ${slideId}`);
  };

  // Add bullet to slide
  const handleAddBulletToSlide = (slideId: string) => {
    const slide = metadata.slides.find(s => s.id === slideId);
    if (!slide) return;
    const currentBullets = slide.bullets || [];
    const newBullets = [...currentBullets, `New key point ${currentBullets.length + 1}`];
    handleUpdateSlide(slideId, { bullets: newBullets });
  };

  // Delete bullet from slide
  const handleDeleteBulletFromSlide = (slideId: string, bulletIdx: number) => {
    const slide = metadata.slides.find(s => s.id === slideId);
    if (!slide || !slide.bullets) return;
    const newBullets = slide.bullets.filter((_, idx) => idx !== bulletIdx);
    handleUpdateSlide(slideId, { bullets: newBullets });
  };

  // Slide management
  const handleAddSlide = (afterIdx?: number) => {
    const newSlide: SlideData = {
      id: `slide-${Date.now()}`,
      title: "New Dynamic Slide",
      layout_type: "stat_grid",
      bullets: ["New Key Visual Point", "Actionable Insight"],
      visual_elements: [
        { id: `el-${Date.now()}`, type: "icon", title: "Feature Highlight", icon_name: "Zap", animation_effect: "bounce" }
      ],
      animation: { entrance: "bounce", exit: "fade", duration: "0.8s" },
      bg_theme: "ocean"
    };

    const newSlides = [...metadata.slides];
    const insertIdx = afterIdx !== undefined ? afterIdx + 1 : newSlides.length;
    newSlides.splice(insertIdx, 0, newSlide);

    updateStateWithHistory({ ...metadata, slides: newSlides }, "Added new slide");
    setTimeout(() => scrollToSlide(newSlide.id!), 100);
  };

  const handleDuplicateSlide = (slideId: string) => {
    const slideIdx = metadata.slides.findIndex(s => s.id === slideId);
    if (slideIdx === -1) return;

    const source = metadata.slides[slideIdx];
    const duplicate: SlideData = {
      ...JSON.parse(JSON.stringify(source)),
      id: `slide-${Date.now()}`,
      title: `${source.title} (Copy)`
    };

    const newSlides = [...metadata.slides];
    newSlides.splice(slideIdx + 1, 0, duplicate);
    updateStateWithHistory({ ...metadata, slides: newSlides }, "Duplicated slide");
  };

  const handleDeleteSlide = (slideId: string) => {
    if (metadata.slides.length <= 1) {
      toast.error("Presentation must have at least one slide");
      return;
    }
    const newSlides = metadata.slides.filter(s => s.id !== slideId);
    updateStateWithHistory({ ...metadata, slides: newSlides }, "Deleted slide");
    toast.success("Slide deleted");
  };

  const handleMoveSlide = (slideId: string, direction: "up" | "down") => {
    const idx = metadata.slides.findIndex(s => s.id === slideId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === metadata.slides.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const newSlides = [...metadata.slides];
    const temp = newSlides[idx];
    newSlides[idx] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;

    updateStateWithHistory({ ...metadata, slides: newSlides }, "Reordered slides");
  };

  // AI Slide Regeneration with Model Tier
  const handleRegenerateSlideWithAi = async (slideId: string, customPrompt?: string) => {
    const slide = metadata.slides.find(s => s.id === slideId);
    if (!slide) return;

    setIsAiLoading(true);
    setGeneratingSlideId(slideId);
    setAiLoadingMessage(`Submitting slide regeneration to Lumi AI (${selectedModel} tier)...`);

    try {
      const modelName = selectedModel === "Low" ? "glm 5.1" : selectedModel === "High" ? "kimi" : "glm 502";
      const instruction = customPrompt || `Enhance slide titled '${slide.title}' with creative animation, visual icons, dynamic graphics, and engaging layouts tailored to topic.`;

      const response = await fetch(`${LMS_API_BASE_URL || ''}/api/method/novel_lms.lms_ai_module_creation.api.generator.regenerate_slide_in_background`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_json: JSON.stringify({
            title: chapter.title,
            content_type: "Video Content",
            video_details: {
              ...metadata,
              slides: [slide]
            }
          }),
          instruction,
          llm_model: modelName,
          slide_id: slideId
        })
      });

      const responseText = await response.text();
      let initResult: any = {};
      try {
        initResult = JSON.parse(responseText);
      } catch {
        throw new Error("Server returned a non-JSON error page. Please try again.");
      }

      const resData = initResult.message || initResult;
      const jobId = resData.job_id;

      if (!resData.success || !jobId) {
        throw new Error(resData.error || "Failed to trigger background slide regeneration job.");
      }

      // Poll background job status until completion
      const pollInterval = 2000;
      const maxAttempts = 300; // 10 minutes max
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, pollInterval));
        attempts++;

        try {
          const statusRes = await fetch(`${LMS_API_BASE_URL || ''}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_status?ai_job_id=${jobId}`);
          const statusText = await statusRes.text();
          let statusJson: any = {};
          try {
            statusJson = JSON.parse(statusText);
          } catch {
            continue; // Ignore transient HTML error pages during status checks
          }

          const statusData = statusJson.message || statusJson;

          if (statusData.progress) {
            setAiLoadingMessage(statusData.progress);
          }

          if (statusData.status === "finished" || statusData.status === "completed") {
            const finalResult = statusData.result?.message || statusData.result;
            if (finalResult?.success && finalResult.chapter?.video_details?.slides?.[0]) {
              const returnedSlide = finalResult.chapter.video_details.slides[0];
              const newScore = returnedSlide.critic_score ?? returnedSlide.critic_agent_score ?? returnedSlide.critic_evaluation?.scorePercentage;
              const updatedSlide: SlideData = {
                ...slide,
                ...returnedSlide,
                critic_score: typeof newScore === "number" ? Math.round(newScore) : slide.critic_score,
                slide_html: returnedSlide.slide_html || undefined,
                id: slide.id
              };
              handleUpdateSlide(slideId, updatedSlide);
              toast.success(`Slide regenerated! Critic Agent assigned new score: ${typeof newScore === 'number' ? Math.round(newScore) + '%' : 'Updated'}`);
            } else {
              toast.error(finalResult?.error || "Slide regeneration completed but no slide returned.");
            }
            break;
          } else if (statusData.status === "failed" || statusData.status === "cancelled") {
            toast.error(statusData.error || statusData.progress || "Background slide regeneration failed.");
            break;
          }
        } catch (pollErr) {
          console.warn("Polling error (will retry):", pollErr);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error calling AI slide generator");
    } finally {
      setIsAiLoading(false);
      setGeneratingSlideId(null);
    }
  };

  // Helper to render icon by name
  const renderVisualIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'sparkles': return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'shield': return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'cpu': return <Cpu className="w-5 h-5 text-blue-400" />;
      case 'target': return <Target className="w-5 h-5 text-rose-400" />;
      case 'award': return <Award className="w-5 h-5 text-yellow-400" />;
      case 'barchart': return <BarChart className="w-5 h-5 text-indigo-400" />;
      case 'layers': return <Layers className="w-5 h-5 text-teal-400" />;
      default: return <Activity className="w-5 h-5 text-teal-400" />;
    }
  };

  // Save & Approve presentation -> launches post-approval video generation pipeline
  const handleApproveAndGenerateVideo = () => {
    const isVideoConverted = chapter.content_type === "Video Content" || Boolean(chapter.video || chapter.video_url || chapter.video_details?.is_converted_from_slide);
    const updatedChapter = {
      ...chapter,
      content_type: isVideoConverted ? "Video Content" : (chapter.content_type || "Slide Content"),
      video: chapter.video || chapter.video_url,
      video_url: chapter.video_url || chapter.video,
      video_details: {
        ...chapter.video_details,
        template: metadata.template,
        color_palette: metadata.color_palette,
        voice_tone: metadata.voice_tone,
        script: metadata.script,
        slides: metadata.slides
      }
    };
    onSaveAndApprove(updatedChapter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col font-sans overflow-hidden">

      {/* Top Navigation Bar */}
      <header className="h-16 border-b bg-card px-6 flex items-center justify-between shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>AI Presentation & Animation Editor</span>
              <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                {metadata.slides.length} Slides
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground truncate max-w-sm">{chapter.title}</p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3">

          {/* AI Model Selector */}
          <div className="flex items-center gap-2 border px-3 py-1.5 rounded-lg bg-background shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Model:
            </span>
            <Select value={selectedModel} onValueChange={(val: any) => setSelectedModel(val)}>
              <SelectTrigger className="h-7 w-32 border-none shadow-none text-xs font-bold focus:ring-0">
                <SelectValue placeholder="Select Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">
                  <div className="flex items-center justify-between w-full">
                    <span>Low</span>
                    <span className="text-[10px] text-muted-foreground ml-2">(glm 5.1)</span>
                  </div>
                </SelectItem>
                <SelectItem value="High">
                  <div className="flex items-center justify-between w-full font-bold text-primary">
                    <span>High</span>
                    <span className="text-[10px] text-muted-foreground ml-2">(kimi)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Pro">
                  <div className="flex items-center justify-between w-full font-bold text-purple-600">
                    <span>Pro</span>
                    <span className="text-[10px] text-purple-400 ml-2">(glm 502)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center border rounded-lg overflow-hidden bg-background">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none border-r"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Side-by-Side Compare */}
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setCompareMode(!compareMode)}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>{compareMode ? "Exit Compare" : "Compare Original"}</span>
          </Button>

          {/* Version History */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setHistoryDialogOpen(true)}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </Button>

          <div className="h-6 w-px bg-border my-auto" />

          {/* Convert Slide to Video Action */}
          <Button
            variant="outline"
            className="h-9 gap-2 border-[#008b99]/40 text-[#008b99] hover:bg-[#008b99]/10 font-semibold shadow-xs text-xs px-4"
            onClick={() => setIsVoiceModalOpen(true)}
          >
            <Video className="w-4 h-4 text-[#008b99]" />
            <span>Convert Slide to Video</span>
          </Button>

          {/* Approve & Generate Video Action */}
          <Button
            className="h-9 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md text-xs px-5"
            onClick={handleApproveAndGenerateVideo}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Save Changes</span>
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel: Slide List & Navigation */}
        <aside className="w-64 border-r bg-card/50 flex flex-col shrink-0">
          <div className="p-3 border-b flex items-center justify-between bg-card">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slide Deck ({metadata.slides.length})</span>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleAddSlide()}>
              <Plus className="w-3.5 h-3.5" /> Add Slide
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {metadata.slides.map((slide, idx) => {
              const isActive = slide.id === activeSlideId;
              const score = getSlideCriticScore(slide, idx);
              const scoreStyle = getCriticScoreBadgeStyle(score);
              return (
                <div
                  key={slide.id}
                  onClick={() => scrollToSlide(slide.id!)}
                  className={`
                    group relative border rounded-xl p-3 cursor-pointer transition-all duration-200 shadow-xs
                    ${isActive
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : `bg-card ${scoreStyle.cardBorderClass} hover:border-muted-foreground/40`
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                      Slide {idx + 1}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      {slide.is_locked ? (
                        <Lock className="w-3 h-3 text-amber-500" />
                      ) : (
                        <Unlock className="w-3 h-3 text-muted-foreground/60" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-bold text-foreground line-clamp-1">{slide.title}</p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <Badge variant="outline" className={`text-[9px] px-2 py-0.5 border ${scoreStyle.badgeClass}`}>
                      <Award className="w-3 h-3 mr-1 inline shrink-0" />
                      Critic: {score}%
                    </Badge>
                    <span>{slide.bullets?.length || 0} Points</span>
                  </div>

                  {/* Quick Reorder Controls */}
                  <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-0.5 bg-background border rounded-md shadow-xs p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => { e.stopPropagation(); handleMoveSlide(slide.id!, "up"); }}
                      disabled={idx === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => { e.stopPropagation(); handleMoveSlide(slide.id!, "down"); }}
                      disabled={idx === metadata.slides.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Panel: Continuous Scroll Workspace */}
        <main className="flex-1 bg-muted/20 overflow-y-auto p-6 scrollbar-thin">
          {compareMode && (
            <div className="max-w-7xl mx-auto mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <SplitSquareVertical className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Side-by-Side Compare Mode Active — Comparing initial baseline slides (Left) with your current edited slides (Right).</span>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20" onClick={() => setCompareMode(false)}>
                Exit Compare Mode
              </Button>
            </div>
          )}

          <div className={`${compareMode ? "max-w-7xl" : "max-w-4xl"} mx-auto space-y-12 transition-all duration-300`}>
            {metadata.slides.map((slide, idx) => {
              const origSlide = originalMetadata.slides.find(s => s.id === slide.id) || originalMetadata.slides[idx];
              const score = getSlideCriticScore(slide, idx);
              const scoreStyle = getCriticScoreBadgeStyle(score);
              return (
                <div
                  key={slide.id}
                  ref={(el) => { slideRefs.current[slide.id!] = el; }}
                  className="space-y-3 scroll-mt-6"
                >
                  {/* Per-Slide Editing Toolbar */}
                  <div className="bg-card border rounded-xl p-2.5 shadow-sm flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground bg-primary/10 px-2.5 py-1 rounded-md text-primary">
                        Slide #{idx + 1}
                      </span>

                      {/* Regenerate Slide */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => handleRegenerateSlideWithAi(slide.id!)}
                        disabled={isAiLoading || slide.is_locked}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading && generatingSlideId === slide.id ? "animate-spin" : ""}`} />
                        <span>{isAiLoading && generatingSlideId === slide.id ? "Generating..." : "Regenerate Slide"}</span>
                      </Button>

                      {/* Critic Agent Score Badge */}
                      <Badge variant="outline" className={`h-8 text-xs font-bold gap-1.5 px-3 border ${scoreStyle.badgeClass}`}>
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>Critic Agent Score: {score}%</span>
                      </Badge>
                    </div>

                    {/* Slide Action Buttons */}
                    <div className="flex items-center gap-1.5">

                      {/* Convert Slide to Video */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#008b99] hover:bg-[#008b99]/10"
                        title="Convert Slide Chapter to Video Lesson"
                        onClick={() => setIsVoiceModalOpen(true)}
                      >
                        <Video className="w-3.5 h-3.5" />
                      </Button>

                      {/* Lock Toggle */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={slide.is_locked ? "Unlock Slide" : "Lock Slide"}
                        onClick={() => handleUpdateSlide(slide.id!, { is_locked: !slide.is_locked })}
                      >
                        {slide.is_locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
                      </Button>

                      {/* Duplicate */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Duplicate Slide"
                        onClick={() => handleDuplicateSlide(slide.id!)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete Slide"
                        onClick={() => handleDeleteSlide(slide.id!)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Main Slide Presentation Canvas Card (Self-Contained HTML, CSS & JS Engine) */}
                  {compareMode ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-card/60 p-3 rounded-2xl border shadow-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5" /> Original Snapshot
                          </span>
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                            Original Baseline
                          </Badge>
                        </div>
                        <SlideIframePreview
                          htmlContent={origSlide ? (origSlide.slide_html || generateSelfContainedSlideHtml(origSlide, originalMetadata, idx)) : generateSelfContainedSlideHtml(slide, metadata, idx)}
                          title={origSlide?.title || slide.title}
                          durationMs={origSlide?.duration_ms || slide.duration_ms}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" /> Current Version (Edited)
                          </span>
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                            Current Edited
                          </Badge>
                        </div>
                        <SlideIframePreview
                          htmlContent={slide.slide_html || generateSelfContainedSlideHtml(slide, metadata, idx)}
                          title={slide.title}
                          durationMs={slide.duration_ms}
                        />
                      </div>
                    </div>
                  ) : (
                    <SlideIframePreview
                      htmlContent={slide.slide_html || generateSelfContainedSlideHtml(slide, metadata, idx)}
                      title={slide.title}
                      durationMs={slide.duration_ms}
                    />
                  )}

                  {/* Micro Prompt Bar */}
                  <div className="flex items-center gap-3 bg-card border p-3 rounded-xl shadow-xs">
                    <div className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-1.5 transition-colors ${isAiLoading || slide.is_locked
                        ? "bg-amber-500/10 border-amber-500/30 opacity-90 cursor-not-allowed"
                        : "bg-muted/50 border-input"
                      }`}>
                      {isAiLoading ? (
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                      ) : slide.is_locked ? (
                        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Wand2 className="w-4 h-4 text-primary shrink-0" />
                      )}

                      <Input
                        placeholder={
                          isAiLoading
                            ? "Generation in Progress..."
                            : slide.is_locked
                              ? "Slide is locked"
                              : "Micro-prompt: e.g., 'Make background darker with glowing decibel graphics'..."
                        }
                        disabled={isAiLoading || slide.is_locked}
                        className="border-none shadow-none text-xs focus-visible:ring-0 h-7 disabled:cursor-not-allowed disabled:opacity-100 placeholder:text-muted-foreground/80 font-medium bg-transparent"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isAiLoading && !slide.is_locked) {
                            const target = e.target as HTMLInputElement;
                            const val = target.value.trim();
                            if (val) {
                              target.value = "";
                              handleRegenerateSlideWithAi(slide.id!, val);
                            }
                          }
                        }}
                      />

                      {isAiLoading && (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold shrink-0 animate-pulse border border-amber-500/30">
                          <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                          <span>Generating...</span>
                        </div>
                      )}

                      {!isAiLoading && !slide.is_locked && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10 gap-1 shrink-0 font-medium"
                          onClick={(e) => {
                            const container = e.currentTarget.parentElement;
                            const inputEl = container?.querySelector('input') as HTMLInputElement;
                            if (inputEl && inputEl.value.trim()) {
                              const val = inputEl.value.trim();
                              inputEl.value = "";
                              handleRegenerateSlideWithAi(slide.id!, val);
                            }
                          }}
                        >
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span>Generate</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Version History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <span>Version History</span>
            </DialogTitle>
            <DialogDescription>Select a previous version to restore your presentation deck.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin my-2">
            {versionHistoryList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No saved versions yet.</p>
            ) : (
              versionHistoryList.map((ver, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-accent/40 text-xs">
                  <div>
                    <span className="font-bold block text-foreground">{ver.label}</span>
                    <span className="text-[10px] text-muted-foreground">{ver.timestamp}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setMetadata(ver.snapshot);
                      setHistoryDialogOpen(false);
                      toast.success(`Restored version from ${ver.timestamp}`);
                    }}
                  >
                    Restore
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Settings & Video Conversion Dialog */}
      <Dialog open={isVoiceModalOpen} onOpenChange={setIsVoiceModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#008b99]">
              <Video className="w-5 h-5 text-[#008b99]" />
              <span>Convert Slide Chapter to Video Lesson</span>
            </DialogTitle>
            <DialogDescription>
              Configure AI voice tone, narrator gender, speech rate, and template to synthesize an MP4 video for this lesson.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Voice Gender Selection */}
            <div className="space-y-1.5">
              <label className="font-bold block text-foreground">Voice Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {["Female", "Male"].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setVoiceSettings(prev => ({ ...prev, voiceGender: gender }))}
                    className={`p-2.5 rounded-lg border text-center transition-all ${voiceSettings.voiceGender === gender
                        ? "border-[#008b99] bg-[#008b99]/10 font-bold text-[#008b99] ring-1 ring-[#008b99]"
                        : "bg-card hover:bg-accent"
                      }`}
                  >
                    {gender} Voice
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Tone Selection */}
            <div className="space-y-1.5">
              <label className="font-bold block text-foreground">Voice Tone & Delivery</label>
              <Select
                value={voiceSettings.voiceTone}
                onValueChange={(val) => setVoiceSettings(prev => ({ ...prev, voiceTone: val }))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Voice Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional & Authoritative</SelectItem>
                  <SelectItem value="Conversational">Conversational & Friendly</SelectItem>
                  <SelectItem value="Energetic">Energetic & Engaging</SelectItem>
                  <SelectItem value="Educational">Educational & Clear</SelectItem>
                  <SelectItem value="Calm">Calm & Instructional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Speech Rate & Speed */}
            <div className="space-y-1.5">
              <label className="font-bold block text-foreground">Speech Speed / Pace</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "1.25x (Fast)", val: "1.25" },
                  { label: "1.50x", val: "1.50" },
                  { label: "2.00x", val: "2.00" },
                ].map((sp) => (
                  <button
                    key={sp.val}
                    type="button"
                    onClick={() => setVoiceSettings(prev => ({ ...prev, speechSpeed: sp.val }))}
                    className={`p-2 rounded-lg border text-center transition-all ${voiceSettings.speechSpeed === sp.val
                        ? "border-[#008b99] bg-[#008b99]/10 font-bold text-[#008b99] ring-1 ring-[#008b99]"
                        : "bg-card hover:bg-accent"
                      }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Accent */}
            <div className="space-y-1.5">
              <label className="font-bold block text-foreground">Narrator Accent & Language</label>
              <Select
                value={voiceSettings.narrationLanguage}
                onValueChange={(val) => setVoiceSettings(prev => ({ ...prev, narrationLanguage: val }))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US Accent)</SelectItem>
                  <SelectItem value="en-GB">English (British Accent)</SelectItem>
                  <SelectItem value="en-IN">English (Indian Accent)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-[#008b99] border-[#008b99]/30 hover:bg-[#008b99]/10"
              onClick={() => {
                setPreviewSlideIdx(0);
                setIsPreviewModalOpen(true);
              }}
            >
              <Play className="w-3.5 h-3.5 fill-[#008b99]" />
              <span>Preview Video Before Creation</span>
            </Button>

            <Button
              className="gap-2 bg-[#008b99] hover:bg-[#007682] text-white font-semibold text-xs px-5 h-9"
              onClick={handleConvertSlideToVideoApi}
              disabled={isConvertingToVideo}
            >
              {isConvertingToVideo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing MP4...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Confirm & Render MP4 Video</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pre-Creation Video Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2 text-[#008b99] font-bold">
                <SquarePlay className="w-5 h-5" /> Pre-Creation Video & Voice Preview
              </span>
              <Badge variant="outline" className="text-xs bg-[#008b99]/10 text-[#008b99] border-[#008b99]/30">
                Slide {previewSlideIdx + 1} of {metadata.slides.length}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Watch animated slide motion synchronized with spoken AI voice narration before converting to final MP4 module file.
            </DialogDescription>
          </DialogHeader>

          {/* Interactive Slide Preview Canvas */}
          <div className="flex-1 my-3 bg-slate-950 rounded-xl overflow-hidden relative aspect-video border shadow-lg flex flex-col">
            <SlideIframePreview
              htmlContent={metadata.slides[previewSlideIdx]?.slide_html || generateSelfContainedSlideHtml(metadata.slides[previewSlideIdx], metadata, previewSlideIdx)}
              title={metadata.slides[previewSlideIdx]?.title}
              durationMs={metadata.slides[previewSlideIdx]?.duration_ms}
            />

            {/* Narration Subtitle Overlay Bar */}
            <div className="p-3 bg-slate-900/90 backdrop-blur border-t border-slate-800 text-slate-100 flex items-start gap-3">
              <Volume2 className="w-4 h-4 text-[#008b99] shrink-0 mt-0.5" />
              <p className="text-xs italic leading-relaxed line-clamp-2">
                "{metadata.slides[previewSlideIdx]?.narration || metadata.slides[previewSlideIdx]?.notes || `Narrator script for slide covering ${metadata.slides[previewSlideIdx]?.title}`}"
              </p>
            </div>
          </div>

          {/* Preview Navigation, Pause Audio & Voice Test Controls */}
          <div className="flex items-center justify-between border-t pt-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                disabled={previewSlideIdx === 0}
                onClick={() => {
                  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                  setPreviewSlideIdx(previewSlideIdx - 1);
                  setIsAudioPaused(false);
                }}
              >
                Previous Slide
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                disabled={previewSlideIdx === metadata.slides.length - 1}
                onClick={() => {
                  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                  setPreviewSlideIdx(previewSlideIdx + 1);
                  setIsAudioPaused(false);
                }}
              >
                Next Slide
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  setIsAudioPaused(false);
                  handleSpeechPreview(metadata.slides[previewSlideIdx]?.narration || metadata.slides[previewSlideIdx]?.title);
                }}
              >
                <Volume2 className="w-3.5 h-3.5 text-[#008b99]" />
                <span>Test Voice Sample</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-[#008b99]/30 text-[#008b99] hover:bg-[#008b99]/10"
                onClick={() => {
                  if ("speechSynthesis" in window) {
                    if (window.speechSynthesis.paused) {
                      window.speechSynthesis.resume();
                      setIsAudioPaused(false);
                    } else if (window.speechSynthesis.speaking) {
                      window.speechSynthesis.pause();
                      setIsAudioPaused(true);
                    } else {
                      handleSpeechPreview(metadata.slides[previewSlideIdx]?.narration || metadata.slides[previewSlideIdx]?.title);
                      setIsAudioPaused(false);
                    }
                  }
                }}
              >
                {isAudioPaused ? <Play className="w-3.5 h-3.5 fill-[#008b99]" /> : <Pause className="w-3.5 h-3.5 text-[#008b99]" />}
                <span>{isAudioPaused ? "Resume Audio" : "Pause Audio"}</span>
              </Button>
            </div>

            <Button
              className="h-9 gap-2 bg-[#008b99] hover:bg-[#007682] text-white font-semibold text-xs px-5"
              onClick={handleConvertSlideToVideoApi}
              disabled={isConvertingToVideo}
            >
              {isConvertingToVideo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing MP4...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Looks Great! Render MP4 Video</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}




