// A very simplified toast function for basic notifications
function createToast(title, description, variant = 'default') {
    const toastContainer = document.getElementById('toast-container') || (() => {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'toast-container';
        document.body.appendChild(div);
        return div;
    })();

    const toastDiv = document.createElement('div');
    toastDiv.className = `toast ${variant}`;
    toastDiv.innerHTML = `
        <div>
            <div style="font-weight: bold; margin-bottom: 0.25rem;">${title}</div>
            <div style="font-size: 0.9em;">${description}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;

    toastContainer.prepend(toastDiv); // Add to top

    toastDiv.querySelector('.toast-close').addEventListener('click', () => {
        toastDiv.remove();
    });

    setTimeout(() => {
        toastDiv.remove();
    }, 5000); // Remove after 5 seconds
}

// Function to convert a File to a compressed Base64 data URI (simplified)
function fileToDataUri(file, maxSize = 600) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    return reject(new Error("Failed to get canvas context"));
                }

                let { width, height } = img;
                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Get the data URI from the canvas
                const dataUri = canvas.toDataURL(file.type, 0.7); // 0.7 quality
                resolve(dataUri);
            };
            img.onerror = reject;
            if (event.target && event.target.result) {
                img.src = event.target.result;
            } else {
                reject(new Error("FileReader did not load the image correctly."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}