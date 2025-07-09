document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias al DOM ---
    const restauranteForm = document.getElementById('restaurante-form');
    const restauranteNombreInput = document.getElementById('restaurante-nombre');
    const restauranteSlugInput = document.getElementById('restaurante-slug');
    const restauranteTelefonoInput = document.getElementById('restaurante-telefono');
    const restaurantesTableBody = document.querySelector('#restaurantes-table tbody');

    const usuarioForm = document.getElementById('usuario-form');
    const usuarioEmailInput = document.getElementById('usuario-email');
    const usuarioPasswordInput = document.getElementById('usuario-password');
    const usuarioRolSelect = document.getElementById('usuario-rol');
    const usuarioRestauranteSelect = document.getElementById('usuario-restaurante');
    const asignarRestauranteContainer = document.getElementById('asignar-restaurante-container');
    const usuariosTableBody = document.querySelector('#usuarios-table tbody');
    
    const qrcodeContainer = document.getElementById('qrcode-container');
    const qrcodeDiv = document.getElementById('qrcode');
    const qrLink = document.getElementById('qr-link');
    const downloadQrBtn = document.getElementById('download-qr-btn');

    // --- Función de Utilidad ---
    async function fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message);
            }
            return response.status !== 204 ? response.json() : null;
        } catch (error) {
            console.error('Error en fetchData:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // --- LÓGICA PARA RESTAURANTES ---
    async function loadRestaurantes() {
        const restaurantes = await fetchData('/api/restaurantes');
        restaurantesTableBody.innerHTML = '';
        usuarioRestauranteSelect.innerHTML = '<option value="">Seleccione un restaurante</option>';
        if (restaurantes) {
            restaurantes.forEach(r => {
                const row = restaurantesTableBody.insertRow();
                row.innerHTML = `
                    <td>${r.nombre}</td>
                    <td>${r.slug}</td>
                    <td>${r.telefono || ''}</td>
                    <td><button class="btn qr-btn" data-slug="${r.slug}" data-nombre="${r.nombre}">Generar QR</button></td>
                `;
                const option = document.createElement('option');
                option.value = r._id;
                option.textContent = r.nombre;
                usuarioRestauranteSelect.appendChild(option);
            });
        }
    }
    
    restaurantesTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('qr-btn')) {
            const slug = e.target.dataset.slug;
            const nombre = e.target.dataset.nombre;
            const url = `${window.location.origin}/r/${slug}`;

            qrcodeDiv.innerHTML = '';
            
            new QRCode(qrcodeDiv, {
                text: url,
                width: 256,
                height: 256,
                colorDark : "#002b4d",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });

            qrLink.href = url;
            qrLink.textContent = `Enlace para: ${nombre}`;
            downloadQrBtn.dataset.filename = `qr-${slug}.png`;
            qrcodeContainer.style.display = 'block';
            qrcodeContainer.scrollIntoView({ behavior: 'smooth' });
        }
    });

    downloadQrBtn.addEventListener('click', () => {
        const canvas = qrcodeDiv.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = downloadQrBtn.dataset.filename || 'codigo-qr.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    });

    restauranteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetchData('/api/restaurantes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: restauranteNombreInput.value,
                slug: restauranteSlugInput.value,
                telefono: restauranteTelefonoInput.value
            })
        });
        restauranteForm.reset();
        loadRestaurantes();
    });

    // --- LÓGICA PARA USUARIOS ---
    usuarioRolSelect.addEventListener('change', () => {
        asignarRestauranteContainer.style.display = usuarioRolSelect.value === 'admin_restaurante' ? 'block' : 'none';
    });
    
    async function loadUsers() {
        const users = await fetchData('/api/usuarios');
        usuariosTableBody.innerHTML = '';
        if(users) {
            users.forEach(user => {
                const row = usuariosTableBody.insertRow();
                row.innerHTML = `<td>${user.email}</td><td>${user.rol}</td><td>${user.restaurante ? user.restaurante.nombre : 'N/A'}</td>`;
            });
        }
    }

    usuarioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetchData('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: usuarioEmailInput.value,
                password: usuarioPasswordInput.value,
                rol: usuarioRolSelect.value,
                restaurante: usuarioRolSelect.value === 'admin_restaurante' ? usuarioRestauranteSelect.value : null
            })
        });
        usuarioForm.reset();
        loadUsers();
    });

    // --- Carga Inicial ---
    loadRestaurantes();
    loadUsers();
    // Aseguramos que el contenedor de restaurante se muestre si el rol por defecto lo requiere
    if (usuarioRolSelect.value === 'admin_restaurante') {
        asignarRestauranteContainer.style.display = 'block';
    } else {
        asignarRestauranteContainer.style.display = 'none';
    }
});