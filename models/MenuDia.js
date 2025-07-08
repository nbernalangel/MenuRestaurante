const mongoose = require('mongoose');

const selectedOptionSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, default: '' }
}, { _id: false });

const menuCategorySelectionSchema = new mongoose.Schema({
    categoriaNombre: { type: String, required: true },
    platosEscogidos: [selectedOptionSchema]
}, { _id: false });

const menuDiaSchema = new mongoose.Schema({
    fecha: { 
        type: Date, 
        required: true
    },
    nombreMenu: { type: String, default: 'Menú del Día' },
    precioMenuGlobal: { type: Number, min: 0, default: 0 },
    itemsPorCategoria: [menuCategorySelectionSchema],
    activo: { type: Boolean, default: true },
    restaurante: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Restaurante', 
        required: true 
    }
}, { timestamps: true });

// --- LÍNEA NUEVA Y CLAVE ---
// Esto crea la regla "fecha + restaurante" deben ser únicos juntos.
menuDiaSchema.index({ fecha: 1, restaurante: 1 }, { unique: true });

module.exports = mongoose.model('MenuDia', menuDiaSchema);