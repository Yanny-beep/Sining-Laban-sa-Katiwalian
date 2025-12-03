📚 Sining Laban sa Katiwalian – Virtual Museum

A digital, interactive museum showcasing artistic expressions against corruption.

🎨 Overview

Sining Laban sa Katiwalian is an immersive virtual museum experience featuring artworks, literature, digital designs, and multimedia created to raise awareness and inspire action against corruption.

Visitors can browse curated galleries, open artworks in animated modals, post realtime comments, and engage with the community — all through a modern, mobile-responsive UI.

This project was built as an educational and artistic platform promoting transparency, awareness, and accountability.

✨ Features
🖼️ Interactive Art Gallery

Responsive grid layout

Categories & filters (Visual Arts, Literature, Applied Arts, etc.)

Smooth card animations

Optimized asset loading

🔍 Modal Art Viewer

Each artwork includes:

Full image or video thumbnail

Title, description, and artist

Like button with interaction feedback

Realtime comment section

Double-tap to like (mobile friendly)

💬 Realtime Comments & Likes

Powered by Supabase Realtime:

Live comments feed

Persistent likes per user

Unique visitor ID system

Timestamped messages

🚀 Performance Enhancements

Custom animated loading screen

Full asset preloading

Zero-delay filtering

GPU-friendly, stutter-free animations

Fixed navbar behavior with responsive auto-hide

🌌 Dynamic Hero Section

Particle background

Clean typography and layout

Auto-hiding navbar when hero is visible

👤 User Profile System

Choose avatar

Set display name

Anonymous mode included

Local storage persistence

🛠️ Tech Stack
Frontend

HTML5

CSS3 (custom animations & responsive layout)

JavaScript (ES Modules)

Backend

Supabase (Database + Realtime)

PostgreSQL

Supabase JS SDK v2

📂 Project Structure
/
├── index.html               # Main virtual museum
├── style.css                # UI layout, animations, responsiveness
├── script.js                # Gallery logic, modals, filters, realtime, profiles
├── assets/
│   ├── icons/
│   ├── visual arts/
│   ├── literary arts/
│   ├── applied arts/
│   └── multimedia/
└── README.md

🚀 Getting Started
1️⃣ Clone the repository
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>

2️⃣ Configure Supabase

In script.js, replace:

window.sb = createClient("<YOUR-SUPABASE-URL>", "<YOUR-ANON-KEY>");


with your actual Supabase credentials.

3️⃣ Run the project

Since it’s a pure frontend build, simply open:

index.html


Or run a local web server:

npx serve

📱 Responsive & Mobile-Ready

The virtual museum is optimized for:

Desktop browsers

Tablets

Mobile devices

UI adjusts automatically for the best viewing experience, including modal scaling and simplified animations on mobile.

🧩 Core Functionalities
Feature	Description
Scroll Snap Navigation	Section-based immersive scrolling
Animated Modals	Artwork preview with comments & likes
Filters	Instant card filtering with zero delay
Local User Profiles	Avatar, name, and anonymous mode
Realtime Comments	Live conversation powered by Supabase
Like System	Smooth like interactions + feedback
Visitor Tracking	Unique user IDs for stats & analytics
Loading Screen	Animated loader with progress states
🖋️ Authors & Contributors

Sining Laban sa Katiwalian – Virtual Museum
Created for art appreciation, education, and social awareness.

If you want your name/team/class added here, I can update this section.

📜 License

This project is intended for educational, artistic, and non-commercial use.
You are free to modify or extend it with proper attribution.

💡 Need Improvements?

I can help you with:

Code cleanup / refactoring

Supabase schema optimization

UI/UX redesign

Performance improvements

Deploying to GitHub Pages or Netlify

Adding dark/light mode

Adding search, tagging, or multi-filter support
