document.addEventListener("DOMContentLoaded", () => {
  // Create stars container
  const starsContainer = document.createElement("div");
  starsContainer.className = "stars-container";
  document.body.appendChild(starsContainer);

  // Add CSS styles
  const style = document.createElement("style");
  style.textContent = `
    .stars-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: -1;
      background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
    }

    .star {
      position: absolute;
      background: white;
      border-radius: 50%;
      opacity: 0;
      animation: twinkle 3s infinite ease-in-out;
    }

    .star.small {
      width: 1px;
      height: 1px;
      box-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
    }

    .star.medium {
      width: 2px;
      height: 2px;
      box-shadow: 0 0 4px rgba(255, 255, 255, 0.9);
    }

    .star.large {
      width: 3px;
      height: 3px;
      box-shadow: 0 0 6px rgba(255, 255, 255, 1);
    }

    .star.xlarge {
      width: 4px;
      height: 4px;
      box-shadow: 0 0 8px rgba(255, 255, 255, 1), 0 0 12px rgba(255, 255, 255, 0.5);
    }

    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }

    .star.floating {
      animation: twinkle 3s infinite ease-in-out, float 8s infinite ease-in-out;
    }

    .shooting-star {
      position: absolute;
      width: 2px;
      height: 2px;
      background: linear-gradient(45deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
      border-radius: 50%;
      opacity: 0;
      animation: shoot 3s linear;
    }

    .shooting-star::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100px;
      width: 100px;
      height: 1px;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
    }

    @keyframes shoot {
      0% {
        opacity: 1;
        transform: translateX(-100px) translateY(0);
      }
      70% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translateX(300px) translateY(200px);
      }
    }
  `;
  document.head.appendChild(style);

  // Star generation configuration
  const starCounts = {
    small: 150,
    medium: 80,
    large: 40,
    xlarge: 15,
  };

  // Generate stars
  function createStars() {
    Object.entries(starCounts).forEach(([size, count]) => {
      for (let i = 0; i < count; i++) {
        const star = document.createElement("div");
        star.className = `star ${size}`;

        // Random position
        star.style.left = Math.random() * 100 + "%";
        star.style.top = Math.random() * 100 + "%";

        // Random animation delay
        star.style.animationDelay = Math.random() * 3 + "s";

        // Some stars have floating animation
        if (Math.random() > 0.7) {
          star.classList.add("floating");
          star.style.animationDelay = Math.random() * 8 + "s";
        }

        starsContainer.appendChild(star);
      }
    });
  }

  // Create shooting stars
  function createShootingStar() {
    const shootingStar = document.createElement("div");
    shootingStar.className = "shooting-star";

    // Random starting position (top area)
    shootingStar.style.left = Math.random() * 100 + "%";
    shootingStar.style.top = Math.random() * 30 + "%";

    starsContainer.appendChild(shootingStar);

    // Remove after animation
    setTimeout(() => {
      if (shootingStar.parentNode) {
        shootingStar.remove();
      }
    }, 3000);
  }

  // Parallax effect on mouse move
  function handleMouseMove(e) {
    const stars = document.querySelectorAll(".star");
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    stars.forEach((star, index) => {
      const speed = ((index % 3) + 1) * 0.5; // Different speeds for parallax
      const x = (mouseX - 0.5) * speed;
      const y = (mouseY - 0.5) * speed;

      star.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  // Parallax effect on scroll
  function handleScroll() {
    const scrolled = window.pageYOffset;
    const stars = document.querySelectorAll(".star");

    stars.forEach((star, index) => {
      const speed = ((index % 4) + 1) * 0.1;
      star.style.transform = `translateY(${scrolled * speed}px)`;
    });
  }

  // Initialize
  createStars();

  // Add event listeners
  document.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("scroll", handleScroll);

  // Create shooting stars periodically
  setInterval(createShootingStar, 8000 + Math.random() * 12000);

  // Create initial shooting star
  setTimeout(createShootingStar, 2000);

  // Responsive handling
  function handleResize() {
    // Recreate stars on significant size changes
    if (Math.abs(window.innerWidth - starsContainer.dataset.lastWidth) > 200) {
      starsContainer.innerHTML = "";
      createStars();
      starsContainer.dataset.lastWidth = window.innerWidth;
    }
  }

  window.addEventListener("resize", handleResize);
  starsContainer.dataset.lastWidth = window.innerWidth;
});
