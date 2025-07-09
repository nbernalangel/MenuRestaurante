document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del formulario
    const registerForm = document.getElementById('register-form');
    const messageContainer = document.getElementById('message-container');
    const submitButton = registerForm.querySelector('button[type="submit"]');

    // Escuchamos el evento 'submit' del formulario
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitamos que la página se recargue

        // Desactivamos el botón para evitar envíos múltiples
        submitButton.disabled = true;
        submitButton.textContent = 'Procesando...';
        
        // Creamos un objeto con los datos del formulario
        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        try {
            // Hacemos la petición POST a nuestro futuro endpoint en el backend
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                // Si todo salió bien (código 2xx)
                showMessage(result.message, 'success');
                
                // Esperamos un par de segundos para que el usuario lea el mensaje
                setTimeout(() => {
                    // Redirigimos al usuario a la página de verificación, pasando el email en la URL
                    window.location.href = `/verify.html?email=${encodeURIComponent(data.email)}`;
                }, 2000);

            } else {
                // Si hubo un error (código 4xx o 5xx)
                throw new Error(result.message || 'Ocurrió un error desconocido.');
            }

        } catch (error) {
            // Si hay un error de red o el servidor falló
            showMessage(error.message, 'danger');
            // Habilitamos el botón de nuevo para que pueda intentarlo otra vez
            submitButton.disabled = false;
            submitButton.textContent = 'Crear Cuenta';
        }
    });

    // Función para mostrar mensajes al usuario
    function showMessage(message, type) {
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';
        // Usamos las variables de color de tu CSS
        if (type === 'success') {
            messageContainer.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
            messageContainer.style.color = '#155724';
        } else {
            messageContainer.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
            messageContainer.style.color = '#721c24';
        }
    }
});