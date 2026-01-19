document.addEventListener('DOMContentLoaded', () => {
    updateHeader(); // Render header first

    onUserChange(({ user, isUserLoading }) => {
        if (!isUserLoading && user) {
            // User is logged in, redirect to dashboard
            window.location.href = '/dashboard.html';
        }
    });

    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = e.target.name.value;
            const email = e.target.email.value;
            const password = e.target.password.value;
            const signUpButton = document.getElementById('signUpButton');

            signUpButton.disabled = true;
            signUpButton.textContent = "Creating Account...";

            try {
                await signUpUser(name, email, password);
                // Redirection handled by auth.js on successful sign-up
            } catch (error) {
                // Error toast handled by auth.js
                signUpButton.disabled = false;
                signUpButton.textContent = "Create Account";
            }
        });
    }

    const googleSignInButton = document.getElementById('googleSignInButton');
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', async () => {
            const signUpButton = document.getElementById('signUpButton');
            signUpButton.disabled = true;
            googleSignInButton.disabled = true;
            googleSignInButton.textContent = "Signing Up..."; // Changed text for sign-up context

            try {
                await signInWithGoogle(); // Uses signInWithGoogle from auth.js
                // Redirection handled by auth.js on successful sign-in/up
            } catch (error) {
                // Error toast handled by auth.js
                signUpButton.disabled = false;
                googleSignInButton.disabled = false;
                // Restore original Google button content
                googleSignInButton.innerHTML = getGoogleButtonInnerHTML();
            }
        });

        // Ensure consistent icon/text and accessible structure
        googleSignInButton.innerHTML = getGoogleButtonInnerHTML();
        googleSignInButton.classList.add('flex', 'items-center', 'justify-center');
    }
});