console.log("Running detailLoader.js");

/**
 * Enhanced detailLoader.js with HYBRID structure support
 * Supports: Hybrid structure only
 */

let lyricsTitleSet = false;
let stopOrderData = null;

class TourDetailLoader {
    constructor() {
        this.currentStop = null;
        this.currentLanguage = null;
        this.stopInfo = null;
        this.contentPath = null;
        this.stopOrderLoaded = false;
        
        // Configuration
        this.config = {
            BASE_PATH: 'content',
            DEFAULT_LANGUAGE: 'zh',
            SUPPORTED_LANGUAGES: ['en', 'zh'],
            
            // Language configuration - easily extensible
            LANGUAGES: {
                'en': {
                    name: 'English',
                    native: 'English'
                },
                'zh': {
                    name: 'Chinese',
                    native: '中文'
                }
                // Add new languages here as needed
                // 'es': {
                //     name: 'Spanish',
                //     native: 'Español'
                // }
            },
            
            // File patterns for HYBRID structure
            PATTERNS: {
                // Hybrid: /content/welcome-center/audio/audio-zh.mp3
                HYBRID: {
                    audio: 'audio/audio-{lang}.mp3',
                    lyrics: 'lyrics/lyrics-{lang}.txt',
                    images: 'images'
                }
            }
        };
    }

    async init() {
        try {
            console.log("Initializing TourDetailLoader...");
            
            // Parse URL to get stop and language
            this.parseUrl();
            
            // Set language preference
            this.setLanguage();
            
            // Load stop order and title mapping from stopOrder.json
            await this.loadStopOrder();
            
            // Validate stop exists
            if (!this.validateStop()) {
                throw new Error(`Stop '${this.currentStop}' not found`);
            }
            
            // Set content path and load content
            this.contentPath = `${this.config.BASE_PATH}/${this.currentStop}`;
            await this.loadContent();
            
            console.log("✅ TourDetailLoader initialized successfully", {
                stop: this.currentStop,
                language: this.currentLanguage,
                contentPath: this.contentPath
            });
            
        } catch (error) {
            console.error("❌ Failed to initialize TourDetailLoader:", error);
            this.showError(error.message);
        }
    }

    parseUrl() {
        // Support multiple URL formats:
        // 1. ?stop=welcome-center&lang=zh
        // 2. /tour/zh/welcome-center  
        // 3. /detail/welcome-center
        
        const urlParams = new URLSearchParams(window.location.search);
        const pathSegments = window.location.pathname.split('/').filter(s => s);
        
        if (urlParams.has('stop')) {
            // Query parameter format
            this.currentStop = urlParams.get('stop');
            this.currentLanguage = urlParams.get('lang');
        } else if (pathSegments.includes('tour')) {
            // Path format: /tour/zh/welcome-center
            const tourIndex = pathSegments.indexOf('tour');
            if (pathSegments.length > tourIndex + 2) {
                this.currentLanguage = pathSegments[tourIndex + 1];
                this.currentStop = pathSegments[tourIndex + 2];
            }
        } else if (pathSegments.length > 0) {
            // Legacy format: /detail/welcome-center
            this.currentStop = pathSegments[pathSegments.length - 1];
        }
        
        console.log("Parsed URL:", { stop: this.currentStop, language: this.currentLanguage });
    }

    setLanguage() {
        // Priority: URL param > stored preference > default
        if (!this.currentLanguage || !this.config.SUPPORTED_LANGUAGES.includes(this.currentLanguage)) {
            const stored = localStorage.getItem('tour-language');
            this.currentLanguage = (stored && this.config.SUPPORTED_LANGUAGES.includes(stored)) 
                ? stored 
                : this.config.DEFAULT_LANGUAGE;
        }
        
        // Validate language exists in configuration
        if (!this.config.LANGUAGES[this.currentLanguage]) {
            console.warn(`Language '${this.currentLanguage}' not found in configuration, falling back to default`);
            this.currentLanguage = this.config.DEFAULT_LANGUAGE;
        }
        
        localStorage.setItem('tour-language', this.currentLanguage);
        console.log("Language set to:", this.currentLanguage);
    }

    async loadStopOrder() {
        try {
            const res = await fetch('static/stopOrder.json');
            stopOrderData = await res.json();
            this.stopOrderLoaded = true;
        } catch (e) {
            console.error('Failed to load stopOrder.json', e);
            stopOrderData = null;
        }
    }

    validateStop() {
        if (!this.currentStop) {
            console.error("No stop specified");
            return false;
        }
        if (!stopOrderData || !stopOrderData[this.currentStop]) {
            console.error("Stop not found in stopOrder.json");
            return false;
        }
        // stopOrderData[stop] can be a number or an object with order/title
        const stopEntry = stopOrderData[this.currentStop];
        if (typeof stopEntry === 'number') {
            this.stopInfo = {
                id: this.currentStop,
                order: stopEntry,
                title: {
                    en: this.currentStop.replace(/-/g, ' '),
                    zh: this.currentStop.replace(/-/g, ' ')
                }
            };
        } else {
            this.stopInfo = {
                id: this.currentStop,
                order: stopEntry.order,
                title: stopEntry.title || {
                    en: this.currentStop.replace(/-/g, ' '),
                    zh: this.currentStop.replace(/-/g, ' ')
                }
            };
        }
        return true;
    }

    async loadContent() {
        console.log("Loading content...");
        
        // Load different parts
        this.loadAudio();
        this.loadImages();
        this.loadLyrics();
        this.updateUI();
        
        console.log("Content loaded successfully");
    }

    loadAudio() {
        const audioElement = document.getElementById('audio');
        if (!audioElement) return;
        
        const pattern = this.config.PATTERNS.HYBRID;
        let audioFile = pattern.audio.replace('{lang}', this.currentLanguage);
        
        const audioPath = `content/${this.currentStop}/audio/audio-${this.currentLanguage}.mp3`;
        audioElement.innerHTML = `<source src="${audioPath}" type="audio/mpeg">`;
        audioElement.load();
        
        console.log("Audio loaded:", audioPath);
    }

    async loadImages() {
        const pattern = this.config.PATTERNS.HYBRID;
        const imagesPath = `${this.contentPath}/${pattern.images}`;
        const manifestUrl = `${imagesPath}/images.json`;

        let imageFiles = [];
        try {
            const res = await fetch(manifestUrl);
            imageFiles = await res.json();
        } catch (e) {
            console.error('Could not load images manifest:', e);
            // fallback: try slide1.png, slide2.png, ... up to 3
            imageFiles = ['slide1.png', 'slide2.png', 'slide3.png'];
        }

        const slideshowContainer = document.querySelector('.slideshow-container');
        if (!slideshowContainer) return;

        // Clear existing slides and dots
        slideshowContainer.innerHTML = '';

        // Slides
        imageFiles.forEach((file, idx) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'mySlides fade';
            slideDiv.innerHTML = `
                <div class="numbertext">${idx + 1} / ${imageFiles.length}</div>
                <img src="${imagesPath}/${file}" alt="Slide ${idx + 1}">
            `;
            slideshowContainer.appendChild(slideDiv);
        });

        // Navigation arrows
        const prev = document.createElement('a');
        prev.className = 'prev';
        prev.innerHTML = '&#10094;';
        prev.onclick = () => plusSlides(-1);
        slideshowContainer.appendChild(prev);

        const next = document.createElement('a');
        next.className = 'next';
        next.innerHTML = '&#10095;';
        next.onclick = () => plusSlides(1);
        slideshowContainer.appendChild(next);

        // Dots
        const dotsWrapper = document.createElement('div');
        dotsWrapper.className = 'dots-wrapper';
        imageFiles.forEach((_, idx) => {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.onclick = () => currentSlide(idx + 1);
            dotsWrapper.appendChild(dot);
        });
        slideshowContainer.appendChild(dotsWrapper);

        // Initialize slideshow
        window.slideIndex = 1;
        window.showSlides = function(n) {
            let slides = document.getElementsByClassName("mySlides");
            let dots = document.getElementsByClassName("dot");
            if (n > slides.length) {window.slideIndex = 1}
            if (n < 1) {window.slideIndex = slides.length}
            for (let i = 0; i < slides.length; i++) {
                slides[i].style.display = "none";
            }
            for (let i = 0; i < dots.length; i++) {
                dots[i].className = dots[i].className.replace(" active", "");
            }
            slides[window.slideIndex-1].style.display = "block";
            dots[window.slideIndex-1].className += " active";
        }
        window.plusSlides = function(n) { window.showSlides(window.slideIndex += n); }
        window.currentSlide = function(n) { window.showSlides(window.slideIndex = n); }
        window.showSlides(window.slideIndex);
    }

    loadLyrics() {
        const pattern = this.config.PATTERNS.HYBRID;
        let lyricsFile = pattern.lyrics.replace('{lang}', this.currentLanguage);
        
        const lyricsPath = `${this.contentPath}/${lyricsFile}`;
        console.log("Lyrics path set:", lyricsPath);
        
        // Share path with lyricPlayer.js
        window.TOUR_LYRICS_PATH = lyricsPath;
        window.dispatchEvent(new CustomEvent('lyricsPathReady', {
            detail: { 
                path: lyricsPath,
                language: this.currentLanguage
            }
        }));
        
        console.log("Lyrics path set:", lyricsPath);
    }

    updateUI() {
        // Set page title
        const titleElement = document.getElementById('mainTitle');
        if (titleElement) {
            titleElement.textContent = this.getTitle();
        }
        
        // Set stop number
        const circleElement = document.querySelector('.circle');
        if (circleElement && this.stopInfo) {
            circleElement.textContent = this.stopInfo.order.toString();
        }
        
        // Set page title
        document.title = `${this.getTitle()} - CMU Tour`;
        
        // Add language class to body
        document.body.className = document.body.className.replace(/lang-\w+/g, '');
        document.body.classList.add(`lang-${this.currentLanguage}`);
        
        console.log("UI updated");
    }

    getTitle() {
        if (!this.stopInfo) return this.currentStop.replace(/-/g, ' ');
        
        return this.stopInfo.title[this.currentLanguage] || 
               this.stopInfo.title[this.config.DEFAULT_LANGUAGE] ||
               this.currentStop.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    showError(message) {
        console.error("TourDetailLoader Error:", message);
        
        const titleElement = document.getElementById('mainTitle');
        if (titleElement) {
            titleElement.textContent = "Content Not Available";
            titleElement.style.color = '#ff4444';
        }
        
        // Show user-friendly error
        alert(`Error: ${message}\n\nPlease check the URL or try again later.`);
    }

    // Public API for other scripts
    getCurrentStop() { return this.currentStop; }
    getCurrentLanguage() { return this.currentLanguage; }
    getContentPath() { return this.contentPath; }
    getSupportedLanguages() { return Object.keys(this.config.LANGUAGES); }
    getLanguageConfig() { return this.config.LANGUAGES; }
}

// Initialize
const tourLoader = new TourDetailLoader();
window.tourLoader = tourLoader;

function shouldInitializeTourOnThisPage() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('stop')) return true;
        const path = window.location.pathname;
        if (path.includes('detail')) return true;
        // Presence of key elements on detail page
        if (document.getElementById('audio') || document.querySelector('.content-container')) return true;
    } catch (_) {}
    return false;
}

// Start when ready (only on detail pages)
const startInit = () => {
    if (shouldInitializeTourOnThisPage()) {
        tourLoader.init();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
} else {
    startInit();
}

// Legacy compatibility
window.getCurrentStop = () => tourLoader.getCurrentStop();
window.getCurrentLanguage = () => tourLoader.getCurrentLanguage();

// Listen for lyricsTitleReady event to set the main title from lyrics.txt
window.addEventListener('lyricsTitleReady', (event) => {
  const titleElement = document.getElementById('mainTitle');
  if (titleElement && event.detail && event.detail.title) {
    titleElement.textContent = event.detail.title;
    document.title = event.detail.title + ' - CMU Tour';
  }
});
