document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const restauranteNombreInput = document.getElementById('restaurante-nombre');
    const restauranteSlugInput = document.getElementById('restaurante-slug');
    
    // Función para generar un 'slug' a partir del nombre del restaurante
    function generarSlug(texto) {
        return texto.toString().toLowerCase()
            .normalize('NFD') // Quitar acentos
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-') // Reemplazar espacios con -
            .replace(/[^\w\-]+/g, '') // Quitar caracteres especiales
            .replace(/\-\-+/g, '-') // Reemplazar guiones dobles por uno
            .replace(/^-+/, '') // Quitar guiones del inicio
            .replace(/-+$/, ''); // Quitar guiones del final
    }

    // Actualizar el slug automáticamente mientras se escribe el nombre
    restauranteNombreInput.addEventListener('input', () => {
        restauranteSlugInput.value = generarSlug(restauranteNombreInput.value);
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            restaurante: {
                nombre: document.getElementById('restaurante-nombre').value,
                slug: document.getElementById('restaurante-slug').value,
                telefono: document.getElementById('restaurante-telefono').value
            },
            usuario: {
                email: document.getElementById('usuario-email').value,
                password: document.getElementById('usuario-password').value
            }
        };

        try {
            const response = await fetch('/api/public-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error en el registro.');
            }

            alert('¡Registro exitoso! Ya puedes iniciar sesión.');
            window.location.href = '/login.html';

        } catch (error) {
            console.error('Error de registro:', error);
            alert(`Error: ${error.message}`);
        }
    });
});