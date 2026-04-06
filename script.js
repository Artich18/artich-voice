/* =============================================
  ARTICH VOICE - CORE APP LOGIC
=============================================
  Integrations Placeholder for Firebase & Cloudinary
*/

const firebaseConfig = {
    // TODO: Add Firebase SDK keys here later
    // apiKey: "YOUR_API_KEY",
    // authDomain: "artich-voice.firebaseapp.com",
    // projectId: "artich-voice"
};

const cloudinaryConfig = {
    // TODO: Cloudinary URL generator format
    cloudName: "your_cloud_name",
    audioBase: "https://res.cloudinary.com/your_cloud_name/video/upload/v1/artich/audio/",
    coverBase: "https://res.cloudinary.com/your_cloud_name/image/upload/v1/artich/covers/"
};

/* ================= APP STATE ================= */
let currentUser = null;
let currentAudio = new Audio();
let isPlaying = false;
let playbackSpeed = 1;
let sleepTimerId = null;

// Mock Data for Library
const libraryData = [
    { title: "Maa Ke Haath Ki Roti", category: "Maa Stories", time: "14:20", img: "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?auto=format&fit=crop&q=80&w=150" },
    { title: "Toota Dil, Nayi Shuruaat", category: "Heartbreak", time: "22:15", img: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?auto=format&fit=crop&q=80&w=150" },
    { title: "Sheher Ka Sangharsh", category: "Struggle", time: "18:45", img: "https://images.unsplash.com/photo-1506869640319-ce1c192f1556?auto=format&fit=crop&q=80&w=150" }
];

/* ================= INITIALIZATION ================= */
document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
    populateLibrary();
    setupAudioListeners();
});

/* ================= AUTHENTICATION FLOW ================= */
function checkLoginStatus() {
    const savedUser = localStorage.getItem('artichUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('display-name').innerText = currentUser.name || "Guest";
    } else {
        document.getElementById('login-modal').classList.remove('hidden');
    }
}

function handleLogin() {
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('mobile-number').value;
    const code = document.getElementById('country-code').value;
    
    if(name && phone) {
        currentUser = { name: name, phone: code+phone, isGuest: false };
        localStorage.setItem('artichUser', JSON.stringify(currentUser));
        // TODO: Sync to Firebase Users Collection
        checkLoginStatus();
    } else {
        alert("Please enter both Name and Mobile Number, or Skip as Guest.");
    }
}

function skipLogin() {
    currentUser = { name: "Guest User", isGuest: true };
    localStorage.setItem('artichUser', JSON.stringify(currentUser));
    checkLoginStatus();
}

function logout() {
    localStorage.removeItem('artichUser');
    currentUser = null;
    checkLoginStatus();
    switchView('home');
}

/* ================= NAVIGATION (SPA ROUTING) ================= */
function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    // Remove active state from nav
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });

    // Show selected view
    document.getElementById(`view-${viewName}`).classList.add('active');
    
    // Highlight nav item (except player, which triggers from floating elements or home)
    if(viewName !== 'player') {
        const navElements = document.getElementById('bottom-nav').children;
        const indexMap = { 'home': 0, 'library': 1, 'profile': 3 };
        navElements[indexMap[viewName]].classList.add('active');
    }
}

function openPlayer(storyId = "default-story") {
    switchView('player');

    currentAudio.src = "audio/sample.mp3";

    const savedTime = localStorage.getItem(storyId + "-time");
    if (savedTime) {
        currentAudio.currentTime = parseFloat(savedTime);
    }
}

/* ================= AUDIO PLAYER LOGIC ================= */
function saveBookmark() {
    const time = currentAudio.currentTime;
    let bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
    bookmarks.push(time);
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    alert("Bookmark saved");
}
function togglePlay() {
    const playIcon = document.getElementById('play-icon');
    
    if (isPlaying) {
        currentAudio.pause();
        playIcon.classList.remove('fa-pause');
        playIcon.classList.add('fa-play');
    } else {
        // Mock play (will throw error if no src, catch gracefully for UI demo)
        currentAudio.play().catch(e => console.log("Audio URL not set yet. UI simulated."));
        playIcon.classList.remove('fa-play');
        playIcon.classList.add('fa-pause');
    }
    isPlaying = !isPlaying;
}

function skip(seconds) {
    currentAudio.currentTime += seconds;
    updateSeekUI();
}

function toggleSpeed() {
    const speeds = [1, 1.25, 1.5, 2];
    let currentIndex = speeds.indexOf(playbackSpeed);
    playbackSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    currentAudio.playbackRate = playbackSpeed;
    document.getElementById('speed-label').innerText = playbackSpeed + "x";
}

function setSleepTimer() {
    const time = prompt("Set sleep timer (minutes):", "15");
    if(time && !isNaN(time)) {
        if(sleepTimerId) clearTimeout(sleepTimerId);
        
        sleepTimerId = setTimeout(() => {
            if(isPlaying) togglePlay();
            alert("Sleep timer ended. Story paused.");
        }, time * 60000);
        
        alert(`Sleep timer set for ${time} minutes.`);
    }
}
function addFavorite(storyTitle = "The Scars We Hide") {
    let favs = JSON.parse(localStorage.getItem("favorites")) || [];
    if (!favs.includes(storyTitle)) {
        favs.push(storyTitle);
        localStorage.setItem("favorites", JSON.stringify(favs));
        alert("Added to favorites");
    }
}

/* ================= PLAYER EVENT LISTENERS ================= */
function setupAudioListeners() {
    const seekBar = document.getElementById('seek-bar');
    
    currentAudio.addEventListener('timeupdate', () => {
        const percent = (currentAudio.currentTime / currentAudio.duration) * 100;
        seekBar.value = isNaN(percent) ? 0 : percent;
        document.getElementById('current-time').innerText = formatTime(currentAudio.currentTime);
      localStorage.setItem("default-story-time", currentAudio.currentTime);
        
        // TODO: Throttle and save to Firebase listeningProgress every 10 seconds
    });

    currentAudio.addEventListener('loadedmetadata', () => {
        document.getElementById('total-time').innerText = formatTime(currentAudio.duration);
    });

    seekBar.addEventListener('input', (e) => {
        const time = (e.target.value / 100) * currentAudio.duration;
        currentAudio.currentTime = time;
    });
}

function formatTime(seconds) {
    if(isNaN(seconds)) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}

/* ================= UI POPULATORS ================= */
function populateLibrary() {
    const container = document.getElementById('library-content');
    container.innerHTML = '';
    
    libraryData.forEach(item => {
        const html = `
            <div class="lib-item" onclick="openPlayer()">
                <img src="${item.img}" class="lib-cover" alt="Cover">
                <div class="lib-info">
                    <h4 class="gold-text">${item.title}</h4>
                    <p style="font-size:0.8rem; color:var(--text-secondary)">Jaggu Kashyap • ${item.category}</p>
                    <p style="font-size:0.8rem; margin-top:5px"><i class="far fa-clock"></i> ${item.time}</p>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

