document.addEventListener('DOMContentLoaded', () => {
    updateHeader(); // Render header first

    onUserChange(({ user, isUserLoading }) => {
        if (!isUserLoading && user) {
            // User is logged in, redirect to dashboard
            window.location.href = '/dashboard.html';
        }
    });

    const signInForm = document.getElementById('signInForm');
    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            const signInButton = document.getElementById('signInButton');

            signInButton.disabled = true;
            signInButton.textContent = "Signing In...";

            try {
                await signInUser(email, password);
                // Redirection handled by auth.js on successful sign-in
            } catch (error) {
                // Error toast handled by auth.js
                signInButton.disabled = false;
                signInButton.textContent = "Sign In";
            }
        });
    }

});