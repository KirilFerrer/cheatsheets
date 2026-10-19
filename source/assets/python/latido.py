import asyncio
import time

DURACION = 0.4
INTERVALO = 0.05
MODO = "bloqueante"


async def main():
    origen = time.perf_counter()
    marcas = []
    terminado = asyncio.Event()

    async def latido():
        while not terminado.is_set():
            marcas.append(time.perf_counter() - origen)
            await asyncio.sleep(INTERVALO)

    def calcular(segundos):
        limite = time.perf_counter() + segundos
        while time.perf_counter() < limite:
            pass  # Carga de CPU acotada; no contiene un punto de suspensión.

    tarea = asyncio.create_task(latido())
    await asyncio.sleep(0)  # Dejar que el latido arranque antes del trabajo.
    try:
        if MODO == "bloqueante":
            calcular(DURACION)
        elif MODO == "espera":
            await asyncio.sleep(DURACION)
        else:
            limite = time.perf_counter() + DURACION
            while time.perf_counter() < limite:
                calcular(min(0.015, max(0, limite - time.perf_counter())))
                await asyncio.sleep(0)
    finally:
        terminado.set()
        await tarea

    total = time.perf_counter() - origen
    # Incluir el final permite detectar el bloqueo aunque solo hubiese un latido.
    puntos = [0, *marcas, total]
    hueco = max(b - a for a, b in zip(puntos, puntos[1:]))
    unidad = "latido" if len(marcas) == 1 else "latidos"
    return {
        "resumen": f"{len(marcas)} {unidad}. Mayor intervalo sin latido: {hueco:.3f} s.",
        "eventos": [f"Latido en {marca:.3f} s" for marca in marcas]
        + [f"Fin en {total:.3f} s"],
    }


await main()
