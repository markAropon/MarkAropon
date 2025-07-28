const baseImagePath = "../Css/Assets/GalleryImages/";

const albums = [
  {
    folder: "../Css/Assets/GalleryImages/Agreemo",
    name: "Agreemo Project",
    description: "Design assets and mockups for the Agreemo application",
    icon: "📱/🖥️",
  },
  {
    folder: "BusyHands",
    name: "Busy Hands Project",
    description: "Development assets for the Busy Hands web application",
    icon: "🖥️",
  },
  {
    folder: "PersonalGallery",
    name: "Personal Gallery",
    description: "Personal photos and memories",
    icon: "📸",
  },
];

const galleryDiv = document.querySelector(".gallery");

const modal = document.createElement("div");
modal.className = "image-modal";
modal.innerHTML = `
  <div class="modal-content">
    <span class="close-button">&times;</span>
    <h2 class="modal-title"></h2>
    <div class="modal-images"></div>
  </div>
`;
document.body.appendChild(modal);

// Lightbox container
const lightbox = document.createElement("div");
lightbox.className = "lightbox";
lightbox.innerHTML = `
  <span class="lightbox-close">&times;</span>
  <span class="lightbox-prev">&#10094;</span>
  <img class="lightbox-image" />
  <span class="lightbox-next">&#10095;</span>
`;
document.body.appendChild(lightbox);

const modalTitle = modal.querySelector(".modal-title");
const modalImages = modal.querySelector(".modal-images");
const closeButton = modal.querySelector(".close-button");

const lightboxImage = lightbox.querySelector(".lightbox-image");
const lightboxClose = lightbox.querySelector(".lightbox-close");
const lightboxPrev = lightbox.querySelector(".lightbox-prev");
const lightboxNext = lightbox.querySelector(".lightbox-next");

let currentImageIndex = 0;
let currentImageList = [];

// Event listeners
closeButton.onclick = closeModal;
lightboxClose.onclick = closeLightbox;
lightboxPrev.onclick = showPrevImage;
lightboxNext.onclick = showNextImage;

modal.onclick = (e) => {
  if (e.target === modal) closeModal();
};
lightbox.onclick = (e) => {
  if (e.target === lightbox) closeLightbox();
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeLightbox();
  } else if (e.key === "ArrowRight") {
    showNextImage();
  } else if (e.key === "ArrowLeft") {
    showPrevImage();
  }
});

function closeModal() {
  modal.classList.remove("active");
  modalImages.innerHTML = "";
}

function closeLightbox() {
  lightbox.classList.remove("active");

  setTimeout(() => {
    lightboxImage.src = "";
  }, 300);
}

function openModal(albumData) {
  modal.classList.add("active");
  modalTitle.textContent = `${albumData.name}`;

  modalImages.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #666;">
      <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
      <p>Loading images...</p>
    </div>
  `;

  fetch(`${baseImagePath}${albumData.folder}/`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load folder");
      return res.text();
    })
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const links = Array.from(doc.querySelectorAll("a"));

      modalImages.innerHTML = "";
      currentImageList = [];

      // Collect all image files first
      const imageFiles = [];

      links.forEach((link) => {
        const href = link.getAttribute("href") || "";
        const fileName = href.split("/").pop();

        if (/\.(jpg|jpeg|png|gif|jfif|webp|bmp)$/i.test(fileName)) {
          imageFiles.push(fileName);
        }
      });

      // Sort numerically
      imageFiles.sort((a, b) => {
        const numA = parseFloat(a.match(/\d+\.?\d*/)?.[0] || 0);
        const numB = parseFloat(b.match(/\d+\.?\d*/)?.[0] || 0);
        return numA - numB;
      });

      // Create images in sorted order
      imageFiles.forEach((fileName) => {
        const fullPath = `${baseImagePath}${albumData.folder}/${fileName}`;
        currentImageList.push(fullPath);

        const img = document.createElement("img");
        img.src = fullPath;
        img.alt = fileName;
        img.className = "modal-image";

        img.onclick = () => openLightbox(currentImageList.indexOf(fullPath));

        img.style.opacity = "0";
        img.style.transform = "scale(0.8)";
        img.onload = () => {
          img.style.transition = "all 0.3s ease";
          img.style.opacity = "1";
          img.style.transform = "scale(1)";
        };

        modalImages.appendChild(img);
      });

      if (currentImageList.length === 0) {
        modalImages.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 3rem; margin-bottom: 15px;">📂</div>
            <p>No images found in this album.</p>
          </div>
        `;
      }
    })
    .catch(() => {
      modalImages.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e53e3e;">
          <div style="font-size: 3rem;">⚠️</div>
          <p>Failed to load images.</p>
        </div>
      `;
    });
}

function openLightbox(index) {
  if (currentImageList.length === 0) return;
  currentImageIndex = index;
  lightboxImage.src = currentImageList[currentImageIndex];
  lightboxImage.style.opacity = "0";
  lightboxImage.style.transform = "scale(0.9)";

  lightbox.classList.add("active");

  // Animate in
  setTimeout(() => {
    lightboxImage.style.opacity = "1";
    lightboxImage.style.transform = "scale(1)";
  }, 50);
}

function showPrevImage() {
  if (currentImageList.length === 0) return;

  // Add slide-out animation
  lightboxImage.style.opacity = "0";
  lightboxImage.style.transform = "scale(0.95) translateX(-20px)";

  setTimeout(() => {
    currentImageIndex =
      (currentImageIndex - 1 + currentImageList.length) %
      currentImageList.length;
    lightboxImage.src = currentImageList[currentImageIndex];

    // Slide-in animation from right
    lightboxImage.style.transform = "scale(0.95) translateX(20px)";

    setTimeout(() => {
      lightboxImage.style.opacity = "1";
      lightboxImage.style.transform = "scale(1) translateX(0)";
    }, 50);
  }, 150);
}

function showNextImage() {
  if (currentImageList.length === 0) return;

  // Add slide-out animation
  lightboxImage.style.opacity = "0";
  lightboxImage.style.transform = "scale(0.95) translateX(20px)";

  setTimeout(() => {
    currentImageIndex = (currentImageIndex + 1) % currentImageList.length;
    lightboxImage.src = currentImageList[currentImageIndex];

    // Slide-in animation from left
    lightboxImage.style.transform = "scale(0.95) translateX(-20px)";

    setTimeout(() => {
      lightboxImage.style.opacity = "1";
      lightboxImage.style.transform = "scale(1) translateX(0)";
    }, 50);
  }, 150);
}

function createAlbumCard(albumData, index) {
  const albumCard = document.createElement("div");
  albumCard.className = "album-card";
  albumCard.style.animationDelay = `${index * 0.1}s`;

  albumCard.innerHTML = `
    <div class="folder-icon">${albumData.icon}</div>
    <div class="album-name">${albumData.name}</div>
    <div class="album-description">${albumData.description}</div>
  `;

  albumCard.onclick = () => openModal(albumData);
  galleryDiv.appendChild(albumCard);
}

function renderAlbums() {
  albums.forEach((album, index) => {
    createAlbumCard(album, index);
  });
}

document.addEventListener("DOMContentLoaded", renderAlbums);
document.addEventListener("mousemove", (e) => {
  const cards = document.querySelectorAll(".album-card");
  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;
    }
  });
});

document.addEventListener("mouseleave", () => {
  const cards = document.querySelectorAll(".album-card");
  cards.forEach((card) => {
    card.style.transform = "";
  });
});
