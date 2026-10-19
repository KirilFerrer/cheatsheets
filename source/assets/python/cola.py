import asyncio
import time

TAREAS = 8
CAPACIDAD = 2
CONSUMIDORES = 2
ESPERA = 0.1


async def main():
    cola = asyncio.Queue(maxsize=CAPACIDAD)
    origen = time.perf_counter()
    eventos = []
    resultados = []
    maximo = 0

    def registrar(texto):
        eventos.append(f"{time.perf_counter() - origen:.3f} s · {texto}")

    async def productor():
        nonlocal maximo
        for numero in range(TAREAS):
            if cola.full():
                registrar(f"Cola llena: el productor espera para poner {numero}")
            await cola.put(numero)
            maximo = max(maximo, cola.qsize())
            registrar(f"Entra {numero}; tamaño de la cola: {cola.qsize()}")
        for _ in range(CONSUMIDORES):
            await cola.put(None)  # Una señal de cierre para cada consumidor.

    async def consumidor(nombre):
        while True:
            numero = await cola.get()
            try:
                if numero is None:
                    registrar(f"Consumidor {nombre}: cierre")
                    return
                registrar(f"Consumidor {nombre}: empieza {numero}")
                await asyncio.sleep(ESPERA)
                resultados.append(numero)
                registrar(f"Consumidor {nombre}: termina {numero}")
            finally:
                cola.task_done()

    async with asyncio.TaskGroup() as grupo:
        for nombre in range(CONSUMIDORES):
            grupo.create_task(consumidor(nombre))
        await productor()
        await cola.join()

    return {
        "resumen": f"{len(resultados)} elementos procesados. Máximo observado en cola: {maximo}/{CAPACIDAD}.",
        "eventos": eventos,
        "procesados": sorted(resultados),
        "maximo": maximo,
    }


await main()
