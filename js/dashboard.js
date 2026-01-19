document.addEventListener("DOMContentLoaded", () => {
  updateHeader(); // Render header first

  const dashboardContent = document.getElementById("dashboard-content");
  const adminButtonContainer = document.getElementById(
    "admin-button-container"
  );
  const notificationsSection = document.getElementById("notifications-section");

  let currentUserData = null; // Store current user info
  let foundItems = []; // Store fetched items
  let claimDialogInstance = null; // Keep track of the currently open dialog

  // Function to fetch and display user notifications
  async function fetchUserNotifications() {
    if (!currentUserData) return;

    try {
      // Fetch all claims made by the user
      const claimsQuery = firebaseFirestore.collectionGroup('claims').where('userId', '==', currentUserData.uid);
      const userClaims = await getFirestoreCollection(claimsQuery, true);

      // Filter for non-pending claims (Approved or Rejected)
      const notifications = userClaims.filter(claim => claim.status !== 'Pending');

      notificationsSection.innerHTML = '';

      if (notifications.length > 0) {
        const notificationsContainer = document.createElement('div');
        notificationsContainer.className = 'mb-8';
        
        const title = document.createElement('h2');
        title.className = 'font-headline text-xl font-bold mb-4';
        title.textContent = 'Your Claim Status';
        notificationsContainer.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

        notifications.forEach(notification => {
          const card = document.createElement('div');
          card.className = `card border-l-4 ${notification.status === 'Approved' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`;
          
          const cardContent = document.createElement('div');
          cardContent.className = 'card-content';
          
          const statusTitle = document.createElement('h3');
          statusTitle.className = `font-semibold text-lg ${notification.status === 'Approved' ? 'text-green-800' : 'text-red-800'}`;
          statusTitle.textContent = notification.itemName;
          cardContent.appendChild(statusTitle);

          const statusDiv = document.createElement('div');
          statusDiv.className = 'mt-2';
          const statusLabel = document.createElement('p');
          statusLabel.className = 'text-sm font-semibold';
          statusLabel.innerHTML = `Status: <span class="${notification.status === 'Approved' ? 'text-green-700' : 'text-red-700'}">${notification.status}</span>`;
          statusDiv.appendChild(statusLabel);

          if (notification.adminReason) {
            const reasonDiv = document.createElement('div');
            reasonDiv.className = 'mt-3 p-3 rounded bg-white/60';
            const reasonLabel = document.createElement('p');
            reasonLabel.className = 'text-xs font-semibold text-gray-600 mb-1';
            reasonLabel.textContent = 'Admin Reason:';
            const reasonText = document.createElement('p');
            reasonText.className = `text-sm ${notification.status === 'Approved' ? 'text-green-700' : 'text-red-700'}`;
            reasonText.textContent = notification.adminReason;
            reasonDiv.appendChild(reasonLabel);
            reasonDiv.appendChild(reasonText);
            statusDiv.appendChild(reasonDiv);
          }

          cardContent.appendChild(statusDiv);
          card.appendChild(cardContent);
          grid.appendChild(card);
        });

        notificationsContainer.appendChild(grid);
        notificationsSection.appendChild(notificationsContainer);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  // Function to render the loading skeleton
  function renderSkeleton() {
    dashboardContent.innerHTML = "";
    const grid = document.createElement("div");
    grid.className =
      "grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 xl-grid-cols-4 gap-6"; // Added gap for consistency
    for (let i = 0; i < 8; i++) {
      const card = document.createElement("div");
      card.className = "card overflow-hidden";
      card.innerHTML = `
                <div class="aspect-4-3 w-full skeleton-image skeleton"></div>
                <div class="card-content p-4">
                    <div class="skeleton skeleton-text" style="width: 75%; height: 1.5rem; margin-bottom: 0.5rem;"></div>
                    <div class="skeleton skeleton-text" style="width: 100%; height: 1rem;"></div>
                </div>
                <div class="card-footer flex justify-between p-4 pt-0">
                    <div class="skeleton skeleton-button" style="width: 5rem; height: 1.5rem;"></div>
                    <div class="skeleton skeleton-button" style="width: 4rem; height: 2rem;"></div>
                </div>
            `;
      grid.appendChild(card);
    }
    dashboardContent.appendChild(grid);
  }

  // Function to create a claim dialog
  function createClaimDialog(item, open, onOpenChange) {
    if (!open) {
      if (claimDialogInstance) {
        claimDialogInstance.remove();
        claimDialogInstance = null;
      }
      return;
    }

    if (claimDialogInstance) {
      claimDialogInstance.remove();
    }

    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";

    const dialogContent = document.createElement("div");
    dialogContent.className = "dialog-content";

    const dialogHeader = document.createElement("div");
    dialogHeader.className = "dialog-header";
    dialogHeader.innerHTML = `
            <h2 class="dialog-title">Claim: ${item.name}</h2>
            <p class="dialog-description">Please provide details to verify your ownership of the item.</p>
        `;

    const formElem = document.createElement("form");
    formElem.className = "space-y-4";
    formElem.id = "claimForm"; // Add an ID for easier access

    const claimReasonInput = createTextarea(
      "Describe the item in detail, including any unique identifying features.",
      "claimReason",
      ""
    );
    claimReasonInput.required = true;
    claimReasonInput.minLength = 10;
    const claimReasonGroup = createFormGroup(
      "Reason for Claiming",
      claimReasonInput
    );

    const contactInfoInput = createInput(
      "text",
      "Your email or phone number",
      "contactInformation",
      currentUserData ? currentUserData.email : ""
    );
    contactInfoInput.required = true;
    contactInfoInput.minLength = 5;
    const contactInfoGroup = createFormGroup(
      "Contact Information",
      contactInfoInput
    );

    const dialogFooter = document.createElement("div");
    dialogFooter.className = "dialog-footer";
    const cancelButton = createButton(
      "Cancel",
      "outline",
      "default",
      false,
      () => onOpenChange(false)
    );
    const submitButton = createButton(
      "Submit Claim",
      "primary",
      "default",
      false,
      null,
      false,
      "dialog-submit-button"
    );
    submitButton.type = "submit"; // Important for form submission

    dialogFooter.appendChild(cancelButton);
    dialogFooter.appendChild(submitButton);

    formElem.appendChild(claimReasonGroup);
    formElem.appendChild(contactInfoGroup);
    formElem.appendChild(dialogFooter);

    dialogContent.appendChild(dialogHeader);
    dialogContent.appendChild(formElem);

    const closeButton = document.createElement("button");
    closeButton.className = "dialog-close-button";
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", () => onOpenChange(false));
    dialogContent.appendChild(closeButton);

    overlay.appendChild(dialogContent);
    document.body.appendChild(overlay);

    claimDialogInstance = overlay; // Store reference to the dialog

    formElem.addEventListener("submit", async (e) => {
      e.preventDefault();
      const reason = claimReasonInput.value;
      const contact = contactInfoInput.value;

      if (reason.length < 10) {
        createToast(
          "Validation Error",
          "Please provide a detailed reason (at least 10 characters).",
          "destructive"
        );
        return;
      }
      if (contact.length < 5) {
        createToast(
          "Validation Error",
          "Please provide valid contact information (at least 5 characters).",
          "destructive"
        );
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";

      if (!currentUserData) {
        createToast(
          "Authentication Error",
          "You must be logged in to make a claim.",
          "destructive"
        );
        submitButton.disabled = false;
        submitButton.textContent = "Submit Claim";
        return;
      }

      try {
        // 1. Create the claim document
        const claimsCollectionRef = firebaseFirestore
          .collection("found_items")
          .doc(item.id)
          .collection("claims");
        const newClaim = {
          claimReason: reason,
          contactInformation: contact,
          foundItemId: item.id,
          userId: currentUserData.uid,
          status: "Pending",
          itemName: item.name,
          itemImage: item.imageURL,
        };
        await addFirestoreDoc(claimsCollectionRef.path, newClaim);

        // 2. Update the found_item document with the claimant's ID
        await updateFirestoreDoc("found_items", item.id, {
          claims: arrayUnion(currentUserData.uid),
        });

        createToast(
          "Claim submitted successfully!",
          "Your claim is pending review by an admin."
        ); // Added description
        onOpenChange(false); // Close dialog
        fetchFoundItems(); // Re-fetch items to update UI
      } catch (error) {
        console.error("Error submitting claim:", error);
        createToast(
          "Submission Failed",
          "An unexpected error occurred. Please try again.",
          "destructive"
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Claim";
      }
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        onOpenChange(false);
      }
    });
  }

  // Function to render a single found item card
  function renderFoundItemCard(item) {
    const card = document.createElement("div");
    card.className = "card overflow-hidden flex flex-col";

    const imageDiv = document.createElement("div");
    imageDiv.className = "relative aspect-4-3";
    // Add a placeholder if imageURL is empty
    imageDiv.innerHTML = `<img src="${
      item.imageURL || "/placeholder-image.svg"
    }" alt="${item.name}" class="object-cover rounded-md" />`;
    card.appendChild(imageDiv);

    const cardContent = document.createElement("div");
    cardContent.className = "card-content p-4 flex-grow";
    cardContent.innerHTML = `
            <h3 class="font-headline text-lg font-semibold truncate">${item.name}</h3>
            <p class="mt-1 text-sm text-muted-foreground line-clamp-2">${item.description}</p>
        `;
    card.appendChild(cardContent);

    const cardFooter = document.createElement("div");
    cardFooter.className =
      "card-footer flex justify-between items-center p-4 pt-0";

    const badge = createBadge(item.category, "secondary");
    cardFooter.appendChild(badge);

    const hasUserClaimed =
      item.claims &&
      currentUserData &&
      item.claims.includes(currentUserData.uid);
    const claimButton = createButton(
      hasUserClaimed ? "Reviewing" : "Claim",
      "primary",
      "sm",
      false,
      () =>
        createClaimDialog(item, true, (open) => {
          if (!open) createClaimDialog(item, false); // Close dialog
        }),
      hasUserClaimed
    );
    cardFooter.appendChild(claimButton);
    card.appendChild(cardFooter);

    return card;
  }

  // Function to fetch and render found items
  async function fetchFoundItems() {
    dashboardContent.innerHTML = ""; // Clear existing content
    renderSkeleton(); // Show skeleton while loading
    try {
      const items = await getFirestoreCollection(
        firebaseFirestore.collection("found_items").orderBy("dateFound", "desc")
      );
      foundItems = items; // Store items globally
      dashboardContent.innerHTML = ""; // Clear skeleton

      if (items.length > 0) {
        const grid = document.createElement("div");
        grid.className =
          "grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 xl-grid-cols-4 gap-6"; // Added gap for consistency
        items.forEach((item) => {
          grid.appendChild(renderFoundItemCard(item));
        });
        dashboardContent.appendChild(grid);
      } else {
        dashboardContent.innerHTML = `
                    <div class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-24 text-center">
                        <h2 class="font-headline text-2xl font-semibold">No Items Found</h2>
                        <p class="mt-2 text-muted-foreground">
                            It looks like there are no items reported right now. Be the first to report one!
                        </p>
                        <a href="report.html" class="button button-primary mt-4">Report a Found Item</a>
                    </div>
                `;
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      dashboardContent.innerHTML = `
                <div class="rounded-md bg-destructive/10 p-4 text-destructive" style="background-color: rgba(220,53,69,0.1); color: #dc3545; padding: 1rem; border-radius: 6px;">
                    <p><strong>Error:</strong> Failed to load items. Check console for details.</p>
                </div>
            `;
    }
  }

  // Auth check and initial load
  onUserChange(async ({ user, isUserLoading }) => {
    if (isUserLoading) {
      // Show loading indicator
      adminButtonContainer.innerHTML = createSkeleton(
        "6rem",
        "2.5rem",
        "rounded-md"
      ).outerHTML;
      renderSkeleton();
      return;
    }

    if (!user) {
      // Not logged in, redirect to sign-in
      window.location.href = "sign-in.html";
      return;
    }

    currentUserData = user; // Store user data

    // Render admin button if applicable
    if (user.email === "admin@gmail.com") {
      adminButtonContainer.innerHTML = `<a href="admin.html" class="button button-primary">Admin Dashboard</a>`;
    } else {
      adminButtonContainer.innerHTML = "";
    }

    // Fetch and render notifications
    await fetchUserNotifications();

    // Fetch and render items
    await fetchFoundItems();
  });
});
