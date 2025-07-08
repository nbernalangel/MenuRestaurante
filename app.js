const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

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

// ========================================================
// === RUTA DE REGISTRO PÚBLICO ===========================
// ========================================================
app.post('/api/public-register', async (req, res) => {
    try {
        const { restaurante, usuario } = req.body;

        // Validar que el slug o el nombre no existan
        const restauranteExistente = await Restaurante.findOne({ $or: [{ slug: restaurante.slug }, { nombre: restaurante.nombre }] });
        if (restauranteExistente) {
            return res.status(409).json({ message: 'El nombre o la URL del restaurante ya existe.' });
        }
        
        // Validar que el email no exista
        const usuarioExistente = await Usuario.findOne({ email: usuario.email });
        if (usuarioExistente) {
            return res.status(409).json({ message: 'Este email ya está registrado.' });
        }

        // 1. Crear el restaurante
        const nuevoRestaurante = new Restaurante(restaurante);
        await nuevoRestaurante.save();

        // 2. Encriptar contraseña y crear el usuario administrador
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(usuario.password, salt);
        
        const nuevoUsuario = new Usuario({
            email: usuario.email,
            password: hashedPassword,
            rol: 'admin_restaurante',
            restaurante: nuevoRestaurante._id // Asignar el ID del restaurante recién creado
        });
        await nuevoUsuario.save();

        res.status(201).json({ message: 'Restaurante y usuario creados con éxito.' });

    } catch (e) {
        res.status(500).json({ message: e.message });
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
app.post('/api/login', async (req, res) => { try { const { email, password } = req.body; const usuario = await Usuario.findOne({ email }); if (!usuario) { return res.status(401).json({ message: 'Credenciales incorrectas' }); } const esValida = await bcrypt.compare(password, usuario.password); if (!esValida) { return res.status(401).json({ message: 'Credenciales incorrectas' }); } let nombreRestaurante = null; if(usuario.restaurante) { const rest = await Restaurante.findById(usuario.restaurante); nombreRestaurante = rest ? rest.nombre : null; } res.json({ userId: usuario._id, email: usuario.email, rol: usuario.rol, restauranteId: usuario.restaurante, nombreRestaurante }); } catch (e) { res.status(500).json({ message: 'Error interno del servidor' }); }});


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

// Rutas para servir archivos HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/super_admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'super_admin.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/r/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// --- Iniciar Servidor ---
app.listen(port, () => { console.log(`🚀 Servidor funcionando en http://localhost:${port}`); });