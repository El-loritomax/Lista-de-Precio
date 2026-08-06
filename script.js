let tasaBCV = 0;
let carrito = [];
let listaProductosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    const title = document.querySelector('h1');
    if (title) {
        title.textContent = 'Lista de Precio';
    }
});

function filterProducts() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let rows = document.querySelectorAll(".product-row");

    rows.forEach(row => {
        let productName = row.querySelector(".product-name").innerText.toLowerCase();
        if (productName.includes(input)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

function filterCategory(category) {
    let rows = document.querySelectorAll(".product-row");
    let buttons = document.querySelectorAll(".btn-cat");

    buttons.forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");

    rows.forEach(row => {
        if (category === "todos") {
            row.style.display = "";
        } else {
            if (row.classList.contains(category)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        }
    });
}

// Configuración de Supabase
const SUPABASE_URL = "https://lswunozbkpfymbrreqjn.supabase.co";
const SUPABASE_KEY = "sb_publishable_sIR7w5x-o3ZDl9MlgaWgWg_QLqdiF0b";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Obtener tasa del BCV automáticamente con respaldo seguro
async function obtenerTasaBCV() {
    try {
        const urlApi = encodeURIComponent('https://ve.dolarapi.com/v1/dolares/oficial');
        const respuesta = await fetch(`https://api.allorigins.win/get?url=${urlApi}`);
        const data = await respuesta.json();
        const datos = JSON.parse(data.contents);
        
        tasaBCV = datos.promedio;
        console.log("Tasa BCV cargada:", tasaBCV);

        const elTasa = document.getElementById("tasa-dolar");
        if (elTasa) {
            elTasa.textContent = `Bs. ${tasaBCV.toFixed(2)}`;
        }
    } catch (error) {
        console.error("Error al obtener tasa, usando respaldo:", error);
        tasaBCV = 36.50; 
        const elTasa = document.getElementById("tasa-dolar");
        if (elTasa) {
            elTasa.textContent = `Bs. ${tasaBCV.toFixed(2)} (Aproximada)`;
        }
    }
}

// Obtener productos y renderizar con precios grandes y llamativos
async function obtenerProductos() {
    if (tasaBCV === 0) {
        await obtenerTasaBCV();
    }

    const { data, error } = await supabaseClient
        .from('productos')
        .select('*');

    if (error) {
        console.error("Error en Supabase:", error);
    } else {
        listaProductosGlobal = data;
        const tablaBody = document.querySelector('tbody');
        if (!tablaBody) return;

        tablaBody.innerHTML = '';

        data.forEach(producto => {
            const fila = document.createElement('tr');
            const catClase = producto.categoria ? producto.categoria.toLowerCase().trim() : 'viveres';
            fila.className = `product-row ${catClase}`;

            const precioUSD = parseFloat(producto.precio) || 0;
            const precioBs = (precioUSD * tasaBCV).toFixed(2);

            fila.innerHTML = `
                <td class="product-name">${producto.nombre || 'Sin nombre'}</td>
                <td>${producto.presentacion || '1 Kilo / Kg'}</td>
                <td>
                    <div class="price-container">
                        <span class="price-usd">$${precioUSD.toFixed(2)}</span>
                        <span class="price-bs">Bs. ${precioBs}</span>
                    </div>
                </td>
                <td><span class="badge in-stock">${producto.estado || 'Disponible'}</span></td>
                <td>
                    <button class="btn-agregar" onclick="agregarAlCarrito('${producto.id}')">+ Agregar</button>
                </td>
            `;

            tablaBody.appendChild(fila);
        });
    }
}

// --- FUNCIONES DEL CARRITO ---
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
}

function actualizarCarritoUI() {
    const mainLayout = document.getElementById('mainLayout');
    const cartSidebar = document.getElementById('cartSidebar');
    const contadorBadge = document.getElementById('carrito-contador-badge');
    const listaHtml = document.getElementById('lista-carrito');
    const totalUsdEl = document.getElementById('carrito-total-usd');
    const totalBsEl = document.getElementById('carrito-total-bs');

    let totalItems = 0;
    let totalUsd = 0;
    let contenidoHtml = '';

    if (carrito.length === 0) {
        cartSidebar.style.display = 'none';
        mainLayout.classList.remove('with-cart');
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
                        <strong style="font-size: 0.95rem; color: #222;">${item.nombre}</strong><br>
                        <small style="color: #666; font-size: 0.8rem;">$${item.precioUSD.toFixed(2)} c/u</small>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button onclick="cambiarCantidad('${item.id}', -1)" style="background: #e0e0e0; border: none; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem;">-</button>
                        <span style="font-size: 1rem; font-weight: 800; color: #1b5e20; min-width: 18px; text-align: center;">${item.cantidad}</span>
                        <button onclick="cambiarCantidad('${item.id}', 1)" style="background: #2e7d32; color: white; border: none; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem;">+</button>
                    </div>
                </div>
            `;
        });
    }

    contadorBadge.textContent = totalItems;
    listaHtml.innerHTML = contenidoHtml;
    totalUsdEl.textContent = totalUsd.toFixed(2);
    totalBsEl.textContent = (totalUsd * tasaBCV).toFixed(2);
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarritoUI();
}

function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío");
        return;
    }

    let mensaje = "Hola, ¡quiero hacer el siguiente pedido! 🛒:%0A";
    let totalUsd = 0;

    carrito.forEach(item => {
        let subtotal = item.precioUSD * item.cantidad;
        totalUsd += subtotal;
        mensaje += `- ${item.cantidad}x ${item.nombre} (${item.presentacion}) - $${subtotal.toFixed(2)}%0A`;
    });

    let totalBs = totalUsd * tasaBCV;
    mensaje += `%0A*Total USD:* $${totalUsd.toFixed(2)}`;
    mensaje += `%0A*Total Bs:* Bs. ${totalBs.toFixed(2)}`;
    mensaje += `%0A_(Tasa BCV: Bs. ${tasaBCV.toFixed(2)})_`;

    const numeroWhatsApp = "584120000000"; 
    window.open(`https://wa.me/${numeroWhatsApp}?text=${mensaje}`, '_blank');
}

// Ejecutar al iniciar
obtenerProductos();