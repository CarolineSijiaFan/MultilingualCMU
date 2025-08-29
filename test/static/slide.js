let slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
  // console.log(slides[slideIndex-1]);
}

// --- Swipe support for mobile ---
(function() {
  const container = document.querySelector('.slideshow-container');
  if (!container) return;
  let startX = 0;
  let endX = 0;
  let threshold = 30; // Minimum px to count as swipe

  container.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
    }
  });
  container.addEventListener('touchmove', function(e) {
    if (e.touches.length === 1) {
      endX = e.touches[0].clientX;
    }
  });
  container.addEventListener('touchend', function(e) {
    let diff = endX - startX;
    if (Math.abs(diff) > threshold) {
      if (diff < 0) {
        plusSlides(1); // Swipe left, next slide
      } else {
        plusSlides(-1); // Swipe right, prev slide
      }
    }
    startX = 0;
    endX = 0;
  });
})();
