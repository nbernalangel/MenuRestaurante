document.addEventListener('DOMContentLoaded', async () => {
    // 1. REFERENCIAS AL DOM
    const nombreRestauranteElem = document.getElementById('nombre-restaurante');
    const menuDelDiaContent = document.getElementById('menu-del-dia-content');
    const especialesContent = document.getElementById('especiales-content');
    const platosALaCartaContent = document.getElementById('platos-a-la-carta-content');
    const checkoutBtn = document.getElementById('checkout-btn');
    const nombreClienteInput = document.getElementById('nombre-cliente');
    const telefonoClienteInput = document.getElementById('telefono-cliente');
    const direccionClienteInput = document.getElementById('direccion-cliente');
    const notasClienteInput = document.getElementById('notas-cliente');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPriceDisplay = document.getElementById('cart-total-price');

    // 2. ESTADO
    let cart = [];
    let restauranteInfo = {};

    // 3. LÓGICA DEL CARRITO
    function addToCart(item) {
        const precio = parseFloat(item.precio);
        if (isNaN(precio)) {
            console.error("Error: Se intentó añadir un ítem sin precio válido.", item);
            return;
        }

        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...item, quantity: 1, precio: precio });
        }
        renderCart();
    }
    
    function removeFromCart(itemId) {
        const itemIndex = cart.findIndex(cartItem => cartItem.id === itemId);
        if (itemIndex > -1) {
            if (cart[itemIndex].quantity > 1) {
                cart[itemIndex].quantity--;
            } else {
                cart.splice(itemIndex, 1);
            }
        }
        renderCart();
    }

    function renderCart() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
            cartTotalPriceDisplay.textContent = '0.00';
            return;
        }
        let total = 0;
        cart.forEach(item => {
            total += item.precio * item.quantity;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `<span class="item-name">${item.quantity}x ${item.nombre}</span><span class="item-price">$${(item.precio * item.quantity).toFixed(2)}</span><button class="remove-from-cart-btn" data-id="${item.id}">-</button>`;
            cartItemsContainer.appendChild(itemDiv);
        });
        cartTotalPriceDisplay.textContent = total.toFixed(2);
    }
    
    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-from-cart-btn')) {
            removeFromCart(e.target.dataset.id);
        }
    });

    // 4. RENDERIZADO DE MENÚS
    function renderMenuDelDia(menu) {
        if (!menu) {
            menuDelDiaContent.innerHTML = '<div class="menu-item"><p>No hay menú del día disponible hoy.</p></div>';
            return;
        }
        let menuHtml = `<div class="menu-item"><h4>${menu.nombreMenu} - $${menu.precioMenuGlobal.toFixed(2)}</h4>`;
        menu.itemsPorCategoria.forEach((cat, index) => {
            menuHtml += `<div><strong>${cat.categoriaNombre}:</strong></div>`;
            const opciones = cat.platosEscogidos;
            if (opciones.length > 1) {
                opciones.forEach((plato, i) => {
                    menuHtml += `<label style="font-weight:normal; display:inline-block; margin-right:15px;"><input type="radio" name="menu-cat-${index}" value="${plato.nombre}" ${i === 0 ? 'checked' : ''}> ${plato.nombre}</label>`;
                });
            } else if (opciones.length === 1) {
                menuHtml += `<span data-opcion-unica="true" data-nombre="${opciones[0].nombre}">${opciones[0].nombre}</span>`;
            }
        });
        menuHtml += `<button class="add-menu-to-cart-btn btn btn-primary" style="margin-top:1em;" data-precio="${menu.precioMenuGlobal}" data-nombre-base="${menu.nombreMenu}">Añadir Menú</button></div>`;
        menuDelDiaContent.innerHTML = menuHtml;
    }
    
    function renderPlatos(platos, container, tipoPlato) {
        if (!platos || platos.length === 0) {
            container.innerHTML = `<div class="menu-item"><p>No hay ${tipoPlato} disponibles.</p></div>`;
            return;
        }
        container.innerHTML = '';
        platos.forEach(plato => {
            const platoDiv = document.createElement('div');
            platoDiv.className = 'menu-item';
            platoDiv.innerHTML = `
                <h4>${plato.nombre}</h4>
                <p>${plato.descripcion || ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="price">$${plato.precio.toFixed(2)}</span>
                    <button class="add-plato-to-cart-btn btn btn-primary" data-id="${plato._id}" data-nombre="${plato.nombre}" data-precio="${plato.precio}">Añadir</button>
                </div>
            `;
            container.appendChild(platoDiv);
        });
    }

    // 5. LÓGICA DE EVENTOS DE AÑADIR AL CARRITO
    document.querySelector('.public-menu-grid').addEventListener('click', (e) => {
        if (e.target.classList.contains('add-plato-to-cart-btn')) {
            const { id, nombre, precio } = e.target.dataset;
            addToCart({ id, nombre, precio: parseFloat(precio) });
        } else if (e.target.classList.contains('add-menu-to-cart-btn')) {
            const nombreBase = e.target.dataset.nombreBase;
            const precio = parseFloat(e.target.dataset.precio);
            
            let selecciones = [];
            const radioGroups = menuDelDiaContent.querySelectorAll('input[type="radio"]');
            if (radioGroups.length > 0) {
                const groups = {};
                radioGroups.forEach(radio => {
                    if (!groups[radio.name]) groups[radio.name] = false;
                    if (radio.checked) {
                        selecciones.push(radio.value);
                        groups[radio.name] = true;
                    }
                });
            }
            
            menuDelDiaContent.querySelectorAll('[data-opcion-unica]').forEach(opcion => {
                selecciones.push(opcion.dataset.nombre);
            });
            
            const nombreCompleto = `${nombreBase} (${selecciones.join(', ')})`;
            addToCart({ id: `menu-${Date.now()}`, nombre: nombreCompleto, precio: precio });
        }
    });

    // 6. LÓGICA DE WHATSAPP
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) { return alert('Tu carrito está vacío.'); }
        const nombreCliente = nombreClienteInput.value.trim();
        if (!nombreCliente) { return alert('Por favor, ingresa tu nombre.'); }
        
        const telefono = telefonoClienteInput.value.trim();
        const direccion = direccionClienteInput.value.trim();
        const notas = notasClienteInput.value.trim();

        let message = `*¡Nuevo Pedido para ${restauranteInfo.nombre}!* \n\n`;
        message += `*Cliente:* ${nombreCliente}\n`;
        if (telefono) message += `*Teléfono:* ${telefono}\n`;
        if (direccion) message += `*Dirección:* ${direccion}\n`;
        
        message += `\n*--- Detalle del Pedido ---*\n`;
        cart.forEach(item => {
            message += `${item.quantity}x ${item.nombre} - $${(item.precio * item.quantity).toFixed(2)}\n`;
        });
        message += `\n*Total: $${cartTotalPriceDisplay.textContent}*`;
        if (notas) message += `\n\n*Notas:* ${notas}`;
        
        const whatsappNumber = restauranteInfo.telefono;
        if (!whatsappNumber) { return alert('Este restaurante no tiene un número de WhatsApp configurado.'); }
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    });

    // 7. CARGA INICIAL
    async function loadPage() {
        const pathParts = window.location.pathname.split('/');
        const slug = pathParts.pop() || pathParts.pop();
        if (!slug || window.location.pathname.indexOf('/r/') === -1) {
            document.body.innerHTML = `<div class="container"><h1>Error: URL de restaurante inválida.</h1><p>Asegúrate de que la URL sea del tipo /r/nombre-del-restaurante</p></div>`;
            return;
        }
        try {
            const data = await fetch(`/api/public/menu/${slug}`).then(res => res.json());
            if (!data.restaurante) throw new Error('Restaurante no encontrado');

            restauranteInfo = data.restaurante;
            document.title = restauranteInfo.nombre;
            nombreRestauranteElem.textContent = restauranteInfo.nombre;

            renderMenuDelDia(data.menuDelDia);
            renderPlatos(data.platosEspeciales, especialesContent, 'especiales');
            renderPlatos(data.platosALaCarta, platosALaCartaContent, 'platos a la carta');

        } catch (error) {
            console.error('Error al cargar el menú:', error);
            document.body.innerHTML = `<div class="container"><h1>Error al cargar el menú</h1><p>${error.message}</p></div>`;
        }
    }

    loadPage();
});