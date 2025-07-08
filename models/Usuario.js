const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
        // IMPORTANTE: En un futuro, esta contraseña debe ser encriptada usando 'bcrypt'
    },
    rol: { 
        type: String, 
        enum: ['superadmin', 'admin_restaurante'], 
        required: true 
    },
    // Conecta al usuario con su restaurante, si no es un superadmin.
    restaurante: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Restaurante'
    }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);