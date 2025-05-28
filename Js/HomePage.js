// JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Initialize carousel after DOM loads
  const indicatorsContainer = document.querySelector(".carousel-indicators");

  // Add null check
  if (indicatorsContainer) {
    slides.forEach((_, index) => {
      const indicator = document.createElement("div");
      indicator.className = `indicator ${index === 0 ? "active" : ""}`;
      indicator.addEventListener("click", () => showSlide(index));
      indicatorsContainer.appendChild(indicator);
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const indicatorsContainer = document.querySelector(".carousel-indicators");
  let currentSlide = 0;
  let autoSlideInterval;

  // Create indicators
  slides.forEach((_, index) => {
    const indicator = document.createElement("div");
    indicator.className = `indicator ${index === 0 ? "active" : ""}`;
    indicator.addEventListener("click", () => showSlide(index));
    indicatorsContainer.appendChild(indicator);
  });

  function updateIndicators(index) {
    document.querySelectorAll(".indicator").forEach((indicator, i) => {
      indicator.classList.toggle("active", i === index);
    });
  }

  function showSlide(index, direction = "next") {
    const currentActive = document.querySelector(".slide.active");
    const nextSlide = slides[index];

    currentActive.classList.add("exit");
    currentActive.classList.remove("active");

    nextSlide.style.transform =
      direction === "next" ? "translateX(100%)" : "translateX(-100%)";
    nextSlide.classList.add("active");

    setTimeout(() => {
      currentActive.classList.remove("exit");
      nextSlide.style.transform = "translateX(0)";
      updateIndicators(index);
    }, 10);

    currentSlide = index;
  }

  // Auto-advance
  function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
      const nextIndex = (currentSlide + 1) % slides.length;
      showSlide(nextIndex);
    }, 5000);
  }

  // Pause on hover
  const carousel = document.querySelector(".carousel-container");
  carousel.addEventListener("mouseenter", () =>
    clearInterval(autoSlideInterval)
  );
  carousel.addEventListener("mouseleave", startAutoSlide);

  // Controls
  document.getElementById("prevBtn").addEventListener("click", () => {
    const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prevIndex, "prev");
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    const nextIndex = (currentSlide + 1) % slides.length;
    showSlide(nextIndex);
  });

  // Initialize
  startAutoSlide();
});

// Welcome message
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
      animation: fadeDown 1s ease-out;
    `;

  document.body.appendChild(welcomeAlert);

  setTimeout(() => {
    welcomeAlert.remove();
  }, 3000);
}, 500);
// CSS Animation for welcome message
