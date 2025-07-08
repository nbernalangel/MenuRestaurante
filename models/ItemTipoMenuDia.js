const mongoose = require('mongoose');

// Esquema para las opciones dentro de un tipo de ítem (ej: "Sopa", "Fruta" para "Entrada")
const opcionItemMenuDiaSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' }
}, { _id: false }); // No necesitamos un ID para cada opción individual

// Esquema para el tipo de ítem del menú del día (ej: "Entrada", "Proteína", "Principio")
const itemTipoMenuDiaSchema = new mongoose.Schema({
    nombreTipo: { // Ej: "Entrada", "Proteína", "Principio", "Postre"
        type: String,
        required: true,
        unique: true, // Asegura que solo haya un tipo con este nombre (no dos "Entradas")
        trim: true
    },
    opciones: [opcionItemMenuDiaSchema] // Un arreglo de las opciones disponibles para este tipo
});

const ItemTipoMenuDia = mongoose.model('ItemTipoMenuDia', itemTipoMenuDiaSchema);

module.exports = ItemTipoMenuDia;