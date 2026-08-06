// Configuración de Supabase
const SUPABASE_URL = 'https://lswunozbkpfymbrreqjn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sIR7w5x-o3ZD19M1gaWgWg_QlqdiF0b';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos de la página
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');

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

// Función para iniciar sesión al hacer clic en Entrar
if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
        // Obtenemos los valores de los inputs de correo y contraseña
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            alert('Error al iniciar sesión: ' + error.message);
        } else {
            alert('¡Inicio de sesión exitoso!');
            verificarSesion();
        }
    });
}

// Función para cerrar sesión
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        await supabase.auth.signOut();
        verificarSesion();
    });
}

// Ejecutar al cargar
verificarSesion();