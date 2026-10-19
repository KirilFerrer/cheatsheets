---
title: 'Python · Asincronía'
date: '2026-10-20'
updated: '2026-10-20'
layout: 'learning'
language: 'es'
disableNunjucks: true
icon: 'python'
series_title: 'Custom'
series_path: '/custom/'
categories: ['Custom']
intro: 'Cómo funcionan async def, await y el bucle de eventos de Python: ejecutar tareas concurrentes, limitar el trabajo y gestionar sus resultados y errores.'
heading: 'Asincronía'
menu_title: 'Asincronía'
learning_classes: 'learning-page learning-custom learning-page-cards'
background: 'bg-gradient-to-r from-teal-700 to-cyan-900 !text-white'
---

## 1. Partir de un programa secuencial

Una aplicación puede necesitar consultar usuarios, pedidos y productos antes de preparar una respuesta. Durante cada consulta pasa tiempo esperando a que otro servicio conteste. Si empieza la siguiente únicamente cuando acaba la anterior, acumula esas esperas.

La **programación asíncrona** permite suspender una operación mientras espera y atender otra durante ese intervalo. Es especialmente útil para entrada y salida: red, conexiones o servicios externos. No implica que varios cálculos se estén ejecutando al mismo tiempo.

Los ejemplos de esta guía utilizan **Python 3.11 o posterior** y solo su biblioteca estándar. Cada bloque Python es un programa completo: se puede guardar en un archivo independiente y ejecutar desde una terminal. Por ejemplo, guardar este primero como `secuencial.py`:

```python
import time

def consultar(nombre):
    print("Inicio:", nombre)
    time.sleep(0.2)
    print("Fin:", nombre)
    return f"datos de {nombre}"

inicio = time.perf_counter()
resultados = []
for nombre in ["usuarios", "pedidos", "productos"]:
    resultados.append(consultar(nombre))

print(resultados)
print(f"Tiempo: {time.perf_counter() - inicio:.2f} s")
```

Ejecutarlo con:

```bash
python secuencial.py
```

La salida será parecida a esta:

```text
Inicio: usuarios
Fin: usuarios
Inicio: pedidos
Fin: pedidos
Inicio: productos
Fin: productos
['datos de usuarios', 'datos de pedidos', 'datos de productos']
Tiempo: 0.60 s
```

`time.sleep(0.2)` representa una espera de 200 milisegundos. Aquí no hay una petición HTTP real: se simula su latencia para estudiar el orden de ejecución. La función devuelve un texto que permite identificar qué consulta produjo cada resultado.

`time.perf_counter()` mide tiempo transcurrido. Restar la lectura inicial a la final permite medir el lote completo; `:.2f` muestra dos decimales. Los tiempos son aproximados y dependen del entorno.

El `for` ejecuta tres llamadas completas. Como cada una tarda unos 0,2 segundos, el lote tarda unos 0,6 segundos. Esta será la referencia para entender qué cambia al introducir asincronía.

## 2. Definir una corrutina con async def

Una función declarada con **`async def`** es una función corrutina. Al llamarla se crea un objeto que representa una ejecución pendiente. Su cuerpo no se ejecuta únicamente por haber hecho esa llamada: hay que esperarla o programarla como tarea.

Guardar este segundo programa en otro archivo, por ejemplo `corrutina.py`:

```python
import asyncio

async def consultar(nombre):
    print("Inicio:", nombre)
    await asyncio.sleep(0.2)
    print("Fin:", nombre)
    return f"datos de {nombre}"

async def main():
    corrutina = consultar("usuarios")
    print("Corrutina creada")
    resultado = await corrutina
    print("Resultado:", resultado)

asyncio.run(main())
```

Su salida muestra en qué momento comienza realmente el cuerpo:

```text
Corrutina creada
Inicio: usuarios
Fin: usuarios
Resultado: datos de usuarios
```

`consultar("usuarios")` crea el objeto guardado en `corrutina`. Después se imprime `Corrutina creada`. Al llegar a **`await corrutina`**, `main()` necesita su resultado y comienza a ejecutarse la consulta.

Dentro de la consulta, `await asyncio.sleep(0.2)` suspende esa ejecución durante la espera. Al poder continuar, se imprime `Fin` y se devuelve el texto. Ese valor es el que recibe `resultado`.

**`asyncio.run(main())`** prepara el bucle de eventos, ejecuta la corrutina principal y cierra el bucle al terminar. Es la entrada del programa asíncrono desde un archivo normal. Dentro de Jupyter ya existe un bucle en ejecución: se utiliza `await main()` en lugar de esa última línea.

Crear una corrutina y olvidarla no ejecuta la operación. Además, una misma corrutina ya consumida no se puede reutilizar como una ejecución nueva: para repetir la consulta hay que volver a llamar a `consultar(...)`.

## 3. Distinguir await de concurrencia

`await` significa que la operación actual necesita esperar un resultado. **No crea por sí solo varias operaciones concurrentes**. Este programa sigue consultando los recursos uno después de otro:

```python
import asyncio
import time

async def consultar(nombre):
    print("Inicio:", nombre)
    await asyncio.sleep(0.2)
    print("Fin:", nombre)
    return f"datos de {nombre}"

async def main():
    inicio = time.perf_counter()
    resultados = []
    for nombre in ["usuarios", "pedidos", "productos"]:
        resultados.append(await consultar(nombre))
    print(resultados)
    print(f"Tiempo: {time.perf_counter() - inicio:.2f} s")

asyncio.run(main())
```

La secuencia vuelve a ser `Inicio usuarios → Fin usuarios → Inicio pedidos`. El tiempo sigue rondando los 0,6 segundos.

En la primera iteración, `main()` espera a que termine la consulta de usuarios. La llamada de pedidos todavía no se ha realizado. Aunque durante la espera el bucle podría atender otra tarea, este programa no ha programado ninguna otra consulta que pueda aprovecharla.

Esto permite separar dos preguntas: **¿una operación puede suspenderse?** y **¿se han organizado varias operaciones para que avancen de forma concurrente?** `async def` y `await` resuelven la primera parte; aún falta organizar el lote.

## 4. Solapar operaciones con gather

**`asyncio.gather()`** recibe varias operaciones, las programa para que puedan avanzar concurrentemente y espera a que estén disponibles sus resultados. Para comparar con el programa anterior:

```python
import asyncio
import time

async def consultar(nombre):
    print("Inicio:", nombre)
    await asyncio.sleep(0.2)
    print("Fin:", nombre)
    return f"datos de {nombre}"

async def main():
    inicio = time.perf_counter()
    resultados = await asyncio.gather(
        consultar("usuarios"),
        consultar("pedidos"),
        consultar("productos"),
    )
    print(resultados)
    print(f"Tiempo: {time.perf_counter() - inicio:.2f} s")

asyncio.run(main())
```

Una salida habitual es:

```text
Inicio: usuarios
Inicio: pedidos
Inicio: productos
Fin: usuarios
Fin: pedidos
Fin: productos
['datos de usuarios', 'datos de pedidos', 'datos de productos']
Tiempo: 0.20 s
```

Las tres consultas alcanzan su espera sin que el programa exija terminar una antes de empezar la siguiente. Por eso sus esperas se solapan y el lote se aproxima a la duración de una consulta, más el coste de coordinación.

### Qué hace el bucle de eventos

El **bucle de eventos** atiende las tareas que pueden continuar. Cuando una llega a una espera pendiente, conserva su estado y puede atender otra. Al finalizar esa espera, la tarea vuelve a estar disponible para continuar desde donde se suspendió.

En estos ejemplos, las tareas utilizan **un mismo hilo**. No están ejecutando tres bloques de Python simultáneamente; aprovechan el tiempo en que las otras esperan. Esta organización es **concurrencia**. Ejecutar instrucciones al mismo tiempo en varios núcleos sería **paralelismo**.

### En qué orden llegan los resultados

`gather()` devuelve una lista en el orden de sus argumentos. El primer elemento corresponde a usuarios, aunque esa consulta no sea la primera en terminar. Si una operación tarda más, cambia el orden de finalización, pero no la posición que ocupa su resultado en esa lista.

El orden de los mensajes ayuda a interpretar la ejecución; la posición de los resultados expresa la relación entre entradas y salidas. Son dos cosas distintas. [Contrato de gather](https://docs.python.org/3.12/library/asyncio-task.html#asyncio.gather).

## 5. Programar tareas con create_task

Una **`Task`** es el objeto con el que `asyncio` administra la ejecución de una corrutina. **`asyncio.create_task()`** permite programarla y conservar una referencia mientras la operación principal continúa haciendo otras cosas.

```python
import asyncio

async def consultar(nombre, demora):
    print("Inicio:", nombre)
    await asyncio.sleep(demora)
    print("Fin:", nombre)
    return f"datos de {nombre}"

async def main():
    usuarios = asyncio.create_task(consultar("usuarios", 0.3))
    pedidos = asyncio.create_task(consultar("pedidos", 0.1))
    print("Consultas programadas")

    await asyncio.sleep(0.05)
    print("La tarea principal también continúa")

    print("Resultado:", await usuarios)
    print("Resultado:", await pedidos)

asyncio.run(main())
```

Con el planificador habitual, primero se imprime `Consultas programadas`. Al llegar al primer `await asyncio.sleep(...)`, la tarea principal cede el control y el bucle puede empezar las consultas.

Pedidos tiene una demora de 0,1 segundos y usuarios, de 0,3. Por eso normalmente aparece `Fin: pedidos` antes que `Fin: usuarios`. Sin embargo, el programa imprime primero el resultado de usuarios porque lo espera primero. Esperar después la tarea de pedidos recoge el resultado que ya había calculado; **no ejecuta otra consulta**.

Si se escribiera `await asyncio.create_task(consultar(...))` en cada iteración de un `for`, se volvería a esperar una consulta antes de programar la siguiente. Para conseguir solapamiento, hay que programar las tareas antes de esperar a que termine cada una.

Conservar referencias permite esperar sus resultados y observar sus errores. `tarea.done()` indica si terminó; `tarea.result()` consulta inmediatamente el resultado y falla si todavía no está listo. `await tarea` espera hasta que lo esté.

## 6. Evitar llamadas que bloquean el bucle

Declarar una función con `async def` no transforma las llamadas síncronas que contiene. Si ejecuta `time.sleep(0.3)`, duerme el hilo del bucle. Durante ese intervalo tampoco pueden avanzar las otras tareas de ese hilo.

Cuando una biblioteca ofrece una operación asíncrona, se utiliza esa operación con `await`. Cuando solo ofrece una función síncrona de entrada y salida, **`asyncio.to_thread()`** permite ejecutarla en otro hilo y esperar su resultado sin bloquear el bucle.

```python
import asyncio
import time

def leer_datos():
    time.sleep(0.3)  # Representa una operación síncrona que tarda en responder.
    return "contenido recibido"

async def consultar():
    return await asyncio.to_thread(leer_datos)

async def mostrar_latidos():
    for numero in range(3):
        print("Latido:", numero + 1)
        await asyncio.sleep(0.1)

async def main():
    datos, _ = await asyncio.gather(consultar(), mostrar_latidos())
    print("Resultado:", datos)

asyncio.run(main())
```

Los tres latidos se imprimen mientras la lectura está en curso. La tarea principal recibe `contenido recibido` cuando terminan las operaciones.

En `to_thread(leer_datos)` se pasa **la función**, sin llamarla previamente. Escribir `to_thread(leer_datos())` ejecutaría la lectura antes de entrar en `to_thread`, bloqueando el hilo equivocado y pasando después su resultado como si fuera una función.

Para observar la diferencia en este mismo ejemplo, se puede sustituir el cuerpo de `consultar()` por `return leer_datos()`. La lectura ocupará entonces el hilo del bucle: el primer latido aparecerá después de esa espera.

Lo mismo ocurre con un bucle de cálculo largo que no ceda el control. La palabra `async` no evita el bloqueo. Tampoco toda expresión `await` garantiza una suspensión: si el resultado ya está disponible, la tarea puede continuar inmediatamente.

## 7. Limitar consultas con un semáforo

Programar mil consultas a la vez puede saturar una base de datos o agotar las conexiones de un servicio. Un **semáforo** mantiene un número de permisos y permite entrar en una sección a tantas tareas como permisos haya disponibles.

En este programa hay cinco tareas, pero solo dos pueden estar dentro de la consulta simultáneamente:

```python
import asyncio

LIMITE = 2

async def consultar(numero, semaforo):
    async with semaforo:
        print("Entra:", numero)
        await asyncio.sleep(0.1)
        print("Sale:", numero)
        return numero

async def main():
    semaforo = asyncio.Semaphore(LIMITE)
    resultados = await asyncio.gather(
        *(consultar(numero, semaforo) for numero in range(5))
    )
    print("Resultados:", resultados)

asyncio.run(main())
```

Los mensajes muestran las tandas: entran 0 y 1; al liberarse permisos pueden entrar 2 y 3; finalmente entra 4. El resultado conserva el orden `[0, 1, 2, 3, 4]`.

`async with semaforo` espera un permiso antes de ejecutar el bloque y lo libera al salir, incluso si se produce una excepción. En `gather`, el `*` expande las corrutinas generadas por el `for` para pasarlas como argumentos separados.

Cambiar `LIMITE` a uno hace que solo una consulta atraviese esa sección cada vez. Aumentarlo a cinco permite atender las cinco esperas juntas. El límite controla la **simultaneidad**, no una cuota de peticiones por segundo.

El semáforo limita las operaciones que entran, pero las cinco tareas siguen existiendo. Si el volumen es enorme, también será necesario limitar cuánto trabajo se crea o se mantiene pendiente; una cola acotada permite organizar esa parte.

## 8. Poner un plazo y cerrar los recursos

Una consulta puede no responder a tiempo. **`asyncio.timeout()`**, disponible desde Python 3.11, permite establecer un plazo para un bloque asíncrono. Al agotarse, solicita cancelar la operación y entrega `TimeoutError` fuera del contexto.

```python
import asyncio

async def consultar():
    print("Abrir recurso")
    try:
        await asyncio.sleep(0.3)
        print("Consulta terminada")
        return "datos"
    finally:
        print("Cerrar recurso")

async def main():
    try:
        async with asyncio.timeout(0.1):
            datos = await consultar()
        print("Resultado:", datos)
    except TimeoutError:
        print("Plazo agotado")

asyncio.run(main())
```

Como la consulta necesita unos 0,3 segundos y solo se permiten 0,1, la salida será:

```text
Abrir recurso
Cerrar recurso
Plazo agotado
```

`finally` se ejecuta tanto al terminar normalmente como al salir por una excepción o una cancelación. En una aplicación real sería el lugar para devolver un permiso o cerrar un recurso adquirido. El mensaje de cierre aparece antes de que el llamador gestione el timeout.

El `except TimeoutError` está fuera de `async with` porque el contexto transforma allí la cancelación que provocó su propio plazo. Cambiar el límite a `0.5` permite ver la terminación normal, el cierre y el resultado.

### Qué significa cancelar una tarea

`tarea.cancel()` solicita entregar **`asyncio.CancelledError`** a la corrutina en una oportunidad de cancelación. La tarea puede liberar recursos antes de finalizar. Si se captura esa excepción para registrar o limpiar algo, normalmente debe volver a lanzarse con `raise`.

El bucle necesita recuperar el control para atender la cancelación y los plazos. Un cálculo bloqueante que no cede el hilo puede retrasarlos. Además, cancelar la espera de `to_thread()` no mata la función que ya se está ejecutando en su hilo: esa función necesita su propio mecanismo de parada si debe poder interrumpirse. [Timeouts y cancelación](https://docs.python.org/3.12/library/asyncio-task.html#timeouts).

## 9. Coordinar fallos con TaskGroup

Cuando varias tareas forman una misma operación, interesa que su ciclo de vida quede delimitado. **`asyncio.TaskGroup`** espera a las tareas creadas dentro del grupo. Si una falla con una excepción distinta de una cancelación, solicita cancelar a sus hermanas y espera a que se cierren.

```python
import asyncio

async def consulta_lenta():
    print("Inicio de la consulta lenta")
    try:
        await asyncio.sleep(0.3)
        print("Consulta lenta terminada")
    except asyncio.CancelledError:
        print("Consulta lenta cancelada")
        raise
    finally:
        print("Cerrar consulta lenta")

async def consulta_fragil():
    await asyncio.sleep(0.05)
    raise ValueError("La respuesta no es válida")

async def main():
    try:
        async with asyncio.TaskGroup() as grupo:
            grupo.create_task(consulta_lenta())
            grupo.create_task(consulta_fragil())
    except* ValueError as errores:
        print("Errores de validación:", len(errores.exceptions))

asyncio.run(main())
```

La consulta frágil falla antes de que termine la lenta. El grupo cancela esta última, su `finally` cierra el recurso y después se gestionan los errores. La salida muestra:

```text
Inicio de la consulta lenta
Consulta lenta cancelada
Cerrar consulta lenta
Errores de validación: 1
```

Los fallos del grupo se entregan mediante un **`ExceptionGroup`**, que puede contener varias excepciones. `except* ValueError` selecciona las de ese tipo; `errores.exceptions` contiene las que se han recogido en ese subgrupo.

`gather()` tiene otro contrato: con su configuración habitual propaga el primer fallo, pero no cancela automáticamente a las otras tareas por ese fallo. Con `return_exceptions=True`, espera y devuelve también las excepciones como elementos de su lista.

Si un fallo termina `main()` y cierra `asyncio.run()`, las tareas pendientes pueden cancelarse durante ese cierre. Esa cancelación del programa no debe confundirse con el comportamiento propio de `gather()`. [TaskGroup y gestión de errores](https://docs.python.org/3.12/library/asyncio-task.html#task-groups).

## 10. Proteger datos compartidos

Usar un solo hilo no elimina todas las condiciones de carrera. Si una tarea lee un valor, se suspende y lo escribe después, otra puede haber leído el mismo valor durante ese intervalo.

Este programa fuerza una suspensión entre la lectura y la escritura de un contador:

```python
import asyncio

PROTEGER = False

async def main():
    contador = 0
    lock = asyncio.Lock()

    async def incrementar():
        nonlocal contador
        if PROTEGER:
            async with lock:
                anterior = contador
                await asyncio.sleep(0)
                contador = anterior + 1
        else:
            anterior = contador
            await asyncio.sleep(0)
            contador = anterior + 1

    await asyncio.gather(incrementar(), incrementar())
    print("Esperado: 2")
    print("Obtenido:", contador)

asyncio.run(main())
```

Con `PROTEGER = False`, ambas tareas leen cero antes de escribir. Cada una calcula `0 + 1` y el valor final queda en uno. `await asyncio.sleep(0)` permite atender otra tarea y hace visible esa intercalación.

Con `PROTEGER = True`, **`asyncio.Lock()`** permite entrar a una sola tarea en el bloque protegido. La segunda lee el contador después de que la primera haya terminado su incremento y el resultado es dos.

`nonlocal contador` indica que la asignación modifica la variable de `main()`, en lugar de crear otra variable local en `incrementar()`. El lock debe proteger la lectura y la escritura como una operación completa; proteger solo la última asignación dejaría la lectura desactualizada.

El `await` intermedio está puesto para enseñar la carrera. En código real conviene evitar esperas innecesarias dentro de una sección crítica. `asyncio.Lock` coordina corrutinas del bucle; para datos que también utilizan otros hilos se necesita la sincronización adecuada a esos hilos.

## 11. Limitar el trabajo pendiente con una cola

Una **cola** separa a quien produce trabajo de quien lo procesa. **`asyncio.Queue(maxsize=2)`** permite mantener dos elementos pendientes dentro de ella. Cuando se llena, `await cola.put(...)` suspende al productor hasta que un consumidor deje espacio.

```python
import asyncio

async def productor(cola):
    for numero in range(4):
        await cola.put(numero)
        print("Encolado:", numero)
    await cola.put(None)

async def consumidor(cola):
    while True:
        numero = await cola.get()
        try:
            if numero is None:
                return
            await asyncio.sleep(0.1)
            print("Procesado:", numero)
        finally:
            cola.task_done()

async def main():
    cola = asyncio.Queue(maxsize=2)
    async with asyncio.TaskGroup() as grupo:
        grupo.create_task(consumidor(cola))
        await productor(cola)
        await cola.join()
    print("Todos los elementos procesados")

asyncio.run(main())
```

El consumidor obtiene un elemento con `get()`. Mientras lo procesa, el productor puede llenar los puestos disponibles de la cola. Al estar llena, el productor espera: no puede seguir acumulando elementos sin límite. Esta presión del consumidor sobre el productor se conoce como **backpressure**.

`task_done()` confirma que se ha atendido un elemento retirado. `await cola.join()` espera a que todos los elementos colocados hayan recibido esa confirmación. Una cola vacía no basta para demostrarlo: el consumidor puede seguir trabajando con un elemento que ya retiró.

`None` es una señal de cierre porque los trabajos válidos del ejemplo son enteros. Se envía al acabar la producción para que el consumidor salga de su bucle. La señal también se confirma mediante `task_done()` en el `finally`. Con varios consumidores haría falta una señal por consumidor.

La capacidad limita los elementos **dentro de la cola**, no los que ya están procesándose. En este caso pueden existir dos pendientes y uno en manos del consumidor. [Colas de asyncio](https://docs.python.org/3.12/library/asyncio-queue.html).

## 12. Elegir entre asincronía, hilos y procesos

La elección parte del trabajo que ocupa el tiempo del programa. Si muchas operaciones esperan respuestas y ofrecen APIs asíncronas, `asyncio` permite coordinar esas esperas, limitar su simultaneidad y gestionar sus plazos.

Si una biblioteca de entrada y salida es síncrona, se puede delegar esa llamada a un hilo mediante `to_thread()` o utilizar un pool de hilos. Un hilo puede avanzar mientras otro espera en una operación que permite hacerlo. Los hilos comparten la memoria del proceso y requieren coordinar el acceso a los datos compartidos.

Si domina un cálculo largo, convertirlo en una corrutina no proporciona más capacidad de CPU. Un pool de procesos puede repartir trabajos independientes entre núcleos; a cambio, hay costes de arranque y envío de datos. Cada proceso tiene su propia memoria e intérprete.

En CPython con el GIL activado, varios hilos no ejecutan simultáneamente un mismo tipo de bucle de Python puro dentro del intérprete. Algunas bibliotecas nativas liberan el GIL y existen compilaciones sin él, por lo que hay que comprobar el entorno y el trabajo concreto antes de generalizar una medición.

Una aplicación puede combinar los modelos: `asyncio` coordina sus consultas y delega una fase de cálculo en procesos. Lo esencial es distinguir **esperar**, **coordinar** y **calcular**, y elegir el recurso de ejecución que corresponda a cada parte.

## Referencias

La documentación oficial desarrolla los contratos utilizados: [corrutinas y tareas](https://docs.python.org/3.12/library/asyncio-task.html), [locks y semáforos](https://docs.python.org/3.12/library/asyncio-sync.html), [colas](https://docs.python.org/3.12/library/asyncio-queue.html) y [executors de hilos y procesos](https://docs.python.org/3.12/library/concurrent.futures.html).

El artículo [Python Concurrency de Real Python](https://realpython.com/python-concurrency/) amplía la comparación entre modelos de concurrencia. Esta guía utiliza explicaciones propias y ejemplos pequeños para seguir el flujo de ejecución y entender la función de cada operación.
