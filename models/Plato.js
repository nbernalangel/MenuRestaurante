const mongoose = require('mongoose');

const platoSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    precio: { type: Number, required: true, min: 0 },
    categoria: { type: String, required: true },
    imagenUrl: { type: String, default: '' },
    disponible: { type: Boolean, default: true },
    // --- LÍNEA AÑADIDA ---
    restaurante: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Restaurante', 
        required: true 
    }
});

module.exports = mongoose.model('Plato', platoSchema);