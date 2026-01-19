document.addEventListener('DOMContentLoaded', () => {
    updateHeader(); // Render header first

    const adminTabsList = document.getElementById('adminTabsList');
    const tabsContentContainer = document.getElementById('tabsContentContainer');

    let currentUserData = null;
    let allClaims = [];

    // Helper: create a confirmation toast in bottom-right with action buttons
    function showConfirmToast({ title = "Confirm", message = "", confirmText = "Confirm", cancelText = "Cancel", onConfirm = () => {}, onCancel = () => {}, timeout = 12000 } = {}) {
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
        cardContent.innerHTML = `
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
            </div>
        `;
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
                await handleUpdateStatus('Rejected', claim.foundItemId, claim.id, onUpdate);
                rejectButton.disabled = false;
                approveButton.disabled = false;
            });
            buttonGroup.appendChild(rejectButton);

            const approveButton = createButton('Approve', 'primary', 'sm', false, async () => {
                rejectButton.disabled = true;
                approveButton.disabled = true;
                await handleUpdateStatus('Approved', claim.foundItemId, claim.id, onUpdate);
                rejectButton.disabled = false;
                approveButton.disabled = false;
            });
            buttonGroup.appendChild(approveButton);
            cardFooter.appendChild(buttonGroup);
        }
        card.appendChild(cardFooter);
        return card;
    }

    async function handleUpdateStatus(status, foundItemId, claimId, onUpdate) {
        const claimDocRef = firebaseFirestore.collection('found_items').doc(foundItemId).collection('claims').doc(claimId);

        try {
            await updateFirestoreDoc(claimDocRef.parent.path, claimId, { status: status });

            if (status === 'Approved') {
                const itemDocRef = firebaseFirestore.collection('found_items').doc(foundItemId);
                await deleteFirestoreDoc(itemDocRef.parent.path, foundItemId);
                
                // Optimistically update UI before fetching
                allClaims = allClaims.map(claim => {
                    if (claim.id === claimId) {
                        return { ...claim, status: status };
                    }
                    return claim;
                });
                renderTabsContent(); // Re-render immediately
                
                createToast("Claim Approved & Item Removed", "The item has been removed from the dashboard.");
            } else {
                // Same optimistic update for rejections
                allClaims = allClaims.map(claim => {
                    if (claim.id === claimId) {
                        return { ...claim, status: status };
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