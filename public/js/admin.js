document.addEventListener('DOMContentLoaded', () => {
    // 1. AUTENTICACIÓN
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.restauranteId) {
        alert('No tienes permiso. Por favor, inicia sesión.');
        window.location.href = '/login.html';
        return;
    }
    const RESTAURANTE_ID = userData.restauranteId;
    let allMenuCategories = [];

    // 2. REFERENCIAS AL DOM
    const adminRestauranteNombre = document.getElementById('admin-restaurante-nombre');
    const logoutBtn = document.getElementById('logout-btn');
    const editRestauranteForm = document.getElementById('edit-restaurante-form');
    const editRestauranteNombreInput = document.getElementById('edit-restaurante-nombre');
    const editRestauranteTelefonoInput = document.getElementById('edit-restaurante-telefono');
    
    const platoForm = document.getElementById('plato-form');
    const platoIdInput = document.getElementById('plato-id');
    const platoNombreInput = document.getElementById('plato-nombre');
    const platoDescripcionInput = document.getElementById('plato-descripcion');
    const platoPrecioInput = document.getElementById('plato-precio');
    const platoCategoriaInput = document.getElementById('plato-categoria');
    const platosTableBody = document.querySelector('#platos-table tbody');
    
    const especialForm = document.getElementById('especial-form');
    const especialIdInput = document.getElementById('especial-id');
    const especialNombreInput = document.getElementById('especial-nombre');
    const especialDescripcionInput = document.getElementById('especial-descripcion');
    const especialPrecioInput = document.getElementById('especial-precio');
    const especialesTableBody = document.querySelector('#especiales-table tbody');

    const categoriaForm = document.getElementById('categoria-form');
    const categoriaIdInput = document.getElementById('categoria-id');
    const categoriaNombreInput = document.getElementById('categoria-nombre');
    const opcionesContainer = document.getElementById('opciones-container');
    const addOpcionBtn = document.getElementById('add-opcion-btn');
    const categoriasTableBody = document.querySelector('#categorias-table tbody');
    
    const menuDiaForm = document.getElementById('menu-dia-form');
    const menuDiaIdInput = document.getElementById('menu-dia-id');
    const menuFechaInput = document.getElementById('menu-fecha');
    const menuNombreInput = document.getElementById('menu-nombre');
    const menuPrecioInput = document.getElementById('menu-precio');
    const menuItemsSelectionContainer = document.getElementById('menu-items-selection-container');
    const menusDiaTableBody = document.querySelector('#menus-dia-table tbody');
    
    // 3. LÓGICA PRINCIPAL
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
            throw error;
        }
    }

    if (userData.nombreRestaurante) {
        adminRestauranteNombre.textContent = `Gestionando: ${userData.nombreRestaurante}`;
    }
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userData');
        window.location.href = '/login.html';
    });

    async function loadRestauranteData() {
        try {
            const restaurante = await fetchData(`/api/restaurantes/${RESTAURANTE_ID}`);
            if (restaurante) {
                editRestauranteNombreInput.value = restaurante.nombre;
                editRestauranteTelefonoInput.value = restaurante.telefono;
                adminRestauranteNombre.textContent = `Gestionando: ${restaurante.nombre}`;
            }
        } catch (error) {}
    }
    editRestauranteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = { nombre: editRestauranteNombreInput.value, telefono: editRestauranteTelefonoInput.value };
        try {
            const updated = await fetchData(`/api/restaurantes/${RESTAURANTE_ID}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            alert('Datos actualizados.');
            adminRestauranteNombre.textContent = `Gestionando: ${updated.nombre}`;
        } catch(e) {}
    });

    async function loadPlatos() {
        const platos = await fetchData(`/api/platos/restaurante/${RESTAURANTE_ID}`);
        platosTableBody.innerHTML = '';
        if(platos) platos.forEach(p => {
            const row = platosTableBody.insertRow();
            row.innerHTML = `<td>${p.nombre}</td><td>$${p.precio.toFixed(2)}</td><td>${p.categoria}</td><td><label class="switch"><input type="checkbox" class="toggle-disponibilidad" data-id="${p._id}" data-tipo="platos" ${p.disponible ? 'checked' : ''}><span class="slider"></span></label></td><td><button class="edit-plato btn" data-id='${p._id}'>E</button><button class="delete-plato btn btn-danger" data-id='${p._id}'>X</button></td>`;
        });
    }
    platoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = { nombre: platoNombreInput.value, descripcion: platoDescripcionInput.value, precio: parseFloat(platoPrecioInput.value), categoria: platoCategoriaInput.value, restaurante: RESTAURANTE_ID };
        const id = platoIdInput.value;
        await fetchData(id ? `/api/platos/${id}` : '/api/platos', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        platoForm.reset(); platoIdInput.value = ''; loadPlatos();
    });
    platosTableBody.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('toggle-disponibilidad')) { await fetchData(`/api/platos/${id}/toggle`, { method: 'PATCH' }); }
        else if (e.target.classList.contains('edit-plato')) {
            const p = await fetchData(`/api/platos/${id}`);
            platoIdInput.value = p._id; platoNombreInput.value = p.nombre; platoDescripcionInput.value = p.descripcion; platoPrecioInput.value = p.precio; platoCategoriaInput.value = p.categoria;
        } else if (e.target.classList.contains('delete-plato')) {
            if (confirm('¿Seguro?')) { await fetchData(`/api/platos/${id}`, { method: 'DELETE' }); loadPlatos(); }
        }
    });
    
    async function loadEspeciales() {
        const especiales = await fetchData(`/api/especiales/restaurante/${RESTAURANTE_ID}`);
        especialesTableBody.innerHTML = '';
        if(especiales) especiales.forEach(e => {
            const row = especialesTableBody.insertRow();
            row.innerHTML = `<td>${e.nombre}</td><td>$${e.precio.toFixed(2)}</td><td><label class="switch"><input type="checkbox" class="toggle-disponibilidad" data-id="${e._id}" data-tipo="especiales" ${e.disponible ? 'checked' : ''}><span class="slider"></span></label></td><td><button class="edit-especial btn" data-id='${e._id}'>E</button><button class="delete-especial btn btn-danger" data-id='${e._id}'>X</button></td>`;
        });
    }
    especialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = { nombre: especialNombreInput.value, descripcion: especialDescripcionInput.value, precio: parseFloat(especialPrecioInput.value), restaurante: RESTAURANTE_ID };
        const id = especialIdInput.value;
        await fetchData(id ? `/api/especiales/${id}` : '/api/especiales', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        especialForm.reset(); especialIdInput.value = ''; loadEspeciales();
    });
    especialesTableBody.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('toggle-disponibilidad')) { await fetchData(`/api/especiales/${id}/toggle`, { method: 'PATCH' }); }
        else if (e.target.classList.contains('edit-especial')) {
            const esp = await fetchData(`/api/especiales/${id}`);
            especialIdInput.value = esp._id; especialNombreInput.value = esp.nombre; especialDescripcionInput.value = esp.descripcion; especialPrecioInput.value = esp.precio;
        } else if (e.target.classList.contains('delete-especial')) {
            if (confirm('¿Seguro?')) { await fetchData(`/api/especiales/${id}`, { method: 'DELETE' }); loadEspeciales(); }
        }
    });

    function createOpcionInput(opcion = {}) {
        const div = document.createElement('div'); div.classList.add('opcion-item'); div.style.display = 'flex'; div.style.alignItems = 'center'; div.style.marginBottom = '5px';
        const input = document.createElement('input'); input.type = 'text'; input.className = 'opcion-nombre'; input.value = opcion.nombre || ''; input.placeholder = 'Nombre de la opción'; input.required = true; input.style.flexGrow = '1';
        const button = document.createElement('button'); button.type = 'button'; button.className = 'remove-opcion-btn btn'; button.textContent = 'Quitar'; button.style.marginLeft = '10px';
        div.appendChild(input); div.appendChild(button);
        opcionesContainer.appendChild(div);
        button.addEventListener('click', () => { div.remove(); });
    }
    addOpcionBtn.addEventListener('click', () => createOpcionInput());
    async function loadCategorias() {
        const categorias = await fetchData(`/api/menu-categorias/restaurante/${RESTAURANTE_ID}`);
        allMenuCategories = categorias || [];
        categoriasTableBody.innerHTML = '';
        if (allMenuCategories.length > 0) {
            allMenuCategories.forEach(cat => {
                const row = categoriasTableBody.insertRow();
                row.innerHTML = `<td>${cat.nombre}</td><td>${cat.opciones.map(o => o.nombre).join(', ')}</td><td><button class="edit-categoria btn" data-id='${cat._id}'>E</button><button class="delete-categoria btn btn-danger" data-id='${cat._id}'>X</button></td>`;
            });
        }
        updateMenuDiaForm();
    }
    categoriaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const opciones = Array.from(opcionesContainer.querySelectorAll('.opcion-nombre')).map(input => ({ nombre: input.value })).filter(opcion => opcion.nombre);
        if (opciones.length === 0) return alert('Añade al menos una opción.');
        const categoriaData = { nombre: categoriaNombreInput.value, opciones, restaurante: RESTAURANTE_ID };
        const id = categoriaIdInput.value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/menu-categorias/${id}` : '/api/menu-categorias';
        await fetchData(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoriaData) });
        categoriaForm.reset(); categoriaIdInput.value = ''; opcionesContainer.innerHTML = ''; createOpcionInput();
        categoriaForm.querySelector('button[type="submit"]').textContent = 'Guardar Categoría';
        loadCategorias();
    });
    categoriasTableBody.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('edit-categoria')) {
            const categoria = await fetchData(`/api/menu-categorias/${id}`);
            categoriaIdInput.value = categoria._id; categoriaNombreInput.value = categoria.nombre;
            opcionesContainer.innerHTML = '';
            if (categoria.opciones.length > 0) {
                categoria.opciones.forEach(opcion => createOpcionInput(opcion));
            } else { createOpcionInput(); }
            categoriaForm.querySelector('button[type="submit"]').textContent = 'Actualizar Categoría';
        } else if (e.target.classList.contains('delete-categoria')) {
            if (confirm('¿Seguro?')) { await fetchData(`/api/menu-categorias/${id}`, { method: 'DELETE' }); loadCategorias(); }
        }
    });

    function updateMenuDiaForm(menuAEditar = null) {
        menuItemsSelectionContainer.innerHTML = '';
        if (allMenuCategories.length > 0) {
            allMenuCategories.forEach(categoria => {
                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('menu-item-category');
                const checkboxesHtml = categoria.opciones.map(opcion => {
                    let isChecked = false;
                    if(menuAEditar) {
                        const catEnMenu = menuAEditar.itemsPorCategoria.find(item => item.categoriaNombre === categoria.nombre);
                        if(catEnMenu) { isChecked = catEnMenu.platosEscogidos.some(plato => plato.nombre === opcion.nombre); }
                    }
                    const opcionDataString = JSON.stringify({ nombre: opcion.nombre, descripcion: opcion.descripcion || '' });
                    return `<label><input type="checkbox" class="menu-item-checkbox" data-opcion='${opcionDataString}' ${isChecked ? 'checked' : ''}> ${opcion.nombre}</label>`;
                }).join('');
                categoryDiv.innerHTML = `<h4>${categoria.nombre}</h4><div class="checkbox-group" data-categoria-nombre="${categoria.nombre}">${checkboxesHtml}</div>`;
                menuItemsSelectionContainer.appendChild(categoryDiv);
            });
        } else { menuItemsSelectionContainer.innerHTML = '<p>Primero debes crear categorías.</p>'; }
    }
    menuDiaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const menuData = { fecha: menuFechaInput.value, nombreMenu: menuNombreInput.value, precioMenuGlobal: parseFloat(menuPrecioInput.value) || 0, itemsPorCategoria: [], restaurante: RESTAURANTE_ID };
        menuItemsSelectionContainer.querySelectorAll('.checkbox-group').forEach(group => {
            const categoriaNombre = group.dataset.categoriaNombre;
            const platosEscogidos = [];
            group.querySelectorAll('.menu-item-checkbox:checked').forEach(checkbox => { platosEscogidos.push(JSON.parse(checkbox.dataset.opcion)); });
            if (platosEscogidos.length > 0) { menuData.itemsPorCategoria.push({ categoriaNombre, platosEscogidos }); }
        });
        if (menuData.itemsPorCategoria.length === 0) { return alert('Debes seleccionar al menos un ítem.'); }
        const id = menuDiaIdInput.value;
        await fetchData(id ? `/api/menus-dia/${id}` : '/api/menus-dia', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(menuData) });
        menuDiaForm.reset(); menuDiaIdInput.value = '';
        menuDiaForm.querySelector('button[type="submit"]').textContent = 'Guardar Menú del Día';
        updateMenuDiaForm();
        loadMenusDia();
    });
    async function loadMenusDia() {
        const menus = await fetchData(`/api/menus-dia/restaurante/${RESTAURANTE_ID}`);
        menusDiaTableBody.innerHTML = '';
        if (menus) {
            menus.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            menus.forEach(menu => {
                const row = menusDiaTableBody.insertRow();
                const platos = menu.itemsPorCategoria.map(cat => `<strong>${cat.categoriaNombre}:</strong> ${cat.platosEscogidos.map(p => p.nombre).join(', ')}`).join('<br>');
                row.innerHTML = `<td>${new Date(menu.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</td><td>${menu.nombreMenu}</td><td>${platos}</td><td><button class="edit-menu btn" data-id='${menu._id}'>E</button><button class="delete-menu btn btn-danger" data-id='${menu._id}'>X</button></td>`;
            });
        }
    }
    menusDiaTableBody.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('edit-menu')) {
            const menu = await fetchData(`/api/menus-dia/${id}`);
            menuDiaIdInput.value = menu._id;
            menuFechaInput.value = new Date(menu.fecha).toISOString().split('T')[0];
            menuNombreInput.value = menu.nombreMenu;
            menuPrecioInput.value = menu.precioMenuGlobal;
            updateMenuDiaForm(menu);
            menuDiaForm.querySelector('button[type="submit"]').textContent = 'Actualizar Menú del Día';
        } else if (e.target.classList.contains('delete-menu')) {
            if (confirm('¿Seguro?')) { await fetchData(`/api/menus-dia/${id}`, { method: 'DELETE' }); loadMenusDia(); }
        }
    });

    // 4. CARGA INICIAL
    loadRestauranteData();
    loadPlatos();
    loadEspeciales();
    loadCategorias();
    loadMenusDia();
    createOpcionInput();
});