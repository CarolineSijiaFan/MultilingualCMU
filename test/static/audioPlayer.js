document.addEventListener("DOMContentLoaded", function() {
    var audio = document.getElementById("audio");
    var progressBar = document.getElementById("progressBar");
    var progressContainer = progressBar.parentElement;
    var playIcon = document.getElementById("playIcon");
    var pauseIcon = document.getElementById("pauseIcon");
    var progressCircle = document.getElementById("progressCircle");
    var seekBackwardBtn = document.getElementById("seekBackward10Btn");
    var seekForwardBtn = document.getElementById("seekForward10Btn");
    var isDragging = false;
  
    playIcon.addEventListener("click", function() {
        audio.play();
        playIcon.style.display = "none";
        pauseIcon.style.display = "inline";
      });
    
    pauseIcon.addEventListener("click", function() {
        audio.pause();
        playIcon.style.display = "inline";
        pauseIcon.style.display = "none";
      });
  
    progressContainer.addEventListener("mousedown", function(event) {
      isDragging = true;
    });
  
    document.addEventListener("mousemove", function(event) {
      if (isDragging) {
        var newTime = (event.clientX - progressContainer.getBoundingClientRect().left) / progressContainer.offsetWidth * audio.duration;
        audio.currentTime = newTime;
        // displayLyrics(); // Update lyrics during drag (removed)

        // Calculate and update visual progress bar display while dragging
        var progress = (newTime / audio.duration) * 100;
        updateProgressBarDisplay(progress);

        // If the audio was paused, start playing it from the new position
        if (audio.paused) {
            audio.play();
        }
      }
    });
  
    document.addEventListener("mouseup", function() {
      isDragging = false;
    });
  
    // Add click event listener for seeking
    progressContainer.addEventListener("click", function(event) {
        var clickTime = (event.clientX - progressContainer.getBoundingClientRect().left) / progressContainer.offsetWidth * audio.duration;
        audio.currentTime = clickTime;
        // displayLyrics(); // Update lyrics for the new time (removed)

        // If the audio was paused, start playing it from the new position
        if (audio.paused) {
            audio.play();
        }
    });
  
    function updateProgressBarDisplay(progress) {
      progress = Math.min(100, Math.max(0, progress));
      progressBar.style.width = progress + "%";
      progressCircle.style.left = progress + "%";
    }
  
    audio.addEventListener("timeupdate", function() {
      if (!isDragging) {
        var duration = audio.duration;
        var currentTime = audio.currentTime;
        var progress = (currentTime / duration) * 100;
        progressBar.style.width = progress + "%";
        progressCircle.style.left = progress + "%";
      }
    });

    // Seek functionality
    if (seekBackwardBtn && audio) {
        seekBackwardBtn.addEventListener('click', function() {
            audio.currentTime = Math.max(0, audio.currentTime - 10);
        });
    }
    if (seekForwardBtn && audio) {
        seekForwardBtn.addEventListener('click', function() {
            audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
        });
    }

  });