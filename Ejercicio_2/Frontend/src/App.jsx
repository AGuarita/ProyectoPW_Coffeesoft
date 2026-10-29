import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Button,
  Badge,
  ListGroup,
  ListGroupItem,
  ButtonGroup,
  UncontrolledAlert,
  Navbar,
  NavbarBrand,
  Spinner
} from 'reactstrap';
import './App.css';

function App() {
  const [inventario, setInventario] = useState([]);
  const [carga, setCarga] = useState({ creditos: 0, itemsCargados: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // URL base de tu backend Express
  const API_URL = 'http://localhost:5000/api';

  // Obtener datos iniciales (Inventario y Carga actual)
  const fetchData = async () => {
    try {
      const [resInv, resCarga] = await Promise.all([
        fetch(`${API_URL}/inventario`),
        fetch(`${API_URL}/carga`)
      ]);

      if (!resInv.ok || !resCarga.ok) throw new Error('Error al conectar con el servidor de la base.');

      const dataInv = await resInv.json();
      const dataCarga = await resCarga.json();

      setInventario(dataInv);
      setCarga(dataCarga);
      setLoading(false);
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Endpoint 3: Añadir suministro a la nave
  const agregarACarga = async (equipoId) => {
    try {
      setErrorMsg(null);
      const res = await fetch(`${API_URL}/carga/agregar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipoId, cantidad: 1 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Stock en base insuficiente');

      fetchData(); // Refrescar datos
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Endpoint 4: Actualizar unidades (+ o -)
  const actualizarUnidades = async (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarItem(id);
      return;
    }
    try {
      setErrorMsg(null);
      const res = await fetch(`${API_URL}/carga/actualizar-unidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: nuevaCantidad })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Créditos insuficientes para esta cantidad');

      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Endpoint 5: Eliminar / Desembarcar suministro
  const eliminarItem = async (id) => {
    try {
      setErrorMsg(null);
      const res = await fetch(`${API_URL}/carga/eliminar/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al desembarcar el suministro');

      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Buscar detalles del nombre del item cargado cruzando con el inventario
  const obtenerDetalleItem = (id) => {
    return inventario.find(item => item.id === id) || { nombre: 'Desconocido', precio: 0 };
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner color="primary" />
        <p className="mt-2">Cargando sistemas de AstroLogistics...</p>
      </div>
    );
  }

  return (
    <Container className="my-4">
      {/* Panel Superior / Navbar de Misión */}
      <Navbar dark className="mission-header mb-4 justify-content-between">
        <NavbarBrand className="fw-bold">🚀 AstroLogistics Ltd. - Control de Manifiesto</NavbarBrand>
        <div>
          <span className="me-3">Créditos Disponibles: <Badge color="success">{carga.creditos} Cr</Badge></span>
          <span>Costo Total de Carga: <Badge color="dark" pill>{carga.total} Cr</Badge></span>
        </div>
      </Navbar>

      {/* Manejo de Alertas de Errores por Restricciones */}
      {errorMsg && (
        <UncontrolledAlert color="warning" className="fw-bold">
          ⚠️ Alerta de Misión: {errorMsg}
        </UncontrolledAlert>
      )}

      <Row>
        {/* Catálogo de la Base (Izquierda / 8 columnas) */}
        <Col md="8" xs="12">
          <h3 className="mb-3 text-light">Catálogo de Suministros (Base)</h3>
          <Row>
            {inventario.map((suministro) => (
              <Col md="4" xs="12" key={suministro.id} className="mb-3">
                <Card className="card-custom h-100">
                  <CardBody className="d-flex flex-column justify-content-between">
                    <div>
                      <CardTitle tag="h5" className="text-info">{suministro.nombre}</CardTitle>
                      <small className="text-muted d-block mb-2">Categoría: {suministro.categoria}</small>
                      <div className="mb-2">
                        <Badge color="success" className="me-2">${suministro.precio.toFixed(2)} Cr</Badge>
                        <Badge color={suministro.stock > 0 ? 'secondary' : 'danger'}>
                          Stock: {suministro.stock}
                        </Badge>
                      </div>
                    </div>
                    {suministro.stock === 0 ? (
                      <Button color="secondary" disabled size="sm" className="mt-2">
                        Agotado en Base
                      </Button>
                    ) : (
                      <Button color="primary" size="sm" className="mt-2" onClick={() => agregarACarga(suministro.id)}>
                        Añadir a la Nave
                      </Button>
                    )}
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        {/* Bodega de Carga / Panel Lateral (Derecha / 4 columnas) */}
        <Col md="4" xs="12">
          <div className="cargo-panel">
            <h4 className="mb-3 text-light">Bodega de Carga</h4>
            {carga.itemsCargados.length === 0 ? (
              <p className="text-muted">La bodega está vacía. Selecciona suministros del catálogo.</p>
            ) : (
              <ListGroup flush>
                {carga.itemsCargados.map((item) => {
                  const detalle = obtenerDetalleItem(item.id);
                  return (
                    <ListGroupItem key={item.id} className="bg-transparent text-light border-secondary d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{detalle.nombre}</strong>
                        <br />
                        <small className="text-muted">Cant: {item.cantidad} | ${ (detalle.precio * item.cantidad).toFixed(2) } Cr</small>
                      </div>
                      <div className="d-flex align-items-center">
                        <ButtonGroup size="sm" className="me-2">
                          <Button color="outline-light" onClick={() => actualizarUnidades(item.id, item.cantidad - 1)}>-</Button>
                          <Button color="outline-light" disabled>{item.cantidad}</Button>
                          <Button color="outline-light" onClick={() => actualizarUnidades(item.id, item.cantidad + 1)}>+</Button>
                        </ButtonGroup>
                        <Button color="danger" outline size="sm" onClick={() => eliminarItem(item.id)}>
                          ✕
                        </Button>
                      </div>
                    </ListGroupItem>
                  );
                })}
              </ListGroup>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default App;