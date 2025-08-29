document.addEventListener("DOMContentLoaded", async function () {
    const audio = document.getElementById("audio");
    const lyricsContainer = document.getElementById("lyrics");
    let lyrics = [];
    let userIsScrolling = false;
    let scrollTimeout = null;
    let lyricsPath = null;

    // Helper to convert [mm:ss] to seconds
    function parseTimestamp(timestamp) {
        const match = timestamp.match(/\[(\d{2}):(\d{2})\]/);
        if (!match) return 0;
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        return minutes * 60 + seconds;
    }

    // Wait for TourDetailLoader to set the lyrics path
    function waitForLyricsPath() {
        return new Promise((resolve) => {
            // Check if path is already available
            if (window.TOUR_LYRICS_PATH) {
                resolve(window.TOUR_LYRICS_PATH);
                return;
            }

            // Listen for the event
            window.addEventListener('lyricsPathReady', (event) => {
                resolve(event.detail.path);
            }, { once: true });

            // Fallback timeout
            setTimeout(() => {
                console.warn("Lyrics path not set, using fallback");
                // Fallback to old logic
                let stop = null;
                if (window.location.search.includes('stop=')) {
                    const params = new URLSearchParams(window.location.search);
                    stop = params.get('stop');
                } else {
                    const segments = window.location.pathname.split('/');
                    stop = segments.pop() || segments.pop();
                }
                resolve(`/content/${stop}/lyrics.txt`);
            }, 2000);
        });
    }

    // Load and parse lyrics
    async function loadLyrics() {
        try {
            lyricsPath = await waitForLyricsPath();
            console.log("Loading lyrics from:", lyricsPath);
            
            const response = await fetch(lyricsPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            let lines = text.split("\n").filter(line => line.trim());
            // Extract title from first line if present
            let lyricsTitle = null;
            if (lines.length && lines[0].startsWith('[TITLE]')) {
                const match = lines[0].match(/^\[TITLE\]\s*(.+)$/);
                if (match) {
                    lyricsTitle = match[1].trim();
                    lines.shift(); // Remove the title line
                }
            }
            if (lyricsTitle) {
                window.dispatchEvent(new CustomEvent('lyricsTitleReady', { detail: { title: lyricsTitle } }));
            }
            lyrics = lines
                .map(line => {
                    const match = line.match(/^\[(\d{2}):(\d{2})\]\s*(.+)$/);
                    if (!match) return null;
                    return {
                        time: parseTimestamp(match[0]),
                        text: match[3].trim()
                    };
                })
                .filter(line => line !== null);

            console.log(`Loaded ${lyrics.length} lyric lines`);
            
            // Initial display
            if (lyrics.length > 0) {
                displayLyrics(true);
            } else {
                lyricsContainer.innerHTML = "<span style='color: #f88'>No lyrics found</span>";
            }
        } catch (error) {
            console.error("Error loading lyrics:", error);
            lyricsContainer.innerHTML = `<span style='color: #f88'>Error loading lyrics: ${error.message}</span>`;
        }
    }

    let currentLine = 0;

    function displayLyrics(forceUpdate = false) {
        const player = document.querySelector('.lyrics-player');
        const isEnlarged = player.classList.contains('enlarged');
        // If user is scrolling in enlarged mode, do not update unless forced
        // Note: User scroll detection is less relevant for a single paragraph display, but keeping the flag logic.
        if (isEnlarged && userIsScrolling && !forceUpdate) return;

        let html = "";
        if (isEnlarged) {
            // Show all lyrics as a single paragraph, highlighting current line
            html = lyrics.map((line, index) => {
                if (index === currentLine) {
                    return `<span class='lyric-word current'>${line.text}</span>`; // Use span for inline, add current class
                } else {
                    return `<span class='lyric-word'>${line.text}</span>`; // Use span for inline
                }
            }).join(' '); // Join spans with a space

            lyricsContainer.innerHTML = html;

            // Auto-scroll to center the current line in paragraph view

        } else {
            // Show previous, current, next
            if (currentLine > 0) {
                html += `<div class=\'lyric-line\'>${lyrics[currentLine - 1].text}</div>`;
            } else {
                html += `<div class=\'lyric-line\'>&nbsp;</div>`;
            }
            html += `<div class=\'lyric-line current\'>${lyrics[currentLine].text}</div>`;
            if (currentLine < lyrics.length - 1) {
                html += `<div class=\'lyric-line\'>${lyrics[currentLine + 1].text}</div>`;
            } else {
                html += `<div class=\'lyric-line\'>&nbsp;</div>`;
            }
             lyricsContainer.innerHTML = html;

            // Auto-scroll to center the current line in shrinked mode (if needed)
            // This logic currently only runs if not enlarged, and is implicit in the 3-line view.
        }
    }

    audio.addEventListener("timeupdate", function () {
        if (!lyrics.length) return;
        // Find the current line based on time
        while (currentLine < lyrics.length - 1 && audio.currentTime >= lyrics[currentLine + 1].time) {
            currentLine++;
        }
        while (currentLine > 0 && audio.currentTime < lyrics[currentLine].time) {
            currentLine--;
        }
        displayLyrics();
    });

    // Start loading lyrics
    loadLyrics();

    // Enlarge/shrink functionality
    const enlargeIcon = document.querySelector('.lyrics-enlarge-icon');
    const player = document.querySelector('.lyrics-player');
    const scrollBox = document.querySelector('.lyrics-scroll');
    if (enlargeIcon && player) {
        enlargeIcon.addEventListener('click', function() {
            player.classList.toggle('enlarged');
            userIsScrolling = false;
            displayLyrics(true);
        });
    }
    // User scroll detection for enlarged mode
    if (scrollBox) {
        scrollBox.addEventListener('scroll', function() {
            if (!player.classList.contains('enlarged')) return;
            userIsScrolling = true;
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                userIsScrolling = false;
                displayLyrics(true); // Resume auto-scroll after inactivity
            }, 2000);
        });
    }
}); 