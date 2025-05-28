document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const indicatorsContainer = document.querySelector(".carousel-indicators");
  const carousel = document.querySelector(".carousel-container");
  let currentSlide = 0;

  // --- Throttling for scroll events ---
  let isThrottled = false;
  const throttleDuration = 700; // Milliseconds. Adjust this value.
  // Should ideally be a bit longer than your slide transition time.
  const scrollThreshold = 15; // Min scroll delta to trigger a slide change. Adjust this.

  // --- Initial Slide Setup ---
  if (slides.length === 0) {
    console.warn("No slides found for the carousel.");
    if (indicatorsContainer)
      indicatorsContainer.innerHTML = "<p>No slides to display.</p>";
    return;
  }

  let initialActiveSlideFound = false;
  slides.forEach((slide, index) => {
    if (slide.classList.contains("active")) {
      currentSlide = index;
      initialActiveSlideFound = true;
      slide.style.transform = "translateX(0)";
      slide.style.opacity = "1";
      slide.style.visibility = "visible";
    } else {
      slide.style.opacity = "0";
      slide.style.visibility = "hidden";
    }
  });

  if (!initialActiveSlideFound && slides.length > 0) {
    currentSlide = 0;
    slides[0].classList.add("active");
    slides[0].style.transform = "translateX(0)";
    slides[0].style.opacity = "1";
    slides[0].style.visibility = "visible";
  }

  // --- Setup Controls if more than one slide ---
  if (slides.length > 1) {
    // Indicator Setup (Visual Only)
    if (indicatorsContainer) {
      slides.forEach((_, index) => {
        const indicator = document.createElement("div");
        indicator.className = `indicator ${
          index === currentSlide ? "active" : ""
        }`;
        indicatorsContainer.appendChild(indicator);
      });
      updateIndicators(currentSlide);
    } else {
      console.warn("Carousel indicators container not found.");
    }

    // Scroll Navigation
    if (carousel) {
      carousel.addEventListener(
        "wheel",
        (event) => {
          if (isThrottled) {
            event.preventDefault(); // Prevent page scroll even while throttled if desired
            return;
          }

          let delta = event.deltaY;
          // If deltaY is 0 (e.g., some trackpads for horizontal scroll), try deltaX
          if (delta === 0 && event.deltaX !== 0) {
            delta = event.deltaX;
          }

          let slideChanged = false;
          if (delta > scrollThreshold) {
            // Scrolling down or right
            const nextIndex = (currentSlide + 1) % slides.length;
            if (nextIndex !== currentSlide) {
              // Avoid re-triggering on no change (e.g. only 1 slide)
              showSlide(nextIndex, "next");
              slideChanged = true;
            }
          } else if (delta < -scrollThreshold) {
            // Scrolling up or left
            const prevIndex =
              (currentSlide - 1 + slides.length) % slides.length;
            if (prevIndex !== currentSlide) {
              showSlide(prevIndex, "prev");
              slideChanged = true;
            }
          }

          if (slideChanged) {
            event.preventDefault(); // Prevent the page from scrolling if a slide changed
            isThrottled = true;
            setTimeout(() => {
              isThrottled = false;
            }, throttleDuration);
          }
        },
        { passive: false }
      ); // passive: false is needed to allow preventDefault
    } else {
      console.warn("Carousel container for scroll navigation not found.");
    }
  } else {
    // Only one slide or no slides, hide indicators if they exist
    if (indicatorsContainer) indicatorsContainer.style.display = "none";
  }

  // --- Update Indicators Function ---
  function updateIndicators(index) {
    if (!indicatorsContainer || slides.length <= 1) return;
    document.querySelectorAll(".indicator").forEach((indicator, i) => {
      indicator.classList.toggle("active", i === index);
    });
  }

  // --- Slide Transition Logic ---
  function showSlide(index, direction = "next") {
    const currentActive = document.querySelector(".slide.active");
    const nextSlide = slides[index];

    if (!nextSlide || currentActive === nextSlide) {
      if (currentActive === nextSlide) updateIndicators(index);
      return;
    }

    if (currentActive) {
      currentActive.classList.add("exit");
      currentActive.classList.remove("active");
    }

    nextSlide.style.transition = "none";
    nextSlide.style.transform =
      direction === "next" ? "translateX(100%)" : "translateX(-100%)";
    nextSlide.style.opacity = "0";
    nextSlide.style.visibility = "visible";
    nextSlide.classList.add("active");

    void nextSlide.offsetHeight; // Force reflow

    nextSlide.style.transition = ""; // Re-enable CSS transitions
    nextSlide.style.transform = "translateX(0)";
    nextSlide.style.opacity = "1";

    currentSlide = index;
    if (slides.length > 1) updateIndicators(index);

    // IMPORTANT: Match this duration (e.g., 500ms) to your CSS slide transition-duration
    const slideTransitionDuration = 300;
    setTimeout(() => {
      if (currentActive) {
        currentActive.classList.remove("exit");
        currentActive.style.opacity = "0";
        currentActive.style.visibility = "hidden";
      }
    }, slideTransitionDuration);
  }
});

setTimeout(() => {
  const welcomeAlert = document.createElement("div");
  welcomeAlert.textContent = "Welcome to my profile!";
  welcomeAlert.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(43, 4, 185, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      opacity: 0;
      animation: fadeDownIn 0.5s ease-out forwards, fadeOutAlert 0.5s ease-in 3s forwards;
    `;

  const styleSheet = document.styleSheets[0];
  if (styleSheet) {
    const keyframes = `
      @keyframes fadeDownIn {
        0% { opacity: 0; transform: translate(-50%, -20px); }
        100% { opacity: 1; transform: translate(-50%, 0); }
      }
      @keyframes fadeOutAlert {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    try {
      const rules = keyframes
        .trim()
        .split("}")
        .filter((r) => r.trim())
        .map((r) => r.trim() + "}");
      rules.forEach((rule) => {
        let ruleExists = false;
        for (let i = 0; i < styleSheet.cssRules.length; i++) {
          if (
            styleSheet.cssRules[i].type === CSSRule.KEYFRAMES_RULE &&
            styleSheet.cssRules[i].name ===
              (rule.match(/@keyframes\s+([^{\s]+)/) || [])[1]
          ) {
            ruleExists = true;
            break;
          }
        }
        if (!ruleExists)
          styleSheet.insertRule(rule, styleSheet.cssRules.length);
      });
    } catch (e) {
      console.warn("Could not insert keyframes rule for welcome alert:", e);
    }
  }

  document.body.appendChild(welcomeAlert);
  welcomeAlert.addEventListener("animationend", (event) => {
    if (event.animationName === "fadeOutAlert") {
      welcomeAlert.remove();
    }
  });
}, 500);
