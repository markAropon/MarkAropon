document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const indicatorsContainer = document.querySelector(".carousel-indicators");
  const carousel = document.querySelector(".carousel-container");
  let currentSlide = 0;

  let isThrottled = false;
  const throttleDuration = 700;
  const scrollThreshold = 15;

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

  if (slides.length > 1) {
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

    if (carousel) {
      carousel.addEventListener(
        "wheel",
        (event) => {
          if (isThrottled) {
            event.preventDefault();
            return;
          }

          let delta = event.deltaY;
          if (delta === 0 && event.deltaX !== 0) {
            delta = event.deltaX;
          }

          let slideChanged = false;
          if (delta > scrollThreshold) {
            const nextIndex = (currentSlide + 1) % slides.length;
            if (nextIndex !== currentSlide) {
              showSlide(nextIndex, "next");
              slideChanged = true;
            }
          } else if (delta < -scrollThreshold) {
            const prevIndex =
              (currentSlide - 1 + slides.length) % slides.length;
            if (prevIndex !== currentSlide) {
              showSlide(prevIndex, "prev");
              slideChanged = true;
            }
          }

          if (slideChanged) {
            event.preventDefault();
            isThrottled = true;
            setTimeout(() => {
              isThrottled = false;
            }, throttleDuration);
          }
        },
        { passive: false }
      );
    } else {
      console.warn("Carousel container for scroll navigation not found.");
    }
  } else {
    if (indicatorsContainer) indicatorsContainer.style.display = "none";
  }

  function updateIndicators(index) {
    if (!indicatorsContainer || slides.length <= 1) return;
    document.querySelectorAll(".indicator").forEach((indicator, i) => {
      indicator.classList.toggle("active", i === index);
    });
  }

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

    void nextSlide.offsetHeight;

    nextSlide.style.transition = "";
    nextSlide.style.transform = "translateX(0)";
    nextSlide.style.opacity = "1";

    currentSlide = index;
    if (slides.length > 1) updateIndicators(index);

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
      top: 50px;
      left: 50px;
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
