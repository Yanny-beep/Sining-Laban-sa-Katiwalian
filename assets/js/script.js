/*  ====== SUPABASE INTEGRATION (ADD ON TOP) ====== */
/* 1) Include supabase-js if not using bundler.
   In your index.html (head or before script.js) add:
   <script src="https://esm.sh/@supabase/supabase-js@2"></script>
   This will expose window.supabase.
*/
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
window.sb = createClient("https://aigiahcecfgdrwygqwij.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ2lhaGNlY2ZnZHJ3eWdxd2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTY3OTgsImV4cCI6MjA4MDA5Mjc5OH0.ZnCQGV3iSTniq1SVWVHs8u8-J3Ai0Df46ZRKMcG1a5Q");
// ====== LOADING SCREEN ======
const loadingScreen = document.getElementById('loadingScreen');
const loadingProgress = document.getElementById('loadingProgress');
const loadingText = document.getElementById('loadingText');

let progress = 0;
const loadingMessages = [
    'Preparing your experience...',
    'Loading artworks...',
    'Connecting to gallery...',
    'Setting up interactions...',
    'Almost ready...'
];

function updateLoadingProgress(percent, message) {
    loadingProgress.style.width = percent + '%';
    if (message) loadingText.textContent = message;
}
function preloadAllMedia() {
    const media = [];

    artworks.forEach(a => {
        if (a.type === "image") {
            const img = new Image();
            img.src = a.image;
            media.push(img);
        } else if (a.type === "video") {
            const thumb = new Image();
            thumb.src = a.thumbnail;
            media.push(thumb);
        }
    });

    return Promise.all(media.map(m => new Promise(res => {
        m.onload = res;
        m.onerror = res;
    })));
}

function simulateLoading() {
    let messageIndex = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress > 100) progress = 100;

        if (progress > 20 && messageIndex === 0) {
            messageIndex = 1;
            updateLoadingProgress(progress, loadingMessages[1]);
        } else if (progress > 40 && messageIndex === 1) {
            messageIndex = 2;
            updateLoadingProgress(progress, loadingMessages[2]);
        } else if (progress > 60 && messageIndex === 2) {
            messageIndex = 3;
            updateLoadingProgress(progress, loadingMessages[3]);
        } else if (progress > 80 && messageIndex === 3) {
            messageIndex = 4;
            updateLoadingProgress(progress, loadingMessages[4]);
        } else {
            updateLoadingProgress(progress);
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(hideLoadingScreen, 500);
        }
    }, 200);
}

function hideLoadingScreen() {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
        loadingScreen.remove();   // <-- important
    }, 600);
}


// Start loading simulation
simulateLoading();

// --- anonymous persistent id per browser (UUID v4)
function getOrCreateUserId() {
    let uid = localStorage.getItem('guest_user_id_v1');
    if (!uid) {
        // browsers supporting crypto.randomUUID()
        if (crypto && crypto.randomUUID) uid = crypto.randomUUID();
        else uid = 'u-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        localStorage.setItem('guest_user_id_v1', uid);
    }
    return uid;
}
const GUEST_ID = getOrCreateUserId();
// --- STATISTICS: register unique viewer, load totals, and update UI smoothly ---

/// smooth count
function animateNumber(el, from, to, duration = 500) {
    if (!el) return;
    from = Number(from) || 0;
    to = Number(to) || 0;

    const start = performance.now();
    const step = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(from + (to - from) * ease);
        el.textContent = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    el.classList.add("pulse");
    setTimeout(() => el.classList.remove("pulse"), 300);
}

async function registerViewer() {
    try {
        await sb.from("viewers").upsert(
            { user_id: GUEST_ID },
            { onConflict: "user_id", ignoreDuplicates: false }
        );
    } catch (err) {
        console.warn("Viewer registration error", err);
    }
}

async function updateStats() {
    const likesRes = await sb.from("likes").select("*", { count: "exact", head: true });
    const commentsRes = await sb.from("comments").select("*", { count: "exact", head: true });
    const viewersRes = await sb.from("viewers").select("*", { count: "exact", head: true });

    const elLikes = document.getElementById("statsLikes");
    const elComments = document.getElementById("statsComments");
    const elViewers = document.getElementById("statsViewers");

    animateNumber(elLikes, Number(elLikes.dataset.value), likesRes.count || 0);
    animateNumber(elComments, Number(elComments.dataset.value), commentsRes.count || 0);
    animateNumber(elViewers, Number(elViewers.dataset.value), viewersRes.count || 0);

    elLikes.dataset.value = likesRes.count || 0;
    elComments.dataset.value = commentsRes.count || 0;
    elViewers.dataset.value = viewersRes.count || 0;
}


// load all three stats at once
async function loadAllStats() {
    if (!sb) return;

    // viewers
    const viewersRes = await sb.from('viewers').select('*', { count: 'exact', head: true });
    const viewersCount = viewersRes.count || 0;

    // likes
    const likesRes = await sb.from('likes').select('*', { count: 'exact', head: true });
    const likesCount = likesRes.count || 0;

    // comments
    const commentsRes = await sb.from('comments').select('*', { count: 'exact', head: true });
    const commentsCount = commentsRes.count || 0;

    // update UI with animations - FIXED: correct element IDs
    const viewersEl = document.getElementById('statsViewers');
    const likesEl = document.getElementById('statsLikes');
    const commentsEl = document.getElementById('statsComments');

    if (viewersEl) {
        animateNumber(viewersEl, Number(viewersEl.dataset.value || 0), viewersCount);
        viewersEl.dataset.value = viewersCount;
    }

    if (likesEl) {
        animateNumber(likesEl, Number(likesEl.dataset.value || 0), likesCount);
        likesEl.dataset.value = likesCount;
    }

    if (commentsEl) {
        animateNumber(commentsEl, Number(commentsEl.dataset.value || 0), commentsCount);
        commentsEl.dataset.value = commentsCount;
    }
}

// Extend your realtime subscription to listen for inserts on viewers/likes/comments
function subscribeStatsRealtime() {
    if (!sb) return;
    const channel = sb.channel('stats_channel');

    // viewers insert -> update count
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'viewers' }, payload => {
        const el = document.getElementById('statsViewers'); // FIXED: correct ID
        if (!el) return;
        const old = Number(el.dataset.value || 0);
        const next = old + 1;
        animateNumber(el, old, next);
        el.dataset.value = next;
    });

    // likes insert
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, payload => {
        const el = document.getElementById('statsLikes'); // FIXED: correct ID
        if (!el) return;
        const old = Number(el.dataset.value || 0);
        const next = old + 1;
        animateNumber(el, old, next);
        el.dataset.value = next;
    });

    // comments insert
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
        const el = document.getElementById('statsComments'); // FIXED: correct ID
        if (!el) return;
        const old = Number(el.dataset.value || 0);
        const next = old + 1;
        animateNumber(el, old, next);
        el.dataset.value = next;
    });

    channel.subscribe();
}
async function loadInitialData() {
    for (let i = 0; i < artworks.length; i++) {
        // load comments
        sessionComments[i] = await loadCommentsFromDB(i);

        // load like count
        const count = await fetchLikeCount(i);

        // check if this user liked it
        const { data } = await sb
            .from('likes')
            .select('id')
            .match({ artwork_index: i, user_id: GUEST_ID })
            .limit(1)
            .maybeSingle();

        if (data) sessionLikes.add(i);
    }
}

// --- Load comments for an artwork index from Supabase
async function loadCommentsFromDB(artworkIndex) {
    if (!sb) return [];
    const { data, error } = await sb
        .from('comments')
        .select('id, artwork_index, user_id, username, body, created_at')
        .eq('artwork_index', artworkIndex)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Failed to load comments:', error);
        return [];
    }
    // map to your existing comment shape: { text, ts, name }
    const comments = (data || []).map(c => ({
        text: c.body,
        ts: new Date(c.created_at).getTime(),
        name: c.username || 'Anonymous',
        id: c.id,
        user_id: c.user_id
    }));
    return comments;
}

// --- Post a comment to Supabase (and return inserted row)
async function postCommentToDB(artworkIndex, username, bodyText) {
    if (!sb) {
        // fallback to local-only behaviour
        return null;
    }
    const payload = {
        artwork_index: artworkIndex,
        user_id: GUEST_ID,
        username: username || null,
        body: bodyText
    };

    const { data, error } = await sb.from('comments').insert(payload).select().single();
    if (error) {
        console.error('Error inserting comment:', error);
        throw error;
    }
    return data;
}

// --- Toggle like (insert). We'll try to insert; if unique constraint prevents duplicate, ignore error.
// Optionally support "unlike" by deleting row if exists.
async function addLikeToDB(artworkIndex) {
    if (!sb) return null;

    const payload = { artwork_index: artworkIndex, user_id: GUEST_ID };
    // try insert
    const { data, error } = await sb.from('likes').insert(payload).select().single();
    if (error) {
        // if unique constraint violation (duplicate), it will error 23505; ignore for now
        if (error.details && error.details.includes('already exists')) {
            // already liked
            return null;
        } else {
            console.error('Error inserting like:', error);
            throw error;
        }
    }
    return data;
}

// --- Realtime subscriptions: listens for new comments and likes
function subscribeRealtime(onComment, onLike) {
    if (!sb) return;

    // Comments
    sb.channel('comments_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
            try { onComment && onComment(payload.new); } catch (e) { console.error(e); }
        })
        .subscribe();

    // Likes
    sb.channel('likes_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, payload => {
            try { onLike && onLike(payload.new); } catch (e) { console.error(e); }
        })
        .subscribe();

    // (Optionally also listen for DELETE on likes if you implement unlike)
}

/* ===========================
           Data & gallery rendering
           =========================== */
const artworks = [
    {
        title: "Uhaw sa Hustisya",
        category: "Visual Arts",
        description: "The main subject of the artwork is greed and the power of money represented through a drawing of a wealthy crocodile dressed in a suit. It explores the ongoing issue of corruption in our country, exposing the rotten ways used in “silencing” the voices of the Filipino people. It was originally made as commissioned artwork in which the artist used it as an opportunity for social advocacy and to raise awareness.",
        artist: "Inoue",
        medium: "Digital Drawing",
        category: "visual",
        year: "2025",
        type: "image",
        image: "assets/visual arts/labrador.webp"
    },
    {
        title: "Corruption in the Philippines",
        category: "Visual Arts",
        description: "Corruption in the Philippines is a drawing that reflects the grim reality of justice and morality in our country. At the center of the piece is a crocodile lavishly throwing around money, with its tail creating a hole through the broken gavel it sits on. This symbolizes the consequence of corruption, breaking the very foundation and instrument of the justice system in which ordinary people rely on.",
        artist: "Nathaniel Esplana",
        medium: "Drawing",
        category: "visual",
        year: "2025",
        type: "image",
        image: "assets/visual arts/belga.webp"
    },
    {
        title: "Lubog sa Korupsyon",
        category: "Visual Arts",
        description: "Lubog sa Korupsyon shows the conflict between two groups; one on the comfort of a throne made from wealth, while the others rise up against them amidst heavy flooding. This artwork aims to depict the reality of governance in the Philippines, highlighting how corruption among politicians leads to the suffering of the Filipino people. It serves as an eye-opener for the Filipinos to be aware of current issues and to inspire them to take part in the fight for our country.",
        artist: "Roselyn Sana",
        medium: "Digital Drawing",
        category: "visual",
        year: "2025",
        type: "image",
        image: "assets/visual arts/labrador1.webp"
    },

    {
        title: "Nakikita kita I.",
        category: "Visual Arts",
        description: "Nakikita Kita I is about a man who fights to resist two hands covering his eyes. It is meant to symbolize resistance of the oppressed against those in power, revealing the dark truth they force to hide from us. The artwork is a reflection of the artist's criticism of the very system responsible for shaping Philippine society, and how it fails to do so properly.",
        artist: "Shawn Paolo Velasco",
        medium: "Graphic Drawing",
        category: "visual",
        year: "2025",
        type: "image",
        image: "assets/visual arts/velasco.webp"
    },

    {
        title: "Katakawan",
        category: "Visual Arts",
        description: "“Katawakan” uses an image of a pig to represent the corrupt politicians in our country. This editorial cartoon criticizes their greed and calls out the two-faced actions they make. In response to the recent issue in ghost flood control projects, the artwork points out why our funds are being spent on niche projects instead of being allocated towards more relevant and progressive projects. ",
        artist: "Jad Paulo Boquiron",
        medium: "Drawing",
        category: "visual",
        year: "2025",
        type: "image",
        image: "assets/visual arts/boquiron.webp"
    },

    {
        title: "Resist, Revolt, Reclaim",
        category: "Visual Arts",
        description: "As the title suggests, this artwork pushes us to resist corruption, revolt against injustice, and reclaim what is rightfully ours. With its striking red visuals, it conveys a powerful emotion which encourages viewers to take necessary actions and not just stand idly. The piece calls for a movement that helps challenge those who abuse their power, rising against cruelty, injustice, and corruption.",
        artist: "Uriel Miguel Carbonell",
        medium: "Digital Design",
        category: "visual",
        year: "2025",
        type: "image",
        image: "assets/visual arts/carbonell.webp"
    },

    {
        title: "Buwaya sa Politiko",
        category: "Literary Arts",
        description: "Mga Buwaya sa Politika depicts important issues such as bureaucratic capitalism, nepotism, abuse of power, and the suffering of ordinary citizens through a Bicolano tigsik. It conveys the harsh reality of corruption while expressing the artist's frustration, concern for the youth and marginalized sectors, and desire for justice and reform. The poem functions as a social commentary and political critique, aiming to encourage citizens to be critical and speak out against injustice.",
        artist: "Von Justin Estayani",
        medium: "Digital Text",
        category: "literature",
        year: "2025",
        type: "image",
        image: "assets/literary arts/estayani.webp"
    },

    {
        title: "Awit ng mga Inakay",
        category: "Literary Arts",
        description: "Awit ng mga Inakay is a poem focused on the contrast between the Filipino people as birds and the mandaragit, representing those in power. This literary piece uses symbolism in depicting the current state of our society with the dynamic between birds of prey and predatory birds. It serves to call out both people in power and those who choose to stay silent despite all that happened across time, pushing us to finally face the “Mandaragit” in our country.",
        artist: "Ashley Nicole De Mesa",
        medium: "Digital Text",
        category: "literature",
        year: "2025",
        type: "image",
        image: "assets/literary arts/demesa.webp"
    },

    {
        title: "Babala may Buaya",
        category: "Literary Arts",
        description: "The acrostic poem uses the image of buayas (crocodiles) as a metaphor to reveal the hidden danger of corrupt officials in positions of power. A buaya symbolizes someone who pretends to be calm or harmless but strikes when there's something to gain, just like a crocodile waits silently before attacking. By comparing leaders to predators, the poem shows how the nation's resources are exploited while the country suffer.",
        artist: "Gideon Moses Isidro",
        medium: "Digital Text",
        category: "literature",
        year: "2025",
        type: "image",
        image: "assets/literary arts/isidro.webp"
    },

    {
        title: "The Battle Against Corruption: Bringing Back the Light",
        category: "Literary Arts",
        description: "The acrostic poem uses the image of buayas (crocodiles) as a metaphor to reveal the hidden danger of corrupt officials in positions of power. A buaya symbolizes someone who pretends to be calm or harmless but strikes when there's something to gain, just like a crocodile waits silently before attacking. By comparing leaders to predators, the poem shows how the nation's resources are exploited while the country suffer.",
        artist: "Yzan France Ramos",
        medium: "Digital Text",
        category: "literature",
        year: "2025",
        image: "assets/literary arts/ramos.webp"
    },

    {
        title: "The Divided Flower",
        category: "Applied Arts",
        description: "This symbolic artwork of a flower represents two sides of government, one side being vibrant and thriving, the other showing decay and corruption. “The Divided Flower” shows that even something as pure as a flower can be corrupted—just as any system, no matter how beautiful, can be flawed when exploited. The art not only acts as decoration but also raises awareness through the artist's personal thoughts on leadership, honesty, and corruption.",
        artist: "Joshua Napay",
        medium: "Crafts",
        category: "applied",
        year: "2025",
        type: "image",
        image: "assets/applied arts/napay.webp"
    },

    {
        title: "Nakikita kita II. ",
        category: "Applied Arts",
        description: "The artwork is focused on a girl whose eyes are covered with hands on top of her blindfolds. “Nakikita Kita II” tells us a message about seeing through the tricks, lies, and deception of the corrupt despite their elaborate attempts in keeping us within their grasp. It is a form of personal expression for the artist, transforming a piece of clothing into a means of spreading awareness against corruption and the people who oppress us.",
        artist: "Shawn Paolo Velasco",
        medium: "T-Shirt Print",
        category: "applied",
        year: "2025",
        type: "image",
        image: "assets/applied arts/velasco1.webp"
    },

    {
        title: "Barong ng Buwaya",
        category: "Applied Arts",
        description: "The crocodiles in barong Tagalog represent corrupt officials hiding behind respectability, revealing how abuse of power leads to poverty and public suffering.",
        artist: "Jomari Tan",
        medium: "T-Shirt Print",
        category: "applied",
        year: "2025",
        type: "image",
        image: "assets/applied arts/salvino1.webp"
    },

    {
        title: "Ginintuang Kasinungalingan",
        category: "Applied Arts",
        description: " As an applied artwork, it serves as wearable advocacy that expresses political beliefs, spreads social awareness, and transforms clothing into a moving canvas for protest and dialogue.",
        artist: "Jomari Tan",
        medium: "T-Shirt Print",
        category: "applied",
        year: "2025",
        type: "image",
        image: "assets/applied arts/salvino2.webp"
    },

    {
        title: "Baon ng Buwaya",
        category: "Applied Arts",
        description: "The artwork addresses political corruption in the Philippines through an allegorical design that uses crocodiles as symbols of greed, power abuse, and exploitation",
        artist: "Jomari Tan",
        medium: "T-Shirt Print",
        category: "applied",
        year: "2025",
        type: "image",
        image: "assets/applied arts/salvino.webp"
    },
    {
        title: "SC2FLOODED FUTURE",
        category: "Performance Arts",
        description: "SC2FLOODED FUTURE” is a dance that embodies the collective disappointment of our society whose trust was broken by empty promises in flood-control projects. Through movements, this artwork shows the reality faced by many Filipinos against abuse, corruption, and negligence of those in power. It serves as a reminder to uphold justice and hold accountabole those who have given our country neither compassion nor responsibility.",
        artist: "SC2F",
        medium: "Dance",
        category: "performance",
        year: "2025",
        type: "video",
        videoType: "googledrive",
        videoId: "1zy14utgXxR7jnuF8Y7tLPVPoNLzIJozc", // Extract this from your Google Drive link
        thumbnail: "assets/performance arts/SC2FLOODED.webp"
    },
    {
        title: "Awit ng ibon",
        category: "Performance Arts",
        description: "Awit ng Ibon” is a performance artwork depicting the idea of striving for peace, only to never reach it because of the lack of freedom. This song tells us that peace will never be achieved if we do not stand up for our freedom and break free from the restrictions brought by the corrupt system. The artist highlights the importance of striving to be free, by standing against oppression and fighting for what is rightfully ours.",
        artist: "Andrey Sto Domingo , ft. Jonas Baes(Cover)",
        medium: "Music",
        category: "performance",
        year: "1979",
        type: "video",
        videoType: "googledrive",
        videoId: "1HLdyUrCdmd5U3RNn2Q8c4LDo9-8ZriO7", // Extract this from your Google Drive link
        thumbnail: "assets/performance arts/Awitngibon.webp "
    }

];

const grid = document.getElementById('galleryGrid');

function truncateText(text, maxChars, reserve = 30) {
    // text: the string
    // maxChars: maximum visible chars including '...more'
    // reserve: chars to reserve for '...more' (default 10)

    if (!text || typeof text !== 'string') return { short: '', long: false };
    if (text.length <= maxChars) return { short: text, long: false };

    // cut to maxChars - reserve so we have room for '...more'
    let cut = text.slice(0, maxChars - reserve);

    // backup to last space to avoid breaking words
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > 0) {
        cut = cut.slice(0, lastSpace);
    }

    // trim trailing punctuation/space
    cut = cut.replace(/[\s\.,;–—:]+$/, "");

    return { short: cut, long: true };
}
function makeCard(a, i) {
    const el = document.createElement('article');
    el.className = 'card';
    el.dataset.index = i;
    el.dataset.category = a.category;
    el.tabIndex = 0;

    // Truncate description for card view
    const truncated = truncateText(a.description || '', 160);
    const descHtml = truncated.long
        ? `${truncated.short}<span class="dots-and-more">...<span class="card-more" role="button" tabindex="0" aria-label="Read more">more</span></span>`
        : `${truncated.short}`;

    // Determine media source
    let mediaHTML = '';
    if (a.type === 'video') {
        // Show thumbnail with play button overlay for videos
        const thumbnail = a.thumbnail || 'https://images.unsplash.com/photo-1574267432644-f7eeb86d49a4?w=1200&q=80';
        mediaHTML = `
            <img src="${thumbnail}" alt="${a.title}">
            <div class="video-play-overlay">
                <svg viewBox="0 0 24 24" width="60" height="60" fill="white">
                    <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.7)" stroke="white" stroke-width="1.5"/>
                    <path d="M9 8l8 4-8 4V8z" fill="white"/>
                </svg>
            </div>
        `;
    } else {
        // Regular image
        mediaHTML = `<img src="${a.image}" alt="${a.title}">`;
    }

    el.innerHTML = `
        <div class="thumb">
            <div class="art-category-badge">${a.category}</div>
            ${mediaHTML}
        </div>

        <div class="card-body">
            <div class="title">${truncateText(a.title || '', 42).short}</div>
            <div class="artist-name">by ${a.artist || ''}</div>

            <div class="desc">
                ${descHtml}
            </div>

            <div class="meta"><span>${a.medium || ''}</span><span> · ${a.year || ''}</span></div>
        </div>
    `;

    // Card click opens modal
    el.addEventListener('click', async (e) => {
        if (e.target.closest('.card-more')) return;
        loadModalData(i);
        openModal(i);
    });

    return el;
}


window.addEventListener("load", async () => {
    updateLoadingProgress(20, "Loading media...");
    await preloadAllMedia();

    updateLoadingProgress(40, "Connecting to database...");
    await registerViewer();

    updateLoadingProgress(60, "Loading statistics...");
    await updateStats();

    updateLoadingProgress(80, "Rendering gallery...");
    await loadInitialData();

    renderAll();

    updateLoadingProgress(100, "Ready!");
});





function renderAll() {
    grid.innerHTML = '';
    artworks.forEach((a, i) => grid.appendChild(makeCard(a, i)));
}

renderAll();
// Convert DB row to your UI shape
function dbCommentToUI(c) {
    return {
        text: c.body,
        ts: new Date(c.created_at).getTime(),
        name: c.username || 'Anonymous'
    };
}

// Fetch like count
async function fetchLikeCount(i) {
    const { count, error } = await sb
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("artwork_index", i);

    if (error) {
        console.error("fetchLikeCount error", error);
        return 0;
    }

    return count || 0;
}


// Realtime handlers
function onRemoteComment(newRow) {
    const idx = newRow.artwork_index;
    sessionComments[idx] = sessionComments[idx] || [];

    // Remove temporary comment if exists
    sessionComments[idx] = sessionComments[idx].filter(c => !String(c.id).startsWith("temp-"));

    // Prevent double insert (if somehow already added)
    const exists = sessionComments[idx].some(c => c.id === newRow.id);
    if (exists) return;

    // Add real comment
    sessionComments[idx].push(dbCommentToUI(newRow));

    if (currentIndex === idx) renderComments(idx);
}



function onRemoteLike(newRow) {
    if (currentIndex !== null) {
        fetchLikeCount(currentIndex).then(count => {
            modalLikeCount.textContent = `${count} like${count !== 1 ? 's' : ''}`;
        });
    }
}

// Subscribe to realtime
subscribeRealtime(onRemoteComment, onRemoteLike);

// Load modal data
async function loadModalData(i) {
    sessionComments[i] = await loadCommentsFromDB(i);

    const count = await fetchLikeCount(i);
    modalLikeCount.textContent = `${count} like${count !== 1 ? 's' : ''}`;

    const { data: userLike } = await sb
        .from('likes')
        .select('id')
        .match({ artwork_index: i, user_id: GUEST_ID })
        .limit(1)
        .maybeSingle();

    if (userLike) sessionLikes.add(i);
    else sessionLikes.delete(i);
}

// allow clicking the small 'more' inside card to open the modal without letting the click bubble incorrectly
// delegate 'more' clicks from grid
grid.addEventListener('click', async (e) => {
    const more = e.target.closest('.card-more');
    if (!more) return;
    e.stopPropagation();
    const card = more.closest('.card');
    if (!card) return;

    const idx = Number(card.dataset.index);
    if (Number.isNaN(idx)) return;

    loadModalData(idx);   // <--- IMPORTANT FIX
    openModal(idx);             // <--- open AFTER data is loaded
});


// keyboard accessibility for .card-more (space/enter)
grid.addEventListener('keydown', (e) => {
    const focused = document.activeElement;
    if (focused && focused.classList && focused.classList.contains('card-more')) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const card = focused.closest('.card');
            const idx = Number(card.dataset.index);
            if (!Number.isNaN(idx)) openModal(idx);
        }
    }
});

function disableCardTransitions() {
    document.querySelectorAll(".card").forEach(card => {
        card.style.transition = "none";
    });
}

function enableCardTransitions() {
    document.querySelectorAll(".card").forEach(card => {
        card.style.transition = "";
    });
}

function applyFilter(filter) {
    disableCardTransitions()
    const cards = Array.from(grid.children);

    // Instant hide/show without animation delay
    cards.forEach((c, index) => {
        const matches = (filter === 'all') || c.dataset.category === filter;

        if (matches) {
            enableCardTransitions()
            c.style.display = "flex";
            // Reset and reapply animation instantly
            c.style.animation = 'none';
            c.offsetHeight; // Force reflow
            c.style.animation = `cardFadeIn 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) forwards ${index * 0.03}s`;
        } else {
            c.style.display = "none";
        }
    });
}

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    applyFilter(t.dataset.filter || 'all');
}));

/* ===========================
   Modal & interactions (V3)
   =========================== */
const sessionCommented = new Set();
const modal = document.getElementById('modal');
const modalLeft = document.getElementById('modalLeft');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const closeModalBtn = document.getElementById('closeModal');
const modalDescription = document.getElementById('modalDescription');
const likeBtn = document.getElementById('likeBtn');
const shareBtn = document.getElementById('shareBtn');
const focusComment = document.getElementById('focusComment');
const commentsArea = document.getElementById('commentsArea');
const commentInput = document.getElementById('commentInput');
const postComment = document.getElementById('postComment');
const modalLikeCount = document.getElementById('modalLikeCount');


let currentIndex = null;
const sessionComments = {};
const sessionLikes = new Set();

function openModal(i) {
    const a = artworks[i];
    currentIndex = i;

    // Clear previous media
    modalImg.style.display = 'none';
    const existingVideo = modalLeft.querySelector('.video-container');
    if (existingVideo) {
        existingVideo.remove();
    }

    // Handle video or image
    if (a.type === 'video') {
        modalImg.style.display = 'none';

        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';

        let videoHTML = '';

        if (a.videoType === 'youtube') {
            videoHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${a.videoId}?autoplay=0&rel=0&modestbranding=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    title="${a.title}">
                </iframe>
            `;
        } else if (a.videoType === 'vimeo') {
            videoHTML = `
                <iframe 
                    src="https://player.vimeo.com/video/${a.videoId}?title=0&byline=0&portrait=0" 
                    frameborder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen
                    title="${a.title}">
                </iframe>
            `;
        } else if (a.videoType === 'googledrive') {
            videoHTML = `
                <iframe 
                    src="https://drive.google.com/file/d/${a.videoId}/preview" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen
                    title="${a.title}">
                </iframe>
            `;
        } else if (a.videoType === 'direct') {
            videoHTML = `
                <video controls controlsList="nodownload" preload="metadata">
                    <source src="${a.videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        }

        videoContainer.innerHTML = videoHTML;
        modalLeft.insertBefore(videoContainer, modalLeft.firstChild);
    } else {
        // Regular image
        modalImg.style.display = 'block';
        modalImg.src = a.image || '';
        modalImg.alt = a.title || '';
    }

    modalTitle.textContent = a.title || '';

    const full = a.description || '';
    const short = truncateText(full, 150, 30);

    modalDesc.innerHTML = '';
    modalDesc.classList.remove('pushed-down');

    if (short.long) {
        const shortSpan = document.createElement('span');
        shortSpan.className = 'modal-short';
        shortSpan.textContent = short.short + '...';

        const moreBtn = document.createElement('span');
        moreBtn.className = 'modal-more';
        moreBtn.textContent = 'more';
        moreBtn.role = 'button';
        moreBtn.tabIndex = 0;

        const fullSpan = document.createElement('span');
        fullSpan.className = 'modal-full';
        fullSpan.style.display = 'none';
        fullSpan.textContent = full;

        modalDesc.appendChild(shortSpan);
        modalDesc.appendChild(moreBtn);
        modalDesc.appendChild(fullSpan);

        const toggle = () => {
            const isHidden = fullSpan.style.display === 'none' || fullSpan.style.display === '';
            if (isHidden) {
                fullSpan.style.display = 'inline';
                shortSpan.style.display = 'none';
                moreBtn.textContent = 'show less';
                modalDesc.classList.add('expanded');
                if (fullSpan.nextSibling !== moreBtn) {
                    fullSpan.parentNode.insertBefore(moreBtn, fullSpan.nextSibling);
                }
            } else {
                fullSpan.style.display = 'none';
                shortSpan.style.display = 'inline';
                moreBtn.textContent = 'more';
                modalDesc.classList.remove('expanded');
                if (shortSpan.nextSibling !== moreBtn) {
                    shortSpan.parentNode.insertBefore(moreBtn, shortSpan.nextSibling);
                }
            }
        };

        moreBtn.onclick = toggle;
        moreBtn.onkeydown = (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                toggle();
            }
        };
    } else {
        modalDesc.textContent = full;
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.querySelector('main').style.overflow = 'hidden';
    modalLikeCount.textContent = "- likes";

    updateLikeUI();
    renderComments(i);

    const commentsActive = sessionCommented.has(i);
    const addCommentSection = document.querySelector('.add-comment');

    if (commentsActive) {
        modalDescription.classList.add('active');
        document.querySelector('.modal-card').classList.add('comments-active');
        setTimeout(() => {
            commentsArea.classList.add('active');
            addCommentSection.classList.add('active');
        }, 50);
    } else {
        modalDescription.classList.remove('active');
        document.querySelector('.modal-card').classList.remove('comments-active');
        commentsArea.classList.remove('active');
        addCommentSection.classList.remove('active');
    }
}




function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.querySelector('main').style.overflow = 'auto';

    // Stop any playing videos
    const videoContainer = modalLeft.querySelector('.video-container');
    if (videoContainer) {
        const iframe = videoContainer.querySelector('iframe');
        if (iframe) {
            // Reset iframe src to stop video
            const src = iframe.src;
            iframe.src = '';
            iframe.src = src;
        }
        const video = videoContainer.querySelector('video');
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
    }

    // Reset comment state when closing modal
    if (currentIndex !== null) {
        sessionCommented.delete(currentIndex);
        updateCommentUI();

        const addCommentSection = document.querySelector('.add-comment');
        modalDescription.classList.remove('active');
        document.querySelector('.modal-card').classList.remove('comments-active');
        commentsArea.classList.remove('active');
        addCommentSection.classList.remove('active');
    }

    currentIndex = null;
}
// Mobile: Touch anywhere on modal-left to close comments
(function setupMobileImageTapToCloseComments() {
    let tapStartY = 0;
    let wasDragging = false;

    function handleTapStart(e) {
        tapStartY = e.touches[0].clientY;
        wasDragging = false;
    }

    function handleTapMove(e) {
        const currentY = e.touches[0].clientY;
        if (Math.abs(currentY - tapStartY) > 10) {
            wasDragging = true;
        }
    }

    function closeCommentsOnMobile(e) {
        // Only work on mobile
        if (window.innerWidth > 700) return;

        // Don't close if this was a drag gesture
        if (wasDragging) return;

        // Don't close if tapping on video controls
        if (e.target.closest('.video-container')) return;

        e.stopPropagation();

        // Only close comments if they're open
        if (currentIndex !== null && sessionCommented.has(currentIndex)) {
            sessionCommented.delete(currentIndex);
            updateCommentUI();

            const addCommentSection = document.querySelector('.add-comment');
            modalDescription.classList.remove('active');
            document.querySelector('.modal-card').classList.remove('comments-active');
            commentsArea.classList.remove('active');
            addCommentSection.classList.remove('active');
        }
    }

    modalLeft.addEventListener('touchstart', handleTapStart, { passive: true });
    modalLeft.addEventListener('touchmove', handleTapMove, { passive: true });
    modalLeft.addEventListener('touchend', closeCommentsOnMobile);

    modalImg.addEventListener('touchstart', handleTapStart, { passive: true });
    modalImg.addEventListener('touchmove', handleTapMove, { passive: true });
    modalImg.addEventListener('touchend', closeCommentsOnMobile);
})();

closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
modalImg.addEventListener('click', (e) => { e.stopPropagation(); });

(function setupMobileDrag() {
    if (window.innerWidth > 700) return; // Only for mobile

    const modalRight = document.querySelector('.modal-right');
    const modalRightContent = document.querySelector('.modal-right-content');
    const modalCard = document.querySelector('.modal-card');
    const addCommentSection = document.querySelector('.add-comment');

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let initialScroll = 0;
    let wasCommentOpen = false;

    function handleTouchStart(e) {
        const touch = e.touches[0];
        const rect = modalRight.getBoundingClientRect();

        // Check if touch is on scrollable elements that need scrolling
        const target = e.target;
        const commentsEl = target.closest('.comments');
        const modalDescEl = target.closest('.modal-desc');
        const inputEl = target.closest('.add-comment input');

        // Allow scrolling in comments if it has scrollable content
        if (commentsEl && commentsEl.scrollHeight > commentsEl.clientHeight) {
            return;
        }

        // Allow scrolling in modal-desc if it has scrollable content
        if (modalDescEl && modalDescEl.scrollHeight > modalDescEl.clientHeight) {
            return;
        }

        // Don't drag when typing in input
        if (inputEl) return;

        startY = touch.clientY;
        currentY = startY;
        isDragging = true;
        initialScroll = contentScroll;
        wasCommentOpen = currentIndex !== null && sessionCommented.has(currentIndex);
        modalRight.classList.add('dragging');

        // Remove transitions during drag for smooth following
        modalRight.style.transition = 'none';
        modalRightContent.style.transition = 'none';
    }

    function handleTouchMove(e) {
        if (!isDragging) return;

        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // Dragging down
        if (deltaY > 0) {
            // If comments are open, close them by dragging down
            if (wasCommentOpen) {
                const resistance = Math.min(deltaY * 0.5, 200);
                modalRight.style.transform = `translateY(${resistance}px)`;
                e.preventDefault();
            } else {
                // Normal drag down (close modal)
                const resistance = Math.min(deltaY * 0.5, 200);
                modalRight.style.transform = `translateY(${resistance}px)`;
                e.preventDefault();
            }
        }
        // Dragging up - reveal comments
        else if (deltaY < 0 && initialScroll === 0) {
            const dragDistance = Math.abs(deltaY);
            const resistance = Math.min(dragDistance * 0.5, 300);
            modalRight.style.transform = `translateY(-${resistance}px)`;
            e.preventDefault();
        }
    }

    function handleTouchEnd(e) {
        if (!isDragging) return;

        const deltaY = currentY - startY;
        isDragging = false;
        modalRight.classList.remove('dragging');

        // Re-enable transitions for smooth snap with longer duration
        modalRight.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)';

        // Swipe down > 120px = close modal (if comments weren't open)
        if (deltaY > 120 && !wasCommentOpen) {
            // Animate out before closing
            modalRight.style.transform = 'translateY(100%)';
            setTimeout(() => {
                modalRight.style.transform = '';
                modalRight.style.transition = '';
                closeModal();
            }, 500);
        }
        // Swipe down > 100px = close comments (if comments were open)
        else if (deltaY > 100 && wasCommentOpen) {
            // Close comments - snap back to closed position
            sessionCommented.delete(currentIndex);
            updateCommentUI();

            modalDescription.classList.remove('active');
            modalCard.classList.remove('comments-active');
            commentsArea.classList.remove('active');
            addCommentSection.classList.remove('active');

            modalRight.style.transform = 'translateY(0)';
        }
        // Swipe up > 100px = fully open comments (reduced threshold for easier trigger)
        else if (deltaY < -100 && currentIndex !== null) {
            // Add to session and update UI
            sessionCommented.add(currentIndex);
            updateCommentUI();

            // Show comment sections
            modalDescription.classList.add('active');
            modalCard.classList.add('comments-active');
            commentsArea.classList.add('active');
            addCommentSection.classList.add('active');

            // Slide up to reveal comments
            modalRight.style.transform = 'translateY(0px)';

            // Focus input after animation
            setTimeout(() => {
                commentInput.focus();
            }, 550);
        }
        // Not enough drag - snap back
        else {
            if (wasCommentOpen || sessionCommented.has(currentIndex)) {
                // Snap to open position showing comments
                modalRight.style.transform = 'translateY(0px)';
            } else {
                // Snap to closed position
                modalRight.style.transform = 'translateY(0)';

                modalDescription.classList.remove('active');
                modalCard.classList.remove('comments-active');
                commentsArea.classList.remove('active');
                addCommentSection.classList.remove('active');
            }
        }

        // Clean up after transition
        setTimeout(() => {
            modalRight.style.transition = '';
        }, 500);

        currentY = 0;
        startY = 0;
    }

    modalRight.addEventListener('touchstart', handleTouchStart, { passive: true });
    modalRight.addEventListener('touchmove', handleTouchMove, { passive: false });
    modalRight.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Re-initialize on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 700) {
            modalRight.removeEventListener('touchstart', handleTouchStart);
            modalRight.removeEventListener('touchmove', handleTouchMove);
            modalRight.removeEventListener('touchend', handleTouchEnd);
        }
    });
})();

(function setupMobileDragLeft() {
    if (window.innerWidth > 700) return; // Only for mobile

    const modalLeft = document.querySelector('.modal-left');
    const modal = document.getElementById('modal');

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let initialTransform = 0;

    function handleTouchStart(e) {
        // Don't drag if tapping on video
        if (e.target.closest('.video-container')) return;

        // Don't drag if modal isn't open
        if (!modal.classList.contains('open')) return;

        const touch = e.touches[0];
        startY = touch.clientY;
        currentY = startY;
        isDragging = true;
        initialTransform = 0;

        // Remove all transitions for smooth dragging
        modal.style.transition = 'none';

        console.log('Drag started at:', startY); // Debug log
    }

    function handleTouchMove(e) {
        if (!isDragging) return;

        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        console.log('Dragging deltaY:', deltaY); // Debug log

        if (deltaY > 0) {
            // Show visual drag with resistance
            const resistance = Math.min(deltaY * 0.6, window.innerHeight * 0.8);
            modal.style.transform = `translateY(${resistance}px)`;
            e.preventDefault();
        }
    }

    function handleTouchEnd() {
        if (!isDragging) return;

        const deltaY = currentY - startY;
        isDragging = false;

        console.log('Drag ended, deltaY:', deltaY); // Debug log

        // Re-enable transitions for snap animation
        modal.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.4s ease';

        if (deltaY > 100) {
            // Close modal if dragged far enough
            modal.style.transform = 'translateY(100vh)';
            modal.style.opacity = '0';

            setTimeout(() => {
                modal.style.transform = '';
                modal.style.transition = '';
                modal.style.opacity = '';
                closeModal();
            }, 400);
        } else {
            // Snap back if not enough drag
            modal.style.transform = 'translateY(0)';

            setTimeout(() => {
                modal.style.transition = '';
            }, 400);
        }

        currentY = 0;
        startY = 0;
    }

    modalLeft.addEventListener('touchstart', handleTouchStart, { passive: true });
    modalLeft.addEventListener('touchmove', handleTouchMove, { passive: false });
    modalLeft.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Re-initialize on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 700) {
            modalLeft.removeEventListener('touchstart', handleTouchStart);
            modalLeft.removeEventListener('touchmove', handleTouchMove);
            modalLeft.removeEventListener('touchend', handleTouchEnd);
        }
    });
})();




// Track how many times the user tried to unlike
let unloveAttempts = 0;

const unloveMessages = [
    "you can't truly unlove someone right?",
    "hmm, trust me you can't unlove some...thing",
    "really? you can't unlove someone, you just get used to it",
    "come on… your heart knows the truth",
    "nope. nice try. love sticks."
];
// 🎉 CUSTOM POPUP (replaces alert)
// small helper to show the custom popup (restarts animation by toggling class)
function showPopup(msg) {
    const popup = document.getElementById("popup");
    if (!popup) {
        alert(msg);
        return;
    }

    // Add emoji/icon based on message
    const isLike = msg.includes('Liked') || msg.includes('❤️');
    popup.className = 'custom-popup' + (isLike ? ' liked' : '');
    popup.textContent = msg;

    // Restart animation
    popup.classList.remove("show");
    void popup.offsetWidth;
    popup.classList.add("show");

    // Auto-hide after 2s
    clearTimeout(popup._hideTimeout);
    popup._hideTimeout = setTimeout(() => {
        popup.classList.remove("show");
    }, 2000);
}
// Circle popup for unlike attempts (like loading screen)
function showCirclePopup(msg) {
    // Remove existing popup if any
    const existingPopup = document.getElementById("circlePopup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create circle popup
    const popup = document.createElement('div');
    popup.id = 'circlePopup';
    popup.className = 'circle-popup';
    popup.innerHTML = `
        <div class="circle-popup-content">
            <div class="circle-popup-rings">
                <div class="popup-ring"></div>
                <div class="popup-ring"></div>
                <div class="popup-ring"></div>
            </div>
            <div class="circle-popup-text">${msg}</div>
        </div>
    `;

    document.body.appendChild(popup);

    // Show animation
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);

    // Auto-hide after 2.5s
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => {
            popup.remove();
        }, 400);
    }, 2500);
}
// updated like button behavior (keeps DB insert/unique-constraint protection)
likeBtn.addEventListener("click", async () => {
    if (currentIndex === null) return;

    const isLiked = sessionLikes.has(currentIndex);

    try {
        if (isLiked) {
            // User tried to unlike - show circle animation with message
            unloveAttempts++;
            const msg = unloveMessages[Math.floor(Math.random() * unloveMessages.length)];

            // Show circle popup instead of regular popup
            showCirclePopup(msg);

            // Add shake class then remove after animation
            likeBtn.classList.add("shake");
            setTimeout(() => likeBtn.classList.remove("shake"), 380);

            // Ensure the 'liked' visual state remains
            likeBtn.classList.add("liked");
        } else {
            // Real LIKE - NO POPUP, just visual feedback
            await addLikeToDB(currentIndex);
            sessionLikes.add(currentIndex);
            unloveAttempts = 0;

            // Visual feedback only - no popup
            likeBtn.classList.add("liked");

            // Small scale pop animation
            likeBtn.style.transition = "transform .18s ease";
            likeBtn.style.transform = "scale(1.18)";
            setTimeout(() => { likeBtn.style.transform = ""; }, 180);
        }

        // Refresh like count and aria state
        await updateLikeUI();

    } catch (err) {
        console.error("Like toggle failed:", err);
        showPopup("Something went wrong.");
    }
});


async function updateLikeUI() {
    if (currentIndex === null) return;

    const liked = sessionLikes.has(currentIndex);

    // Button visuals
    likeBtn.classList.toggle("liked", liked);
    likeBtn.classList.toggle("active", liked);
    likeBtn.setAttribute("aria-pressed", liked);

    // Get real count from Supabase
    const count = await fetchLikeCount(currentIndex);

    // Update UI text
    modalLikeCount.textContent = `${count} like${count !== 1 ? "s" : ""}`;
}



// Share button: copy link to clipboard (hash + index)
shareBtn.addEventListener('click', async () => {
    if (currentIndex === null) return;
    const url = location.href.split('#')[0] + '#art-' + currentIndex;

    const svg = shareBtn.querySelector('svg');
    const originalHTML = svg.outerHTML;

    try {
        await navigator.clipboard.writeText(url);

        // Replace with checkmark
        svg.outerHTML = `
            <svg class="icon-share active" viewBox="0 0 24 24" width="28" height="28">
                <path fill="currentColor" d="M20 6L9 17l-5-5 2-2 3 3 9-9z"/>
            </svg>`;

        const originalTitle = shareBtn.title;
        shareBtn.title = 'Nakopya na';

        // Reset after 1.5 seconds
        setTimeout(() => {
            const currentSvg = shareBtn.querySelector('svg');
            if (currentSvg) {
                currentSvg.outerHTML = originalHTML;
            }
            shareBtn.title = originalTitle;
        }, 1500);
    } catch (e) {
        alert('Hindi makopya - narito ang link: ' + url);
    }
});

// Comment button behavior (toggle focus/highlight)
// Comment button behavior (toggle focus/highlight)
focusComment.addEventListener('click', () => {
    if (currentIndex === null) return;

    const addCommentSection = document.querySelector('.add-comment');
    const modalRight = document.querySelector('.modal-right');

    if (sessionCommented.has(currentIndex)) {
        // Close comments
        sessionCommented.delete(currentIndex);
        updateCommentUI();

        modalDescription.classList.remove('active');
        document.querySelector('.modal-card').classList.remove('comments-active');
        commentsArea.classList.remove('active');
        addCommentSection.classList.remove('active');

        // Smooth animation back to closed position on mobile
        if (window.innerWidth <= 700) {
            modalRight.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)';
            modalRight.style.transform = 'translateY(0)';
            setTimeout(() => {
                modalRight.style.transition = '';
            }, 500);
        }
    } else {
        // Open comments
        sessionCommented.add(currentIndex);
        updateCommentUI();

        modalDescription.classList.add('active');
        document.querySelector('.modal-card').classList.add('comments-active');

        setTimeout(() => {
            commentsArea.classList.add('active');
            addCommentSection.classList.add('active');

            // Smooth animation to reveal comments on mobile
            if (window.innerWidth <= 700) {
                modalRight.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)';
                modalRight.style.transform = 'translateY(0px)';
                setTimeout(() => {
                    modalRight.style.transition = '';
                }, 500);
            }
        }, 50);

        // Focus input after animation completes
        setTimeout(() => {
            commentInput.focus();
        }, 600);
    }
});

function updateCommentUI() {
    const commented = currentIndex !== null && sessionCommented.has(currentIndex);
    const commentIcon = focusComment.querySelector('svg');
    if (commentIcon) {
        commentIcon.classList.toggle('active', commented);
    }
    focusComment.classList.toggle('active', commented);
    focusComment.setAttribute('aria-pressed', String(Boolean(commented)));
}

/* ===========================
   Comments engine (V3)
   =========================== */
// store comments as objects: { text, ts, name }
function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 10) return 'just now';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24); return `${d}d`;
}

function createCommentNode(c) {
    const row = document.createElement('div');
    row.className = 'comment-row';

    const body = document.createElement('div');
    body.className = 'comment-body';

    const meta = document.createElement('div');
    meta.className = 'comment-meta';

    const u = document.createElement('span');
    u.className = 'u';
    u.textContent = c.name || 'Anonymous';

    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = timeAgo(c.ts);

    meta.appendChild(u);
    meta.appendChild(time);

    const text = document.createElement('div');
    text.className = 'comment-text';
    text.textContent = c.text;

    body.appendChild(meta);
    body.appendChild(text);

    row.appendChild(body);

    return { row, timeElem: time };
}

function renderComments(index) {
    const list = sessionComments[index] || [];
    commentsArea.innerHTML = '';
    if (!list.length) {
        const placeholder = document.createElement('div');
        placeholder.className = 'comment-row';
        placeholder.style.opacity = 1; // show immediately

        const b = document.createElement('div'); b.className = 'comment-body';
        const meta = document.createElement('div'); meta.className = 'comment-meta';
        const u = document.createElement('span'); u.className = 'u'; u.textContent = 'Anonymous';
        const time = document.createElement('span'); time.className = 'time'; time.textContent = '';
        meta.appendChild(u); meta.appendChild(time);

        const txt = document.createElement('div'); txt.className = 'comment-text';
        txt.textContent = 'No comments yet - you go ahead and leave one first.';

        b.appendChild(meta); b.appendChild(txt);
        placeholder.appendChild(b);

        commentsArea.appendChild(placeholder);
        return;
    }


    list.forEach(c => {
        const { row, timeElem } = createCommentNode(c);
        commentsArea.appendChild(row);
        // live update time every 30s
        setInterval(() => { timeElem.textContent = timeAgo(c.ts); }, 30000);
    });
    // scroll to bottom
    commentsArea.scrollTop = commentsArea.scrollHeight;
}

postComment.addEventListener('click', async () => {
    const txt = commentInput.value.trim();
    if (!txt || currentIndex === null) return;

    // Get username and avatar from localStorage
    let username = localStorage.getItem('guest_display_name_v1') || 'Anonymous';
    let avatar = localStorage.getItem('guest_avatar_v1') || '👤';

    // Ensure Anonymous users have proper display
    if (!username || username === 'null') {
        username = 'Anonymous';
    }

    // Optimistic UI: update local session immediately
    sessionComments[currentIndex] = sessionComments[currentIndex] || [];
    const tempId = "temp-" + Math.random().toString(36).slice(2);
    const obj = { id: tempId, text: txt, ts: Date.now(), name: username, avatar: avatar };
    sessionComments[currentIndex].push(obj);
    sessionCommented.add(currentIndex);
    updateCommentUI();
    commentInput.value = '';
    renderComments(currentIndex);

    // Persist to Supabase
    try {
        if (sb) {
            await postCommentToDB(currentIndex, username, txt);
        }
    } catch (err) {
        console.error('Failed to save comment to DB', err);
    }
});


commentInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); postComment.click(); } });

// initial render (empty)
// renderComments will be called on modal open

/* ===========================
   Scroll & nav behavior
   =========================== */
const main = document.querySelector('main');
const topNav = document.getElementById('topNav');
const hero = document.getElementById('hero');
const nextSection = document.getElementById('collections');

const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // Hero visible at least 25% → hide nav
        if (entry.isIntersecting && entry.intersectionRatio > 0.25) {
            topNav.classList.add('hidden');
        } else {
            topNav.classList.remove('hidden');
        }
    });
}, {
    root: main,
    threshold: [0, 0.15, 0.25, 0.5, 1]
});

obs.observe(hero);


obs.observe(hero);

// Nav scroll detection
main.addEventListener('scroll', () => {
    if (main.scrollTop > 50) {
        topNav.classList.add('scrolled');
    } else {
        topNav.classList.remove('scrolled');
    }
});
// Hero -> guided scroll to next (wheel/touch are attached to main)
let locking = false;

function lockScrollToNext() {
    if (locking) return;
    if (main.scrollTop > 40) return;
    locking = true;
    const heroInner = document.getElementById('homeSection');
    heroInner.classList.add('animated');
    topNav.classList.add('hidden');
    nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
        locking = false;
        heroInner.classList.remove('animated');
    }, 900);
}

main.addEventListener('wheel', (e) => {
    if (main.scrollTop > 60) return;
    if (Math.abs(e.deltaY) < 6) return;
    if (e.deltaY > 0) {
        e.preventDefault();
        lockScrollToNext();
    }
}, { passive: false });

let touchStartY = null;
main.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
main.addEventListener('touchend', e => {
    if (!touchStartY) return;
    const dy = touchStartY - (e.changedTouches[0].clientY);
    if (main.scrollTop <= 60 && dy > 40) lockScrollToNext();
    touchStartY = null;
}, { passive: true });

document.getElementById('discoverBtn').addEventListener('click', () => lockScrollToNext());

/* ===========================
   Hero frame fullscreen
   =========================== */
const heroFrame = document.getElementById('heroFrame');
const heroFrameOverlay = document.getElementById('heroFrameOverlay');
const heroFrameFullImg = document.getElementById('heroFrameFullImg');
const heroImg = heroFrame.querySelector('img');

// Add spinning animation that stops after 60 seconds
if (heroFrame) {
    console.log('Starting hero frame spin');
    heroFrame.classList.add('spinning');
    setTimeout(() => {
        console.log('Stopping hero frame spin');
        heroFrame.classList.remove('spinning');
    }, 60000); // 60 seconds
} else {
    console.error('heroFrame element not found');
}
heroFrame.addEventListener('click', () => {
    heroFrameFullImg.src = heroImg.src;
    heroFrameFullImg.alt = heroImg.alt;
    heroFrameOverlay.classList.add('open');
    heroFrameOverlay.setAttribute('aria-hidden', 'false');
    document.querySelector('main').style.overflow = 'hidden';
});

heroFrameOverlay.addEventListener('click', () => {
    heroFrameOverlay.classList.remove('open');
    heroFrameOverlay.setAttribute('aria-hidden', 'true');
    document.querySelector('main').style.overflow = 'auto';
});

// initialize nav state based on current hero visibility
setTimeout(() => {
    const heroRect = hero.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(heroRect.bottom, mainRect.bottom) - Math.max(heroRect.top, mainRect.top));
    const ratio = visibleHeight / heroRect.height;
    if (ratio > 0.75) topNav.classList.add('hidden'); else topNav.classList.remove('hidden');
}, 50);

// show year
document.getElementById('year').textContent = new Date().getFullYear();

// initial apply filter and ensure layout is correct on first paint
window.addEventListener('load', () => applyFilter('all'));

/* ===========================
   Accessibility: Escape to close things
   =========================== */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (heroFrameOverlay.classList.contains('open')) {
            heroFrameOverlay.classList.remove('open');
            heroFrameOverlay.setAttribute('aria-hidden', 'true');
            document.querySelector('main').style.overflow = 'auto';
        }
        if (modal.classList.contains('open')) closeModal();
    }
});

/* ===========================
   Hash linking to open art by index (optional)
   =========================== */
(function handleHashOpen() {
    const m = location.hash.match(/^#art-(\d+)$/);
    if (m) {
        const idx = parseInt(m[1], 10);
        if (!Number.isNaN(idx) && idx >= 0 && idx < artworks.length) {
            // wait until render
            setTimeout(() => openModal(idx), 200);
        }
    }
})();

// User Profile Setup
// User Profile Setup
// User Profile Setup
(function setupUserProfile() {
    const setupModal = document.getElementById('userSetupModal');
    const stayAnonymousBtn = document.getElementById('stayAnonymousBtn');
    const chooseNameBtn = document.getElementById('chooseNameBtn');
    const nameInputSection = document.getElementById('nameInputSection');
    const displayNameInput = document.getElementById('displayNameInput');
    const confirmNameBtn = document.getElementById('confirmNameBtn');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const userProfileDisplay = document.querySelector('.user-profile');

    let selectedAvatar = null;

    // Check if user has already set up profile
    // Check if user has already set up profile
    const hasProfile = localStorage.getItem('user_profile_setup');

    console.log('Profile setup check:', hasProfile); // Debug log

    if (!hasProfile) {
        // Show setup modal AFTER loading screen is done
        setTimeout(() => {
            console.log('Showing user setup modal'); // Debug log
            setupModal.classList.remove('hidden');
            setupModal.style.display = 'flex';
            setupModal.style.opacity = '1';
            setupModal.style.pointerEvents = 'auto';
        }, 1500); // Increased delay to ensure loading screen is fully hidden
    } else {
        console.log('User already has profile'); // Debug log
        updateUserProfileDisplay();
    }

    // Anonymous option - mobile text link
    stayAnonymousBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem('user_profile_setup', 'true');
        localStorage.setItem('guest_display_name_v1', 'Anonymous');
        localStorage.setItem('guest_avatar_v1', 'user');
        setupModal.style.display = 'none';
        setupModal.classList.add('hidden');
        updateUserProfileDisplay();
        showPopup('Welcome! 🎉');
    });

    // Choose name option
    chooseNameBtn.addEventListener('click', () => {
        nameInputSection.style.display = 'flex';
        document.querySelector('.profile-options').style.display = 'none';
        stayAnonymousBtn.style.display = 'none';
        displayNameInput.focus();
    });

    // Avatar selection
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            avatarOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedAvatar = option.dataset.avatar;
        });
    });

    // Confirm name
    confirmNameBtn.addEventListener('click', () => {
        const name = displayNameInput.value.trim();
        if (!name) {
            displayNameInput.style.borderColor = 'var(--accent)';
            displayNameInput.placeholder = 'Please enter a name!';
            setTimeout(() => {
                displayNameInput.style.borderColor = '';
                displayNameInput.placeholder = 'Enter your display name';
            }, 2000);
            return;
        }

        if (!selectedAvatar) {
            showPopup('Please select an avatar!');
            return;
        }

        localStorage.setItem('user_profile_setup', 'true');
        localStorage.setItem('guest_display_name_v1', name);
        localStorage.setItem('guest_avatar_v1', selectedAvatar);
        setupModal.style.display = 'none';
        setupModal.classList.add('hidden');
        updateUserProfileDisplay();

        setTimeout(() => {
            showPopup(`Welcome, ${name}! 🎉`);
        }, 300);
    });

    // Update the user profile icon in navbar
    function updateUserProfileDisplay() {
        const avatar = localStorage.getItem('guest_avatar_v1') || 'user';
        const name = localStorage.getItem('guest_display_name_v1') || 'Anonymous';

        if (userProfileDisplay) {
            userProfileDisplay.innerHTML = getAvatarSVG(avatar);
            userProfileDisplay.title = name;
        }
    }

    // SVG avatar generator
    function getAvatarSVG(type) {
        const svgs = {
            user: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="4"/>
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
            </svg>`,
            artist: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>`,
            palette: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
            </svg>`,
            heart: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>`,
            star: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>`,
            fire: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="none">
                <path d="M13.5 1c-.8 2-1.8 4.5-2.5 7-.6-3-1.2-5-1.5-6C7 4.5 4 9 4 13c0 4.4 3.6 8 8 8s8-3.6 8-8c0-3.7-2.5-7.4-6.5-12z"/>
            </svg>`,
            sparkle: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="none">
                <path d="M12 1l2.4 7.2h7.6l-6.2 4.5 2.4 7.3-6.2-4.5-6.2 4.5 2.4-7.3L2 8.2h7.6z"/>
                <circle cx="19" cy="5" r="1.5"/>
                <circle cx="5" cy="19" r="1.5"/>
            </svg>`,
            shield: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>`
        };
        return svgs[type] || svgs.user;
    }

    // Make function available globally
    window.getAvatarSVG = getAvatarSVG;

    // Enter key support
    displayNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmNameBtn.click();
        }
    });
})();
/* ============================================
   INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
   ============================================ */

// Animate sections when they come into view
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    });

    // Observe the about section
    const aboutSection = document.querySelector('.ac-container');
    if (aboutSection) {
        observer.observe(aboutSection);
    }

    // Observe gallery grid for card animations
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
        observer.observe(galleryGrid);
    }
}

// Initialize scroll animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupScrollAnimations);
} else {
    setupScrollAnimations();
}

/* ============================================
   RE-ANIMATE CARDS ON FILTER CHANGE
   ============================================ */

// Store the original tab click handler
const originalTabHandler = document.querySelectorAll('.tab');

// Enhanced filter animation
originalTabHandler.forEach(tab => {
    tab.addEventListener('click', () => {
        const cards = document.querySelectorAll('.card');

        // Reset animations
        cards.forEach((card, index) => {
            card.style.animation = 'none';
            card.offsetHeight; // Trigger reflow

            // Re-apply animation with stagger
            if (card.style.display !== 'none') {
                card.style.animation = `cardFadeIn 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards ${index * 0.05}s`;
            }
        });
    });
});

/* ============================================
   ENHANCED MODAL ANIMATIONS
   ============================================ */

// Add scale effect when modal opens
const originalOpenModal = window.openModal;
if (typeof openModal === 'function') {
    window.openModal = function (index) {
        originalOpenModal(index);

        // Add entrance animation
        const modalCard = document.querySelector('.modal-card');
        if (modalCard) {
            modalCard.style.animation = 'modalSlideIn 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) forwards';
        }
    };
}

/* ============================================
   SMOOTH STATS NUMBER UPDATES
   ============================================ */

// Enhance the existing animateNumber function with spring animation
const originalAnimateNumber = window.animateNumber;
if (typeof animateNumber === 'function') {
    window.animateNumber = function (el, from, to, duration = 800) {
        if (!el) return;
        from = Number(from) || 0;
        to = Number(to) || 0;

        const start = performance.now();
        const step = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            // Spring easing
            const ease = 1 - Math.pow(1 - progress, 4);
            const value = Math.round(from + (to - from) * ease);
            el.textContent = value.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                // Add completion animation
                el.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    el.style.transform = 'scale(1)';
                }, 200);
            }
        };
        requestAnimationFrame(step);

        el.classList.add("pulse");
        setTimeout(() => el.classList.remove("pulse"), 300);
    };
}

/* ============================================
   BUTTON RIPPLE EFFECT
   ============================================ */

function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple-effect');

    button.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple to all buttons
document.querySelectorAll('.btn, .insta-btn').forEach(button => {
    button.addEventListener('click', createRipple);
});

// Add CSS for ripple effect
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .btn, .insta-btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

/* ============================================
   LOGO SPIN CONTROL
   ============================================ */

// Ensure logo spins only once on load
/* ============================================
   LOGO SPIN CONTROL WITH RINGS ANIMATION
   ============================================ */

window.addEventListener('load', () => {
    const heroFrame = document.getElementById('heroFrame');
    if (heroFrame && !sessionStorage.getItem('logo_spun')) {
        // First show rings animation
        setTimeout(() => {
            heroFrame.classList.add('rings-ready');
        }, 2000);

        // Then start spinning after rings appear
        setTimeout(() => {
            heroFrame.classList.add('spinning');
        }, 2000);

        // Stop spinning after 60 seconds
        setTimeout(() => {
            heroFrame.classList.remove('spinning');
            sessionStorage.setItem('logo_spun', 'true');
        }, 62000);
    }
});

const mainScroller = document.querySelector("main");
const heroSection = document.getElementById("hero");

// fully working hide-on-hero logic
mainScroller.addEventListener("scroll", () => {
    const scrolled = mainScroller.scrollTop;
    const heroHeight = heroSection.offsetHeight;

    // hide nav while inside hero section
    if (scrolled < heroHeight - 150) {
        topNav.classList.add("hidden");
    } else {
        topNav.classList.remove("hidden");
    }
});


console.log('🎨 All animations loaded successfully!');