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
intro: 'Concurrencia, corrutinas y bucle de eventos. Cómo se organizan las esperas, qué hacen async y await y cuándo intervienen los hilos y los procesos.'
heading: 'Asincronía'
menu_title: 'Asincronía'
learning_classes: 'learning-page learning-custom learning-page-cards'
background: 'bg-gradient-to-r from-teal-700 to-cyan-900 !text-white'
---

## Concurrencia, paralelismo y asincronía

Una aplicación puede necesitar consultar usuarios, pedidos y productos antes de preparar una respuesta. Si espera la respuesta de usuarios antes de pedir los pedidos, y después hace lo mismo con los productos, las tres operaciones avanzan en secuencia.

Durante buena parte de una consulta de red, la CPU no está calculando la respuesta: espera a que otro sistema la envíe. Esa espera deja una oportunidad para atender otras operaciones.

**Concurrencia** significa organizar varias operaciones para que progresen durante un mismo intervalo. Pueden alternarse en un solo hilo: una avanza hasta que necesita esperar, otra aprovecha ese tiempo y la primera continúa cuando dispone de lo que esperaba.

**Paralelismo** significa ejecutar trabajo simultáneamente, por ejemplo, repartir dos cálculos entre dos núcleos. La concurrencia no exige ese reparto físico: varias consultas pueden estar pendientes a la vez aunque el código que las coordina se ejecute en un mismo hilo.

**Asincronía** es una forma de expresar operaciones cuyo resultado puede llegar más adelante. En Python, `asyncio` coordina corrutinas que pueden suspenderse durante una espera y reanudarse después. Permite hacer trabajo concurrente, pero declarar una función como asíncrona no convierte automáticamente sus instrucciones en trabajo paralelo.

Si tres consultas independientes esperan un segundo cada una, ejecutarlas en secuencia acumula unos tres segundos de espera. Si sus esperas se solapan, el conjunto puede aproximarse a un segundo, más la coordinación. La mejora procede de aprovechar el tiempo de espera, no de calcular tres veces más deprisa.

## Trabajo de entrada y salida y trabajo de CPU

Un trabajo está limitado por **entrada y salida**, o I/O, cuando pasa gran parte de su tiempo esperando datos: una respuesta HTTP, una consulta a una base de datos o información de un dispositivo. Mientras la respuesta no está disponible, realizar más cálculos no hace que llegue antes.

Un trabajo está limitado por **CPU** cuando ocupa el tiempo ejecutando instrucciones: recorrer muchos elementos, transformar datos o calcular un resultado numérico. Para terminar antes necesita reducir ese trabajo o disponer de más capacidad de ejecución.

La diferencia determina qué puede aportar la concurrencia. Solapar esperas suele mejorar un lote de consultas independientes. Intercalar dos cálculos dentro de un único hilo no proporciona otro núcleo ni elimina las instrucciones que deben ejecutarse.

Una misma aplicación puede tener ambas fases. Descargar información consume tiempo de red; procesar lo descargado puede consumir CPU. Conviene distinguirlas porque la solución adecuada para una fase puede no ayudar a la siguiente.

## Corrutinas y async def

Una función declarada con **`async def`** es una función corrutina. Su cuerpo puede contener operaciones con `await`, que permiten esperar resultados sin mantener ocupado el hilo durante toda la espera.

Una consulta simplificada permite fijarse en ese flujo:

```python
import asyncio

async def consultar(nombre):
    await asyncio.sleep(1)
    return f"datos de {nombre}"
```

`nombre` identifica el recurso solicitado. `asyncio.sleep(1)` representa una espera de un segundo; no envía una petición de red. Al terminar esa espera, la función devuelve un texto con el recurso correspondiente. Esta misma función sirve como referencia en los fragmentos siguientes.

Llamar a `consultar("usuarios")` **crea un objeto corrutina**. Esa llamada, por sí sola, no ejecuta el cuerpo hasta obtener el resultado. El objeto describe una ejecución que todavía debe esperarse o programarse.

Esta diferencia también existe en los tipos de objetos: la función es la definición reutilizable; la corrutina es una ejecución concreta de esa definición. Para realizar una nueva consulta se crea otra corrutina llamando otra vez a la función. Una corrutina que ya terminó no se puede reutilizar como si fuera una ejecución nueva.

## Qué significa await

**`await`** expresa que la operación actual necesita el resultado de otra operación asíncrona para continuar. Dentro de una corrutina, estas dos líneas mantienen un orden secuencial:

```python
usuarios = await consultar("usuarios")
pedidos = await consultar("pedidos")
```

La primera consulta comienza y llega a su espera. La corrutina que la llamó queda pendiente de su resultado; todavía no ha alcanzado la segunda línea. Cuando recibe los datos de usuarios, los asigna a `usuarios` y entonces empieza la consulta de pedidos.

Aunque las dos funciones sean asíncronas, las esperas no se solapan: en ese fragmento se ha pedido completar una consulta antes de iniciar la siguiente. **Poder suspender una operación y organizar varias operaciones concurrentes son decisiones diferentes.**

El valor que produce la corrutina mediante `return` es el que entrega `await`. Si en lugar de devolver un valor termina con una excepción, esa excepción aparece al esperarla y puede gestionarse en el llamador.

`await` solo se utiliza en un contexto asíncrono. Tampoco significa necesariamente «dar paso a otra tarea»: si lo esperado ya está disponible, la ejecución puede continuar sin suspenderse.

## El bucle de eventos

El **bucle de eventos** organiza qué tareas pueden continuar. Mantiene las operaciones pendientes y atiende las que tienen trabajo disponible. Cuando una tarea llega a una espera que no puede resolverse inmediatamente, el bucle puede atender otra.

Al suspender una corrutina se conserva su estado: las variables locales, el punto de ejecución y lo que está esperando. Cuando la espera se resuelve, puede continuar desde ese punto; no vuelve a empezar la función.

En el hilo del bucle se ejecuta una tarea de Python cada vez. La alternancia es **cooperativa**: el bucle recupera el control cuando la tarea se suspende o termina. No interrumpe arbitrariamente un cálculo largo para dar un turno a otra corrutina.

Esto explica por qué una tarea puede estar iniciada sin estar ejecutando instrucciones en ese instante. Puede estar esperando una respuesta, preparada para continuar o ya terminada. El bucle coordina esos estados; no convierte cada corrutina en un hilo del sistema.

En la entrada de una aplicación, `asyncio.run(...)` prepara un bucle, ejecuta la corrutina principal y cierra el bucle al terminar. Dentro de una corrutina que ya se está ejecutando, la coordinación continúa mediante `await` y las APIs de tareas. Los entornos que mantienen un bucle activo, como Jupyter, tienen su propio contexto de ejecución asíncrona.

## Programar tareas con create_task

Una **`Task`** es el objeto con el que `asyncio` administra la ejecución de una corrutina. `asyncio.create_task()` la programa para que el bucle pueda atenderla y devuelve una referencia a esa tarea.

Dentro de una corrutina, la diferencia respecto a las dos esperas secuenciales es programar ambas consultas antes de esperar sus resultados:

```python
usuarios = asyncio.create_task(consultar("usuarios"))
pedidos = asyncio.create_task(consultar("pedidos"))

resultado_usuarios = await usuarios
resultado_pedidos = await pedidos
```

Al llegar a `await usuarios`, las dos tareas ya están programadas. Mientras usuarios espera, pedidos también puede avanzar hasta su propia espera. Esperar primero a usuarios no impide que pedidos termine antes.

Si pedidos ya terminó al alcanzar `await pedidos`, se recoge el resultado disponible. No se realiza una segunda consulta. Una tarea conserva el resultado o la excepción de la ejecución que administra.

Programar una tarea tampoco hace que el llamador espere automáticamente a que termine. La referencia permite observar su finalización: `await tarea` espera el resultado; `tarea.done()` indica si terminó; `tarea.result()` consulta el resultado inmediatamente y falla si todavía no está disponible.

Crear una tarea y esperarla inmediatamente antes de crear la siguiente conserva la secuencia. El solapamiento procede de tener varias operaciones programadas y capaces de avanzar durante las esperas de las otras.

## Agrupar resultados con gather

**`asyncio.gather()`** reúne varias operaciones y permite esperar sus resultados conjuntamente. Cuando recibe corrutinas, las programa como tareas:

```python
resultados = await asyncio.gather(
    consultar("usuarios"),
    consultar("pedidos"),
    consultar("productos"),
)
```

Las tres consultas pueden alcanzar su espera sin exigir que termine una antes de iniciar la siguiente. Con la espera de un segundo de `consultar()`, las tres pausas pueden transcurrir durante el mismo intervalo.

`resultados` contiene `['datos de usuarios', 'datos de pedidos', 'datos de productos']`. **La lista mantiene el orden de los argumentos**, aunque una consulta termine antes que otra. La posición del resultado permite relacionarlo con la entrada que lo produjo.

El orden de finalización y el orden en que el llamador recibe la lista son dos cosas distintas. Si productos tarda menos que usuarios, puede terminar primero y seguir ocupando la tercera posición de la lista.

`gather()` resulta útil cuando interesa reunir resultados independientes. El comportamiento ante un fallo también forma parte de su contrato y debe distinguirse de la cancelación coordinada que ofrece `TaskGroup`.

## Llamadas que bloquean el bucle

Declarar una función con `async def` no transforma las llamadas síncronas que contiene. **`time.sleep(1)` bloquea el hilo que lo ejecuta** durante la pausa. Si ese hilo es el del bucle, las demás tareas tampoco pueden avanzar durante ese segundo.

**`await asyncio.sleep(1)` suspende la corrutina** mientras transcurre la pausa y permite al bucle atender otras tareas. Las dos operaciones representan una espera, pero entregan el control de forma diferente.

La misma distinción se aplica a una biblioteca de red. Una llamada HTTP síncrona puede mantener ocupado el hilo del bucle hasta recibir la respuesta. Escribir `async` delante de la función que la contiene no cambia el contrato de esa llamada.

Cuando existe una API asíncrona, sus operaciones se esperan mediante `await`. Cuando solo existe una función síncrona de entrada y salida, puede delegarse en un hilo para integrar su resultado sin bloquear el bucle.

Un cálculo largo sin puntos de suspensión produce el mismo problema de coordinación: el bucle no puede atender otras tareas, plazos o solicitudes de cancelación hasta recuperar el control.

## Delegar una operación síncrona a un hilo

**`asyncio.to_thread()`** permite ejecutar una función síncrona en otro hilo y esperar su resultado desde una corrutina. Una lectura de texto ilustra la relación entre ambas partes:

```python
from pathlib import Path

texto = await asyncio.to_thread(Path("datos.txt").read_text, encoding="utf-8")
```

`Path("datos.txt")` representa la ruta del archivo. Su método `read_text` es una función síncrona que abre el archivo y devuelve el contenido como texto. `encoding="utf-8"` se entrega a ese método para indicar cómo interpretar los bytes.

Se pasa **el método sin llamarlo**: `read_text`, no `read_text()`. La ejecución de la lectura debe ocurrir en el hilo delegado. Llamarlo antes de pasarlo a `to_thread()` realizaría la lectura en el hilo del bucle y enviaría después su resultado donde se esperaba una función.

Mientras la lectura está pendiente, la corrutina que hizo `await` espera, pero el bucle puede atender otras tareas. Cuando termina la función, su valor se entrega a `texto`; si falla, su excepción se propaga al esperar.

Esto integra una operación bloqueante en un flujo asíncrono. No vuelve asíncrona internamente a la biblioteca ni hace que un cálculo de Python puro necesite menos instrucciones.

## Pools de hilos

Un **pool** mantiene trabajadores reutilizables y les entrega trabajos. `ThreadPoolExecutor` administra hilos, de modo que un lote de llamadas síncronas puede atenderse concurrentemente.

Para varias lecturas, `rutas` puede contener objetos `Path` correspondientes a los archivos de interés:

```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=2) as pool:
    textos = list(pool.map(Path.read_text, rutas))
```

`Path` es la clase del apartado anterior. `pool.map()` llama a `Path.read_text` para cada ruta. `max_workers=2` permite que hasta dos trabajadores del pool ejecuten sus llamadas a la vez; si hay más trabajos, esperan a que quede un trabajador disponible.

`map()` entrega los resultados en el orden de las entradas. `list(...)` consume esos resultados y, si alguno todavía no está disponible, el llamador espera. Este fragmento corresponde a coordinación **síncrona**: no debe confundirse con esperar sin bloquear el hilo del bucle.

El bloque `with` cierra el executor al salir y, por defecto, espera a los trabajos pendientes. Reutilizar los trabajadores evita crear y destruir un hilo para cada operación.

Los hilos comparten la memoria del proceso. Esto facilita acceder a los mismos objetos, pero obliga a coordinar las modificaciones compartidas. Que cada llamada se ejecute en un hilo distinto no protege automáticamente los datos.

## Datos compartidos y condiciones de carrera

Una **condición de carrera** aparece cuando el resultado depende de una intercalación no controlada entre operaciones. También puede existir entre corrutinas de un único hilo si una modificación queda dividida por una suspensión.

Si `contador` vale cero, una actualización separada en lectura, espera y escritura contiene ese punto de intercalación:

```python
anterior = contador
await asyncio.sleep(0)
contador = anterior + 1
```

La primera tarea lee cero y se suspende. La segunda puede leer también cero antes de que la primera escriba. Ambas calculan uno y lo guardan: se solicitaron dos incrementos, pero el valor final solo aumentó una vez.

`asyncio.sleep(0)` cede el control al bucle. Aquí hace explícita la suspensión que separa la lectura de la escritura. Una operación real también puede suspenderse al esperar una respuesta necesaria para completar una actualización.

Un **lock** delimita una sección a la que solo puede entrar un participante cada vez. Un mismo `lock = asyncio.Lock()` compartido por las tareas permite proteger esa secuencia completa:

```python
async with lock:
    anterior = contador
    await asyncio.sleep(0)
    contador = anterior + 1
```

La segunda tarea espera a que la primera salga del bloque antes de leer el valor. Proteger únicamente la asignación final dejaría abierta la posibilidad de trabajar con una lectura desactualizada.

En código real conviene evitar esperas innecesarias dentro de la sección protegida. Un incremento sin puntos de suspensión no presenta esta intercalación entre tareas del mismo bucle. `asyncio.Lock` coordina esas tareas; si los participantes son hilos del sistema, se utiliza una primitiva adecuada a hilos, como `threading.Lock`.

## Semáforos y límites de simultaneidad

Un lock concede acceso a un participante. Un **semáforo** administra varios permisos, lo que permite limitar cuántas operaciones entran simultáneamente en una sección.

Con un semáforo compartido creado mediante `limite = asyncio.Semaphore(3)`, cada consulta puede delimitar su acceso al servicio:

```python
async with limite:
    respuesta = await consultar("usuarios")
```

Hasta tres tareas pueden estar dentro de sus respectivos bloques. La siguiente espera a que se libere un permiso. `async with` lo adquiere antes de entrar y lo libera al salir, incluso si el bloque termina con una excepción.

El semáforo debe compartirse entre las consultas cuyo acceso se quiere limitar. Crear uno diferente en cada tarea daría a cada una sus propios permisos y perdería el límite común.

La espera de una operación continúa dentro de la sección: mientras aguarda la respuesta, mantiene su permiso porque esa consulta sigue en curso. El límite protege el número de operaciones simultáneas, no solo las instrucciones que están utilizando CPU en ese instante.

Un límite de tres consultas simultáneas **no equivale a tres peticiones por segundo**. La cantidad de peticiones que terminan en un segundo depende de cuánto duren. Tampoco limita cuántas tareas se han creado y están esperando permiso; para acotar el trabajo pendiente puede utilizarse una cola.

## Colas y trabajo pendiente

Una **cola** separa la producción de trabajos de su procesamiento. En `asyncio.Queue(maxsize=10)`, la capacidad permite mantener hasta diez elementos dentro de la cola.

`await cola.put(trabajo)` añade un elemento. Si la cola está llena, suspende al productor hasta que exista espacio. Esto permite que el ritmo del consumidor frene al productor y evita acumular trabajo indefinidamente; esa relación se conoce como **backpressure**.

El consumidor retira un elemento y confirma cuándo termina de atenderlo. En el siguiente fragmento, `procesar(trabajo)` representa la operación asíncrona encargada de ese trabajo:

```python
trabajo = await cola.get()
try:
    await procesar(trabajo)
finally:
    cola.task_done()
```

`get()` espera si no hay elementos y libera un puesto al retirar uno. `task_done()` confirma que se ha atendido un elemento retirado; no lo elimina de la cola, porque ya se había retirado con `get()`.

`await cola.join()` espera a que todos los elementos añadidos reciban esa confirmación. Una cola vacía no demuestra que todo haya terminado: el consumidor puede estar procesando un elemento que ya retiró. Además, `join()` no sustituye al protocolo que indique cuándo el productor ha terminado de añadir trabajos.

La capacidad limita los elementos **dentro de la cola**, no los que ya se están procesando. Con diez pendientes y dos consumidores ocupados pueden existir doce trabajos sin terminar. El cierre de los consumidores también debe coordinarse; una señal de fin es una posibilidad cuando se distingue de los trabajos válidos.

## Timeouts y cancelación

Un **timeout** fija cuánto tiempo se está dispuesto a esperar una operación. `asyncio.timeout()`, disponible desde Python 3.11, aplica ese plazo a un bloque asíncrono:

```python
try:
    async with asyncio.timeout(2):
        respuesta = await consultar("usuarios")
except TimeoutError:
    respuesta = None
```

Si la consulta termina dentro del plazo, se conserva su resultado. Si el contexto agota los dos segundos, solicita la cancelación correspondiente y transforma esa cancelación en `TimeoutError` al salir. El `except` se coloca fuera del bloque porque la transformación ocurre en su salida. `None` representa aquí una decisión del llamador ante el fallo, no una respuesta recibida del servicio.

**Cancelar una tarea es solicitar su finalización cooperativa.** `tarea.cancel()` provoca que se entregue `asyncio.CancelledError` en una oportunidad de cancelación. La corrutina puede ejecutar su limpieza antes de terminar; no se detiene cortando cualquier instrucción a mitad.

Los bloques `finally` y los gestores de contexto permiten cerrar recursos también durante la cancelación. Si se captura `CancelledError` para registrar o limpiar algo, normalmente debe propagarse de nuevo con `raise` para respetar esa solicitud.

El bucle necesita recuperar el control para atender el plazo. Una llamada que bloquea su hilo puede retrasar tanto el timeout como la cancelación. Por eso un plazo asíncrono no corrige una operación bloqueante colocada en el lugar equivocado.

Cancelar la espera de un trabajo delegado tampoco garantiza detener ese trabajo. Una función que ya se ejecuta en un hilo o un proceso puede continuar; necesita su propio mecanismo de parada cuando deba poder interrumpirse.

## TaskGroup y errores de varias tareas

Cuando varias tareas pertenecen a una misma operación, importa gestionar conjuntamente su duración y sus fallos. **`asyncio.TaskGroup`**, disponible desde Python 3.11, delimita un grupo de tareas y espera a que se cierren antes de salir de su contexto.

```python
async with asyncio.TaskGroup() as grupo:
    usuarios = grupo.create_task(consultar("usuarios"))
    pedidos = grupo.create_task(consultar("pedidos"))
```

Las tareas se crean mediante el grupo y pueden avanzar concurrentemente. Si el bloque termina correctamente, ambas han finalizado y sus referencias permiten recuperar los resultados. No quedan consultas del grupo continuando fuera de ese ámbito.

Si una tarea falla con una excepción distinta de una cancelación, el grupo solicita cancelar las demás y espera a su limpieza. Los fallos se reúnen en un **`ExceptionGroup`**, que puede contener varias excepciones. La sintaxis `except* ValueError` permite gestionar las de ese tipo dentro del grupo de errores.

`gather()` tiene otro comportamiento. Con su configuración habitual, propaga el primer fallo al llamador, pero ese fallo no cancela automáticamente las otras tareas. Con `return_exceptions=True`, espera a todas y coloca también sus excepciones como elementos de la lista de resultados.

Por eso un resultado reunido con `gather()` no implica siempre éxito: si se solicitó devolver excepciones, hay que distinguirlas de los valores válidos. `TaskGroup` expresa mejor el caso en el que las tareas forman una unidad y el fallo de una debe provocar el cierre de las demás.

Si una excepción acaba haciendo que termine la corrutina principal y se cierre `asyncio.run()`, ese cierre puede cancelar tareas pendientes. Esa cancelación del programa completo no debe confundirse con el contrato propio de `gather()`.

## Procesos y trabajo de CPU

Los hilos pertenecen a un mismo proceso y comparten memoria. Un **proceso** dispone de su propio intérprete y espacio de memoria. Un pool de procesos puede distribuir cálculos independientes entre varios núcleos.

`ProcessPoolExecutor` utiliza una interfaz similar a la del pool de hilos. Si `calcular(limite)` representa una función de cálculo y `limites` contiene sus distintas entradas, la operación central es:

```python
from concurrent.futures import ProcessPoolExecutor

with ProcessPoolExecutor(max_workers=2) as pool:
    resultados = list(pool.map(calcular, limites))
```

`max_workers=2` limita el pool a dos procesos trabajadores. Los argumentos se envían a esos trabajadores y sus resultados vuelven al proceso llamador. `map()` conserva el orden de entrada, igual que en el executor de hilos.

El coste incluye arrancar trabajadores y transportar datos. Un cálculo pequeño puede terminar antes en el proceso original. Aumentar trabajadores tampoco crea más núcleos disponibles ni elimina el tiempo dedicado a transferencias.

En una aplicación que crea procesos, su arranque se protege con `if __name__ == "__main__":` para evitar que los trabajadores vuelvan a ejecutar ese arranque al importar el módulo. Las funciones enviadas deben poder importarse desde los trabajadores y sus argumentos y resultados deben poder serializarse. Esto explica por qué funciones locales, lambdas o definiciones de una sesión interactiva pueden resultar incompatibles con un pool de procesos.

### Memoria del padre y del trabajador

Enviar una lista a un trabajador no convierte esa lista normal en memoria compartida. Si el trabajador añade un elemento, modifica su propia representación. El padre necesita recibir explícitamente el resultado si le interesa esa modificación.

`pool.submit(funcion, argumento)` envía un trabajo y devuelve un **`concurrent.futures.Future`**. En código síncrono, `futuro.result()` espera a que termine y recupera el valor devuelto, o propaga la excepción. Recibir una lista modificada como resultado no significa que la lista original del padre haya cambiado.

Existen mecanismos explícitos de comunicación y memoria compartida entre procesos, pero tienen sus propios contratos. No debe suponerse que un objeto normal conserva la identidad y las modificaciones compartidas que tendría entre hilos.

## GIL y elección del modelo

En **CPython con el GIL activado**, varios hilos no ejecutan simultáneamente bytecode de Python dentro del mismo intérprete. Los hilos siguen siendo útiles cuando una operación libera esa limitación mientras espera entrada y salida.

Algunas bibliotecas nativas liberan el GIL durante sus cálculos y existen compilaciones de CPython sin él. Por eso hay que relacionar la elección con el intérprete y las operaciones reales, en lugar de concluir que todos los cálculos se comportan igual con hilos.

Cuando predominan esperas y las bibliotecas proporcionan APIs asíncronas, `asyncio` permite coordinarlas en un bucle, con plazos y límites explícitos. Cuando la biblioteca de entrada y salida es síncrona, un pool de hilos puede atender varias llamadas y `to_thread()` permite integrarlas en una aplicación asíncrona.

Cuando predominan cálculos independientes de Python puro, los procesos permiten repartirlos entre intérpretes y núcleos, con el coste de arranque y transporte. Si los cálculos dependen estrechamente unos de otros, ese reparto puede ser poco útil o introducir demasiada comunicación.

Una aplicación también puede combinar los modelos. Un bucle puede coordinar la red y esperar un cálculo delegado a un pool de procesos. `bucle.run_in_executor(pool, calcular, limite)` envía ese trabajo y devuelve un futuro compatible con `await`; `bucle` se obtiene con `asyncio.get_running_loop()` dentro de la ejecución asíncrona.

La mejora final depende de cuánto trabajo pueda solaparse o repartirse. La parte secuencial permanece, la consulta más lenta puede determinar el final del lote y el exceso de trabajadores puede saturar conexiones, memoria o servicios. Entender dónde se consume el tiempo permite elegir el modelo sin atribuirle mejoras que no puede producir.

## Referencias

Documentación oficial: [corrutinas, tareas y cancelación](https://docs.python.org/3.12/library/asyncio-task.html), [locks y semáforos](https://docs.python.org/3.12/library/asyncio-sync.html), [colas](https://docs.python.org/3.12/library/asyncio-queue.html), [executors de hilos y procesos](https://docs.python.org/3.12/library/concurrent.futures.html) y [trabajo delegado desde el bucle](https://docs.python.org/3.12/library/asyncio-eventloop.html#asyncio.loop.run_in_executor).

El artículo [Python Concurrency de Real Python](https://realpython.com/python-concurrency/) desarrolla la comparación entre concurrencia, hilos, procesos y asincronía.
