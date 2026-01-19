// Global state for user and loading status
let currentUser = null;
let isAuthLoading = true;

const authListeners = []; // To notify components about auth state changes

// Listen for auth state changes
firebaseAuth.onAuthStateChanged(user => {
    currentUser = user;
    isAuthLoading = false;
    authListeners.forEach(listener => listener({ user, isUserLoading: false }));
    console.log("Auth state changed:", user ? user.email : "Logged out");
    updateHeader(); // Update header whenever auth state changes
});

// Function to subscribe to auth state
function onUserChange(callback) {
    authListeners.push(callback);
    callback({ user: currentUser, isUserLoading: isAuthLoading }); // Initial call
    return () => {
        const index = authListeners.indexOf(callback);
        if (index > -1) {
            authListeners.splice(index, 1);
        }
    };
}

async function signInUser(email, password) {
    try {
        await firebaseAuth.signInWithEmailAndPassword(email, password);
        createToast("Success!", "You have been signed in successfully.");
        // Redirection handled by onUserChange listener in page scripts
    } catch (error) {
        console.error("Sign-in error:", error);
        createToast("Sign-in failed", error.code === "auth/invalid-credential" ? "Invalid email or password." : "An unexpected error occurred. Please try again.", "destructive");
        throw error; // Re-throw to allow page-specific handling
    }
}

async function signUpUser(name, email, password) {
    try {
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        createToast("Account Created!", "Your account has been created successfully.");
        // Redirection handled by onUserChange listener in page scripts
    } catch (error) {
        console.error("Sign-up error:", error);
        createToast("Sign-up failed", error.code === "auth/email-already-in-use" ? "This email is already registered." : "An unexpected error occurred. Please try again.", "destructive");
        throw error; // Re-throw to allow page-specific handling
    }
}

async function signOutUser() {
    try {
        await firebaseAuth.signOut();
        createToast("Logged Out", "You have been successfully logged out.");
        window.location.href = '/sign-in.html'; // Direct redirect as per original Next.js code
    } catch (error) {
        console.error("Sign-out error:", error);
        createToast("Logout Failed", "An error occurred during logout.", "destructive");
        throw error;
    }
}

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await firebaseAuth.signInWithPopup(provider);
        createToast("Success!", "You have been signed in with Google.");
        // Redirection handled by onUserChange listener in page scripts
    } catch (error) {
        console.error("Google Sign-in error:", error);
        createToast("Google Sign-in failed", "Could not sign in with Google. Please try again.", "destructive");
        throw error;
    }
}

// Function to render/update the header dynamically
function updateHeader() {
    const headerElement = document.getElementById('main-header');
    if (!headerElement) return;

    headerElement.innerHTML = `
        <div class="container mx-auto flex h-16 items-center px-4 md-px-6">
            <a href="${currentUser ? "dashboard.html" : "index.html"}" class="logo">
                ${createClaimItLogo('h-6 w-6 text-primary').outerHTML}
                <span class="font-headline font-bold">ClaimIt</span>
            </a>
            <nav class="hidden md-flex items-center gap-4" id="main-nav">
                <!-- Navigation links will be injected here -->
            </nav>
            <div class="flex items-center justify-end space-x-4" id="auth-section" style="margin-left: auto;">
                <!-- Auth buttons/dropdown will be injected here -->
            </div>
        </div>
    `;

    const nav = headerElement.querySelector('#main-nav');
    const authSection = headerElement.querySelector('#auth-section');

    if (currentUser) {
        nav.classList.remove('hidden'); // Show nav for logged-in users
        nav.innerHTML = `
            <a href="dashboard.html" class="button button-ghost">Dashboard</a>
            <a href="report.html" class="button button-ghost">Report an Item</a>
            ${currentUser.email === 'admin@gmail.com' ? `<a href="admin.html" class="button button-ghost">Admin</a>` : ''}
        `;

        const getInitials = (name) => {
            if (!name) return "";
            const names = name.split(' ');
            if (names.length > 1) {
                return `${names[0][0]}${names[names.length - 1][0]}`;
            }
            return name.substring(0, 2).toUpperCase();
        };

        const avatarTrigger = createButton('', 'ghost', 'default', false, null, false, 'relative h-8 w-8 rounded-full');
        // Ensure that createAvatar uses the correct classes for styling
        const avatar = createAvatar(currentUser.photoURL, currentUser.displayName, getInitials(currentUser.displayName), 'h-8 w-8');
        avatarTrigger.appendChild(avatar);

        const dropdown = createDropdownMenu(avatarTrigger, [
            { label: currentUser.displayName, className: 'font-normal' },
            { label: currentUser.email, className: 'text-xs text-muted-foreground' },
            { label: "Log out", onClick: signOutUser }
        ]);
        
        authSection.appendChild(dropdown);

        // Add a visible Logout button for quicker access (desktop / mobile)
        const logoutButton = document.createElement('button');
        logoutButton.id = 'visibleLogoutButton';
        logoutButton.className = 'button button-destructive button-sm';
        logoutButton.textContent = 'Log out';
        logoutButton.addEventListener('click', signOutUser);
        authSection.appendChild(logoutButton);

    } else {
        nav.classList.add('hidden'); // Hide nav for logged-out users
        authSection.innerHTML = `
            <a href="sign-in.html" class="button button-ghost">Sign In</a>
            <a href="sign-up.html" class="button button-primary">Sign Up</a>
        `;
    }
}

// Expose helper so pages can require authentication and redirect automatically
function requireAuth(redirectTo = '/sign-in.html') {
    // If auth status already known, redirect immediately
    if (!isAuthLoading && !currentUser) {
        window.location.href = redirectTo;
        return;
    }
    // Otherwise wait for auth resolution
    onUserChange(({ user, isUserLoading }) => {
        if (!isUserLoading && !user) {
            window.location.href = redirectTo;
        }
    });
}

// Expose globally for page scripts
window.requireAuth = requireAuth;