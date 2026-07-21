import fs from "node:fs";
import path from "node:path";
import pptxgen from "pptxgenjs";

const assetDir = "E:/Project/matcha/docs/presentation-assets";
const outDir = "E:/Project/matcha/docs/deliverables";
const outPath = path.join(outDir, "MatchA-Product-Design-Review.pptx");

fs.mkdirSync(outDir, { recursive: true });

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "MatchA Product & Engineering";
pptx.company = "MatchA";
pptx.subject = "MatchA web platform design and development status";
pptx.title = "MatchA Product Design Review";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Georgia",
  bodyFontFace: "Aptos",
  lang: "en-US"
};
pptx.defineLayout({ name: "LAYOUT_WIDE", width: 13.333, height: 7.5 });

const C = {
  cream: "FFF7EC",
  ivory: "FFFCF6",
  maroon: "8F2742",
  rose: "D85B75",
  roseDark: "A53B55",
  ink: "27141B",
  muted: "6F5F61",
  gold: "C98A58",
  purple: "5A357B"
};

function addBackground(slide) {
  slide.background = { color: C.cream };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: C.cream },
    line: { color: C.cream }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.18,
    y: 0.18,
    w: 12.973,
    h: 7.14,
    fill: { color: C.ivory, transparency: 7 },
    line: { color: "EAC0BA", transparency: 25, width: 1 }
  });
  slide.addText("MatchA", {
    x: 0.45,
    y: 0.25,
    w: 1.4,
    h: 0.3,
    color: C.maroon,
    fontFace: "Georgia",
    fontSize: 13,
    bold: true,
    margin: 0
  });
}

function addFooter(slide, label) {
  slide.addText(label, {
    x: 0.45,
    y: 7.08,
    w: 8.5,
    h: 0.22,
    color: C.muted,
    fontSize: 8,
    margin: 0
  });
  slide.addText(new Date().toLocaleDateString("en-IN"), {
    x: 11.25,
    y: 7.08,
    w: 1.55,
    h: 0.22,
    align: "right",
    color: C.muted,
    fontSize: 8,
    margin: 0
  });
}

function title(slide, text, subtitle) {
  slide.addText(text, {
    x: 0.7,
    y: 0.75,
    w: 5.2,
    h: 0.55,
    color: C.ink,
    fontFace: "Georgia",
    fontSize: 24,
    bold: true,
    margin: 0
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.72,
      y: 1.35,
      w: 5.2,
      h: 0.45,
      color: C.muted,
      fontSize: 10,
      breakLine: false,
      fit: "shrink",
      margin: 0
    });
  }
}

function addImage(slide, file, x, y, w, h) {
  const imagePath = path.join(assetDir, file);
  slide.addImage({
    path: imagePath,
    x,
    y,
    w,
    h,
    sizing: { type: "contain", x, y, w, h }
  });
}

function bulletList(slide, items, x, y, w, h) {
  slide.addText(
    items.map((item) => ({ text: item, options: { bullet: { type: "bullet" } } })),
    {
      x,
      y,
      w,
      h,
      color: C.ink,
      fontSize: 12,
      breakLine: false,
      fit: "shrink",
      margin: 0.05,
      paraSpaceAfterPt: 8
    }
  );
}

function screenshotSlide({ bullets, caption, file, imageSize = "mobile", subtitle, titleText }) {
  const slide = pptx.addSlide();
  addBackground(slide);
  title(slide, titleText, subtitle);
  const image =
    imageSize === "desktop"
      ? { x: 5.55, y: 0.85, w: 6.95, h: 5.95 }
      : { x: 7.75, y: 0.78, w: 3.45, h: 6.05 };
  bulletList(slide, bullets, 0.78, 2.05, imageSize === "desktop" ? 4.15 : 5.9, 4.15);
  addImage(slide, file, image.x, image.y, image.w, image.h);
  slide.addText(caption, {
    x: image.x,
    y: 6.9,
    w: image.w,
    h: 0.24,
    align: "center",
    color: C.muted,
    fontSize: 8,
    margin: 0
  });
  addFooter(slide, "Real screenshot captured from local MatchA build");
}

let slide = pptx.addSlide();
addBackground(slide);
slide.addText("MatchA", {
  x: 0.82,
  y: 1.0,
  w: 5.5,
  h: 0.8,
  color: C.ink,
  fontFace: "Georgia",
  fontSize: 38,
  bold: true,
  margin: 0
});
slide.addText("Product Design & Development Review", {
  x: 0.84,
  y: 1.9,
  w: 5.8,
  h: 0.4,
  color: C.maroon,
  fontSize: 16,
  bold: true,
  margin: 0
});
slide.addText(
  "A responsive Jaipur-inspired dating platform with matching, chat, instant plans, event discovery, notifications, and admin moderation.",
  {
    x: 0.86,
    y: 2.52,
    w: 5.5,
    h: 0.8,
    color: C.muted,
    fontSize: 13,
    fit: "shrink",
    margin: 0
  }
);
addImage(slide, "01-landing-desktop.png", 6.45, 0.8, 5.9, 5.55);
addFooter(slide, "Prepared for MatchA team review");

slide = pptx.addSlide();
addBackground(slide);
title(slide, "Executive Summary", "What has been built through Phase 11");
bulletList(
  slide,
  [
    "Monorepo foundation with Next.js web/admin apps, Express API, Prisma, PostgreSQL, JWT auth, and shared UI packages.",
    "Mobile-first dating experience: landing, auth, onboarding/profile, home matching, matches, chats, Instant Date, Concert Mode, Events, Notifications.",
    "Admin operations console: users, reports, verification review, events/concert publishing, broadcasts, and audit logs.",
    "Visual direction follows luxury, minimal, Jaipur-inspired cream/rose-gold/maroon styling with floral frames and soft glass surfaces."
  ],
  0.78,
  1.7,
  5.5,
  4.7
);
addImage(slide, "03-home-mobile.png", 6.4, 1.0, 2.05, 5.7);
addImage(slide, "11-admin-dashboard-desktop.png", 8.65, 1.05, 3.8, 5.2);
addFooter(slide, "Scope snapshot: phases 1 through 11");

screenshotSlide({
  titleText: "Brand & Landing Page",
  subtitle: "Public web entry with premium MatchA positioning",
  file: "01-landing-desktop.png",
  imageSize: "desktop",
  caption: "Landing page, desktop viewport",
  bullets: [
    "Elegant cream/ivory base with rose-gold and maroon accents.",
    "Sections implemented for hero, features, how it works, testimonials, safety, pricing, FAQ, and footer.",
    "Primary CTAs route to sign up and login.",
    "Designed to present the product as premium and safety-first, not a generic dating app."
  ]
});

screenshotSlide({
  titleText: "Authentication",
  subtitle: "Secure login foundation with future OAuth/OTP support",
  file: "02-login-desktop.png",
  imageSize: "desktop",
  caption: "Login page, desktop viewport",
  bullets: [
    "Email/password login connected to backend JWT and secure refresh-token cookies.",
    "Google OAuth and Email OTP surfaces are present for provider configuration.",
    "Forgot/reset password and OTP screens are part of the auth module.",
    "Admin and web share the same secure backend auth foundation."
  ]
});

screenshotSlide({
  titleText: "Home & Matching",
  subtitle: "Figma-inspired mobile-first dating card",
  file: "03-home-mobile.png",
  caption: "Home screen, mobile viewport",
  bullets: [
    "Top nav with logo, undo, filters, and notification count.",
    "Profile card with image, verification, age, profession, location, bio, interests, and compatibility percentage.",
    "Matching actions: pass, like, super like, and undo.",
    "Feature cards lead into Instant Date, Concert Mode, and Events."
  ]
});

screenshotSlide({
  titleText: "Instant Date",
  subtitle: "Spontaneous plans with activity and time selection",
  file: "04-instant-date-mobile.png",
  caption: "Instant Date screen, mobile viewport",
  bullets: [
    "Activity choices: coffee, dinner, walk, drive, art, market, casual.",
    "Time windows: now, tonight, weekend, and custom date/time.",
    "Backend creates request records and finds nearby compatible users.",
    "Supports accept, reject, cancel, reschedule, and live-location-ready data model."
  ]
});

screenshotSlide({
  titleText: "Concert Mode",
  subtitle: "Find a concert buddy, new friends, or maybe more",
  file: "05-concert-mode-mobile.png",
  caption: "Concert Mode screen, mobile viewport",
  bullets: [
    "Search concerts by city, title, artist, venue, and genre tags.",
    "Featured concert card includes attendees, intent, join/update/cancel actions.",
    "Looking-for modes support concert buddy, new friends, maybe more, and group vibe.",
    "Participants and notifications are backed by Prisma models."
  ]
});

screenshotSlide({
  titleText: "Events",
  subtitle: "Local group-first plans beyond concerts",
  file: "06-events-mobile.png",
  caption: "Events screen, mobile viewport",
  bullets: [
    "Categories include book clubs, food festivals, comedy, movies, workshops, community, and concerts.",
    "Users can join, mark interested, share, invite, and leave events.",
    "Event participants and invite notifications are stored server-side.",
    "Designed for safer, lower-pressure social discovery."
  ]
});

screenshotSlide({
  titleText: "Notifications",
  subtitle: "In-app inbox and preference management",
  file: "07-notifications-mobile.png",
  caption: "Notifications screen, mobile viewport",
  bullets: [
    "Notification inbox with unread count, filters by type/channel, and read/delete actions.",
    "Covers likes, matches, messages, concert invites, instant date requests, profile views, verification, and system alerts.",
    "Push/email preference toggles persist through user settings.",
    "Home bell displays live unread count."
  ]
});

screenshotSlide({
  titleText: "Matches",
  subtitle: "Mutual connection list for follow-up",
  file: "08-matches-mobile.png",
  caption: "Matches screen, mobile viewport",
  bullets: [
    "Mutual matches created through like/super-like flow.",
    "Cards show profile preview, compatibility, match date, and latest message.",
    "Routes into chat conversations.",
    "Backend prevents duplicates and respects blocked/unmatched states."
  ]
});

screenshotSlide({
  titleText: "Chats",
  subtitle: "Realtime messaging foundation",
  file: "09-chats-mobile.png",
  caption: "Chats screen, mobile viewport",
  bullets: [
    "Conversation list backed by match records and message history.",
    "Socket.IO foundation supports realtime typing, delivery/read state, and online indicators.",
    "Chat module includes images, GIFs, voice-note metadata, edit, delete, reply, mute, archive, block, and report endpoints.",
    "Report actions feed the admin moderation queue."
  ]
});

screenshotSlide({
  titleText: "Profile & Verification",
  subtitle: "Onboarding, profile completion, photos, safety review",
  file: "10-profile-mobile.png",
  caption: "Profile screen, mobile viewport",
  bullets: [
    "Full profile editor: bio, location, gender, interests, lifestyle, prompts, music, food, travel, pets, smoking/drinking.",
    "Photo gallery with primary photo management.",
    "Profile completion percentage drives route access.",
    "Verification request creates admin queue and user notification."
  ]
});

screenshotSlide({
  titleText: "Admin Dashboard",
  subtitle: "Operations console for trust and moderation",
  file: "11-admin-dashboard-desktop.png",
  imageSize: "desktop",
  caption: "Admin app, desktop viewport",
  bullets: [
    "Role-gated admin login with live dashboard metrics.",
    "User controls: search, ban, unban, soft delete.",
    "Moderation queues: reports and verification review.",
    "Publishing controls for events/concerts, broadcast notifications, and audit log viewer."
  ]
});

slide = pptx.addSlide();
addBackground(slide);
title(slide, "Architecture Snapshot", "Current implementation stack and module boundaries");
bulletList(
  slide,
  [
    "Frontend: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, shared UI package.",
    "Backend: Express.js TypeScript API, Prisma ORM, PostgreSQL, JWT access/refresh tokens, Socket.IO chat foundation.",
    "Modules implemented: Auth, Profile, Matching, Chat, Instant Date, Concert Mode, Events, Notifications, Admin.",
    "Data model covers users, photos, interests, likes, matches, messages, notifications, events, concerts, instant dates, reports, blocks, verification, sessions, settings, and audit logs.",
    "Future mobile reuse is supported by keeping API/business logic separate from UI surfaces."
  ],
  0.78,
  1.65,
  11.6,
  4.9
);
addFooter(slide, "Technical architecture overview");

slide = pptx.addSlide();
addBackground(slide);
title(slide, "Next Milestones", "Recommended path after Phase 11");
bulletList(
  slide,
  [
    "Phase 12: automated tests for auth, API modules, matching, chat, events, notifications, and admin flows.",
    "Phase 13: production deployment setup with Vercel, Railway, Supabase PostgreSQL, environment management, health checks, and CI/CD.",
    "Provider integrations: Cloudinary upload flow, Firebase Cloud Messaging, SMTP production email, Google OAuth, Google Maps API.",
    "Product hardening: richer admin analytics, support tickets, ID verification provider, fake-profile detection, SOS/emergency contact flows.",
    "Design pass: final floral border assets, dark mode polish, accessibility audit, and responsive visual QA."
  ],
  0.78,
  1.65,
  11.6,
  4.9
);
addFooter(slide, "Recommended roadmap");

await pptx.writeFile({ fileName: outPath });
console.log(outPath);
