const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


let temperaturaIdeal = 0;


function generarTemperatura() {
    temperaturaIdeal = Math.floor(Math.random() * 100) + 1;
    console.log(`[SISTEMA REACTOR] Nueva temperatura de estabilización generada: ${temperaturaIdeal}`);
}


generarTemperatura();


app.post('/adjust', (req, res) => {
    const { temperatura } = req.body;

    if (temperatura === undefined || typeof temperatura !== 'number') {
        return res.status(400).json({ error: 'Debe proporcionar un valor numérico válido en "temperatura".' });
    }

    if (temperatura < temperaturaIdeal) {
        res.json({
            estado: 'FALLO',
            mensaje: 'La temperatura ideal del reactor es más alta.'
        });
    } else if (temperatura > temperaturaIdeal) {
        res.json({
            estado: 'FALLO',
            mensaje: 'La temperatura ideal del reactor es más baja.'
        });
    } else {
        res.json({
            estado: 'EXITO',
            mensaje: '¡Reactor estabilizado correctamente!'
        });
    }
});


app.post('/reboot', (req, res) => {
    generarTemperatura();
    res.json({
        estado: 'REINICIADO',
        mensaje: 'Sistema reiniciado. Se ha generado una nueva temperatura objetivo.'
    });
});


app.listen(PORT, () => {
    console.log(`Servidor del Reactor ejecutándose en http://localhost:${PORT}`);
});