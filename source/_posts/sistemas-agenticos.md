---
title: 'Sistemas agénticos'
date: '2026-10-23'
updated: '2026-10-23'
layout: 'learning'
language: 'es'
disableNunjucks: true
icon: 'ai'
series_title: 'Custom'
series_path: '/custom/'
categories: ['Custom']
tags: ['agentes', 'arquitectura', 'herramientas', 'contexto', 'RAG', 'harness']
intro: 'Del bucle de un agente a una plataforma que conserva estado, ejecuta herramientas y se recupera de los fallos. Un mismo caso: añadir una exportación CSV a una aplicación de pedidos.'
heading: 'Sistemas agénticos'
menu_title: 'Sistemas agénticos'
learning_classes: 'learning-page learning-custom learning-page-cards'
background: 'bg-gradient-to-r from-teal-700 to-cyan-900 !text-white'
---

## Del modelo al agente

Un modelo de lenguaje recibe una entrada y genera una salida. Puede explicar cómo añadir una exportación CSV o proponer una llamada a una herramienta, pero **el programa que lo rodea es quien lee archivos, ejecuta código y aplica cambios**.

Un agente conecta esas decisiones con acciones y devuelve sus resultados al modelo. Si necesita modificar la aplicación de pedidos, primero puede solicitar el archivo de sus rutas, observar cómo funciona y decidir qué editar. La observación modifica la siguiente decisión.

El **harness** es el programa que dirige ese recorrido: prepara la entrada, llama al modelo, interpreta su respuesta, valida las herramientas y controla cuándo continuar o detenerse. La autonomía existe dentro de las acciones y límites que el harness permite.

Si los pasos son conocidos y siempre siguen el mismo orden, un flujo programado puede ser suficiente. Un agente resulta útil cuando el siguiente paso depende de información que se descubre durante la tarea. El objetivo sigue siendo un resultado comprobable: un CSV correcto, no una conversación convincente.

## El bucle y sus mensajes

El recorrido básico es **preparar contexto → pedir una respuesta → ejecutar las herramientas autorizadas → incorporar observaciones → decidir si continuar**. Una iteración puede contener varias llamadas a herramientas; resolver una petición del usuario puede requerir muchas iteraciones.

El historial mantiene un protocolo. La solicitud de una herramienta incluye un identificador y su resultado debe referirse a esa misma llamada. Este ejemplo ilustra el contrato; los nombres concretos dependen del adaptador utilizado:

```json
[
  {"role": "user", "content": "Añade la exportación CSV de pedidos"},
  {"role": "assistant", "tool_calls": [
    {"id": "call_1", "name": "read_file", "arguments": {"path": "app/orders.py"}}
  ]},
  {"role": "tool", "call_id": "call_1", "content": "Contenido de app/orders.py"}
]
```

`call_1` relaciona la propuesta con la observación. El modelo solo puede usar el contenido leído si el constructor de contexto lo incluye en una inferencia posterior. Ejecutar la función sin devolver el resultado deja el bucle sin esa información.

Una respuesta sin herramientas puede ser una entrega final, una pregunta o una explicación de que la tarea está bloqueada. **La ausencia de llamadas no demuestra que el trabajo esté terminado**. El harness debe distinguir éxito verificado, resultado parcial, espera, cancelación y fallo.

## Herramientas con contratos y permisos

Una herramienta tiene un nombre, una descripción, un esquema de argumentos y un ejecutor. El modelo ve el contrato; el registro de herramientas conecta ese contrato con una función que controla la plataforma.

Para `read_file`, validar que `path` es un texto solo comprueba la forma de la petición. También hay que resolver la ruta dentro del workspace autorizado, evitar escapes mediante rutas o enlaces simbólicos y comprobar que la identidad de la ejecución puede leer ese recurso. **Validación y autorización resuelven problemas diferentes**.

El resultado debe permitir decidir qué hacer después. Una lectura puede devolver texto, referencia de archivo, versión y una indicación de truncamiento. Una ejecución de tests puede devolver código de salida y referencias a los logs. Un error de permisos debe llegar como una observación reconocible, sin ejecutar el efecto denegado.

MCP estandariza la integración con herramientas mediante operaciones como `tools/list` y `tools/call`. No proporciona por sí solo aislamiento, autorización de negocio ni protección de secretos. Esas responsabilidades siguen perteneciendo al sistema que ejecuta la llamada.

## Primer agente con un modelo simulado

El agente inicial puede tener un bucle, una lista de mensajes y un registro de funciones. Un modelo simulado devuelve respuestas predefinidas y permite comprobar el protocolo sin depender de una API, de la red ni de la variabilidad de un modelo real.

En una prueba determinista, la primera respuesta solicita un archivo; el programa ejecuta su lectura; la segunda respuesta utiliza esa observación. Se puede verificar que cada llamada tenga resultado, que una herramienta desconocida no se ejecute y que exista un límite de iteraciones.

Ese límite es parte del programa, no una petición informal en el prompt. También conviene representar la cancelación y los errores de ejecución desde el principio. Así, el bucle tiene una salida definida aunque el modelo repita la misma acción.

Esta primera versión aún pierde lo que solo conserva en memoria al terminar el proceso. La siguiente responsabilidad consiste en separar y guardar los datos que permiten continuar.

## Sesiones, ejecuciones y estado

Una **sesión** agrupa una conversación. Una **ejecución**, o run, persigue un objetivo concreto dentro de esa sesión. Un **proyecto** identifica los recursos sobre los que se trabaja. Separarlos permite tener varias tareas en una conversación sin confundir sus permisos, archivos ni resultados.

La plataforma necesita conservar información de distinta naturaleza:

| Datos                  | Pregunta que responden                            |
| ---------------------- | ------------------------------------------------- |
| Mensajes y llamadas    | ¿Qué se pidió, propuso y observó?                 |
| Estado de ejecución    | ¿Está trabajando, esperando o terminada?          |
| Operaciones            | ¿Qué efecto se intentó y qué resultado se conoce? |
| Artefactos y versiones | ¿Qué archivos o cambios se pueden recuperar?      |

El estado operativo vive fuera del modelo. Un párrafo que dice «estoy esperando» no sustituye una transición persistida a `waiting`. Del mismo modo, conservar la conversación no recupera automáticamente un archivo que solo existía en un disco temporal.

Un **checkpoint** establece una frontera recuperable: qué iteración terminó, qué resultados se guardaron y a qué versión del trabajo corresponden. Si un proceso desaparece, la recuperación comienza en esa frontera y revisa las operaciones cuyo resultado siga siendo incierto.

## Construir el contexto

El historial almacenado y la entrada al modelo no son lo mismo. El **constructor de contexto** selecciona instrucciones, objetivo, mensajes, resultados y evidencia para una inferencia concreta. Es una proyección del estado disponible.

La ventana de contexto tiene un límite. Hay que reservar espacio para la respuesta y para el resto del protocolo que utilice el proveedor. Una aproximación ilustrativa separa esos presupuestos:

```text
presupuesto de entrada = ventana disponible − reserva de salida − margen
```

La selección debe proteger las reglas vigentes, el objetivo, los pasos recientes y las relaciones entre llamadas y resultados. Cortar los primeros mensajes hasta que el texto quepa puede dejar una respuesta de herramienta sin su llamada o borrar una restricción necesaria.

Para el CSV, interesa recuperar cómo se representan los importes, qué permisos exige la ruta y qué tests cubren los pedidos. No hace falta enviar todo el repositorio. Guardar las referencias y versiones incluidas permite explicar después qué información vio el modelo.

La caché de prompts puede reducir trabajo repetido del proveedor. No amplía la ventana ni convierte un contexto excesivo en una entrada válida.

## Memoria y recuperación de conocimiento

La **memoria** conserva información útil entre pasos o ejecuciones: por ejemplo, que el proyecto almacena precios en céntimos. Necesita ámbito, procedencia, versión y una política de actualización. Una regla de un proyecto no debe aplicarse silenciosamente a otro.

**RAG**, generación aumentada con recuperación, busca evidencia y la incorpora a la entrada antes de generar una respuesta. El recorrido incluye localizar documentos, seleccionar fragmentos relevantes y adjuntarlos con suficiente contexto para interpretarlos.

La búsqueda puede ser textual, estructurada o semántica. No exige empezar con una base vectorial. Para localizar el campo `total_cents` en un repositorio pequeño, una búsqueda exacta puede resolver la necesidad.

Si el CSV contiene importes incorrectos, hay que comprobar si el documento estaba actualizado, si la búsqueda lo encontró, si llegó al contexto y si el modelo lo interpretó bien. Atribuir todos los fallos a la generación oculta problemas que ocurrieron antes.

## Compaction y continuidad

Cuando el historial ya no cabe, **compaction** sustituye una parte por una representación más corta. Un resumen útil conserva objetivo, decisiones, restricciones, referencias, errores importantes y trabajo pendiente. Es una transformación con pérdida; no sustituye el historial durable ni garantiza que todos los detalles permanezcan.

El resumen necesita declarar qué parte cubre. Si se produce mientras siguen llegando mensajes, el sistema puede resumir hasta la secuencia 80 y conservar los eventos posteriores como una cola adicional:

```text
entrada siguiente = reglas + resumen hasta 80 + mensajes desde 81 + evidencia
```

El corte de cobertura evita perder novedades o contarlas dos veces. También hay que mantener coherentes las llamadas a herramientas y sus observaciones alrededor de esa frontera.

Un **snapshot** responde otra pregunta: qué estado operativo y qué artefactos están disponibles para restaurar. El resumen ayuda al modelo a continuar; el snapshot permite al programa recuperar una situación concreta. Un resumen que dice «se modificó el exportador» no contiene por sí mismo ese cambio.

## Workspace, sandbox y versiones

El **workspace** contiene los archivos de trabajo. El **proceso** ejecuta instrucciones. El **sandbox** limita el acceso de esa ejecución a recursos como disco, red, memoria y CPU. Un directorio separado organiza archivos, pero no constituye por sí solo una barrera de seguridad.

Para modificar la exportación, cada ejecución necesita un ámbito claro: un checkout, una rama o un conjunto autorizado de archivos. Los comandos se ejecutan con límites de tiempo y recursos, y solo con las credenciales necesarias para su trabajo.

Una comprobación vale para una versión concreta. Si los tests pasan y después cambia el código, ese resultado anterior no verifica la nueva versión. El diff, los artefactos y la evidencia de ejecución deben poder relacionarse.

Si se pierde el sandbox, solo se recupera con certeza lo que se conservó: un commit, un patch, archivos persistidos o una imagen explícita del estado. Restaurar código no recupera automáticamente procesos, conexiones abiertas ni memoria de ejecución.

## Orquestación y trabajo en segundo plano

Una tarea larga debe poder continuar aunque se cierre la pestaña. La API valida la solicitud, guarda la intención y el trabajo pendiente, y devuelve un `run_id`. La interfaz utiliza ese identificador para consultar el avance.

Una **cola** ofrece trabajo pendiente. Un **worker** lo reclama y ejecuta. El **orquestador** controla su ciclo de vida: creación, espera, reanudación, cancelación y terminación. Estas responsabilidades pueden comenzar dentro de un despliegue pequeño.

```text
Petición → intención persistida → trabajo reclamado → bucle → resultado verificado
                        ↑                            ↓
                 consulta por run_id ← estado y eventos
```

Aceptar una solicitud implica que puede recuperarse después; todavía no implica haberla completado. Si guardar la ejecución y programar el trabajo deben ser consistentes, una transacción local o una outbox transaccional pueden conservar ambas intenciones.

También hace falta una autoridad para avanzar cada run. Un lease concede la propiedad durante un periodo, pero su vencimiento no mata al proceso anterior. Versiones o tokens de propiedad permiten rechazar escrituras de un worker que perdió esa autoridad. Los efectos externos necesitan sus propias garantías.

## Fallos, reintentos y cancelación

Un error transitorio, un argumento inválido y una denegación de permisos requieren respuestas distintas. Esperar y reintentar puede ayudar ante un límite temporal del proveedor; repetir una petición mal formada no corrige sus argumentos.

Un timeout es especialmente importante: puede significar que no llegó la respuesta aunque el efecto sí se produjera. Antes de repetir una operación con efectos, hay que consultar su estado, reconciliar el resultado o utilizar la garantía de idempotencia que ofrezca el destino.

La identidad corresponde a la **intención**, no a cada intento. Por ejemplo, `operation_id = exportacion_42` se conserva durante sus reintentos. Esa clave local no obliga a un servicio externo a deduplicar; su contrato debe aceptar y respetar una identidad equivalente.

Cancelar detiene nuevas acciones cuando el sistema observa la solicitud. No deshace automáticamente cambios, mensajes enviados ni comandos que ya comenzaron. El resultado debe conservar los efectos conocidos y el trabajo pendiente.

Agotar presupuesto también puede terminar con una entrega parcial. Clasificarla correctamente permite retomar o revisar la tarea sin presentar como verificado un resultado incompleto.

## Eventos y streaming

Un **comando** solicita una acción; un **evento** registra un hecho aceptado. «Ejecuta los tests» es un comando. «Los tests terminaron con código 0 sobre esta versión» es un evento que debe incluir las referencias necesarias para comprobarlo.

El **event log** conserva hechos para consulta y reconstrucción. Los fragmentos de texto que aparecen mientras responde el modelo son deltas provisionales. Un corte de conexión puede dejarlos incompletos; no deben tratarse como una respuesta final persistida.

Para reconectar, el cliente conserva un cursor o identificador del último evento recibido. El servidor devuelve los posteriores y el cliente deduplica por identidad. SSE puede transportar estos datos, pero el almacenamiento, la retención, la autorización y el replay son responsabilidad de la aplicación.

**Reconstruir el estado no debe volver a ejecutar herramientas**. Leer que se creó un archivo actualiza la vista de lo sucedido; no es una orden para crearlo otra vez. Una captura del estado y los eventos posteriores pueden acelerar esa reconstrucción.

## Cuándo usar varios agentes

Dividir trabajo ayuda cuando las tareas son suficientemente independientes. En el caso CSV, un agente puede investigar el formato esperado y otro revisar la cobertura de tests. Dos agentes que editan a la vez el mismo archivo introducen conflictos y costes de integración.

Cada subagente necesita un **briefing**: objetivo, contexto relevante, recursos permitidos, límites, formato de entrega y criterio de finalización. No debe suponerse que comparte automáticamente todo el historial del coordinador.

**Fan-out** distribuye trabajo; **fan-in** reúne los resultados según una condición explícita. Se puede esperar a todos los hijos, a un subconjunto suficiente o hasta un límite temporal. Cada decisión afecta a qué resultados se aceptan y qué sucede con el trabajo restante.

El coordinador sigue siendo responsable de integrar y verificar. Más agentes también significan más contexto, inferencias, esperas y posibles discrepancias. La decisión se justifica por una mejora medida en la tarea completa.

## Inbox y activaciones

Un subagente puede terminar mientras su coordinador está ocupado o suspendido. Un **inbox** durable conserva la entrega hasta que pueda incorporarse. Una **activación** avisa de que hay trabajo que atender. Guardar información y solicitar atención son operaciones diferentes.

Si se pierde el aviso, el mensaje sigue en el inbox y puede descubrirse al reanudar o mediante reconciliación. Si el aviso llega dos veces, la identidad de la entrega permite reconocer que ya se admitió.

El paso del inbox a la trayectoria necesita una frontera recuperable. Marcar una entrega como consumida antes de registrar su incorporación puede perderla si el proceso cae entre ambas operaciones. El diseño debe poder completar o reconocer esa admisión tras el reinicio.

Cada stream puede conservar su propio orden. Relacionar coordinador e hijos requiere referencias de origen, llamadas y entregas; una marca de tiempo no demuestra por sí sola la dependencia entre dos hechos. Un resultado tardío tampoco debe reactivar automáticamente una ejecución ya cancelada o terminada.

## Modelos, rutas y costes

Una ruta de modelo debe cumplir requisitos de capacidad y protocolo: contexto suficiente, herramientas compatibles y formatos de respuesta interpretables. Cambiar de proveedor puede exigir un adaptador distinto; no siempre basta con sustituir el nombre del modelo.

La afinidad mantiene una ejecución en una ruta estable y puede favorecer el aprovechamiento de caché. El fallback permite responder ante falta de disponibilidad, pero puede perder ese beneficio, cambiar la latencia o alterar el comportamiento del agente. La nueva ruta debe volver a cumplir el contrato.

El presupuesto pertenece a la ejecución completa: inferencias, herramientas, reintentos, subagentes y tiempo de espera. Una llamada barata que obliga a rehacer el trabajo puede producir una tarea más costosa.

Conviene comparar **coste por resultado válido**, latencia hasta la entrega y tasa de tareas completadas. Las cifras de un simulador son ilustrativas y no representan tarifas ni rendimiento de un proveedor real.

## Seguridad fuera del prompt

Un archivo, una página web o un resultado de herramienta puede contener texto que parezca una instrucción. La **prompt injection** intenta que esos datos cambien el objetivo o las reglas del agente. Conservar la procedencia ayuda a distinguir la evidencia de las instrucciones autorizadas.

Las restricciones deben aplicarse fuera del texto generado: permisos comprobados al ejecutar, rutas permitidas, red limitada y credenciales acotadas. Pedir al modelo que no acceda a un secreto no sustituye impedir ese acceso.

Una autorización humana debe referirse a una acción concreta: destino, cambios, alcance y, cuando proceda, versión del artefacto. Si ese objeto cambia de forma relevante después de la revisión, la aprobación anterior puede dejar de cubrirlo.

Los logs también necesitan límites. Sirven para investigar una tarea sin convertirse en otra copia de tokens, datos privados o respuestas completas innecesarias. Visibilidad operativa y acceso indiscriminado a los datos no son equivalentes.

## Observabilidad y evaluación

La **observabilidad** permite seguir una ejecución y localizar dónde falla. Logs, métricas y trazas se correlacionan mediante referencias como `run_id`, `call_id`, `operation_id`, modelo y versión del artefacto.

La **evaluación** comprueba si el resultado resuelve la petición. Un HTTP 200 o una respuesta fluida no demuestran que el CSV tenga columnas correctas, codifique bien el texto, represente los importes o respete los permisos de acceso.

Conviene separar fallos de recuperación, selección de contexto, razonamiento, herramientas e integración. Esa separación permite corregir la pieza responsable y comparar cambios con tareas representativas.

También hay que detectar actividad sin progreso: repetir lecturas, rehacer el mismo patch o encadenar intentos equivalentes sin nueva evidencia. Los límites de coste y tiempo, junto con criterios de avance, ayudan a detener el bucle con una causa clara.

## Arquitectura mínima

Una primera arquitectura puede reunir **una API, una base de datos, un worker, un harness y un workspace autorizado**. El constructor de contexto y el adaptador de modelo pueden ser módulos del mismo servicio. No hace falta convertir cada responsabilidad en un microservicio.

La API persiste objetivo y trabajo pendiente. El worker reclama el run, recupera su estado y reconcilia operaciones inciertas. El harness prepara contexto, interpreta respuestas y ejecuta herramientas autorizadas. Después conserva observaciones y artefactos, y decide si continúa, espera o verifica la entrega.

El siguiente fragmento muestra contratos, no un programa ejecutable: cada función representa un componente que debe implementarse y comprobarse.

```python
def avanzar(run_id):
    with reclamar_ejecucion(run_id) as propiedad:
        estado = recuperar(run_id)
        reconciliar_operaciones_inciertas(estado)
        if debe_detenerse(estado):
            return guardar_salida(estado)

        contexto = construir_contexto(estado)
        respuesta = modelo.completar(contexto)
        guardar_respuesta(respuesta, propiedad)

        for llamada in respuesta.tool_calls:
            validar_y_autorizar(estado, llamada)
            resultado = ejecutar_o_reconciliar(llamada)
            guardar_observacion(llamada.id, resultado, propiedad)

        conservar_estado_y_artefactos(estado)
        programar_siguiente_paso_o_verificar(estado)
```

`propiedad` identifica quién puede avanzar la ejecución. `recuperar` reconstruye datos sin repetir efectos. `ejecutar_o_reconciliar` distingue una acción nueva de un intento cuyo resultado todavía se desconoce. La verificación final relaciona requisitos, versión y evidencia.

La evolución responde a una limitación observada: varios workers para capacidad insuficiente, subagentes para tareas independientes o recuperación semántica cuando la búsqueda existente no encuentra la evidencia. Cada ampliación debe conservar los contratos de la versión pequeña.

## Referencias

- [Building effective agents · Anthropic](https://www.anthropic.com/engineering/building-effective-agents): relación entre workflows, herramientas y agentes.
- [Making retries safe with idempotent APIs · AWS Builders’ Library](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): identidad de operaciones y reintentos.
- [Tools · MCP, especificación 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/server/tools): descubrimiento, contratos y ejecución de herramientas en esa versión.
- [Server-sent events · WHATWG](https://html.spec.whatwg.org/multipage/server-sent-events.html): transporte de eventos y reconexión.
- [Observability primer · OpenTelemetry](https://opentelemetry.io/docs/concepts/observability-primer/): logs, métricas y trazas.
