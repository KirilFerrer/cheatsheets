import asyncio
import time

MODO = "taskgroup"
DURACION = 0.6
FALLAR = True


async def main():
    origen = time.perf_counter()
    eventos = []
    arrancada = asyncio.Event()

    def registrar(texto):
        eventos.append(f"{time.perf_counter() - origen:.3f} s · {texto}")

    async def lenta():
        registrar("La tarea lenta empieza")
        arrancada.set()
        try:
            await asyncio.sleep(DURACION)
            registrar("La tarea lenta termina normalmente")
        except asyncio.CancelledError:
            registrar("La tarea lenta es cancelada")
            raise
        finally:
            registrar("La tarea lenta libera sus recursos")

    async def fragil():
        await arrancada.wait()
        await asyncio.sleep(0.05)
        if FALLAR:
            registrar("La tarea frágil lanza ValueError")
            raise ValueError("Fallo del recurso")
        registrar("La tarea frágil termina normalmente")

    if MODO == "taskgroup":
        try:
            async with asyncio.TaskGroup() as grupo:
                grupo.create_task(lenta())
                grupo.create_task(fragil())
        except* ValueError:
            registrar("TaskGroup entrega ExceptionGroup tras cerrar las tareas")
    else:
        tareas = [asyncio.create_task(lenta()), asyncio.create_task(fragil())]
        try:
            await asyncio.gather(*tareas)
        except ValueError:
            registrar(f"gather propaga el fallo; tarea lenta pendiente: {not tareas[0].done()}")
        finally:
            # Esperar explícitamente a las hermanas para no dejar tareas sueltas.
            await asyncio.gather(*tareas, return_exceptions=True)
            registrar("El llamador ha esperado a todas las tareas")

    return {"resumen": "Grupo cerrado. Lee qué ocurrió con la tarea hermana.", "eventos": eventos}


await main()
