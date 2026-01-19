document.addEventListener('DOMContentLoaded', () => {
    updateHeader(); // Render header first

    let currentUserData = null; // Store current user info
    const categories = ["Electronics", "Keys", "Wallets", "Clothing", "Books", "Bags", "Other"];

    onUserChange(({ user, isUserLoading }) => {
        if (isUserLoading) {
            // Show loading indicator or block UI
            return;
        }
        if (!user) {
            // Not logged in, redirect to sign-in
            window.location.href = '/sign-in.html';
            return;
        }
        currentUserData = user;
    });

    const reportForm = document.getElementById('reportForm');
    const imageInput = document.getElementById('image');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const submitReportButton = document.getElementById('submitReportButton');

    // Populate category select options dynamically (if not hardcoded in HTML)
    const categorySelect = document.getElementById('category');
    if (categorySelect && categorySelect.options.length === 1) { // Only 'Select a category' exists
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    let previewImageSrc = null;

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                previewImageSrc = reader.result;
                // Updated to show a proper preview image with fitting classes
                imagePreviewContainer.innerHTML = `<img src="${previewImageSrc}" alt="Preview" class="max-h-48 w-auto rounded-md object-contain mx-auto block">`;
                imagePreviewContainer.style.padding = '0'; // Remove default padding when image is present
            };
            reader.readAsDataURL(file);
        } else {
            previewImageSrc = null;
            imagePreviewContainer.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mx-auto h-12 w-12 lucide-file-up">
                    <path d="M15 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 18v3m3-3v3m-6-3h12"></path>
                    <path d="M12 2v10"></path>
                    <path d="m15 9-3-3-3 3"></path>
                </svg>
                <p class="mt-2 font-semibold">Click or drag to upload</p>
                <p class="text-xs">PNG, JPG (max 1MB)</p>
            `;
            imagePreviewContainer.style.padding = '2rem'; // Restore default padding
        }
    });

    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Manual validation
        const name = document.getElementById('name').value;
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;
        const locationFound = document.getElementById('locationFound').value;
        const imageFile = imageInput.files?.[0]; // Image is now optional

        let isValid = true;

        // Hide all errors initially
        document.getElementById('nameError').classList.add('hidden');
        document.getElementById('descriptionError').classList.add('hidden');
        document.getElementById('categoryError').classList.add('hidden');
        document.getElementById('locationFoundError').classList.add('hidden');
        document.getElementById('imageError').classList.add('hidden');


        if (name.length < 3) {
            document.getElementById('nameError').classList.remove('hidden');
            isValid = false;
        }

        if (description.length < 10) {
            document.getElementById('descriptionError').classList.remove('hidden');
            isValid = false;
        }

        if (!category) {
            document.getElementById('categoryError').classList.remove('hidden');
            isValid = false;
        }

        if (locationFound.length < 3) {
            document.getElementById('locationFoundError').classList.remove('hidden');
            isValid = false;
        }

        if (!isValid) {
            createToast("Validation Error", "Please correct the form errors.", "destructive");
            return;
        }

        if (!currentUserData) {
            createToast("Authentication Error", "You must be logged in to report an item.", "destructive");
            return;
        }

        submitReportButton.disabled = true;
        submitReportButton.textContent = "Submitting...";

        try {
            let imageURL = '';
            if (imageFile) { // Only process image if a file was selected
                imageURL = await fileToDataUri(imageFile);
            }
            

            await addFirestoreDoc("found_items", {
                name: name,
                description: description,
                category: category,
                locationFound: locationFound,
                imageURL: imageURL, // Will be empty string if no image
                userId: currentUserData.uid,
                dateFound: new Date().toISOString(),
                status: "reported",
            });

            createToast("Report Submitted!", "Thank you for helping our community.");
            window.location.href = "/dashboard.html";
        } catch (error) {
            console.error("Error submitting report:", error);
            createToast("Submission Failed", error.message || "An unexpected error occurred. Please try again.", "destructive");
        } finally {
            submitReportButton.disabled = false;
            submitReportButton.textContent = "Submit Report";
        }
    });
});