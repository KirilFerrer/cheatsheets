import asyncio
import time

TAREAS = 6
ESPERA = 0.15
LIMITE = 3
MODO = "concurrente"
VARIABLE = False


async def main():
    origen = time.perf_counter()
    semaforo = asyncio.Semaphore(LIMITE)
    registros = []
    finalizacion = []

    async def obtener(numero):
        # El permiso se adquiere antes de comenzar la operación.
        async with semaforo:
            inicio = time.perf_counter() - origen
            duracion = ESPERA * ([2, 0.5, 1][numero % 3] if VARIABLE else 1)
            await asyncio.sleep(duracion)
            fin = time.perf_counter() - origen
            registros.append({"tarea": numero, "inicio": inicio, "fin": fin})
            finalizacion.append(numero)
            return numero

    if MODO == "secuencial":
        resultados = []
        for numero in range(TAREAS):
            resultados.append(await obtener(numero))
    else:
        resultados = await asyncio.gather(*(obtener(n) for n in range(TAREAS)))

    total = time.perf_counter() - origen
    return {
        "resumen": f"{TAREAS} tareas terminadas en {total:.3f} s.",
        "eventos": [
            f"Orden de finalización: {finalizacion}",
            f"Orden de los resultados: {resultados}",
            f"Máximo de operaciones simultáneas permitido: {LIMITE}",
        ],
        "registros": registros,
        "duracion": total,
    }


# En un archivo .py, sustituye esta línea por: print(asyncio.run(main()))
await main()
