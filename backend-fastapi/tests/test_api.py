import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["knowledge_base_chunks"] > 0


@pytest.mark.asyncio
async def test_login_con_email_admin():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "identificador": "admin@paidea.ipn.mx",
            "password": "Admin123*"
        })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["rol"] == "Administrador"


@pytest.mark.asyncio
async def test_login_con_boleta_alumno():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["rol"] == "Alumno"
    assert data["boleta_o_rfc"] == "2021630001"


@pytest.mark.asyncio
async def test_login_con_rfc_profesor():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "identificador": "LOMR750315ABC",
            "password": "Profe123*"
        })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["rol"] == "Profesor"


@pytest.mark.asyncio
async def test_login_credenciales_invalidas():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "PasswordIncorrecto"
        })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_consultar_kardex_y_horario_alumno():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Kardex
        kardex_res = await ac.get("/api/v1/alumnos/me/kardex", headers=headers)
        assert kardex_res.status_code == 200
        kardex_data = kardex_res.json()
        assert kardex_data["boleta"] == "2021630001"
        assert len(kardex_data["materias"]) > 0

        # 3. Horario
        horario_res = await ac.get("/api/v1/alumnos/me/horario", headers=headers)
        assert horario_res.status_code == 200
        horario_data = horario_res.json()
        assert len(horario_data) > 0


@pytest.mark.asyncio
async def test_agente_conversacional_legacy():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Consulta de promedio por boleta
        res = await ac.post("/preguntar", json={
            "pregunta": "¿Cuál es mi promedio?",
            "identificador": "2021630001",
            "historial": []
        })
        assert res.status_code == 200
        data = res.json()
        assert "respuesta" in data
        assert "8.85" in data["respuesta"] or "Carlos Pérez" in data["respuesta"]

        # Consulta de reglamento en ChromaDB
        res_rag = await ac.post("/preguntar", json={
            "pregunta": "¿Qué es un dictamen?",
            "identificador": "2021630001",
            "historial": []
        })
        assert res_rag.status_code == 200
        data_rag = res_rag.json()
        assert "respuesta" in data_rag
        assert len(data_rag["respuesta"]) > 20
