const mongoose = require('mongoose');

const opcionSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' }
}, { _id: false });

const menuCategoriaSchema = new mongoose.Schema({
    // La corrección está aquí: se eliminó "unique: true"
    nombre: { type: String, required: true, trim: true }, 
    opciones: [opcionSchema],
    restaurante: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Restaurante', 
        required: true 
    }
});

module.exports = mongoose.model('MenuCategoria', menuCategoriaSchema);