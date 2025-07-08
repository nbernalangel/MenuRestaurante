const mongoose = require('mongoose');

const restauranteSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true, 
        unique: true 
    },
    // El 'slug' es el identificador único para la URL, ej: "la-trattoria-feliz"
    slug: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true
    },
    telefono: { 
        type: String 
    },
    // Aquí puedes añadir más datos como dirección, logo, etc.
}, { timestamps: true });

module.exports = mongoose.model('Restaurante', restauranteSchema);