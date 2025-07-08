const mongoose = require('mongoose');

const especialSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    precio: { type: Number, required: true, min: 0 },
    disponible: { type: Boolean, default: true },
    restaurante: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Restaurante', 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Especial', especialSchema);