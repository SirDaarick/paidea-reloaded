import asyncio
import sys
from datetime import datetime, date, timezone

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.db.init_db import init_db
from app.models.usuario import Usuario, DatosPersonales, Direccion, RolUsuario
from app.models.academico import Carrera, Materia, PeriodoAcademico, Grupo, Clase, HorarioClase
from app.models.alumno import Alumno
from app.models.profesor import Profesor
from app.models.inscripcion import Inscripcion, InscripcionClase, Calificacion
from app.models.tramite import CitaReinscripcion


async def seed_database() -> None:
    print("🌱 Iniciando creación e inserción de datos iniciales en la base de datos...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Verificar si ya existen usuarios
        res = await session.execute(select(Usuario).limit(1))
        if res.scalar_one_or_none():
            print("ℹ️ La base de datos ya contiene registros. Omitiendo seed.")
            return

        # 1. CARRERAS DE ESCOM / IPN
        carreras = [
            Carrera(clave="ISC", nombre="Ingeniería en Sistemas Computacionales", creditos_totales=352.0),
            Carrera(clave="IIA", nombre="Ingeniería en Inteligencia Artificial", creditos_totales=360.0),
            Carrera(clave="LCD", nombre="Licenciatura en Ciencia de Datos", creditos_totales=348.0),
        ]
        session.add_all(carreras)
        await session.flush()
        carrera_isc, carrera_iia, carrera_lcd = carreras[0], carreras[1], carreras[2]

        # 2. PERIODO ACADÉMICO
        periodo_actual = PeriodoAcademico(
            clave="2026-1",
            nombre="Periodo Escolar 2026-1",
            fecha_inicio=date(2026, 1, 26),
            fecha_fin=date(2026, 6, 20),
            activo=True,
        )
        session.add(periodo_actual)
        await session.flush()

        # 3. MATERIAS
        materias_isc = [
            Materia(clave="ISC-101", nombre="Estructuras de Datos", creditos=7.5, semestre=3, carrera_id=carrera_isc.id),
            Materia(clave="ISC-102", nombre="Bases de Datos Relacionales", creditos=7.5, semestre=4, carrera_id=carrera_isc.id),
            Materia(clave="ISC-103", nombre="Sistemas Distribuidos", creditos=7.5, semestre=6, carrera_id=carrera_isc.id),
            Materia(clave="ISC-104", nombre="Compiladores", creditos=7.5, semestre=5, carrera_id=carrera_isc.id),
        ]
        materias_iia = [
            Materia(clave="IIA-101", nombre="Fundamentos de Inteligencia Artificial", creditos=7.5, semestre=3, carrera_id=carrera_iia.id),
            Materia(clave="IIA-102", nombre="Aprendizaje Automático (Machine Learning)", creditos=8.0, semestre=5, carrera_id=carrera_iia.id),
            Materia(clave="IIA-103", nombre="Procesamiento de Lenguaje Natural", creditos=8.0, semestre=6, carrera_id=carrera_iia.id),
        ]
        session.add_all(materias_isc + materias_iia)
        await session.flush()

        # 4. USUARIOS
        # A) Administrador
        admin_user = Usuario(
            email="admin@paidea.ipn.mx",
            password_hash=hash_password("Admin123*"),
            nombre="Juan Carlos",
            primer_apellido="García",
            segundo_apellido="Sánchez",
            rol=RolUsuario.ADMINISTRADOR,
            activo=True,
        )
        session.add(admin_user)

        # B) Profesores
        profe1_user = Usuario(
            email="rlopez@ipn.mx",
            password_hash=hash_password("Profe123*"),
            nombre="Roberto",
            primer_apellido="López",
            segundo_apellido="Mendoza",
            rol=RolUsuario.PROFESOR,
            activo=True,
        )
        session.add(profe1_user)
        await session.flush()

        profe1_perfil = Profesor(
            rfc="LOMR750315ABC",
            usuario_id=profe1_user.id,
            academia="Ciencias de la Computación",
            cubiculo="Edificio 1, Cubículo 104",
        )
        profe1_dp = DatosPersonales(
            usuario_id=profe1_user.id,
            rfc="LOMR750315ABC",
            curp="LOMR750315HDFMNR01",
            telefono="5512345678",
            sexo="Masculino",
        )
        session.add_all([profe1_perfil, profe1_dp])

        profe2_user = Usuario(
            email="cmartinez@ipn.mx",
            password_hash=hash_password("Profe123*"),
            nombre="Carmen",
            primer_apellido="Martínez",
            segundo_apellido="Reyes",
            rol=RolUsuario.PROFESOR,
            activo=True,
        )
        session.add(profe2_user)
        await session.flush()

        profe2_perfil = Profesor(
            rfc="MARC820710XYZ",
            usuario_id=profe2_user.id,
            academia="Inteligencia Artificial",
            cubiculo="Edificio 2, Cubículo 201",
        )
        session.add(profe2_perfil)

        # C) Alumnos
        alumno1_user = Usuario(
            email="alumno1@paidea.ipn.mx",
            password_hash=hash_password("Alumno123*"),
            nombre="Carlos",
            primer_apellido="Pérez",
            segundo_apellido="Ramírez",
            rol=RolUsuario.ALUMNO,
            activo=True,
        )
        session.add(alumno1_user)
        await session.flush()

        alumno1_perfil = Alumno(
            boleta="2021630001",
            usuario_id=alumno1_user.id,
            carrera_id=carrera_isc.id,
            promedio=8.85,
            creditos_cursados=185.0,
            semestre_actual=6,
            situacion_academica="Regular",
        )
        alumno1_dp = DatosPersonales(
            usuario_id=alumno1_user.id,
            curp="PERC020512HDFRMN03",
            rfc="PERC0205121A0",
            telefono="5559876543",
            sexo="Masculino",
        )
        alumno1_dir = Direccion(
            usuario_id=alumno1_user.id,
            estado="Ciudad de México",
            alcaldia_municipio="Gustavo A. Madero",
            colonia="Lindavista",
            calle="Av. Instituto Politécnico Nacional",
            numero_exterior="1000",
            codigo_postal="07738",
        )
        session.add_all([alumno1_perfil, alumno1_dp, alumno1_dir])

        alumno2_user = Usuario(
            email="alumno2@paidea.ipn.mx",
            password_hash=hash_password("Alumno123*"),
            nombre="Ana",
            primer_apellido="Gómez",
            segundo_apellido="Navarro",
            rol=RolUsuario.ALUMNO,
            activo=True,
        )
        session.add(alumno2_user)
        await session.flush()

        alumno2_perfil = Alumno(
            boleta="2022630002",
            usuario_id=alumno2_user.id,
            carrera_id=carrera_iia.id,
            promedio=9.42,
            creditos_cursados=120.0,
            semestre_actual=4,
            situacion_academica="Regular",
        )
        session.add(alumno2_perfil)
        await session.flush()

        # 5. GRUPOS Y CLASES
        grupo_3cv1 = Grupo(nombre="3CV1", turno="Matutino", periodo_id=periodo_actual.id)
        session.add(grupo_3cv1)
        await session.flush()

        clase_bd = Clase(
            grupo_id=grupo_3cv1.id,
            materia_id=materias_isc[1].id, # Bases de Datos
            profesor_id=profe1_perfil.id,
            aula="Edificio 1 - Salón 103",
            cupo_maximo=35,
        )
        session.add(clase_bd)
        await session.flush()

        horario1 = HorarioClase(clase_id=clase_bd.id, dia_semana="Lunes", hora_inicio="07:00", hora_fin="08:30")
        horario2 = HorarioClase(clase_id=clase_bd.id, dia_semana="Miercoles", hora_inicio="07:00", hora_fin="08:30")
        horario3 = HorarioClase(clase_id=clase_bd.id, dia_semana="Viernes", hora_inicio="07:00", hora_fin="08:30")
        session.add_all([horario1, horario2, horario3])

        # 6. INSCRIPCIÓN Y CALIFICACIÓN DE ALUMNO 1
        inscripcion_carlos = Inscripcion(
            alumno_id=alumno1_perfil.id,
            periodo_id=periodo_actual.id,
            estado="Confirmada",
        )
        session.add(inscripcion_carlos)
        await session.flush()

        insc_clase = InscripcionClase(
            inscripcion_id=inscripcion_carlos.id,
            clase_id=clase_bd.id,
        )
        session.add(insc_clase)
        await session.flush()

        calif = Calificacion(
            inscripcion_clase_id=insc_clase.id,
            parcial_1=9.0,
            parcial_2=8.5,
            parcial_3=9.5,
            calificacion_final=9.0,
            estado="Aprobada",
        )
        session.add(calif)

        # 7. CITA DE REINSCRIPCIÓN
        cita_carlos = CitaReinscripcion(
            alumno_id=alumno1_perfil.id,
            periodo_id=periodo_actual.id,
            fecha_cita=datetime(2026, 1, 20, 9, 30, tzinfo=timezone.utc),
            lugar="Plataforma PAIDEA - Turno 1",
        )
        session.add(cita_carlos)

        await session.commit()
        print("🎉 ¡Base de datos poblada exitosamente con registros iniciales!")
        print("-------------------------------------------------------------")
        print("Credenciales de prueba generadas:")
        print("  👑 Administrador: admin@paidea.ipn.mx | Admin123*")
        print("  👨‍🏫 Profesor:     rlopez@ipn.mx      | Profe123* (RFC: LOMR750315ABC)")
        print("  🎓 Alumno 1:      alumno1@paidea.ipn.mx | Alumno123* (Boleta: 2021630001 - ISC)")
        print("  🎓 Alumno 2:      alumno2@paidea.ipn.mx | Alumno123* (Boleta: 2022630002 - IIA)")
        print("-------------------------------------------------------------")


if __name__ == "__main__":
    asyncio.run(seed_database())
