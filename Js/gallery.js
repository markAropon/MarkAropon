const baseImagePath = "../Css/Assets/GalleryImages/";
const manifestPath = "../Data/galleryManifest.json";

let albums = [];

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

// Load gallery manifest
async function loadGalleryManifest() {
  try {
    const response = await fetch(manifestPath);
    if (!response.ok) throw new Error("Failed to load gallery manifest");
    const manifest = await response.json();
    albums = manifest.albums;
    renderAlbums();
  } catch (error) {
    console.error("Error loading gallery manifest:", error);
    // Fallback: show error message
    galleryDiv.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #e53e3e; grid-column: 1 / -1;">
        <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
        <h3>Failed to load gallery</h3>
        <p>Could not load the gallery manifest file.</p>
      </div>
    `;
  }
}

function closeModal() {
  modal.classList.remove("active");
  modalImages.innerHTML = "";
  currentImageList = [];
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

  // Use manifest data instead of fetching directory listing
  setTimeout(() => {
    modalImages.innerHTML = "";
    currentImageList = [];

    if (!albumData.images || albumData.images.length === 0) {
      modalImages.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <div style="font-size: 3rem; margin-bottom: 15px;">📂</div>
          <p>No images found in this album.</p>
        </div>
      `;
      return;
    }

    // Sort images numerically by extracting numbers from filename
    const sortedImages = [...albumData.images].sort((a, b) => {
      const numA = parseFloat(a.filename.match(/\d+\.?\d*/)?.[0] || 0);
      const numB = parseFloat(b.filename.match(/\d+\.?\d*/)?.[0] || 0);
      return numA - numB;
    });

    // Create images in sorted order
    sortedImages.forEach((imageData, index) => {
      const fullPath = `${baseImagePath}${albumData.folder}/${imageData.filename}`;
      currentImageList.push(fullPath);

      const img = document.createElement("img");
      img.src = fullPath;
      img.alt = imageData.title || imageData.filename;
      img.title =
        imageData.description || imageData.title || imageData.filename;
      img.className = "modal-image";

      img.onclick = () => openLightbox(currentImageList.indexOf(fullPath));

      img.style.opacity = "0";
      img.style.transform = "scale(0.8)";

      img.onload = () => {
        img.style.transition = "all 0.3s ease";
        img.style.opacity = "1";
        img.style.transform = "scale(1)";
      };

      img.onerror = () => {
        console.warn(`Failed to load image: ${fullPath}`);
        img.style.display = "none";
      };

      modalImages.appendChild(img);
    });

    if (currentImageList.length === 0) {
      modalImages.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <div style="font-size: 3rem; margin-bottom: 15px;">📂</div>
          <p>No images could be loaded from this album.</p>
        </div>
      `;
    }
  }, 100);
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

// Initialize gallery
document.addEventListener("DOMContentLoaded", () => {
  loadGalleryManifest();
});
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
