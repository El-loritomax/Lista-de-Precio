// Configuración de Supabase (reemplaza con tus datos reales)
const SUPABASE_URL = 'https://lswunozbkpfymbrreqjn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sIR7w5x-o3ZDl9MlgaWgWg_QLqdiF0b';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos de la página
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnGuardar = document.getElementById('btn-guardar');

// Revisar si ya hay una sesión activa al cargar la página
async function verificarSesion() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
    } else {
        loginSection.style.display = 'block';
        adminPanel.style.display = 'none';
    }
}

verificarSesion();

// Iniciar sesión
btnLogin.addEventListener('click', async () => {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert('Error al iniciar sesión: ' + error.message);
    } else {
        alert('¡Bienvenido!');
        verificarSesion();
    }
});

// Cerrar sesión
btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    verificarSesion();
});

// Guardar nuevo producto en la tabla de Supabase
btnGuardar.addEventListener('click', async () => {
    const nombre = document.getElementById('nombre-producto').value;
    const presentacion = document.getElementById('presentacion-producto').value;
    const precio = parseFloat(document.getElementById('precio-producto').value);

    if (!nombre || !presentacion || !precio) {
        alert('Por favor completa todos los campos.');
        return;
    }

    const { data, error } = await supabase
        .from('productos')
        .insert([
            { nombre_text: nombre, presentacion_text: presentacion, precio_float: precio }
        ]);

    if (error) {
        alert('Error al guardar el producto: ' + error.message);
    } else {
        alert('¡Producto guardado con éxito!');
        // Limpiar los campos
        document.getElementById('nombre-producto').value = '';
        document.getElementById('presentacion-producto').value = '';
        document.getElementById('precio-producto').value = '';
    }
});