import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from app.core.database import engine
from app.models.base import Base
# Importar todos los modelos para registrarlos en Base.metadata
import app.models # noqa: F401


async def init_db() -> None:
    """Crea todas las tablas en la base de datos configurada."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tablas de base de datos creadas exitosamente.")


async def drop_db() -> None:
    """Elimina todas las tablas (usar solo en pruebas/reinicio)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("⚠️ Tablas eliminadas.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db())
