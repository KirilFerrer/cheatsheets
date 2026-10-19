---
title: 'Python · Asincronía y concurrencia'
date: '2026-10-20'
updated: '2026-10-20'
layout: 'learning'
language: 'es'
disableNunjucks: true
icon: 'python'
series_title: 'Custom'
series_path: '/custom/'
categories: ['Custom']
intro: 'Corrutinas, tareas, hilos y procesos: qué ejecuta cada modelo, cuándo cede el control y cómo coordinar el trabajo.'
heading: 'Asincronía y concurrencia en Python'
menu_title: 'Asincronía Python'
learning_classes: 'learning-page learning-custom learning-page-cards'
background: 'bg-gradient-to-r from-teal-700 to-cyan-900 !text-white'
python_labs: true
---

## Concurrencia, paralelismo y asincronía

Un programa secuencial termina una operación antes de empezar la siguiente. Si pide seis recursos y cada petición tarda 150 ms, puede pasar casi un segundo esperando aunque el procesador tenga muy poco trabajo. La concurrencia permite mantener varias operaciones en curso: mientras una espera, otra puede avanzar.

**Concurrencia** describe la organización de tareas cuyos intervalos de ejecución se solapan. **Paralelismo** significa que varias tareas están ejecutando instrucciones al mismo tiempo, por ejemplo en dos núcleos. Un programa puede ser concurrente con un solo hilo y un solo núcleo: alterna entre tareas cuando estas tienen que esperar.

La **asincronía** es una forma de expresar operaciones que pueden suspenderse y reanudarse sin mantener ocupado el hilo durante la espera. En `asyncio`, las tareas cooperan con un bucle de eventos. Esa cooperación no crea un núcleo adicional ni convierte automáticamente en concurrente cualquier `for` que contenga `await`.

Los cuatro modelos que compararemos son:

- **Secuencial**: una llamada después de otra. Es la referencia para comprobar resultados y tiempos.
- **Hilos**: varios flujos de ejecución dentro del mismo proceso. Comparten memoria; el sistema operativo decide cuándo atenderlos.
- **Asyncio**: tareas que suspenden su ejecución al esperar una operación preparada para ello. El bucle atiende otra tarea en ese mismo hilo.
- **Procesos**: intérpretes independientes con memorias separadas. Se comunican enviando argumentos y resultados.

Una tarea es una unidad de trabajo de tu aplicación: descargar un recurso, procesar una imagen o contestar una petición. Un hilo y un proceso son recursos de ejecución. La palabra `Task`, con mayúscula, también nombra un objeto concreto de `asyncio`; veremos su contrato antes de utilizarlo.

## Ejecutar los ejemplos

Los paneles de esta página ejecutan **Python real en el navegador** mediante Pyodide. Pulsa **Ejecutar** una primera vez. Después puedes cambiar los parámetros y dejar activada la actualización automática; el código visible cambia al instante y el resultado se recalcula al soltar el control. Desactiva esa opción si quieres preparar varios cambios y ejecutarlos juntos.

Cada panel muestra su resultado debajo de sus controles. Los cambios no modifican el código ni los resultados de los demás paneles. **Detener** corta la prueba; la siguiente volverá a preparar Python si es necesario. Para observar la cancelación cooperativa y el cierre con `finally`, utiliza el apartado de cancelación. Solo se ejecuta un panel a la vez para que dos pruebas no se estorben al medir tiempos.

El código de los paneles termina con `await main()`. Esa forma funciona en esta página y en una celda de Jupyter, donde ya existe un bucle de eventos. Para llevar uno de estos ejemplos a un archivo `ejemplo.py`, sustituye esa última línea por:

```python
print(asyncio.run(main()))
```

Ejecuta el archivo desde una terminal con Python 3.11 o posterior:

```bash
python ejemplo.py
```

`asyncio.run()` prepara un bucle, ejecuta la corrutina principal y cierra los recursos del bucle al terminar. No lo llames dentro de otro bucle que ya esté ejecutándose, como el de Jupyter; allí utiliza `await main()`.

Los ejemplos de hilos, procesos y servidor HTTP se ejecutan **en Python local**, como indica cada apartado. El Python del navegador tiene restricciones y no ofrece los hilos y procesos del sistema operativo que utilizan esas pruebas. Un Web Worker mantiene estos paneles separados de la interfaz, pero no equivale a un `ThreadPoolExecutor` de Python. [Python en un Web Worker](https://pyodide.org/en/0.27.7/usage/webworker.html), [restricciones de Pyodide](https://pyodide.org/en/0.27.7/usage/wasm-constraints.html).

## Detectar qué está limitando el programa

Un trabajo es **I/O-bound** cuando pasa una parte importante de su tiempo esperando entrada o salida: red, disco, base de datos. Mientras espera, el procesador podría atender otra tarea. Es **CPU-bound** cuando el coste principal consiste en ejecutar cálculos. Solapar esperas y repartir cálculos resuelven problemas distintos.

Hay dos relojes que conviene separar. `time.perf_counter()` mide tiempo transcurrido, incluidas esperas y pausas del planificador. `time.thread_time()` mide CPU consumida por el hilo actual. Este ejemplo se ejecuta en Python local:

```python
import time

def medir(nombre, funcion):
    pared = time.perf_counter()
    cpu = time.thread_time()
    resultado = funcion()
    print(
        nombre,
        "pared:", round(time.perf_counter() - pared, 4),
        "CPU del hilo:", round(time.thread_time() - cpu, 4),
    )
    return resultado

medir("espera", lambda: time.sleep(0.2))
medir("cálculo", lambda: sum(n * n for n in range(1_000_000)))
```

La espera debería consumir unos 200 ms de tiempo transcurrido y muy poca CPU del hilo. En el cálculo, ambos tiempos suelen acercarse. Una diferencia no demuestra por sí sola que el programa esté esperando red: también puede haber contención, planificación o trabajo delegado a otros hilos. El reloj describe una medida; hay que relacionarla con lo que hace el código.

En una ejecución con procesos, medir únicamente la CPU del padre omite el cálculo de los hijos. Para estimar CPU agregada, cada trabajador debe medir su propio trabajo y devolver esa medida. Tampoco confundas la suma de intervalos de las tareas con el tiempo del lote: seis esperas de 150 ms pueden sumar 900 ms de intervalos y terminar en unos 300 ms si se atienden de tres en tres.

## Esperas secuenciales y concurrentes

Empezamos con `asyncio.sleep()` para controlar la duración de una operación sin depender de Internet. La llamada representa una espera: suspende la tarea durante al menos el intervalo indicado y permite atender otras tareas. No envía una petición ni descarga nada.

En este primer panel, selecciona **for con await**. Cada `await obtener(numero)` espera a que termine esa llamada antes de pasar a la siguiente iteración. Aunque la función sea asíncrona, el lote sigue siendo secuencial. Con seis tareas de 150 ms, el tiempo ronda 900 ms.

Después selecciona **gather con semáforo**. `gather()` recibe las corrutinas, las programa como tareas y espera sus resultados. `Semaphore(3)` permite que como máximo tres entren en la operación a la vez. Con duraciones iguales, el lote necesita aproximadamente dos tandas de 150 ms.

<div data-python-demo="io"><p>El panel necesita JavaScript. El recorrido y los ejemplos de código de la página se pueden leer sin ejecutarlo.</p></div>

### Qué mide la línea temporal

`origen` se toma una vez al comenzar el lote. Cada tarea registra su inicio después de obtener el permiso y su final al volver de la espera. Así, la parte anterior a la barra incluye el tiempo que estuvo pendiente de entrar; la barra representa la operación que ya había comenzado. **Una barra larga no significa que la CPU haya estado calculando todo ese tiempo**.

Las barras utilizan una escala común dentro de esa ejecución. Si aumentas la espera, la escala cambia y el lote puede ocupar visualmente el mismo ancho: los tiempos escritos permiten comparar ejecuciones. El máximo observado se calcula a partir de los intervalos medidos, además del límite que has configurado.

En el modo secuencial, subir el límite no produce solapamiento porque el programa solo tiene una llamada en curso. En el concurrente, un límite de uno vuelve a serializar el trabajo. Un límite mayor que el número de tareas no crea trabajo adicional.

### Orden de resultados y orden de finalización

Activa las duraciones distintas. Un recurso rápido que se envió después puede terminar antes. La lista `finalizacion` se actualiza al acabar cada operación, pero `gather()` devuelve sus resultados en el orden de los argumentos recibidos. No es una contradicción: son dos órdenes diferentes.

Si necesitas reaccionar conforme termina cada tarea, `asyncio.as_completed()` permite consumir las terminaciones. En Jupyter o dentro de una función asíncrona:

```python
import asyncio

async def recurso(nombre, segundos):
    await asyncio.sleep(segundos)
    return nombre

async def main():
    tareas = [
        asyncio.create_task(recurso("lento", 0.3)),
        asyncio.create_task(recurso("rápido", 0.05)),
    ]
    for terminada in asyncio.as_completed(tareas):
        print(await terminada)

await main()
```

El resultado rápido suele imprimirse antes. El bucle no convierte las tareas en secuenciales: ambas se programaron antes de empezar a consumir sus resultados.

## Corrutinas, tareas y puntos de suspensión

`async def` define una función corrutina. Llamarla produce un objeto corrutina; no ejecuta por sí sola su cuerpo ni lanza un hilo. La tarea que la espera ejecutará su cuerpo hasta que termine o alcance una suspensión efectiva.

```python
import asyncio

async def obtener():
    print("Entro en el cuerpo")
    await asyncio.sleep(0.1)
    return 42

async def main():
    corrutina = obtener()
    print("Objeto creado; todavía no entró en el cuerpo")
    valor = await corrutina
    print("Valor:", valor)

await main()
```

`await` expresa una dependencia: esta tarea necesita el resultado de ese objeto esperable. Si la operación todavía no está lista, la tarea puede suspenderse. El bucle conserva lo necesario para reanudarla y atiende otras tareas disponibles.

**No todo `await` implica que otra tarea vaya a avanzar**. Esperar una corrutina que devuelve inmediatamente puede continuar sin ceder el control. Lo que permite progresar al resto es una suspensión efectiva, no la mera presencia de la palabra `await` en el texto.

`asyncio.create_task(corrutina)` crea una `Task` que el bucle puede atender de forma independiente de la tarea llamadora. Con el planificador habitual, se ejecutará cuando el bucle recupere el control. Conserva la referencia para esperar su resultado, consultar el fallo o cancelarla:

```python
async def main():
    tarea = asyncio.create_task(obtener())
    print("La tarea está programada")
    await asyncio.sleep(0)  # Dar una oportunidad de ejecución a otras tareas.
    print("¿Ha terminado?", tarea.done())
    valor = await tarea
    print("Valor:", valor)

await main()
```

Una corrutina ya consumida no se puede volver a esperar como si fuera una nueva ejecución: crea otro objeto llamando de nuevo a la función. Una `Task` conserva su resultado y sí puede ser esperada por varios consumidores. `Task.result()` es una consulta inmediata: si todavía no terminó, lanza `InvalidStateError`; `await tarea` espera a que esté disponible. [Corrutinas y tareas](https://docs.python.org/3.12/library/asyncio-task.html).

## Bloquear el bucle de eventos

El bucle solo puede atender otras tareas cuando recupera el control. Un bucle de cálculo dentro de una función `async def` ocupa ese hilo hasta terminar. Lo mismo sucede en Python local si llamas a `time.sleep()` o a una función de red bloqueante desde ese hilo.

El siguiente panel mantiene un latido periódico y ejecuta otro trabajo. El modo **Cálculo sin await** no contiene un punto de suspensión. **await asyncio.sleep** libera el hilo durante la espera. **Cálculo por bloques** conserva la carga de CPU, pero intercala `await asyncio.sleep(0)` para permitir que el bucle atienda otras tareas.

<div data-python-demo="latido"><p>Con JavaScript puedes comparar aquí los latidos de las tres ejecuciones.</p></div>

Compara el número de latidos y el mayor hueco. El modo bloqueante deja un intervalo largo sin atenderlos. La espera cooperativa permite latidos más regulares. Dividir el cálculo en bloques mejora la capacidad de respuesta, pero no reparte ese cálculo entre varios núcleos ni garantiza que termine antes.

El intervalo del latido expresa cuándo debería volver a estar disponible, no una cita exacta con el procesador. La carga de la máquina, los otros trabajos y el navegador pueden retrasarlo. Los tiempos de esta página sirven para observar el mecanismo; no sustituyen un benchmark en el entorno de producción.

### Delegar una llamada bloqueante

En Python local, `asyncio.to_thread(funcion, argumentos...)` permite ejecutar una función síncrona en un hilo y esperar su resultado sin bloquear el hilo del bucle. Este ejemplo utiliza solo la biblioteca estándar:

```python
import asyncio
import time

def leer_recurso(segundos):
    time.sleep(segundos)
    return "datos"

async def main():
    datos = await asyncio.to_thread(leer_recurso, 0.2)
    print(datos)

asyncio.run(main())
```

Aquí `to_thread()` recibe la función sin ejecutarla previamente. Escribir `to_thread(leer_recurso(0.2))` ejecutaría primero la llamada bloqueante en el hilo equivocado. Esta herramienta suele ser útil para I/O síncrona; el cálculo de Python puro sigue teniendo las limitaciones del intérprete y su GIL.

## Hilos y pools para entrada y salida

Los hilos comparten los objetos del proceso. Mientras un hilo espera en una operación que libera el GIL, otro puede avanzar. A diferencia de `asyncio`, no necesitas que toda la cadena de llamadas ofrezca una API de corrutinas; puedes reutilizar muchas bibliotecas síncronas.

Este archivo se ejecuta en **Python local**:

```python
import threading
import time

def trabajo(nombre):
    print("Empieza", nombre, "en", threading.current_thread().name)
    time.sleep(0.2)
    print("Termina", nombre)

hilos = [threading.Thread(target=trabajo, args=(n,)) for n in range(3)]
for hilo in hilos:
    hilo.start()
for hilo in hilos:
    hilo.join()
```

`Thread(...)` construye el objeto, `start()` solicita la ejecución del hilo y `join()` espera su terminación. Primero se arrancan todos y después se espera a todos. Si colocas `start()` y `join()` juntos dentro de cada iteración, esperas el fin de uno antes de arrancar el siguiente y serializas el lote.

Crear un hilo por recurso deja de ser razonable cuando tienes miles de recursos. Un pool mantiene un número acotado de trabajadores y les asigna los trabajos pendientes:

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

def obtener(numero, espera):
    time.sleep(espera)
    return numero

if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=3) as pool:
        futuros = [
            pool.submit(obtener, numero, espera)
            for numero, espera in enumerate([0.3, 0.05, 0.1, 0.2])
        ]
        for futuro in as_completed(futuros):
            print("Terminó:", futuro.result())
```

`submit()` devuelve un `Future`: un objeto que representa un resultado pendiente. `futuro.result()` obtiene ese resultado o vuelve a lanzar la excepción del trabajador. Si lo llamas inmediatamente después de cada `submit()`, esperas antes de enviar el siguiente trabajo. Aquí se envía el lote completo y después se consume.

`pool.map(funcion, entradas)` entrega los resultados en el orden de las entradas. `as_completed(futuros)` permite consumirlos según terminan. Igual que con `gather()`, distinguir el orden de entrega del orden de ejecución evita interpretar una espera del consumidor como si los trabajadores no hubieran progresado.

El contexto `with` cierra el pool y espera los trabajos en curso al salir. Por eso una excepción en el consumidor no implica que todos los trabajos se hayan detenido en ese instante. [Executors y Futures](https://docs.python.org/3.12/library/concurrent.futures.html).

## Memoria compartida y condiciones de carrera

Una condición de carrera aparece cuando el resultado depende de una intercalación que el programa no controla. Incrementar un contador puede exigir leer, calcular y escribir. Dos tareas pueden leer el mismo valor y acabar escribiendo el mismo siguiente valor, perdiendo una actualización.

También puede ocurrir entre corrutinas de un solo hilo. En el panel, cada incremento introduce una suspensión entre la lectura y la escritura. Sin protección, varias tareas conservan una copia del mismo valor anterior y la escriben después.

<div data-python-demo="carrera"><p>El panel permite observar las lecturas y escrituras del contador, con y sin lock.</p></div>

`asyncio.Lock()` permite entrar a una sola tarea en la sección protegida. `async with lock` espera el permiso, ejecuta el bloque y lo libera incluso si el bloque falla. La protección debe abarcar la operación completa que necesita coherencia: bloquear únicamente la escritura no protege una lectura anterior que ya quedó obsoleta.

En este ejemplo dejamos el `await` dentro de la sección para hacer visible el problema. En código real conviene mantener las secciones críticas pequeñas y evitar retener un recurso exclusivo durante una espera innecesaria. Si no hay ninguna suspensión entre dos operaciones de corrutinas del mismo hilo, el bucle no las intercala arbitrariamente; eso no protege frente a otros hilos que también accedan a los datos.

### Un lock para cada modelo

`asyncio.Lock` coordina tareas del bucle; no protege por sí solo una estructura usada desde otros hilos. Para hilos utiliza `threading.Lock`. Este ejemplo local fuerza dos lecturas simultáneas antes de permitir escribir:

```python
from concurrent.futures import ThreadPoolExecutor
import threading

estado = {"contador": 0}
barrera = threading.Barrier(2, timeout=5)

def incrementar_sin_lock():
    anterior = estado["contador"]
    barrera.wait()
    estado["contador"] = anterior + 1

with ThreadPoolExecutor(max_workers=2) as pool:
    futuros = [pool.submit(incrementar_sin_lock) for _ in range(2)]
    for futuro in futuros:
        futuro.result()

print("Esperado: 2. Obtenido:", estado["contador"])
```

La barrera obliga a que ambos hayan leído antes de continuar. Para corregirlo, elimina la barrera y protege lectura y escritura con un mismo `threading.Lock`. No metas esa barrera dentro del lock: el primer hilo conservaría el permiso esperando a un segundo hilo que no puede entrar.

El GIL no convierte en atómicas las operaciones de tu aplicación ni sustituye los locks. Coordinar el acceso al intérprete y mantener una regla de negocio coherente son responsabilidades diferentes.

## Cancelación y límites de tiempo

Cancelar una tarea es solicitar que deje de continuar. `tarea.cancel()` provoca la entrega de `CancelledError` en una oportunidad de cancelación. La tarea puede ejecutar su limpieza y debe permitir que la cancelación se propague normalmente. No es una orden que interrumpa cualquier instrucción nativa en cualquier instante.

`asyncio.timeout(segundos)` limita un bloque asíncrono. Cuando se agota el plazo, cancela la tarea y transforma la cancelación provocada por ese plazo en `TimeoutError` al salir del contexto. Por eso el `except TimeoutError` se coloca fuera de `async with`.

<div data-python-demo="timeout"><p>El panel registra la operación, su cancelación y el cierre del recurso.</p></div>

Pon la duración por debajo del plazo y observa el retorno normal. Después aumenta la duración y comprueba que `finally` se ejecuta antes de que el llamador reciba `TimeoutError`. `finally` representa el lugar para liberar una conexión, cerrar un archivo o devolver un permiso; no presupone que haya habido éxito.

Si necesitas registrar una cancelación, captura `asyncio.CancelledError`, realiza la limpieza necesaria y vuelve a lanzarla con `raise`. Suprimirla sin una razón precisa puede romper las expectativas de `TaskGroup` y de los contextos de timeout.

### Esperar menos no siempre detiene el trabajo

En un `Future` de hilos, `futuro.result(timeout=0.1)` limita cuánto espera ese consumidor. Si el hilo ya empezó, el vencimiento no mata su función. `futuro.cancel()` normalmente solo puede cancelar un trabajo que todavía no ha comenzado.

Cancelar el `await` de una llamada a `asyncio.to_thread()` tampoco permite matar el hilo subyacente. Una función larga necesita su propio mecanismo cooperativo de parada, como un evento consultado periódicamente. Distingue siempre el plazo de la petición del ciclo de vida del trabajo que lanzaste.

Un timeout tampoco puede atenderse a tiempo si el mismo hilo del bucle está bloqueado en un cálculo que no cede el control. Primero debe recuperar el control para procesar el vencimiento. [Cancelación y timeouts](https://docs.python.org/3.12/library/asyncio-task.html#timeouts).

## Fallos de un grupo de tareas

`gather()` y `TaskGroup` permiten coordinar tareas, pero tienen contratos diferentes cuando una falla. Con `gather()` y su configuración habitual, el primer fallo se propaga al llamador; las otras tareas no se cancelan automáticamente por ese fallo. Con `return_exceptions=True`, recoge también las excepciones en la lista de resultados.

`TaskGroup`, disponible desde Python 3.11, delimita un grupo de tareas relacionadas. Si una falla con una excepción distinta de una cancelación, solicita cancelar a sus hermanas y espera su cierre antes de entregar los fallos agrupados. Esto ayuda a que las tareas no sobrevivan accidentalmente al ámbito que las creó.

<div data-python-demo="grupo"><p>El panel permite comparar el cierre con TaskGroup y gather.</p></div>

En el modo `gather`, el ejemplo guarda referencias y espera después a todas las tareas con `return_exceptions=True` para recoger también la tarea hermana. Esa espera adicional es una decisión explícita del ejemplo, no una cancelación automática de `gather`.

En el modo `TaskGroup`, `except* ValueError` trata las excepciones de ese tipo dentro del `ExceptionGroup`. `except*` no es una forma decorativa de escribir `except`: permite seleccionar subgrupos de errores cuando varias tareas pueden fallar.

Desactiva el fallo. Ahora ambos mecanismos deberían permitir terminar a las dos tareas. Elegir un grupo estructurado no significa que cualquier excepción deba cancelar cualquier trabajo de la aplicación: depende de si esas tareas constituyen una operación conjunta o si sus resultados son independientes.

No dejes un `Future` o una `Task` olvidados si pueden fallar. El código que creó el trabajo debe observar el resultado, recoger la excepción o delegar esa responsabilidad de forma explícita.

## Semáforos, colas y presión del productor

Un semáforo limita cuántas tareas atraviesan una sección a la vez. No limita necesariamente cuántos objetos tarea has creado antes de que esperen el permiso. Hacer `gather()` de un millón de corrutinas con un semáforo de diez puede dejar muchísimas tareas pendientes en memoria.

Una cola acotada separa producción y consumo. `asyncio.Queue(maxsize=2)` admite dos elementos pendientes en su interior. `await cola.put(elemento)` suspende al productor cuando está llena. Los consumidores recogen trabajo con `await cola.get()` y lo procesan de forma independiente.

<div data-python-demo="cola"><p>El panel muestra cuándo se llena la cola y el productor tiene que esperar.</p></div>

La capacidad no cuenta los elementos que un consumidor ya retiró. Con capacidad dos y dos consumidores puede haber dos pendientes y otros dos procesándose. Aumentar la capacidad permite que el productor se adelante más, pero no aumenta por sí solo la capacidad de procesamiento de los consumidores.

`cola.task_done()` indica que el elemento retirado ya se ha atendido. `await cola.join()` espera a que cada elemento colocado tenga su correspondiente confirmación; no equivale a comprobar que la cola esté vacía, porque un consumidor puede estar trabajando con un elemento ya retirado.

Aquí `None` es una señal de cierre porque los trabajos válidos son enteros. Enviamos una señal por consumidor para que todos puedan terminar. La señal también ocupa un puesto en la cola y requiere `task_done()`; el bloque `finally` lo garantiza incluso al salir del consumidor.

El productor que espera está recibiendo **backpressure**: la capacidad del consumidor limita cuánto trabajo adicional se acepta. En una aplicación real, esa presión puede propagarse a la lectura de archivos, recepción de mensajes o aceptación de nuevas peticiones. Añadir consumidores sin un límite trasladaría el problema al recurso que todos consumen. [Colas de asyncio](https://docs.python.org/3.12/library/asyncio-queue.html).

## Procesos y memorias separadas

Un proceso tiene su propio intérprete y su propia memoria. `ProcessPoolExecutor` envía llamadas a procesos trabajadores y recoge sus resultados. Es una herramienta útil para repartir cálculo, pero también introduce costes de arranque, importación y transporte de datos.

Guarda este ejemplo completo como `procesos.py` y ejecútalo desde una terminal local. Las funciones están a nivel de módulo para que los trabajadores puedan importarlas:

```python
from concurrent.futures import ProcessPoolExecutor
import multiprocessing as mp
import os
import time

def obtener(numero):
    time.sleep(0.15)
    return {"tarea": numero, "pid": os.getpid()}

def main():
    inicio = time.perf_counter()
    contexto = mp.get_context("spawn")
    with ProcessPoolExecutor(max_workers=3, mp_context=contexto) as pool:
        resultados = list(pool.map(obtener, range(6)))
    print(resultados)
    print("Duración del lote:", time.perf_counter() - inicio)

if __name__ == "__main__":
    main()
```

`spawn` arranca intérpretes nuevos. La protección `if __name__ == "__main__"` evita que al importar el módulo cada hijo vuelva a crear otro pool. Elegir explícitamente el contexto hace reproducible el ejemplo entre plataformas y versiones cuyos valores predeterminados pueden cambiar.

Los argumentos y resultados deben poder serializarse con el mecanismo de `multiprocessing`, normalmente `pickle`. Funciones locales, lambdas, conexiones abiertas y objetos con estado no transferible pueden no cumplir ese contrato. En Jupyter, una función definida solamente en una celda puede no ser importable por un trabajador; utiliza un módulo `.py`, como en el ejemplo.

### Modificar una copia no modifica el padre

Este segundo archivo muestra el efecto de las memorias separadas:

```python
from concurrent.futures import ProcessPoolExecutor
import multiprocessing as mp

def modificar(lista):
    lista.append("añadido por el hijo")
    return lista

if __name__ == "__main__":
    original = ["dato original"]
    with ProcessPoolExecutor(max_workers=1, mp_context=mp.get_context("spawn")) as pool:
        devuelta = pool.submit(modificar, original).result()
    print("Padre:", original)
    print("Resultado recibido:", devuelta)
```

La lista del padre conserva su valor. El resultado recibido contiene la modificación de la copia. Si necesitas compartir información entre procesos, diseña una comunicación explícita mediante colas, resultados o memoria compartida con la sincronización correspondiente. [Contextos de multiprocessing](https://docs.python.org/3.12/library/multiprocessing.html#contexts-and-start-methods).

## Cálculo, GIL y elección de trabajadores

Para estudiar CPU hay que quitar la espera artificial. El siguiente archivo compara secuencial, hilos, tareas asíncronas y procesos sobre el mismo cálculo. Reduce `ITERACIONES` si tu máquina tarda demasiado; cada modelo debe conservar la misma carga y devolver los mismos resultados.

```python
import asyncio
import multiprocessing as mp
import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

ITERACIONES = 500_000
TAREAS = 6
TRABAJADORES = 3

def calcular(numero):
    valor = numero + 1
    for paso in range(ITERACIONES):
        valor = (valor * 1_664_525 + paso + 1_013_904_223) & 0xFFFFFFFF
    return valor

async def calcular_async(numero):
    return calcular(numero)  # No hay suspensión dentro del cálculo.

async def lote_async():
    return await asyncio.gather(*(calcular_async(n) for n in range(TAREAS)))

def medir(nombre, accion):
    inicio = time.perf_counter()
    resultados = accion()
    print(nombre, round(time.perf_counter() - inicio, 3), "s")
    return resultados

def lote_hilos():
    with ThreadPoolExecutor(max_workers=TRABAJADORES) as pool:
        return list(pool.map(calcular, range(TAREAS)))

def lote_procesos():
    with ProcessPoolExecutor(
        max_workers=TRABAJADORES,
        mp_context=mp.get_context("spawn"),
    ) as pool:
        return list(pool.map(calcular, range(TAREAS)))

if __name__ == "__main__":
    referencia = medir("secuencial", lambda: [calcular(n) for n in range(TAREAS)])
    hilos = medir("hilos", lote_hilos)
    asincrono = medir("asyncio", lambda: asyncio.run(lote_async()))
    procesos = medir("procesos", lote_procesos)
    assert referencia == hilos == asincrono == procesos
```

El acumulador `valor` pertenece a cada llamada, así que esta prueba no tiene un contador compartido que requiera un lock. `& 0xFFFFFFFF` mantiene un entero de 32 bits para que el coste no crezca por acumular enteros cada vez mayores. El resultado permite verificar que los cuatro modelos hicieron el mismo trabajo.

En una compilación convencional de CPython con el **GIL** activado, los hilos no ejecutan simultáneamente este bucle de Python puro dentro del mismo intérprete. Pueden alternarse y sus intervalos solaparse, sin conseguir paralelismo efectivo para ese cálculo. Incluso pueden tardar más por coordinación.

El comportamiento cambia si una biblioteca nativa libera el GIL, como sucede en ciertas operaciones de cálculo, o si utilizas una compilación sin GIL. No conviertas esta observación sobre un bucle concreto en la regla «los hilos nunca sirven para CPU». Identifica el intérprete y las bibliotecas de la prueba. En versiones que ofrecen `sys._is_gil_enabled()` puedes consultar su estado; que la API no exista no demuestra que el GIL esté desactivado. [GIL y hilos](https://docs.python.org/3/library/threading.html#gil-and-performance-considerations).

La versión asíncrona tampoco contiene una suspensión durante el cálculo. `gather()` coordina las llamadas, pero cada una ocupa el hilo hasta terminar. Añadir `await asyncio.sleep(0)` entre bloques permitiría atender otras tareas; seguiría siendo un solo hilo ejecutando esos bloques.

Los procesos pueden ejecutar los bucles en varios núcleos. La mejora depende de cuántos núcleos y cuotas de CPU tenga disponibles el entorno y de si el cálculo compensa los costes añadidos. Para trabajos muy pequeños, arrancar los intérpretes puede costar más que el cálculo repartido.

## Combinar asyncio y un pool de procesos

Un servicio puede coordinar I/O con `asyncio` y delegar una fase de cálculo en procesos. No son alternativas excluyentes: un modelo organiza las esperas del servicio y el otro proporciona capacidad para ejecutar el trabajo de CPU.

Guarda el siguiente programa en otro archivo local. `get_running_loop()` obtiene el bucle que ya está atendiendo `main`; `run_in_executor(pool, funcion, argumento)` envía el trabajo al pool y devuelve un objeto esperable:

```python
import asyncio
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor

def calcular(numero):
    return sum(paso * paso for paso in range(numero))

async def main(pool):
    loop = asyncio.get_running_loop()
    resultados = await asyncio.gather(
        loop.run_in_executor(pool, calcular, 500_000),
        loop.run_in_executor(pool, calcular, 700_000),
    )
    print(resultados)

if __name__ == "__main__":
    with ProcessPoolExecutor(max_workers=2, mp_context=mp.get_context("spawn")) as pool:
        asyncio.run(main(pool))
```

Mientras espera esos resultados, el bucle puede atender otras tareas, siempre que estas también cooperen. La función enviada al proceso debe ser síncrona e importable; no envíes una corrutina esperando que el pool se encargue de su bucle.

En un servicio que recibe muchas peticiones, un pool compartido puede amortizar el arranque. Crear uno nuevo por petición puede aumentar latencia y competir por los mismos núcleos. También necesitas acotar cuántos trabajos aceptas y recoger sus resultados cuando el cliente abandona la petición. [Trabajo en executors desde el bucle](https://docs.python.org/3.12/library/asyncio-eventloop.html#executing-code-in-thread-or-process-pools).

## Entrada y salida reales por HTTP

Las esperas controladas permiten entender el planificador. Para comprobar el mecanismo con bytes reales, este programa local crea un servidor temporal en `127.0.0.1`, con un puerto libre elegido por el sistema, y ejecuta peticiones concurrentes. No necesita conexión a Internet ni paquetes adicionales.

```python
import asyncio
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import urlopen

class Recurso(BaseHTTPRequestHandler):
    def do_GET(self):
        time.sleep(0.15)  # Latencia controlada del servidor.
        cuerpo = json.dumps({"ruta": self.path}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def log_message(self, formato, *args):
        pass

def leer(url):
    with urlopen(url, timeout=3) as respuesta:
        return json.load(respuesta)

async def main(origen):
    semaforo = asyncio.Semaphore(3)

    async def obtener(numero):
        async with semaforo:
            return await asyncio.to_thread(leer, f"{origen}/recurso/{numero}")

    inicio = time.perf_counter()
    resultados = await asyncio.gather(*(obtener(n) for n in range(6)))
    print(resultados)
    print("Duración:", round(time.perf_counter() - inicio, 3), "s")

if __name__ == "__main__":
    servidor = ThreadingHTTPServer(("127.0.0.1", 0), Recurso)
    hilo = threading.Thread(target=servidor.serve_forever, daemon=True)
    hilo.start()
    try:
        origen = f"http://127.0.0.1:{servidor.server_port}"
        asyncio.run(main(origen))
    finally:
        servidor.shutdown()
        servidor.server_close()
        hilo.join()
```

El cliente `urllib` es síncrono, por eso se delega con `to_thread()`. No se ha convertido mágicamente en una biblioteca HTTP nativa de `asyncio`. El límite de tres controla las peticiones que el cliente mantiene activas.

`ThreadingHTTPServer` puede atender varias conexiones a la vez. Si el servidor atendiese una sola petición cada vez, el cliente podría enviar varias sin conseguir que el servidor solapase su trabajo. La capacidad del otro extremo también forma parte del sistema que estás midiendo.

El `finally` cierra el servidor incluso si el cliente falla. El contexto de cada `urlopen()` cierra su respuesta. Mantener viva una conexión o un hilo después de la prueba puede contaminar la siguiente medición y dejar recursos abiertos.

## Decidir cuándo usar cada modelo

Primero escribe qué quieres mejorar. Reducir el tiempo total de un lote, mantener una interfaz receptiva y atender más peticiones por segundo son objetivos distintos. Una solución puede mejorar uno y empeorar otro si aumenta la contención o el trabajo pendiente.

Para pocas operaciones y costes pequeños, una solución secuencial puede ser suficiente. Es sencilla de depurar y proporciona una referencia fiable. Añade concurrencia cuando puedas señalar una espera o un cálculo que tenga sentido solapar o repartir.

Para I/O con bibliotecas síncronas, un `ThreadPoolExecutor` acotado suele facilitar la adaptación. Para muchas operaciones con APIs asíncronas compatibles, `asyncio` permite coordinar esperas, timeouts y cancelación. Para bucles de Python puro que pueden repartirse entre núcleos, comprueba un pool de procesos y el tamaño del trabajo que le envías.

### Más trabajadores no implican una mejora ilimitada

En un modelo ideal con doce trabajos iguales de 100 ms, un trabajador necesita unos 1,2 s; tres necesitan unas cuatro tandas, unos 0,4 s. Pasar de doce trabajadores a veinte no reduce el número de tandas por debajo de una. En un sistema real, conexiones, cuotas, locks, memoria y capacidad remota pueden limitarte antes.

Un semáforo limita simultaneidad, no necesariamente peticiones por segundo. Si cada petición dura menos, el mismo límite puede producir más solicitudes por segundo. Un proveedor que impone una cuota temporal necesita además una estrategia que respete esa cuota.

### La parte secuencial también cuenta

La ley de Amdahl expresa un límite ideal cuando una fracción del programa no puede paralelizarse. Si `s` es esa fracción y `p` el número de trabajadores, la aceleración ideal es `1 / (s + (1 - s) / p)`. Con un 40 % secuencial, incluso un número ilimitado de trabajadores no superaría una aceleración de 2,5 veces bajo esas suposiciones.

La fórmula no incluye arranque, comunicación ni contención; la ejecución real puede mejorar menos. Se aplica a repartir una carga de cálculo según ese modelo, no como explicación universal de cualquier espera de red.

### Arranque, mensajes y reutilización

Una medición que crea y destruye un pool incluye sus costes de ciclo de vida. Otra que reutiliza un pool mide un servicio ya preparado. Ambas pueden ser válidas si representan la aplicación real, pero responden a preguntas distintas.

Transportar seis enteros y recibir seis resultados pequeños cuesta mucho menos que enviar seis tablas enormes a procesos separados. Antes de repartir trabajo, examina cuánto se serializa, cuántas veces se copia y si el coste de la comunicación supera al cálculo.

Compara varias ejecuciones con la misma entrada y verifica también la corrección. No publiques una aceleración que se obtuvo omitiendo resultados, ignorando excepciones o dejando trabajo ejecutándose después de parar el reloj.

## Referencias y comprobación del comportamiento

Esta guía desarrolla con explicaciones propias el recorrido de [concurrencia en Python de Real Python](https://realpython.com/python-concurrency/): carga de I/O y CPU, ejecución secuencial, hilos, asincronía y procesos. Los paneles incorporan experimentos adicionales para observar los puntos de suspensión, los fallos y la coordinación.

Las referencias oficiales permiten contrastar cada contrato: [corrutinas, tareas y TaskGroup](https://docs.python.org/3.12/library/asyncio-task.html), [locks y semáforos](https://docs.python.org/3.12/library/asyncio-sync.html), [colas](https://docs.python.org/3.12/library/asyncio-queue.html), [executors](https://docs.python.org/3.12/library/concurrent.futures.html) y [procesos](https://docs.python.org/3.12/library/multiprocessing.html).

Al interpretar cualquier ejecución, comprueba tres cosas: que todas las tareas terminaron o se cancelaron de forma deliberada, que sus resultados coinciden con los esperados y que se cerraron los recursos. Una mejora de tiempo solo es útil después de conservar esas propiedades.
