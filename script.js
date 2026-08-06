// Variable global para almacenar la tasa del BCV
let tasaBCV = 0;

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

// 1. Función para obtener la tasa del BCV de forma automática y sin bloqueos
async function obtenerTasaBCV() {
    try {
        // Usamos un proxy seguro para evitar bloqueos de CORS en GitHub Pages
        const urlApi = encodeURIComponent('https://ve.dolarapi.com/v1/dolares/oficial');
        const respuesta = await fetch(`https://api.allorigins.win/get?url=${urlApi}`);
        const data = await respuesta.json();
        const datos = JSON.parse(data.contents);
        
        tasaBCV = datos.promedio;
        console.log("Tasa BCV cargada con éxito:", tasaBCV, "Bs/$");

        const elTasa = document.getElementById("tasa-dolar");
        if (elTasa) {
            elTasa.textContent = `Bs. ${tasaBCV.toFixed(2)}`;
        }
    } catch (error) {
        console.error("Error al obtener la tasa del BCV, usando respaldo:", error);
        tasaBCV = 755.16; // Tasa de respaldo aproximada actual
        const elTasa = document.getElementById("tasa-dolar");
        if (elTasa) {
            elTasa.textContent = `Bs. ${tasaBCV.toFixed(2)} (Aproximada)`;
        }
    }
}

// 2. Función principal para obtener productos y calcular sus precios
async function obtenerProductos() {
    if (tasaBCV === 0) {
        await obtenerTasaBCV();
    }

    const { data, error } = await supabaseClient
        .from('productos')
        .select('*');

    if (error) {
        console.error("Error de conexión con Supabase:", error);
    } else {
        console.log("¡Conectado con éxito! Productos:", data);

        const tablaBody = document.querySelector('tbody');
        if (!tablaBody) return;

        tablaBody.innerHTML = '';

        data.forEach(producto => {
            const fila = document.createElement('tr');

            // Categoría limpia (ej: 'viveres', 'charcuteria', 'refrescos', 'helados')
            const catClase = producto.categoria ? producto.categoria.toLowerCase().trim() : 'viveres';
            fila.className = `product-row ${catClase}`;

            // Cálculo en Bolívares
            const precioUSD = parseFloat(producto.precio) || 0;
            const precioBs = (precioUSD * tasaBCV).toFixed(2);

            fila.innerHTML = `
                <td class="product-name">${producto.nombre || 'Sin nombre'}</td>
                <td>${producto.presentacion || '1 Kilo / Kg'}</td>
                <td class="price">
                    $${precioUSD.toFixed(2)} 
                    <small style="display:block; color: #666; font-size: 0.85em;">(Bs. ${precioBs})</small>
                </td>
                <td><span class="badge in-stock">${producto.estado || 'Disponible'}</span></td>
            `;

            tablaBody.appendChild(fila);
        });
    }
}

// Ejecutamos la carga al iniciar
obtenerProductos();