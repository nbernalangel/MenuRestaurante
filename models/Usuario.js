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
        // La contraseña se encriptará antes de guardarla.
    },
    // --- CAMPOS NUEVOS PARA VERIFICACIÓN DE CORREO ---
    isVerified: {
        type: Boolean,
        default: false // El usuario no está verificado por defecto al registrarse
    },
    verificationCode: {
        type: String,
        required: false // Solo existirá mientras la cuenta no esté verificada
    },
    verificationCodeExpires: {
        type: Date,
        required: false // La fecha y hora en que el código expira
    },
    // --- FIN DE CAMPOS NUEVOS ---
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