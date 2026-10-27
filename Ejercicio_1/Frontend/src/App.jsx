import React, { useState } from 'react';
import './App.css';

function App() {
  const [inputTemp, setInputTemp] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [isStabilized, setIsStabilized] = useState(false);

  const API_URL = 'http://localhost:5000';

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!inputTemp) return;

    try {
      const response = await fetch(`${API_URL}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ temperatura: Number(inputTemp) }),
      });

      const data = await response.json();
      
      const mensajeServidor = data.mensaje || data.error;
      setServerMessage(mensajeServidor);

      setHistory((prev) => [
        { temp: inputTemp, result: mensajeServidor },
        ...prev,
      ]);

      if (data.estado === 'EXITO') {
        setIsStabilized(true);
      }

      setInputTemp('');
    } catch (error) {
      console.error('Error de conexión:', error);
      setServerMessage('No se pudo conectar con el servidor backend.');
    }
  };

  const handleReboot = async () => {
    try {
      const response = await fetch(`${API_URL}/reboot`, {
        method: 'POST',
      });
      const data = await response.json();
      
      setInputTemp('');
      setServerMessage(data.mensaje || 'Sistema reiniciado.');
      setHistory([]);
      setIsStabilized(false);
    } catch (error) {
      console.error('Error al reiniciar:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: 'auto' }}>
      <h2>Estabiliza el Reactor</h2>

      {!isStabilized ? (
        <form onSubmit={handleAdjust}>
          <div>
            <label>Temperatura (1 - 100): </label>
            <input
              type="number"
              min="1"
              max="100"
              value={inputTemp}
              onChange={(e) => setInputTemp(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>
            Ajustar Temperatura
          </button>
        </form>
      ) : (
        <div>
          <h3 style={{ color: 'green' }}>¡Reactor Estabilizado Correctamente! </h3>
          <button onClick={handleReboot}>Reiniciar Sistema</button>
        </div>
      )}

      {serverMessage && (
        <div style={{ marginTop: '15px', padding: '10px', background: '#eef', borderRadius: '5px' }}>
          <strong>Respuesta del servidor:</strong> {serverMessage}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>Historial de Intentos</h3>
        {history.length === 0 ? (
          <p>No hay registro de intentos aún.</p>
        ) : (
          <ul>
            {history.map((item, index) => (
              <li key={index}>
                Intento: <strong>{item.temp}</strong> — Mensaje: <em>{item.result}</em>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isStabilized && history.length > 0 && (
        <button onClick={handleReboot} style={{ marginTop: '20px', background: '#ffcccc' }}>
          Reiniciar Partida
        </button>
      )}
    </div>
  );
}

export default App;