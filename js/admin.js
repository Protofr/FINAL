document.addEventListener('DOMContentLoaded', () => {
    updateHeader(); // Render header first

    const adminTabsList = document.getElementById('adminTabsList');
    const tabsContentContainer = document.getElementById('tabsContentContainer');

    let currentUserData = null;
    let allClaims = [];

    // Helper: create a dialog to get a reason from the admin
    function showReasonDialog(title, message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '1000';

        const dialogContent = document.createElement('div');
        dialogContent.className = 'dialog-content';
        dialogContent.style.backgroundColor = 'white';
        dialogContent.style.borderRadius = '8px';
        dialogContent.style.padding = '24px';
        dialogContent.style.maxWidth = '400px';
        dialogContent.style.width = '90%';
        dialogContent.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

        const dialogHeader = document.createElement('div');
        dialogHeader.className = 'dialog-header';
        dialogHeader.innerHTML = `<h2 class="dialog-title" style="font-size: 1.25rem; font-weight: 600; margin: 0 0 8px 0;">${title}</h2><p class="dialog-description" style="color: #666; margin: 0 0 16px 0;">${message}</p>`;

        const textarea = document.createElement('textarea');
        textarea.className = 'form-textarea';
        textarea.placeholder = 'Enter your reason here...';
        textarea.style.width = '100%';
        textarea.style.padding = '8px';
        textarea.style.borderRadius = '4px';
        textarea.style.border = '1px solid #ddd';
        textarea.style.minHeight = '120px';
        textarea.style.fontFamily = 'inherit';
        textarea.style.marginBottom = '16px';
        textarea.required = true;

        const dialogFooter = document.createElement('div');
        dialogFooter.className = 'dialog-footer';
        dialogFooter.style.display = 'flex';
        dialogFooter.style.gap = '8px';
        dialogFooter.style.justifyContent = 'flex-end';

        const cancelButton = createButton('Cancel', 'outline', 'default', false, () => {
            overlay.remove();
            if (onCancel) onCancel();
        });
        cancelButton.style.minWidth = '100px';
        dialogFooter.appendChild(cancelButton);

        const confirmButton = createButton('Confirm', 'primary', 'default', false, async () => {
            const reason = textarea.value.trim();
            if (!reason) {
                createToast("Validation Error", "Please enter a reason.", "destructive");
                return;
            }
            overlay.remove();
            if (onConfirm) await onConfirm(reason);
        });
        confirmButton.style.minWidth = '100px';
        dialogFooter.appendChild(confirmButton);

        dialogContent.appendChild(dialogHeader);
        dialogContent.appendChild(textarea);
        dialogContent.appendChild(dialogFooter);
        overlay.appendChild(dialogContent);
        document.body.appendChild(overlay);

        // Focus on textarea
        textarea.focus();
    }


        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div style="flex:1">
                <strong style="display:block;margin-bottom:6px">${title}</strong>
                <div style="font-size:0.95rem;color:var(--toast-text, #fff)">${message}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-left:12px">
                <button class="button button-destructive button-sm" style="min-width:88px">${confirmText}</button>
                <button class="button button-ghost button-sm" style="min-width:88px">${cancelText}</button>
            </div>
        `;

        const [confirmBtn, cancelBtn] = toast.querySelectorAll('button');

        let removed = false;
        function removeToast() {
            if (removed) return;
            removed = true;
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 200);
        }

        confirmBtn.addEventListener('click', async () => {
            try {
                confirmBtn.disabled = true;
                cancelBtn.disabled = true;
                await onConfirm();
            } finally {
                removeToast();
            }
        });

        cancelBtn.addEventListener('click', () => {
            try { onCancel(); } finally { removeToast(); }
        });

        container.appendChild(toast);

        // Auto-dismiss after timeout (unless user interacts)
        const autoDismiss = setTimeout(() => removeToast(), timeout);

        // Clear auto-dismiss if user hovers (keep visible)
        toast.addEventListener('mouseenter', () => clearTimeout(autoDismiss));
        toast.addEventListener('focusin', () => clearTimeout(autoDismiss));
    }

    function ClaimCard({ claim, onUpdate }) {
        const card = document.createElement('div');
        card.className = 'card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';
        const cardTitle = document.createElement('div');
        cardTitle.className = 'card-title text-lg';
        cardTitle.textContent = claim.itemName;
        cardHeader.appendChild(cardTitle);
        card.appendChild(cardHeader);

        const cardContent = document.createElement('div');
        cardContent.className = 'card-content space-y-4';
        let contentHTML = `
            <div class="relative aspect-4-3 w-full">
                <img src="${claim.itemImage}" alt="${claim.itemName}" class="rounded-md object-cover" />
            </div>
            <div>
                <p class="text-sm font-semibold">Claim Reason:</p>
                <p class="text-sm text-muted-foreground">${claim.claimReason}</p>
            </div>
            <div>
                <p class="text-sm font-semibold">Contact:</p>
                <p class="text-sm text-muted-foreground">${claim.contactInformation}</p>
            </div>`;
        
        // Add admin reason if it exists
        if (claim.adminReason) {
            contentHTML += `
            <div>
                <p class="text-sm font-semibold">Admin Reason:</p>
                <p class="text-sm text-muted-foreground">${claim.adminReason}</p>
            </div>`;
        }
        
        cardContent.innerHTML = contentHTML;
        card.appendChild(cardContent);

        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer flex justify-between';

        const badgeVariant = claim.status === 'Pending' ? 'secondary' : (claim.status === 'Approved' ? 'default' : 'destructive');
        const statusBadge = createBadge(claim.status, badgeVariant);
        cardFooter.appendChild(statusBadge);

        if (claim.status === 'Pending') {
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'flex gap-2';

            const rejectButton = createButton('Reject', 'outline', 'sm', false, async () => {
                rejectButton.disabled = true;
                approveButton.disabled = true;
                // Show dialog for rejection reason
                showReasonDialog('Reject Claim', 'Please provide a reason for rejection:', async (reason) => {
                    await handleUpdateStatus('Rejected', claim.foundItemId, claim.id, onUpdate, reason);
                }, () => {
                    rejectButton.disabled = false;
                    approveButton.disabled = false;
                });
            });
            buttonGroup.appendChild(rejectButton);

            const approveButton = createButton('Approve', 'primary', 'sm', false, async () => {
                rejectButton.disabled = true;
                approveButton.disabled = true;
                // Show dialog for approval reason
                showReasonDialog('Approve Claim', 'Please provide a reason for approval:', async (reason) => {
                    await handleUpdateStatus('Approved', claim.foundItemId, claim.id, onUpdate, reason);
                }, () => {
                    rejectButton.disabled = false;
                    approveButton.disabled = false;
                });
            });
            buttonGroup.appendChild(approveButton);
            cardFooter.appendChild(buttonGroup);
        }
        card.appendChild(cardFooter);
        return card;
    }

    async function handleUpdateStatus(status, foundItemId, claimId, onUpdate, reason = '') {
        const claimDocRef = firebaseFirestore.collection('found_items').doc(foundItemId).collection('claims').doc(claimId);

        try {
            const updateData = { status: status };
            if (reason) {
                updateData.adminReason = reason;
            }
            await updateFirestoreDoc(claimDocRef.parent.path, claimId, updateData);

            if (status === 'Approved') {
                const itemDocRef = firebaseFirestore.collection('found_items').doc(foundItemId);
                await deleteFirestoreDoc(itemDocRef.parent.path, foundItemId);
                
                // Optimistically update UI before fetching
                allClaims = allClaims.map(claim => {
                    if (claim.id === claimId) {
                        return { ...claim, status: status, adminReason: reason };
                    }
                    return claim;
                });
                renderTabsContent(); // Re-render immediately
                
                createToast("Claim Approved & Item Removed", "The item has been removed from the dashboard.");
            } else {
                // Same optimistic update for rejections
                allClaims = allClaims.map(claim => {
                    if (claim.id === claimId) {
                        return { ...claim, status: status, adminReason: reason };
                    }
                    return claim;
                });
                renderTabsContent();
                
                createToast("Claim Rejected", "The claim status has been updated.");
            }
            
            // Still fetch in background to ensure consistency
            fetchClaims();
        } catch (error) {
            console.error(`Error updating claim to ${status}:`, error);
            createToast("Update Failed", `Could not ${status.toLowerCase()} the claim.`, "destructive");
        }
    }


    async function fetchClaims() {
        tabsContentContainer.innerHTML = '<p>Loading claims...</p>';
        try {
            // Firestore collectionGroup query for 'claims' subcollections
            const claimsQuery = firebaseFirestore.collectionGroup('claims');
            const claimsData = await getFirestoreCollection(claimsQuery, true); // true for collectionGroup

            allClaims = claimsData;
            renderTabsContent(); // Re-render content after fetching
        } catch (error) {
            console.error("Error fetching claims:", error);
            tabsContentContainer.innerHTML = `
                <div class="rounded-md bg-destructive/10 p-4 text-destructive" style="background-color: rgba(220,53,69,0.1); color: #dc3545; padding: 1rem; border-radius: 6px;">
                    <p><strong>Error:</strong> Failed to load claims. Check console for details.</p>
                </div>
            `;
        }
    }

    async function handleClearHistory(status) {
        const claimsToDelete = allClaims.filter(c => c.status === status);
        if (claimsToDelete.length === 0) {
            createToast(`No ${status.toLowerCase()} history to clear.`);
            return;
        }

        // Replace native confirm() with an action toast in the bottom-right
        showConfirmToast({
            title: `Clear ${status} History`,
            message: `Are you sure you want to clear all ${status.toLowerCase()} claims?`,
            confirmText: 'Clear',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    const operations = claimsToDelete.map(claim => ({
                        type: 'delete',
                        ref: firebaseFirestore.collection('found_items').doc(claim.foundItemId).collection('claims').doc(claim.id)
                    }));
                    await executeBatch(operations);

                    createToast("History Cleared", `All ${status.toLowerCase()} claims have been deleted.`);
                    await fetchClaims(); // Refresh the claims list
                } catch (error) {
                    console.error(`Error clearing ${status.toLowerCase()} history:`, error);
                    createToast("Deletion Failed", `Could not clear ${status.toLowerCase()} history.`, "destructive");
                }
            },
            onCancel: () => {
                createToast("Cancelled", "No changes were made.");
            },
            cancelButtonClass: 'button-cancel', // Add this line
        });
    }


    let currentTab = 'pending';

    function renderTabsContent() {
        const pendingClaims = allClaims.filter(c => c.status === 'Pending');
        const approvedClaims = allClaims.filter(c => c.status === 'Approved');
        const rejectedClaims = allClaims.filter(c => c.status === 'Rejected');

        const tabsData = [
            { label: `Pending Claims (${pendingClaims.length})`, value: 'pending', claims: pendingClaims },
            { label: `Approved History (${approvedClaims.length})`, value: 'approved', claims: approvedClaims },
            { label: `Rejected History (${rejectedClaims.length})`, value: 'rejected', claims: rejectedClaims },
        ];

        adminTabsList.innerHTML = ''; // Clear previous tabs
        tabsContentContainer.innerHTML = ''; // Clear previous content

        tabsData.forEach(tab => {
            const trigger = document.createElement('button');
            trigger.className = `tabs-trigger ${tab.value === currentTab ? 'active' : ''}`;
            trigger.textContent = tab.label;
            trigger.addEventListener('click', () => {
                currentTab = tab.value;
                renderTabsContent(); // Re-render to update active state and content
            });
            adminTabsList.appendChild(trigger);
        });

        // Render content for the active tab
        const activeTabData = tabsData.find(t => t.value === currentTab);
        if (activeTabData) {
            const contentDiv = document.createElement('div');
            contentDiv.className = 'tabs-content';

            if (activeTabData.value === 'approved' || activeTabData.value === 'rejected') {
                 const clearButtonContainer = document.createElement('div');
                 clearButtonContainer.className = 'mb-4 flex justify-end';
                 const clearButton = createButton(
                     `Clear ${activeTabData.value === 'approved' ? 'Approved' : 'Rejected'} History`,
                     'destructive',
                     'default',
                     false,
                     () => handleClearHistory(activeTabData.value === 'approved' ? 'Approved' : 'Rejected'),
                     activeTabData.claims.length === 0 // Disable if no claims to clear
                 );
                 clearButtonContainer.appendChild(clearButton);
                 contentDiv.appendChild(clearButtonContainer);
            }

            if (activeTabData.claims.length > 0) {
                const grid = document.createElement('div');
                grid.className = 'grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6';
                activeTabData.claims.forEach(claim => {
                    grid.appendChild(ClaimCard({ claim: claim, onUpdate: fetchClaims }));
                });
                contentDiv.appendChild(grid);
            } else {
                contentDiv.innerHTML += `<p>No ${activeTabData.value.replace('History', 'claims').toLowerCase()} yet.</p>`;
            }
            tabsContentContainer.appendChild(contentDiv);
        }
    }


    // Auth check and initial load
    onUserChange(async ({ user, isUserLoading }) => {
        if (isUserLoading) {
            tabsContentContainer.innerHTML = createSkeleton('100%', '200px').outerHTML;
            return;
        }

        if (!user || user.email !== 'admin@gmail.com') {
            window.location.href = '/dashboard.html'; // Redirect non-admin users
            return;
        }

        currentUserData = user;
        await fetchClaims(); // Fetch and render claims
    });
});