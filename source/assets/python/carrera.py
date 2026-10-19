import asyncio

TAREAS = 4
INCREMENTOS = 3
PROTEGER = False


async def main():
    contador = 0
    lock = asyncio.Lock()
    eventos = []

    async def incrementar(numero):
        nonlocal contador
        for _ in range(INCREMENTOS):
            if PROTEGER:
                async with lock:
                    anterior = contador
                    await asyncio.sleep(0)
                    contador = anterior + 1
            else:
                anterior = contador
                await asyncio.sleep(0)
                contador = anterior + 1
            eventos.append(f"Tarea {numero}: leyó {anterior}, escribió {anterior + 1}")

    await asyncio.gather(*(incrementar(n) for n in range(TAREAS)))
    esperado = TAREAS * INCREMENTOS
    return {
        "resumen": f"Contador esperado: {esperado}. Contador obtenido: {contador}.",
        "eventos": eventos,
        "esperado": esperado,
        "obtenido": contador,
    }


await main()
