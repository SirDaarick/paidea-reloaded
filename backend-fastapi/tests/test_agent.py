import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_crear_y_listar_hilos():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login alumno
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Crear hilo
        create_res = await ac.post(
            "/api/v1/agent/threads",
            json={"titulo": "Dudas de Reinscripción y Kárdex"},
            headers=headers
        )
        assert create_res.status_code == 200
        thread_data = create_res.json()
        assert thread_data["titulo"] == "Dudas de Reinscripción y Kárdex"
        assert thread_data["activo"] is True
        thread_id = thread_data["id"]

        # 3. Listar hilos
        list_res = await ac.get("/api/v1/agent/threads", headers=headers)
        assert list_res.status_code == 200
        threads = list_res.json()
        assert any(t["id"] == thread_id for t in threads)

        # 4. Obtener detalle de hilo
        detail_res = await ac.get(f"/api/v1/agent/threads/{thread_id}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == thread_id
        assert isinstance(detail["mensajes"], list)


@pytest.mark.asyncio
async def test_chat_autenticado_con_persistencia():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login alumno
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Enviar mensaje de chat
        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "¿Cuál es mi promedio oficial?"},
            headers=headers
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "respuesta" in data
        assert data["thread_id"] is not None
        assert "8.85" in data["respuesta"] or "Carlos Pérez" in data["respuesta"] or "9.0" in data["respuesta"]
        assert "SUGGESTIONS" in data["respuesta"]

        # 3. Verificar que el hilo contenga tanto el mensaje del usuario como el del bot
        thread_id = data["thread_id"]
        detail_res = await ac.get(f"/api/v1/agent/threads/{thread_id}", headers=headers)
        assert detail_res.status_code == 200
        mensajes = detail_res.json()["mensajes"]
        assert len(mensajes) >= 2
        roles = [m["rol"] for m in mensajes]
        assert "user" in roles
        assert "assistant" in roles


@pytest.mark.asyncio
async def test_chat_streaming_sse():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login alumno
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Iniciar streaming
        stream_res = await ac.post(
            "/api/v1/agent/chat/stream",
            json={"mensaje": "¿A qué hora es mi próxima clase hoy?"},
            headers=headers
        )
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers.get("content-type", "")
        body = stream_res.text
        assert "data:" in body


@pytest.mark.asyncio
async def test_chat_profesor_metricas():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login profesor
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "LOMR750315ABC",
            "password": "Profe123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Consultar métricas
        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "Muestra mis métricas de rendimiento docente"},
            headers=headers
        )
        assert chat_res.status_code == 200
        assert "Roberto López" in chat_res.json()["respuesta"]


@pytest.mark.asyncio
async def test_chat_consultar_ets():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "¿Cuáles son mis fechas de exámenes ETS?"},
            headers=headers
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "ETS" in data["respuesta"] or "Exámenes a Título de Suficiencia" in data["respuesta"]


@pytest.mark.asyncio
async def test_chat_consultar_optativas():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "¿Qué materias optativas puedo cursar en mi plan de estudio?"},
            headers=headers
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "PLAN_OPTATIVAS" in data["respuesta"] or "Catálogo" in data["respuesta"]


@pytest.mark.asyncio
async def test_chat_ubicar_profesor():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "¿Dónde está el cubículo del profesor Roberto López?"},
            headers=headers
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "Edificio 1" in data["respuesta"] or "Roberto López" in data["respuesta"]


@pytest.mark.asyncio
async def test_chat_consultar_datos_personales():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "Muestra mis datos personales y CURP registrados"},
            headers=headers
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "2021630001" in data["respuesta"] or "Carlos Pérez" in data["respuesta"]


@pytest.mark.asyncio
async def test_chat_cupos_materias():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "¿Cuáles son los cupos y lugares disponibles para reinscripción?"},
            headers=headers
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "CUPOS" in data["respuesta"] or "lugares disponibles" in data["respuesta"]


@pytest.mark.asyncio
async def test_chat_asistencias_art45():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "Auditar mis asistencias y faltas conforme al Artículo 45 del RGE"},
            headers=headers
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "ASISTENCIAS" in data["respuesta"] or "asistencia" in data["respuesta"].lower()


@pytest.mark.asyncio
async def test_chat_estatus_tramites():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "¿Cuál es el estatus de mi trámite escolar?"},
            headers=headers
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "ESTATUS_TRAMITES" in data["respuesta"] or "Trámites" in data["respuesta"]


@pytest.mark.asyncio
async def test_chat_inscribir_ets_y_confirmacion_hitl():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "2021630001",
            "password": "Alumno123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Idempotencia: limpiar inscripciones previas del test
        import sqlite3
        con = sqlite3.connect("paidea.db")
        con.execute("DELETE FROM inscripciones_ets WHERE alumno_id = 1")
        con.commit()
        con.close()

        # 1. Petición inicial genera tarjeta de confirmación Human-in-the-Loop
        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "Quiero inscribir ETS de Compiladores"},
            headers=headers
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "ACTION_CONFIRMATION" in data["respuesta"] or "confirm" in data["respuesta"].lower()

        # 2. Confirmación explícita mediante el endpoint seguro
        confirm_res = await ac.post(
            "/api/v1/agent/action/confirm",
            json={
                "action": "inscribir_ets",
                "payload": {"ets_id": 1}
            },
            headers=headers
        )
        assert confirm_res.status_code == 200
        c_data = confirm_res.json()
        assert c_data["success"] is True
        assert "ETS-" in c_data["folio"]


@pytest.mark.asyncio
async def test_chat_docente_alumnos_en_riesgo():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "identificador": "LOMR750315ABC",
            "password": "Profe123*"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        chat_res = await ac.post(
            "/api/v1/agent/chat",
            json={"mensaje": "Reporte de alumnos en riesgo de reprobar en mis materias"},
            headers=headers
        )
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert "ALUMNOS_RIESGO" in data["respuesta"] or "reprobatorio" in data["respuesta"] or "Excelente" in data["respuesta"]


