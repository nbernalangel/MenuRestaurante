const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const { Resend } = require('resend'); // USAMOS LA LIBRERÍA OFICIAL DE RESEND
require('dotenv').config(); 

const app = express();
const port = 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- Conexión a MongoDB ---
const dbUri = 'mongodb://127.0.0.1:27017/menu-restaurante-db';
mongoose.connect(dbUri).then(() => console.log('✅ Conectado a MongoDB')).catch(err => console.error('❌ Error:', err));

// --- Importar Modelos ---
const Plato = require('./models/Plato');
const Especial = require('./models/Especial');
const MenuCategoria = require('./models/MenuCategoria');
const MenuDia = require('./models/MenuDia');
const Restaurante = require('./models/Restaurante');
const Usuario = require('./models/Usuario');

// --- Configuración de Resend ---
const resend = new Resend(process.env.RESEND_API_KEY);


// ========================================================
// === RUTAS DE REGISTRO Y VERIFICACIÓN ===================
// ========================================================
app.post('/api/register', async (req, res) => {
    try {
        const { nombreRestaurante, email, password } = req.body;

        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(409).json({ message: 'Este correo electrónico ya está registrado.' });
        }
        
        const slug = nombreRestaurante.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
        const restauranteExistente = await Restaurante.findOne({ slug });
        if (restauranteExistente) {
            return res.status(409).json({ message: 'El nombre de este restaurante ya genera una URL que existe. Por favor, elige otro.' });
        }

        const nuevoRestaurante = new Restaurante({ nombre: nombreRestaurante, slug: slug });
        await nuevoRestaurante.save();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); 

        const nuevoUsuario = new Usuario({
            email,
            password: hashedPassword,
            rol: 'admin_restaurante',
            restaurante: nuevoRestaurante._id,
            verificationCode,
            verificationCodeExpires
        });
        await nuevoUsuario.save();

        // Enviar el correo de verificación usando Resend
        await resend.emails.send({
            from: 'Menú Digital <onboarding@resend.dev>', // Resend usa este 'from' por defecto
            to: email,
            subject: 'Tu Código de Verificación',
            html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;"><h2>¡Bienvenido a Menú Digital!</h2><p>Gracias por registrarte. Tu código de verificación es:</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f0f0f0; padding: 10px; border-radius: 8px;">${verificationCode}</p><p>Este código expirará en 15 minutos.</p></div>`
        });

        res.status(201).json({ message: '¡Registro exitoso! Revisa tu correo para obtener el código de verificación.' });

    } catch (e) {
        console.error("Error en /api/register:", e);
        res.status(500).json({ message: 'Ocurrió un error en el servidor.' });
    }
});

app.post('/api/verify', async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        const usuario = await Usuario.findOne({ email });
        if (!usuario) { return res.status(404).json({ message: 'Usuario no encontrado.' }); }
        if (usuario.isVerified) { return res.status(400).json({ message: 'Esta cuenta ya ha sido verificada.' }); }
        if (usuario.verificationCode !== verificationCode || usuario.verificationCodeExpires < new Date()) {
            return res.status(400).json({ message: 'Código de verificación inválido o expirado.' });
        }
        usuario.isVerified = true;
        usuario.verificationCode = undefined;
        usuario.verificationCodeExpires = undefined;
        await usuario.save();
        res.status(200).json({ message: '¡Cuenta verificada con éxito! Ya puedes iniciar sesión.' });
    } catch (e) {
        console.error("Error en /api/verify:", e);
        res.status(500).json({ message: 'Ocurrió un error en el servidor.' });
    }
});


// ========================================================
// === RUTAS DEL SUPER-ADMIN ==============================
// ========================================================
app.post('/api/restaurantes', async (req, res) => { try { const item = new Restaurante(req.body); await item.save(); res.status(201).json(item); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/restaurantes', async (req, res) => { try { const items = await Restaurante.find(); res.json(items); } catch (e) { res.status(500).json({ message: e.message }); } });
app.get('/api/restaurantes/:id', async (req, res) => { try { const item = await Restaurante.findById(req.params.id); res.json(item); } catch (e) { res.status(500).json({ message: e.message }); } });
app.put('/api/restaurantes/:id', async (req, res) => { try { const item = await Restaurante.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(item); } catch (e) { res.status(400).json({ message: e.message }); } });

app.post('/api/usuarios', async (req, res) => { try { const { email, password, rol, restaurante } = req.body; const salt = await bcrypt.genSalt(10); const hashedPassword = await bcrypt.hash(password, salt); const item = new Usuario({ email, password: hashedPassword, rol, restaurante }); await item.save(); res.status(201).json(item); } catch (e) { res.status(400).json({ message: e.message }); }});
app.get('/api/usuarios', async (req, res) => { try { const items = await Usuario.find().populate('restaurante', 'nombre'); res.json(items); } catch (e) { res.status(500).json({ message: e.message }); } });

app.post('/api/login', async (req, res) => { try { const { email, password } = req.body; const usuario = await Usuario.findOne({ email }); if (!usuario) { return res.status(401).json({ message: 'Credenciales incorrectas' }); } if(!usuario.isVerified) { return res.status(401).json({ message: 'Tu cuenta no ha sido verificada. Por favor, revisa tu correo.'}); } const esValida = await bcrypt.compare(password, usuario.password); if (!esValida) { return res.status(401).json({ message: 'Credenciales incorrectas' }); } let nombreRestaurante = null; if(usuario.restaurante) { const rest = await Restaurante.findById(usuario.restaurante); nombreRestaurante = rest ? rest.nombre : null; } res.json({ userId: usuario._id, email: usuario.email, rol: usuario.rol, restauranteId: usuario.restaurante, nombreRestaurante }); } catch (e) { res.status(500).json({ message: 'Error interno del servidor' }); }});


// ========================================================
// === RUTAS DEL ADMIN DE RESTAURANTE =====================
// ========================================================
app.post('/api/platos', async (req, res) => { try { const item = new Plato(req.body); await item.save(); res.status(201).json(item); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/platos/restaurante/:restauranteId', async (req, res) => { try { const items = await Plato.find({ restaurante: req.params.restauranteId }); res.json(items); } catch (e) { res.status(500).json({ message: e.message }); } });
app.get('/api/platos/:id', async (req, res) => { try { const item = await Plato.findById(req.params.id); res.json(item); } catch (e) { res.status(500).json({ message: e.message }); } });
app.put('/api/platos/:id', async (req, res) => { try { const item = await Plato.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(item); } catch (e) { res.status(400).json({ message: e.message }); } });
app.delete('/api/platos/:id', async (req, res) => { try { await Plato.findByIdAndDelete(req.params.id); res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });
app.patch('/api/platos/:id/toggle', async (req, res) => { try { const plato = await Plato.findById(req.params.id); if(plato) { plato.disponible = !plato.disponible; await plato.save(); res.json(plato); } else { res.status(404).json({ message: 'Plato no encontrado' }); } } catch (e) { res.status(500).json({ message: e.message }); } });

app.post('/api/especiales', async (req, res) => { try { const item = new Especial(req.body); await item.save(); res.status(201).json(item); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/especiales/restaurante/:restauranteId', async (req, res) => { try { const items = await Especial.find({ restaurante: req.params.restauranteId }); res.json(items); } catch (e) { res.status(500).json({ message: e.message }); } });
app.get('/api/especiales/:id', async (req, res) => { try { const item = await Especial.findById(req.params.id); res.json(item); } catch (e) { res.status(500).json({ message: e.message }); } });
app.put('/api/especiales/:id', async (req, res) => { try { const item = await Especial.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(item); } catch (e) { res.status(400).json({ message: e.message }); } });
app.delete('/api/especiales/:id', async (req, res) => { try { await Especial.findByIdAndDelete(req.params.id); res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });
app.patch('/api/especiales/:id/toggle', async (req, res) => { try { const especial = await Especial.findById(req.params.id); if(especial) { especial.disponible = !especial.disponible; await especial.save(); res.json(especial); } else { res.status(404).json({ message: 'Especial no encontrado' }); } } catch (e) { res.status(500).json({ message: e.message }); } });

app.post('/api/menu-categorias', async (req, res) => { try { const item = new MenuCategoria(req.body); await item.save(); res.status(201).json(item); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/menu-categorias/restaurante/:restauranteId', async (req, res) => { try { const items = await MenuCategoria.find({ restaurante: req.params.restauranteId }); res.json(items); } catch (e) { res.status(500).json({ message: e.message }); } });
app.get('/api/menu-categorias/:id', async (req, res) => { try { const item = await MenuCategoria.findById(req.params.id); res.json(item); } catch (e) { res.status(500).json({ message: e.message }); } });
app.put('/api/menu-categorias/:id', async (req, res) => { try { const item = await MenuCategoria.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(item); } catch (e) { res.status(400).json({ message: e.message }); } });
app.delete('/api/menu-categorias/:id', async (req, res) => { try { await MenuCategoria.findByIdAndDelete(req.params.id); res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

app.post('/api/menus-dia', async (req, res) => { try { const item = new MenuDia(req.body); await item.save(); res.status(201).json(item); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/menus-dia/restaurante/:restauranteId', async (req, res) => { try { const items = await MenuDia.find({ restaurante: req.params.restauranteId }); res.json(items); } catch (e) { res.status(500).json({ message: e.message }); } });
app.get('/api/menus-dia/:id', async (req, res) => { try { const item = await MenuDia.findById(req.params.id); res.json(item); } catch (e) { res.status(500).json({ message: e.message }); } });
app.put('/api/menus-dia/:id', async (req, res) => { try { const item = await MenuDia.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(item); } catch (e) { res.status(400).json({ message: e.message }); } });
app.delete('/api/menus-dia/:id', async (req, res) => { try { await MenuDia.findByIdAndDelete(req.params.id); res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

// ========================================================
// === RUTAS PÚBLICAS Y PARA SERVIR ARCHIVOS HTML =========
// ========================================================
app.get('/api/public/menu/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const restaurante = await Restaurante.findOne({ slug });
        if (!restaurante) return res.status(404).json({ message: 'Restaurante no encontrado' });
        const inicioDelDia = new Date(new Date().setUTCHours(0, 0, 0, 0));
        const finDelDia = new Date(new Date().setUTCHours(23, 59, 59, 999));
        const menuDelDia = await MenuDia.findOne({ restaurante: restaurante._id, fecha: { $gte: inicioDelDia, $lte: finDelDia }, activo: true });
        const platosALaCarta = await Plato.find({ restaurante: restaurante._id, disponible: true });
        const platosEspeciales = await Especial.find({ restaurante: restaurante._id, disponible: true });
        res.json({ restaurante, menuDelDia, platosALaCarta, platosEspeciales });
    } catch (e) {
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/verify', (req, res) => res.sendFile(path.join(__dirname, 'public', 'verify.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/super_admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'super_admin.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/r/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// --- Iniciar Servidor ---
app.listen(port, () => { console.log(`🚀 Servidor funcionando en http://localhost:${port}`); });