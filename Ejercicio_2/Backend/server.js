const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Inventario inicial y estado de la carga en memoria[cite: 9, 10]
let inventario = [
    { id: 201, nombre: "Tanque de Oxígeno XL", precio: 50.00, stock: 5, categoria: "Soporte Vital" },
    { id: 202, nombre: "Raciones de Emergencia", precio: 20.00, stock: 10, categoria: "Alimentación" },
    { id: 203, nombre: "Batería de Ion de Litio", precio: 75.00, stock: 3, categoria: "Energía" },
    { id: 204, nombre: "Kit de Reparación de Casco", precio: 120.00, stock: 2, categoria: "Mantenimiento" }
];

let naveCarga = {
    creditos: 500.00,
    itemsCargados: []
};

// Función auxiliar para calcular el costo total de la carga activa
function calcularTotalCarga() {
    let total = 0;
    naveCarga.itemsCargados.forEach(item => {
        const suministro = inventario.find(s => s.id === item.id);
        if (suministro) {
            total += suministro.precio * item.cantidad;
        }
    });
    return total;
}

// 1. GET /api/inventario: Devuelve la lista completa de suministros[cite: 9, 10]
app.get('/api/inventario', (req, res) => {
    res.json(inventario);
});

// 2. GET /api/carga: Devuelve los detalles de la carga activa y créditos[cite: 10]
app.get('/api/carga', (req, res) => {
    res.json({
        creditos: naveCarga.creditos,
        itemsCargados: naveCarga.itemsCargados,
        total: calcularTotalCarga()
    });
});

// 3. POST /api/carga/agregar: Añade temporalmente el suministro a la nave[cite: 10]
app.post('/api/carga/agregar', (req, res) => {
    const { equipoId, cantidad = 1 } = req.body;

    const suministro = inventario.find(s => s.id === Number(equipoId));
    if (!suministro) {
        return res.status(404).json({ error: "Suministro no encontrado en base." });
    }

    // Validación: Si el stock del backend es menor a la cantidad solicitada[cite: 10]
    if (suministro.stock < cantidad) {
        return res.status(400).json({ error: "Stock en base insuficiente" });
    }

    const itemExistente = naveCarga.itemsCargados.find(i => i.id === Number(equipoId));
    const costoAdicional = suministro.precio * cantidad;
    const costoActual = calcularTotalCarga();

    // Validación de presupuesto/créditos
    if ((costoActual + costoAdicional) > naveCarga.creditos) {
        return res.status(400).json({ error: "Créditos insuficientes para esta cantidad" });
    }

    // Descontar stock base y añadir a la nave
    suministro.stock -= cantidad;

    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        naveCarga.itemsCargados.push({ id: Number(equipoId), cantidad });
    }

    res.json({
        message: "Suministro agregado correctamente",
        creditos: naveCarga.creditos,
        itemsCargados: naveCarga.itemsCargados,
        total: calcularTotalCarga()
    });
});

// 4. PUT /api/carga/actualizar-unidades/:id: Actualiza la cantidad de unidades[cite: 10]
app.put('/api/carga/actualizar-unidades/:id', (req, res) => {
    const id = Number(req.params.id);
    const { cantidad } = req.body;

    const itemCargado = naveCarga.itemsCargados.find(i => i.id === id);
    const suministro = inventario.find(s => s.id === id);

    if (!itemCargado || !suministro) {
        return res.status(404).json({ error: "Item no encontrado en la bodega." });
    }

    const diferencia = cantidad - itemCargado.cantidad;

    if (diferencia > 0) {
        // Validación de stock al subir unidades[cite: 10]
        if (suministro.stock < diferencia) {
            return res.status(400).json({ error: "Stock en base insuficiente" });
        }
        
        const costoActual = calcularTotalCarga();
        const costoExtra = suministro.precio * diferencia;
        
        // Validación didáctica: Si el costo total supera los créditos[cite: 10]
        if ((costoActual + costoExtra) > naveCarga.creditos) {
            return res.status(400).json({ error: "Créditos insuficientes para esta cantidad" });
        }

        suministro.stock -= diferencia;
    } else if (diferencia < 0) {
        suministro.stock += Math.abs(diferencia);
    }

    itemCargado.cantidad = cantidad;

    // Si la cantidad llega a 0, eliminar de la carga
    if (itemCargado.cantidad <= 0) {
        naveCarga.itemsCargados = naveCarga.itemsCargados.filter(i => i.id !== id);
    }

    res.json({
        message: "Unidades actualizadas",
        creditos: naveCarga.creditos,
        itemsCargados: naveCarga.itemsCargados,
        total: calcularTotalCarga()
    });
});

// 5. DELETE /api/carga/eliminar/:id: Elimina el suministro y devuelve el stock[cite: 10]
app.delete('/api/carga/eliminar/:id', (req, res) => {
    const id = Number(req.params.id);
    const itemCargado = naveCarga.itemsCargados.find(i => i.id === id);
    const suministro = inventario.find(s => s.id === id);

    if (itemCargado && suministro) {
        // Devolver unidades al inventario general de la base[cite: 10]
        suministro.stock += itemCargado.cantidad;
        naveCarga.itemsCargados = naveCarga.itemsCargados.filter(i => i.id !== id);
    }

    res.json({
        message: "Suministro eliminado de la carga",
        creditos: naveCarga.creditos,
        itemsCargados: naveCarga.itemsCargados,
        total: calcularTotalCarga()
    });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});