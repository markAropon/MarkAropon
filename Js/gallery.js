const baseImagePath = "../Css/Assets/GalleryImages/";
const manifestPath = "../Data/galleryManifest.json";
const favComponentsPath = "../Data/Les composants préférés.json";

let albums = [];
let favComponentsData = {};

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
  <div class="lightbox-media">
    <img class="lightbox-image" />
    <video class="lightbox-video" autoplay loop muted playsinline preload="auto">
      <source src="" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  </div>
  <span class="lightbox-next">&#10095;</span>
`;
document.body.appendChild(lightbox);

const modalTitle = modal.querySelector(".modal-title");
const modalImages = modal.querySelector(".modal-images");
const closeButton = modal.querySelector(".close-button");

const lightboxImage = lightbox.querySelector(".lightbox-image");
const lightboxVideo = lightbox.querySelector(".lightbox-video");
const lightboxClose = lightbox.querySelector(".lightbox-close");
const lightboxPrev = lightbox.querySelector(".lightbox-prev");
const lightboxNext = lightbox.querySelector(".lightbox-next");

let currentImageIndex = 0;
let currentImageList = [];

// Helper function to detect video files
function isVideoFile(filename) {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"];
  return videoExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}

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

    // Load favorite components data
    await loadFavoriteComponents();

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

// Load favorite components data
async function loadFavoriteComponents() {
  try {
    const response = await fetch(favComponentsPath);
    if (!response.ok) throw new Error("Failed to load favorite components");
    favComponentsData = await response.json();
  } catch (error) {
    console.error("Error loading favorite components:", error);
    favComponentsData = {};
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
    if (lightboxVideo.src) {
      lightboxVideo.pause();
      lightboxVideo.src = "";
    }
    lightboxImage.style.display = "none";
    lightboxVideo.style.display = "none";
  }, 300);
}

// Copy component code to clipboard
async function copyComponentCode(componentIndex) {
  try {
    const componentCode =
      favComponentsData["Les composants préférés"][componentIndex];
    if (!componentCode) {
      throw new Error("Component code not found");
    }

    await navigator.clipboard.writeText(componentCode);

    // Show success feedback
    showCopyFeedback("Code copied to clipboard! ✅");
  } catch (error) {
    console.error("Failed to copy code:", error);
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value =
        favComponentsData["Les composants préférés"][componentIndex];
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showCopyFeedback("Code copied to clipboard! ✅");
    } catch (fallbackError) {
      showCopyFeedback("Failed to copy code ❌");
    }
  }
}

// Show copy feedback
function showCopyFeedback(message) {
  const feedback = document.createElement("div");
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10003;
    font-family: Inter, sans-serif;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  feedback.textContent = message;
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
  }, 3000);
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

  // Check if this is the favorite components album
  const isFavoriteComponents = albumData.folder === "FavoriteComponents";

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
    sortedImages.forEach((imageData, sortedIndex) => {
      const fullPath = `${baseImagePath}${albumData.folder}/${imageData.filename}`;
      currentImageList.push(fullPath);

      // Find the original index in the unsorted array for component mapping
      const originalIndex = albumData.images.findIndex(
        (img) => img.filename === imageData.filename
      );

      // Create image container
      const imageContainer = document.createElement("div");
      imageContainer.style.cssText = `
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;

      // Check if this is a video file
      const isVideo = isVideoFile(imageData.filename);

      let mediaElement;

      if (isVideo) {
        // Create video element
        mediaElement = document.createElement("video");
        mediaElement.src = fullPath;
        mediaElement.autoplay = true;
        mediaElement.loop = true;
        mediaElement.muted = true;
        mediaElement.playsInline = true;
        mediaElement.preload = "auto";
        mediaElement.className = "modal-video";
        mediaElement.style.cssText = `
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          opacity: 1;
        `;
      } else {
        // Create image element
        mediaElement = document.createElement("img");
        mediaElement.src = fullPath;
        mediaElement.className = "modal-image";
      }

      mediaElement.alt = imageData.title || imageData.filename;
      mediaElement.title =
        imageData.description || imageData.title || imageData.filename;

      mediaElement.onclick = () =>
        openLightbox(currentImageList.indexOf(fullPath));

      if (!isVideo) {
        mediaElement.style.opacity = "0";
        mediaElement.style.transform = "scale(0.8)";

        mediaElement.onload = () => {
          mediaElement.style.transition = "all 0.3s ease";
          mediaElement.style.opacity = "1";
          mediaElement.style.transform = "scale(1)";
        };

        mediaElement.onerror = () => {
          console.warn(`Failed to load image: ${fullPath}`);
          mediaElement.style.display = "none";
        };
      } else {
        // For videos, show immediately without scaling animation
        mediaElement.style.opacity = "1";
        mediaElement.style.transform = "scale(1)";

        // For videos, add hover effects and autoplay handling
        mediaElement.onmouseover = () => {
          mediaElement.style.transform = "scale(1.05)";
          mediaElement.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.2)";
        };

        mediaElement.onmouseout = () => {
          mediaElement.style.transform = "scale(1)";
          mediaElement.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
        };

        // Ensure video plays when loaded
        mediaElement.addEventListener("loadeddata", () => {
          mediaElement
            .play()
            .catch((e) => console.log("Video autoplay prevented:", e));
        });

        // Also try to play when the element is added to DOM
        setTimeout(() => {
          mediaElement
            .play()
            .catch((e) => console.log("Video autoplay prevented:", e));
        }, 100);
      }

      imageContainer.appendChild(mediaElement);

      // Add copy button for favorite components
      if (
        isFavoriteComponents &&
        favComponentsData["Les composants préférés"]
      ) {
        const copyButton = document.createElement("button");
        copyButton.innerHTML = "📋 Copy Code";
        copyButton.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        `;

        copyButton.onmouseover = () => {
          copyButton.style.transform = "translateY(-2px)";
          copyButton.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
        };

        copyButton.onmouseout = () => {
          copyButton.style.transform = "translateY(0)";
          copyButton.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
        };

        copyButton.onclick = (e) => {
          e.stopPropagation();
          copyComponentCode(originalIndex);
        };

        imageContainer.appendChild(copyButton);
      }

      modalImages.appendChild(imageContainer);
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

  const currentPath = currentImageList[currentImageIndex];
  const isVideo = isVideoFile(currentPath);

  // Hide both elements initially
  lightboxImage.style.display = "none";
  lightboxVideo.style.display = "none";

  if (isVideo) {
    // Show video element
    lightboxVideo.style.display = "block";
    lightboxVideo.src = currentPath;
    lightboxVideo.style.opacity = "0";
    lightboxVideo.style.transform = "scale(0.9)";

    // Ensure video plays when ready
    lightboxVideo.addEventListener("loadeddata", () => {
      lightboxVideo
        .play()
        .catch((e) => console.log("Video autoplay prevented:", e));
    });
  } else {
    // Show image element
    lightboxImage.style.display = "block";
    lightboxImage.src = currentPath;
    lightboxImage.style.opacity = "0";
    lightboxImage.style.transform = "scale(0.9)";
  }

  lightbox.classList.add("active");

  // Animate in
  setTimeout(() => {
    if (isVideo) {
      lightboxVideo.style.opacity = "1";
      lightboxVideo.style.transform = "scale(1)";
    } else {
      lightboxImage.style.opacity = "1";
      lightboxImage.style.transform = "scale(1)";
    }
  }, 50);
}

function showPrevImage() {
  if (currentImageList.length === 0) return;

  const currentPath = currentImageList[currentImageIndex];
  const isCurrentVideo = isVideoFile(currentPath);

  // Add slide-out animation
  if (isCurrentVideo) {
    lightboxVideo.style.opacity = "0";
    lightboxVideo.style.transform = "scale(0.95) translateX(-20px)";
  } else {
    lightboxImage.style.opacity = "0";
    lightboxImage.style.transform = "scale(0.95) translateX(-20px)";
  }

  setTimeout(() => {
    currentImageIndex =
      (currentImageIndex - 1 + currentImageList.length) %
      currentImageList.length;
    const newPath = currentImageList[currentImageIndex];
    const isNewVideo = isVideoFile(newPath);

    // Hide current media and show new media
    lightboxImage.style.display = "none";
    lightboxVideo.style.display = "none";

    if (isNewVideo) {
      lightboxVideo.style.display = "block";
      lightboxVideo.src = newPath;
      lightboxVideo.style.transform = "scale(0.95) translateX(20px)";

      // Ensure video plays when ready
      lightboxVideo.addEventListener("loadeddata", () => {
        lightboxVideo
          .play()
          .catch((e) => console.log("Video autoplay prevented:", e));
      });

      setTimeout(() => {
        lightboxVideo.style.opacity = "1";
        lightboxVideo.style.transform = "scale(1) translateX(0)";
      }, 50);
    } else {
      lightboxImage.style.display = "block";
      lightboxImage.src = newPath;
      lightboxImage.style.transform = "scale(0.95) translateX(20px)";

      setTimeout(() => {
        lightboxImage.style.opacity = "1";
        lightboxImage.style.transform = "scale(1) translateX(0)";
      }, 50);
    }
  }, 150);
}

function showNextImage() {
  if (currentImageList.length === 0) return;

  const currentPath = currentImageList[currentImageIndex];
  const isCurrentVideo = isVideoFile(currentPath);

  // Add slide-out animation
  if (isCurrentVideo) {
    lightboxVideo.style.opacity = "0";
    lightboxVideo.style.transform = "scale(0.95) translateX(20px)";
  } else {
    lightboxImage.style.opacity = "0";
    lightboxImage.style.transform = "scale(0.95) translateX(20px)";
  }

  setTimeout(() => {
    currentImageIndex = (currentImageIndex + 1) % currentImageList.length;
    const newPath = currentImageList[currentImageIndex];
    const isNewVideo = isVideoFile(newPath);

    // Hide current media and show new media
    lightboxImage.style.display = "none";
    lightboxVideo.style.display = "none";

    if (isNewVideo) {
      lightboxVideo.style.display = "block";
      lightboxVideo.src = newPath;
      lightboxVideo.style.transform = "scale(0.95) translateX(-20px)";

      // Ensure video plays when ready
      lightboxVideo.addEventListener("loadeddata", () => {
        lightboxVideo
          .play()
          .catch((e) => console.log("Video autoplay prevented:", e));
      });

      setTimeout(() => {
        lightboxVideo.style.opacity = "1";
        lightboxVideo.style.transform = "scale(1) translateX(0)";
      }, 50);
    } else {
      lightboxImage.style.display = "block";
      lightboxImage.src = newPath;
      lightboxImage.style.transform = "scale(0.95) translateX(-20px)";

      setTimeout(() => {
        lightboxImage.style.opacity = "1";
        lightboxImage.style.transform = "scale(1) translateX(0)";
      }, 50);
    }
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
