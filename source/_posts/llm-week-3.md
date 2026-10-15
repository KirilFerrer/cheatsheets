---
title: 'LLM Engineering · Week 3'
date: '2026-10-15'
updated: '2026-10-15'
layout: 'learning'
language: 'es'
disableNunjucks: true
icon: 'ai'
series_title: 'LLM Engineering'
categories: ['AI']
intro: 'Colab, Hugging Face, pipelines, tokenizadores, modelos, cuantización y actas a partir de audio.'
heading: 'LLM Engineering · Week 3'
learning_classes: 'learning-page learning-llm learning-page-cards'
background: 'bg-gradient-to-r from-violet-700 to-purple-900 !text-white'
---

## Colab y GPU

Con una API, tu programa envía la entrada a un proveedor que ejecuta el modelo. Con Transformers, descargas sus pesos y lo ejecutas en la máquina donde corre Python. En Colab esa máquina pertenece a Google: el navegador muestra el notebook, pero los cálculos y archivos están en la sesión remota.

Ambas formas hacen **inferencia**: utilizar un modelo ya entrenado. Entrenar o hacer _fine-tuning_ modifica sus pesos; pasarle mensajes, ejemplos o un historial solo cambia la entrada de esa ejecución.

En Colab, selecciona una GPU T4 en **Entorno de ejecución → Cambiar tipo de entorno de ejecución**. Estos ejemplos utilizan la rama de Transformers del curso; instala las dependencias en una celda:

```python
%pip install -q "transformers==4.57.6" accelerate bitsandbytes huggingface_hub
```

Comprueba qué hardware recibió realmente la sesión:

```python
import torch

print("CUDA disponible:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
```

`cuda` identifica la GPU NVIDIA; `cpu`, el procesador. Los tokenizadores pueden probarse en CPU. Cargar los modelos de generación de esta guía requiere la GPU y memoria libre.

Reiniciar el kernel borra variables y modelos cargados, pero mantiene los archivos y paquetes de esa máquina. Eliminar la sesión elimina también ese entorno: hay que reinstalar y ejecutar las celdas desde arriba. Guarda resultados en Drive para conservarlos. La disponibilidad y duración de las GPU gratuitas varían; tener un notebook guardado no conserva su sesión. [Entornos de Colab](https://research.google.com/colaboratory/faq.html).

## Hugging Face Hub

El Hub aloja repositorios de modelos, datasets y aplicaciones. Un identificador como `Qwen/Qwen3-4B-Instruct-2507` señala un repositorio con pesos, configuración y archivos del tokenizador. `from_pretrained()` los descarga y reutiliza la caché en siguientes cargas; la inferencia posterior ocurre en tu entorno.

**Transformers** carga y ejecuta modelos sobre PyTorch; **Diffusers** ofrece pipelines de difusión para imágenes; **Datasets** carga conjuntos de datos. Compartir el Hub no significa que todos los modelos tengan la misma entrada, salida o librería.

Para modelos que requieren acceso, añade `HF_TOKEN` a los secretos de Colab —icono de llave— y permite que el notebook lo lea:

```python
from google.colab import userdata
from huggingface_hub import login

login(token=userdata.get("HF_TOKEN"))
```

Un token con permiso de lectura basta para descargar modelos a los que tu cuenta tenga acceso. Si el repositorio es restringido, como algunas familias Llama o Gemma, también debes aceptar sus condiciones y obtener acceso en su página. Autenticarse y obtener ese permiso son pasos distintos; los modelos públicos usados aquí pueden descargarse sin ese trámite. [Permisos de los tokens](https://huggingface.co/docs/hub/security-tokens).

## Pipelines

Un `pipeline` reúne la preparación de la entrada, la ejecución del modelo y la conversión de su salida a objetos Python. Primero se crea y carga el modelo; después se reutiliza para tantas entradas como necesites.

```python
from transformers import pipeline

sentimiento = pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment",
    device="cpu",
)

resenas = ["Funciona muy bien.", "Se rompió el primer día."]
resultados = sentimiento(resenas)
for resena, resultado in zip(resenas, resultados):
    print(resena, resultado["label"], resultado["score"])
```

La lista de salida contiene un diccionario por reseña. Este modelo clasifica de `1 star` a `5 stars`; otro puede devolver `POSITIVE` o `NEGATIVE`. `score` expresa la confianza de esa clasificación, no una medida universal de calidad. Por eso cambiar `model` puede cambiar las etiquetas, los idiomas admitidos y el comportamiento, aunque mantengas la misma tarea.

`device="cpu"` permite probar este ejemplo sin reservar GPU; `device="cuda"` lo ejecutaría en la GPU. Especificar `model` evita depender del modelo predeterminado de la librería.

Las demostraciones del curso aplican este mismo patrón a distintos problemas:

- **NER** localiza entidades dentro del texto. Devuelve fragmentos, etiquetas y posiciones; no redacta una respuesta.
- **Question answering** recibe `question` y `context` y extrae una respuesta de ese contexto. No busca información por su cuenta.
- **Zero-shot classification** recibe un texto y `candidate_labels`, por ejemplo `["deporte", "tecnología"]`. Compara esas categorías sin entrenar de nuevo el modelo para ellas.
- **Resumen y traducción** transforman un texto; sus resultados se leen en `summary_text` y `translation_text`. El modelo debe admitir la tarea y los idiomas elegidos.
- **Generación de texto** continúa una entrada y devuelve `generated_text`. Un modelo base completa texto; uno preparado para chat puede responder a mensajes.

La interfaz es parecida, pero el contrato de cada tarea cambia. Un clasificador especializado puede resolver una clasificación directamente, sin pedirle a un chat que escriba una etiqueta y luego interpretar su respuesta. [API de pipelines](https://huggingface.co/docs/transformers/v4.57.1/en/main_classes/pipelines).

## Imágenes y voz

La generación de imágenes mantiene el patrón «cargar → ejecutar → recoger el resultado», utilizando Diffusers. En una sesión con la GPU libre:

```python
%pip install -q "diffusers==0.32.2"
```

```python
from diffusers import AutoPipelineForText2Image
from IPython.display import display

imagenes = AutoPipelineForText2Image.from_pretrained(
    "stabilityai/sdxl-turbo",
    torch_dtype=torch.float16,
    variant="fp16",
).to("cuda")

imagen = imagenes(
    prompt="A classroom learning artificial intelligence, pop art",
    num_inference_steps=4,
    guidance_scale=0.0,
).images[0]
display(imagen)
```

`torch_dtype` fija la precisión de cálculo y carga; `variant="fp16"` selecciona los archivos de pesos de esa variante. `.images[0]` obtiene una imagen PIL. Los pasos de difusión refinan una representación de la imagen: no son tokens de texto. Estos valores corresponden a **SDXL Turbo**; no se trasladan sin más a otro modelo. [Configuración de SDXL Turbo](https://huggingface.co/stabilityai/sdxl-turbo).

SDXL con un refinador encadena dos modelos, mientras que FLUX muestra otra familia con mayores necesidades de memoria en la configuración del curso. Comparar esas imágenes sirve para observar el compromiso entre resultado, tiempo y hardware; no añade una forma nueva de programar cada aplicación.

SpeechT5 recibe texto y un `speaker_embedding`, un vector que condiciona la voz. El dataset de voces proporciona ese vector; no está entrenando el modelo. La salida contiene `audio` y `sampling_rate`, que se pasan a `Audio(...)` para reproducirla. Generar voz convierte texto en sonido; transcribir hará el recorrido inverso en el proyecto final.

Libera el pipeline de imágenes antes de cargar el LLM:

```python
import gc

del imagenes
gc.collect()
torch.cuda.empty_cache()
```

## Tokenizadores

El modelo de texto recibe números. El tokenizador convierte texto en identificadores de su vocabulario y permite reconstruir texto a partir de ellos. Descargar un tokenizador no descarga los miles de millones de pesos del modelo; esta parte puede ejecutarse en CPU.

```python
from transformers import AutoTokenizer

ID_MODELO = "Qwen/Qwen3-4B-Instruct-2507"
tokenizer = AutoTokenizer.from_pretrained(ID_MODELO)

texto = "Una reunión sobre modelos de lenguaje."
ids = tokenizer.encode(texto, add_special_tokens=False)

print(ids)
print(tokenizer.convert_ids_to_tokens(ids))
print(tokenizer.decode(ids))
print("Tokens:", len(ids))
```

`ids` es una lista de enteros. `convert_ids_to_tokens()` muestra sus piezas internas —pueden incluir marcas de espacios— y `decode()` reconstruye el texto. Un token puede abarcar una palabra, parte de ella o puntuación; contar palabras no permite conocer exactamente el número de tokens.

`ID_MODELO` se reutiliza para cargar los pesos y generar las actas. [Qwen3-4B-Instruct-2507](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507) es uno de los modelos comparados en el curso y admite instrucciones de chat.

`tokenizer.get_added_vocab()` permite inspeccionar tokens añadidos, incluidos marcadores especiales. `len(tokenizer)` da el tamaño del vocabulario completo, no la longitud del texto que acabas de codificar.

Al comparar Llama, Phi, DeepSeek y Qwen cambian las divisiones y los identificadores. **Los IDs solo tienen sentido con el vocabulario del modelo que los espera**: cambiar de modelo exige cargar también su tokenizador. La comparación enseña además por qué el mismo texto puede consumir distinto contexto según el modelo.

## Plantillas de chat

Una lista de diccionarios con `role` y `content` es la interfaz de la aplicación. Para que un modelo de chat la procese, hay que convertirla al formato de conversación con el que fue entrenado y después a IDs.

```python
mensajes = [
    {"role": "system", "content": "Responde en español y de forma breve."},
    {"role": "user", "content": "¿Qué diferencia hay entre entrenar e inferir?"},
]

prompt = tokenizer.apply_chat_template(
    mensajes,
    tokenize=False,
    add_generation_prompt=True,
)
print(prompt)
```

`prompt` es un `str` con el contenido y los marcadores de roles y fin de mensaje propios de Qwen. `add_generation_prompt=True` añade el inicio del turno del asistente cuando la plantilla lo requiere; así el modelo responde en ese turno en vez de continuar el texto del usuario.

Para generar, utilizaremos `tokenize=True` y `return_tensors="pt"`: el resultado contendrá tensores de PyTorch. `return_dict=True` permite obtener tanto `input_ids` como `attention_mask`, que indica qué posiciones son contenido y cuáles son relleno.

La cadena completa es **mensajes → plantilla del modelo → IDs → modelo → nuevos IDs → texto**. Un servicio de chat resuelve esos pasos internamente; al ejecutar los pesos directamente, tú preparas la entrada. Las variantes `Instruct` están ajustadas para seguir instrucciones, pero cada una conserva su formato y sus capacidades.

Usar directamente `apply_chat_template(..., tokenize=True)` evita añadir dos veces los tokens especiales. Si formateas primero como texto y luego lo tokenizas por separado, utiliza `add_special_tokens=False` en ese segundo paso. [Plantillas de chat](https://huggingface.co/docs/transformers/v4.57.1/en/chat_templating).

## Modelos y cuantización

Los pesos también ocupan memoria: 4.000 millones de parámetros a 16 bits equivalen aproximadamente a 8 GB solo en pesos. A 4 bits, la cuenta ideal baja a 2 GB. La memoria real es mayor por los módulos que conservan otra precisión, los datos auxiliares y los cálculos de inferencia.

**Cuantizar** representa muchos pesos con menos bits. Permite cargar modelos con menos memoria, a cambio de una aproximación numérica que puede afectar a la calidad; no reduce la cantidad de parámetros ni entrena un modelo nuevo.

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig

cuantizacion = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.float16,
)

def cargar_modelo(id_modelo):
    tokenizador = AutoTokenizer.from_pretrained(id_modelo)
    modelo = AutoModelForCausalLM.from_pretrained(
        id_modelo,
        quantization_config=cuantizacion,
        dtype=torch.float16,
        device_map="auto",
    )
    modelo.eval()
    return tokenizador, modelo

tokenizer, modelo = cargar_modelo(ID_MODELO)
print("Memoria del modelo en GB:", modelo.get_memory_footprint() / 1e9)
```

`AutoModelForCausalLM` selecciona la arquitectura de un modelo que predice la continuación de texto. `from_pretrained()` carga sus pesos; `device_map="auto"` organiza su ubicación según la memoria disponible, con ayuda de Accelerate. Para este ejemplo se espera que el modelo cuantizado quepa en la GPU.

`nf4` es el formato de cuantización; la doble cuantización comprime también sus constantes auxiliares. Los pesos almacenados a 4 bits se utilizan en cálculos de mayor precisión: `bnb_4bit_compute_dtype` controla esa precisión. Aquí se usa `float16`, adecuado para la T4. [Cuantización con bitsandbytes](https://huggingface.co/docs/transformers/v4.57.1/en/quantization/bitsandbytes).

Inspeccionar `modelo` muestra una red de PyTorch: un _embedding_ convierte cada ID en un vector; las capas de atención, MLP y normalización lo transforman usando el contexto; la cabeza de lenguaje produce puntuaciones, llamadas _logits_, para los posibles siguientes tokens. Esa estructura explica qué ejecuta el objeto, sin necesitar implementar el transformer desde cero.

## Generación y streaming

Esta función reutiliza `modelo` y `tokenizer` cargados arriba. Recibe mensajes y devuelve únicamente el texto nuevo:

```python
from transformers import TextStreamer

def generar(mensajes, max_new_tokens=180, streaming=False):
    entradas = tokenizer.apply_chat_template(
        mensajes,
        tokenize=True,
        add_generation_prompt=True,
        return_dict=True,
        return_tensors="pt",
    ).to(modelo.device)

    streamer = TextStreamer(
        tokenizer, skip_prompt=True, skip_special_tokens=True
    ) if streaming else None

    with torch.inference_mode():
        salida = modelo.generate(
            **entradas,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
            streamer=streamer,
        )

    longitud_entrada = entradas["input_ids"].shape[-1]
    nuevos_ids = salida[0, longitud_entrada:]
    return tokenizer.decode(nuevos_ids, skip_special_tokens=True)

respuesta = generar(mensajes)
print(respuesta)
```

`entradas` contiene tensores con una fila por conversación; aquí hay una sola. `.to(modelo.device)` coloca esos datos donde empieza el modelo. `**entradas` pasa sus claves como argumentos de `generate()`. `torch.inference_mode()` evita preparar el seguimiento de gradientes, que aquí no se necesita.

En estos modelos causales, `salida[0]` contiene **la entrada y su continuación**. El corte desde `longitud_entrada` evita mostrar otra vez los mensajes originales. `skip_special_tokens=True` elimina marcadores de control, pero por sí solo no elimina el prompt.

### Elegir el siguiente token

El modelo calcula puntuaciones para el siguiente token; una distribución de probabilidad se obtiene a partir de ellas. Se elige un token, se incorpora al contexto y se repite el proceso hasta terminar. `generate()` organiza ese bucle.

- `max_new_tokens` limita los tokens añadidos; no incluye los de entrada ni obliga a generar esa cantidad.
- `do_sample=False`, con una sola secuencia y sin búsqueda por haces, elige el token más probable en cada paso.
- `do_sample=True` permite muestrear. En ese modo, `temperature` modifica cuánto se concentran las probabilidades y `top_p` limita los candidatos por probabilidad acumulada.

Para experimentar con muestreo, sustituye `do_sample=False` por `do_sample=True, temperature=0.7, top_p=0.9` en la llamada. Aumentar la variedad no aumenta necesariamente la exactitud. [Estrategias de generación](https://huggingface.co/docs/transformers/v4.57.1/en/generation_strategies).

El gráfico de `week3/visualizer.py` muestra el token elegido y algunas alternativas en cada paso. Cada probabilidad está condicionada por el contexto ya generado; no mide la veracidad de la frase. Las alternativas dibujadas no son conversaciones completas que se hayan desarrollado en paralelo. `logprobs` expresa logaritmos de probabilidades y `exp(logprob)` recupera la probabilidad.

### Mostrar mientras se genera

```python
respuesta = generar(mensajes, streaming=True)
```

`TextStreamer` va imprimiendo texto legible mientras `generate()` trabaja. La función sigue esperando a que termine para devolver `respuesta`: el streamer no la convierte en un generador Python ni en una llamada asíncrona. Para consumir fragmentos desde una interfaz se puede usar `TextIteratorStreamer` junto con la generación en otro hilo, como ampliación del mismo flujo.

## Cambio de modelo y memoria

Comparar Llama, Phi, Gemma y Qwen repite el mismo proceso con otros pesos y tokenizadores. Mantener las mismas preguntas permite observar calidad, seguimiento de instrucciones, velocidad y memoria. Un modelo de razonamiento como DeepSeek-R1-Distill puede producir una salida más larga; un límite muy pequeño puede cortarla antes de la respuesta final.

`cargar_modelo()` carga una vez y `generar()` reutiliza esa carga. Volver a descargar o construir el modelo en cada mensaje sería innecesario. Para cambiarlo, libera primero el anterior y carga **el nuevo modelo y su tokenizador juntos**.

Al terminar esta prueba, ejecuta lo siguiente antes de pasar al audio:

```python
import gc

del modelo
gc.collect()
torch.cuda.empty_cache()
```

`del` elimina esa referencia; `gc.collect()` recoge objetos que ya no se usan; `empty_cache()` devuelve bloques libres de la caché de PyTorch. Ninguna de estas operaciones libera un modelo que siga referenciado desde otro objeto. Para volver a usar `generar()`, primero habrá que cargar de nuevo `modelo`.

`get_memory_footprint()` estima la memoria del modelo, no el pico completo de inferencia. El contexto y la caché de atención —KV cache— también consumen memoria y crecen al generar. Ante un error de memoria, libera modelos anteriores, reduce la entrada o la salida, o utiliza un modelo menor. Si CUDA no está disponible, comprueba primero qué entorno tiene Colab antes de cambiar paquetes.

## Actas a partir de audio

El proyecto encadena dos tareas: **audio → transcripción → acta**. El transcriptor convierte sonido en texto; el LLM recibe ese texto y redacta el documento. Como la frontera entre ambos es un `str`, puedes cambiar la transcripción local por una API sin reescribir la parte del acta.

Este apartado reutiliza `cargar_modelo()`, `generar()` e `ID_MODELO`. Parte de la GPU liberada en el apartado anterior: primero se transcribe y después se carga el modelo de texto.

### Archivo en Drive

Guarda una grabación breve en español como `llms/reunion.mp3` dentro de tu Drive. Montarlo permite acceder a ella desde el sistema de archivos de Colab:

```python
from pathlib import Path
from google.colab import drive

drive.mount("/content/drive")
audio = Path("/content/drive/MyDrive/llms/reunion.mp3")
if not audio.is_file():
    raise FileNotFoundError(f"No se encuentra la grabación: {audio}")
```

### Transcripción local

```python
transcriptor = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-small",
    dtype=torch.float16,
    device="cuda",
)

resultado = transcriptor(
    str(audio),
    return_timestamps=True,
    generate_kwargs={"language": "spanish", "task": "transcribe"},
)
transcripcion = resultado["text"]
print(transcripcion)
audio.with_suffix(".txt").write_text(transcripcion, encoding="utf-8")

del transcriptor
gc.collect()
torch.cuda.empty_cache()
```

Aquí Whisper se descarga del Hub y se ejecuta en Colab; el prefijo `openai/` identifica al autor del repositorio y no implica una llamada a la API de OpenAI. `whisper-small` es multilingüe; las variantes terminadas en `.en` se destinan al inglés. Cambia `language` si la grabación está en otro idioma. [Modelo Whisper](https://huggingface.co/openai/whisper-small).

`return_timestamps=True` permite trabajar con marcas temporales, también necesarias en el modo de audio largo de Whisper; `resultado["text"]` conserva la transcripción completa como texto. Las marcas temporales no identifican por sí solas a los hablantes. Leer un MP3 requiere FFmpeg, que está disponible habitualmente en Colab.

### Alternativa mediante API

Para sustituir el bloque local, instala `openai` y añade `OPENAI_API_KEY` a los secretos. Esta opción envía el audio a OpenAI y consume la API:

```python
%pip install -q openai
```

```python
from openai import OpenAI
from google.colab import userdata

cliente = OpenAI(api_key=userdata.get("OPENAI_API_KEY"))
with audio.open("rb") as archivo:
    resultado_api = cliente.audio.transcriptions.create(
        model="gpt-4o-mini-transcribe",
        file=archivo,
        response_format="json",
    )
transcripcion = resultado_api.text
```

El SDK convierte la respuesta JSON en un objeto con `.text`. El siguiente paso utiliza esa cadena, igual que con Whisper local. Ejecuta una de las dos alternativas; si pruebas ambas, la última asignación decide qué transcripción se resume.

### Generar y guardar el acta

```python
from IPython.display import Markdown, display

tokenizer, modelo = cargar_modelo(ID_MODELO)
mensajes_acta = [
    {
        "role": "system",
        "content": (
            "Redacta actas en español usando solo la transcripción. "
            "Incluye resumen, decisiones y tareas con responsable y plazo. "
            "Si un dato no aparece, indica 'No consta'. "
            "Devuelve Markdown sin envolverlo en un bloque de código."
        ),
    },
    {"role": "user", "content": f"Transcripción de la reunión:\n\n{transcripcion}"},
]

acta = generar(mensajes_acta, max_new_tokens=900)
display(Markdown(acta))
destino = audio.with_name("acta.md")
destino.write_text(acta, encoding="utf-8")
print("Guardado en:", destino)
```

El acta queda en Drive junto al audio. La separación en dos pasos permite revisar nombres, cifras y acuerdos en la transcripción antes de resumir; una redacción fluida no corrige una transcripción errónea. Pedir responsables y plazos no hace que existan: deben constar en la grabación.

Una grabación larga puede producir más texto del que cabe en el contexto o en la memoria disponible. En ese caso se transcribe y resume por fragmentos y después se consolidan los resúmenes, conservando decisiones y tareas. Recortar silenciosamente la transcripción perdería parte de la reunión.

Los ejemplos desarrollan los materiales de [Colab y GPU](https://colab.research.google.com/drive/1DjcrYDZldAXKJ08x1uYIVCtItoLPk1Wr), [pipelines](https://colab.research.google.com/drive/1aMaEw8A56xs0bRM4lu8z7ou18jqyybGm), [tokenizadores](https://colab.research.google.com/drive/1WD6Y2N7ctQi1X9wa6rpkg8UfyA4iSVuz), [modelos](https://colab.research.google.com/drive/1hhR9Z-yiqjUe7pJjVQw4c74z_V3VchLy) y [actas](https://colab.research.google.com/drive/1KSMxOCprsl1QRpt_Rq0UqCAyMtPqDQYx) de Week 3.
