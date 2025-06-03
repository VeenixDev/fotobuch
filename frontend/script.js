document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    const limit = 24; // Number of images per page
    let isLoading = false;
    let hasMoreImages = true;

    // Modal elements
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const closeBtn = document.querySelector('.close-modal');

    // Function to open the modal with a specific image
    function openModal(imgSrc) {
        modalImg.src = imgSrc;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    // Function to close the modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Event listeners for closing the modal
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Handle image upload
    const uploadForm = document.getElementById('upload-form');
    const uploadStatus = document.getElementById('upload-status');

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(uploadForm);
        uploadStatus.textContent = 'Uploading...';
        uploadStatus.className = '';

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                uploadStatus.textContent = 'Images uploaded successfully!';
                uploadStatus.className = 'success';
                uploadForm.reset();

                // Append the newly uploaded images to the bottom of the grid
                if (result.files && result.files.length > 0) {
                    window.location.reload();
                }
            } else {
                uploadStatus.textContent = `Upload failed: ${result.error || 'Unknown error'}`;
                uploadStatus.className = 'failure';
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            uploadStatus.textContent = 'Upload failed: Network error';
            uploadStatus.className = 'failure';
        }
    });

    // Function to fetch images from the backend
    async function fetchImages(page = 1) {
        try {
            const response = await fetch(`/api?page=${page}&limit=${limit}`);
            if (!response.ok) {
                throw new Error('Failed to fetch images');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching images:', error);
            document.getElementById('image-container').innerHTML = 
                `<div class="error">Error loading images. Please try again later.</div>`;
            return null;
        }
    }

    // Function to render images in the grid
    function renderImages(imageData, append = false) {
        if (!imageData) return;

        const container = document.getElementById('image-container');

        // Only clear the container if we're not appending
        if (!append) {
            container.innerHTML = '';
        } else {
            // Remove loading wrapper if it exists
            const loadingWrapper = document.querySelector('.loading-wrapper');
            if (loadingWrapper) {
                loadingWrapper.remove();
            }
        }

        if (imageData.data.length === 0) {
            if (!append) {
                container.innerHTML = '<div class="loading">No images found.</div>';
            }
            hasMoreImages = false;
            return;
        }

        // Function to preload image dimensions and set correct aspect ratio
        const preloadImageDimensions = (imageName) => {
            return new Promise((resolve) => {
                const tempImg = new Image();

                tempImg.onload = () => {
                    // Calculate aspect ratio as width/height for CSS aspect-ratio property
                    const width = tempImg.naturalWidth;
                    const height = tempImg.naturalHeight;
                    resolve({ width, height });
                };

                tempImg.onerror = () => {
                    // Use default aspect ratio on error (3:2 is common for photos)
                    resolve({ width: 3, height: 2 });
                };

                tempImg.src = `/api/${imageName}`; // Request a tiny version for dimension calculation
            });
        };

        // First, preload all image dimensions to prevent layout shifts
        const preloadPromises = imageData.data.map(imageName => 
            preloadImageDimensions(imageName).then(dimensions => ({
                imageName,
                dimensions
            }))
        );

        // Update hasMoreImages based on pagination info
        hasMoreImages = imageData.pagination.page < imageData.pagination.totalPages;

        // Wait for all dimensions to be loaded, then add images to the container in order
        Promise.all(preloadPromises).then(imagesWithDimensions => {
            // Process each image with known dimensions
            imagesWithDimensions.forEach(({ imageName, dimensions }) => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';

                // Create a placeholder div with correct aspect ratio
                const placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                placeholder.style.aspectRatio = `${dimensions.width}/${dimensions.height}`;
                imageItem.appendChild(placeholder);

                // Calculate the grid row span based on aspect ratio
                // Using 10px grid-auto-rows, calculate how many rows this image should span
                const rowSpan = Math.ceil((dimensions.height / dimensions.width) * 10) + 1; // +1 for some margin
                imageItem.style.gridRowEnd = `span ${rowSpan}`;

                // Now add the item to the container after dimensions are known
                container.appendChild(imageItem);

                // Create the image element
                const img = document.createElement('img');
                img.alt = imageName;
                img.loading = 'lazy';
                img.style.opacity = '0'; // Start with invisible image

                // Add error handling for images
                img.onerror = () => {
                    img.src = '/No-Image-Placeholder.png';
                    img.style.opacity = '1';
                    placeholder.style.display = 'none';
                };

                // Add load event to smoothly transition from placeholder to image
                img.onload = () => {
                    img.style.opacity = '1';
                    placeholder.style.display = 'none';
                };

                // Set the src after setting up event handlers
                img.src = `/api/${imageName}`;

                imageItem.appendChild(img);

                // Add click event to show full-size image
                img.addEventListener('click', () => {
                    openModal(img.src);
                });
            });

            // Add loading indicator after all images are added, if there are more images
            if (!hasMoreImages) {
                document.getElementById('image-loading-status-container').innerHTML = '';
            }
        });
    }

    // Removed pagination controls in favor of infinite scroll

    // Function to load a specific page
    async function loadPage(page, append = false) {
        if (isLoading || (!append && !hasMoreImages)) return;

        isLoading = true;
        currentPage = page;

        const imageData = await fetchImages(page);

        if (imageData?.data?.length !== 0) {
            document.getElementById('image-loading-status-container').innerHTML = '<div class="loading">Loading images...</div>';
        }

        renderImages(imageData, append);
        isLoading = false;
    }

    // Function to load more images when scrolling
    function loadMoreImages() {
        if (!isLoading && hasMoreImages) {
            loadPage(currentPage + 1, true);
        }
    }

    // Add scroll event listener to load more images when user scrolls to bottom
    window.addEventListener('scroll', () => {
        // Check if user has scrolled to the bottom
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            loadMoreImages();
        }
    });

    // Initial load
    loadPage(currentPage);
});
