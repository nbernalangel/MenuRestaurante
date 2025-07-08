document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al iniciar sesión');
            }

            const userData = await response.json();
            
            // Guardamos los datos del usuario en el navegador
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Redirigimos al panel de administrador
            window.location.href = '/admin.html';

        } catch (error) {
            console.error('Error de login:', error);
            alert(`Error: ${error.message}`);
        }
    });
});