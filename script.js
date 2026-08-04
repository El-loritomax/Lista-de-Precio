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
}// Configuración de Supabase
const SUPABASE_URL = "https://lswunozbkpfymbrreqjn.supabase.co";
const SUPABASE_KEY = "sb_publishable_sIR7w5x-o3ZDl9MlgaWgWg_QLqdiF0b";
// Crear conexión
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Función para obtener los productos de Supabase y mostrarlos por categoría
async function obtenerProductos() {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('*');

    if (error) {
        console.error("Error de conexión:", error);
    } else {
        console.log("¡Conectado con éxito! Productos:", data);

        // 1. Buscamos el cuerpo de la tabla en el HTML
        const tablaBody = document.querySelector('tbody');
        if (!tablaBody) return;

        // 2. Limpiamos las filas estáticas viejas
        tablaBody.innerHTML = '';

        // 3. Insertamos cada producto devuelto por Supabase
        data.forEach(producto => {
            const fila = document.createElement('tr');

            // Asignamos las clases para que funcione el filtro por categoría
            // Convertimos a minúsculas para coincidir con las clases (ej: 'viveres', 'charcuteria')
            const catClase = producto.categoria ? producto.categoria.toLowerCase().trim() : 'viveres';
            fila.className = `product-row ${catClase}`;

            // Renderizamos los datos del producto
            fila.innerHTML = `
                <td class="product-name">${producto.nombre || 'Sin nombre'}</td>
                <td>${producto.presentacion || '1 Kilo / Kg'}</td>
                <td class="price">Bs. ${producto.precio || '0.00'}</td>
                <td><span class="badge in-stock">${producto.estado || 'Disponible'}</span></td>
            `;

            tablaBody.appendChild(fila);
        });
    }
}

// Llamamos a la función al cargar el script

// Variable global para almacenar la tasa del BCV
 tasaBCV = 0;

// 1. Función para obtener la tasa del BCV en tiempo real
async function obtenerTasaBCV() {
    try {
        const respuesta = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
        const datos = await respuesta.json();
        
        // Asignamos el valor promedio (promedio = tasa del dólar BCV)
        tasaBCV = datos.promedio;
        console.log("Tasa BCV cargada con éxito:", tasaBCV, "Bs/$");

        // Opcional: Si tienes un elemento HTML para mostrar la tasa arriba en la página
        const elTasa = document.getElementById("tasa-bcv");
        if (elTasa) {
            elTasa.textContent = `Tasa BCV: Bs. ${tasaBCV.toFixed(2)}`;
        }
    } catch (error) {
        console.error("Error al obtener la tasa del BCV:", error);
        // Tasa de respaldo en caso de fallo de red
        tasaBCV = 36.50; 
    }
}

// 2. Función principal para obtener productos y calcular sus precios
async function obtenerProductos() {
    // Asegurarnos de tener la tasa antes de pintar los productos
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

            // Categoría
            const catClase = producto.categoria ? producto.categoria.toLowerCase().trim() : 'viveres';
            fila.className = `product-row ${catClase}`;

            // Cálculo en Bolívares (Precio en USD * Tasa BCV)
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