import asyncio
import time

DURACION = 0.4
TIMEOUT = 0.2


async def main():
    origen = time.perf_counter()
    eventos = []

    def registrar(texto):
        eventos.append(f"{time.perf_counter() - origen:.3f} s · {texto}")

    async def operacion():
        registrar("Abrir recurso")
        try:
            await asyncio.sleep(DURACION)
            registrar("Operación terminada")
            return "resultado"
        except asyncio.CancelledError:
            registrar("La operación recibe CancelledError")
            raise  # Permitir que la cancelación se propague.
        finally:
            registrar("Cerrar recurso en finally")

    try:
        async with asyncio.timeout(TIMEOUT):
            valor = await operacion()
        resumen = f"La operación devolvió {valor!r} dentro del plazo."
    except TimeoutError:
        registrar("El llamador recibe TimeoutError fuera del contexto")
        resumen = "Plazo agotado; la operación se canceló y ejecutó su limpieza."

    return {"resumen": resumen, "eventos": eventos}


await main()
