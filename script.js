let tasaBCV = 36.50; 
let carrito = [];
let listaProductosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    obtenerTasaEstableYProductos();
});

const SUPABASE_URL = "https://lswunozbkpfymbrreqjn.supabase.co";
const SUPABASE_KEY = "sb_publishable_sIR7w5x-o3ZDl9MlgaWgWg_QLqdiF0b";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function obtenerTasaEstableYProductos() {
    try {
        const respuesta = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
        if (respuesta.ok) {
            const datos = await respuesta.json();
            if (datos && datos.promedio && datos.promedio > 0) {
                tasaBCV = datos.promedio;
            }
        }
    } catch (e) {
        console.warn("Usando tasa de respaldo.");
    }

    const elTasa = document.getElementById("tasa-dolar");
    if (elTasa) {
        elTasa.textContent = `Bs. ${tasaBCV.toFixed(2)}`;
    }

    await obtenerProductos();
}

async function obtenerProductos() {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('*');

    if (error) {
        console.error("Error al conectar con Supabase:", error);
    } else {
        listaProductosGlobal = data || [];
        renderizarTarjetas();
    }
}

function renderizarTarjetas() {
    const gridContainer = document.getElementById('productsGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    listaProductosGlobal.forEach(producto => {
        const tarjeta = document.createElement('div');
        const catClase = producto.categoria ? producto.categoria.toLowerCase().trim() : 'viveres';
        tarjeta.className = `product-card ${catClase}`;

        const precioUSD = parseFloat(producto.precio) || 0;
        const precioBs = (precioUSD * tasaBCV).toFixed(2);
        
        const imagenUrl = producto.imagen && producto.imagen.trim() !== '' 
            ? producto.imagen 
            : 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=200&auto=format&fit=crop&q=60';

        const enCarrito = carrito.find(item => item.id == producto.id);
        let botonAccionHtml = '';

        if (!enCarrito) {
            botonAccionHtml = `<button class="btn-agregar" onclick="agregarAlCarrito('${producto.id}')">Agregar</button>`;
        } else {
            botonAccionHtml = `
                <div class="card-counter-box">
                    <button onclick="cambiarCantidad('${producto.id}', -1)">-</button>
                    <span>${enCarrito.cantidad}</span>
                    <button onclick="cambiarCantidad('${producto.id}', 1)">+</button>
                </div>
            `;
        }

        tarjeta.innerHTML = `
            <div>
                <div class="product-img-container">
                    <img src="${imagenUrl}" alt="${producto.nombre}" class="product-img">
                </div>
                <div class="product-name">${producto.nombre || 'Sin nombre'}</div>
                <div class="product-presentation">${producto.presentacion || 'Unidad'}</div>
                <div class="price-container">
                    <span class="price-usd">$${precioUSD.toFixed(2)}</span>
                    <span class="price-bs">Bs. ${precioBs}</span>
                </div>
            </div>
            ${botonAccionHtml}
        `;

        gridContainer.appendChild(tarjeta);
    });
}

function filterProducts() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let cards = document.querySelectorAll(".product-card");

    cards.forEach(card => {
        let productName = card.querySelector(".product-name").innerText.toLowerCase();
        if (productName.includes(input)) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}

function filterCategory(category, event) {
    let cards = document.querySelectorAll(".product-card");
    let buttons = document.querySelectorAll(".btn-cat");

    buttons.forEach(btn => btn.classList.remove("active"));
    if (event && event.target) {
        event.target.classList.add("active");
    }

    cards.forEach(card => {
        if (category === "todos") {
            card.style.display = "";
        } else {
            if (card.classList.contains(category)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        }
    });
}

function agregarAlCarrito(idProducto) {
    const producto = listaProductosGlobal.find(p => p.id == idProducto);
    if (!producto) return;

    const enCarrito = carrito.find(item => item.id == idProducto);
    if (enCarrito) {
        enCarrito.cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            presentacion: producto.presentacion || '',
            precioUSD: parseFloat(producto.precio) || 0,
            cantidad: 1
        });
    }

    actualizarCarritoUI();
    renderizarTarjetas();
}

function cambiarCantidad(idProducto, cambio) {
    const item = carrito.find(i => i.id == idProducto);
    if (item) {
        item.cantidad += cambio;
        if (item.cantidad <= 0) {
            carrito = carrito.filter(i => i.id != idProducto);
        }
    }
    actualizarCarritoUI();
    renderizarTarjetas();
    
    // Si el modal móvil está abierto, actualizar su contenido dinámicamente
    const modalMovil = document.getElementById('mobileCartModal');
    if (modalMovil && modalMovil.style.display === 'flex') {
        abrirCarritoMovil();
    }
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarritoUI();
    renderizarTarjetas();
    const modalMovil = document.getElementById('mobileCartModal');
    if (modalMovil && modalMovil.style.display === 'flex') {
        abrirCarritoMovil();
    }
}

function actualizarCarritoUI() {
    const mainLayout = document.getElementById('mainLayout');
    const cartSidebar = document.getElementById('cartSidebar');
    const contadorBadge = document.getElementById('carrito-contador-badge');
    const mobileBadge = document.getElementById('mobile-badge');
    const listaHtml = document.getElementById('lista-carrito');
    const totalUsdEl = document.getElementById('carrito-total-usd');
    const totalBsEl = document.getElementById('carrito-total-bs');

    let totalItems = 0;
    let totalUsd = 0;
    let contenidoHtml = '';

    if (carrito.length === 0) {
        cartSidebar.style.display = 'none';
        mainLayout.classList.remove('with-cart');
        if (mobileBadge) mobileBadge.style.display = 'none';
    } else {
        cartSidebar.style.display = 'flex';
        mainLayout.classList.add('with-cart');

        carrito.forEach(item => {
            totalItems += item.cantidad;
            let subtotalUsd = item.precioUSD * item.cantidad;
            totalUsd += subtotalUsd;

            contenidoHtml += `
                <div class="cart-item-row">
                    <div>
                        <div class="cart-item-name">${item.nombre}</div>
                        <div class="cart-item-price">$${item.precioUSD.toFixed(2)} c/u</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="cambiarCantidad('${item.id}', -1)" style="background: #e0e0e0; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1.1rem;">-</button>
                        <span style="font-size: 1.2rem; font-weight: 900; color: #e65100; min-width: 22px; text-align: center;">${item.cantidad}</span>
                        <button onclick="cambiarCantidad('${item.id}', 1)" style="background: #f57c00; color: white; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1.1rem;">+</button>
                    </div>
                </div>
            `;
        });

        if (mobileBadge) {
            mobileBadge.textContent = totalItems;
            mobileBadge.style.display = 'inline-block';
        }
    }

    if (contadorBadge) contadorBadge.textContent = totalItems;
    if (listaHtml) listaHtml.innerHTML = contenidoHtml;
    if (totalUsdEl) totalUsdEl.textContent = totalUsd.toFixed(2);
    if (totalBsEl) totalBsEl.textContent = (totalUsd * tasaBCV).toFixed(2);
}

function abrirCarritoMovil() {
    const modalMovil = document.getElementById('mobileCartModal');
    const cuerpoModalMovil = document.getElementById('mobileCartBodyContent');
    
    if (!modalMovil || !cuerpoModalMovil) return;

    if (carrito.length === 0) {
        cuerpoModalMovil.innerHTML = `
            <div class="empty-cart-container">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h3>Tu carrito está vacío</h3>
                <p>Explora nuestros productos y descubre ofertas increíbles para llevar a casa.</p>
                <button class="btn-explore" onclick="cerrarCarritoMovil()">Empezar a comprar</button>
            </div>
        `;
    } else {
        let totalItems = 0;
        let totalUsd = 0;
        let itemsHtml = '';

        carrito.forEach(item => {
            totalItems += item.cantidad;
            let subtotalUsd = item.precioUSD * item.cantidad;
            totalUsd += subtotalUsd;

            itemsHtml += `
                <div class="cart-item-row">
                    <div>
                        <div class="cart-item-name">${item.nombre}</div>
                        <div class="cart-item-price">$${item.precioUSD.toFixed(2)} c/u</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="cambiarCantidad('${item.id}', -1)" style="background: #e0e0e0; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1.1rem;">-</button>
                        <span style="font-size: 1.2rem; font-weight: 900; color: #e65100; min-width: 22px; text-align: center;">${item.cantidad}</span>
                        <button onclick="cambiarCantidad('${item.id}', 1)" style="background: #f57c00; color: white; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1.1rem;">+</button>
                    </div>
                </div>
            `;
        });

        let totalBs = (totalUsd * tasaBCV).toFixed(2);

        cuerpoModalMovil.innerHTML = `
            <div style="flex: 1; overflow-y: auto; margin-bottom: 15px;">
                ${itemsHtml}
            </div>
            <div class="cart-totals">
                <div class="total-row">
                    <span>Total USD:</span>
                    <span class="highlight-price-usd">$${totalUsd.toFixed(2)}</span>
                </div>
                <div class="total-row bs-row">
                    <span>Total Bs (${tasaBCV.toFixed(2)}):</span>
                    <span class="highlight-price-bs">Bs. ${totalBs}</span>
                </div>
            </div>
            <div class="cart-actions">
                <button class="btn-vaciar" onclick="vaciarCarrito()">Vaciar</button>
                <button class="btn-whatsapp" onclick="enviarWhatsApp()">Pedir por WhatsApp</button>
            </div>
        `;
    }

    modalMovil.style.display = 'flex';
}

function cerrarCarritoMovil() {
    const modalMovil = document.getElementById('mobileCartModal');
    if (modalMovil) {
        modalMovil.style.display = 'none';
    }
}

function enviarWhatsApp() {
    if (carrito.length === 0) return;

    let mensaje = "¡Hola! Quisiera realizar el siguiente pedido:\n\n";
    let totalUsd = 0;

    carrito.forEach(item => {
        let subtotal = item.precioUSD * item.cantidad;
        totalUsd += subtotal;
        mensaje = mensaje + `- ${item.cantidad}x ${item.nombre} (${item.presentacion}) - $${subtotal.toFixed(2)}\n`;
    });

    let totalBs = (totalUsd * tasaBCV).toFixed(2);
    mensaje = mensaje + `\n*Total USD:* $${totalUsd.toFixed(2)}`;
    mensaje = mensaje + `\n*Total Bs:* Bs. ${totalBs} (Tasa: ${tasaBCV.toFixed(2)})`;

    // Reemplaza con tu número de teléfono de WhatsApp en formato internacional (ej: 58412...)
    let numeroWhatsApp = "584120000000"; 
    let url = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
}
