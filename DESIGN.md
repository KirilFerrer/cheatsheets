---
version: alpha
name: Sheet Codes
description: Un cuaderno de programación con lectura continua y navegación de consulta.
colors:
  primary: '#2859ce'
  ink: '#202936'
  muted: '#596777'
  background: '#f5f7fa'
  surface: '#ffffff'
  border: '#dce2e9'
  custom: '#0f766e'
  darkSurface: '#151d2a'
  darkBackground: '#101722'
  darkText: '#e2e8f0'
typography:
  sans:
    fontFamily: 'IBM Plex Sans, system-ui, sans-serif'
  mono:
    fontFamily: 'IBM Plex Mono, ui-monospace, monospace'
rounded:
  DEFAULT: '6px'
  control: '5px'
omitted:
  - section: spacing
    reason: La geometría responsive se mantiene en el CSS canónico.
---

# Sheet Codes

## Overview

Biblioteca de apuntes técnicos en español. La revisión del 23/10/2026 adopta,
por petición del usuario, la UI y UX del proyecto local `plataformas-agenticas`:
navegación lateral estable, lectura continua y un índice del artículo a la derecha.
Mantiene las funcionalidades de consulta de Sheet Codes y sus temas claro y oscuro.
La firma es la organización de un cuaderno de programación: tema a la izquierda,
explicación en el centro, apartados a la derecha. Sin portada comercial ni animación ambiental.

Se ofrecen diez guías en seis temas. Custom contiene Asincronía y Sistemas agénticos,
con enlaces directos. Docker, Django, Redis y LLM Engineering conservan sus cuatro
menús de temas. `study_catalogue()` en `themes/coo/scripts/study-catalogue.js` es el
propietario común del catálogo, los diálogos y la navegación. Custom deriva de los
posts de esa categoría, ordenados por título en español.

## Colors

Modelo B: `themes/coo/source/css/learning.css` es la fuente canónica de tokens.
Este documento refleja los valores y su intención. No hay una paleta paralela en JS.

| Token de diseño      | Variable CSS                             | Consumidores               |
| -------------------- | ---------------------------------------- | -------------------------- |
| primary              | `--learn-accent`                         | Enlaces, selección, iconos |
| ink / muted          | `--learn-text` / `--learn-muted`         | Lectura y metadatos        |
| surface / background | `--learn-surface` / `--study-background` | Artículo y navegación      |
| border               | `--learn-line`                           | Separadores y controles    |
| sans / mono          | `--study-sans` / `--study-mono`          | Texto y código             |

El azul global del tema claro es `#2859ce`; en oscuro, `#7dd3fc`. Superficies oscuras
`#151d2a` y `#101722`, texto `#e2e8f0`, texto secundario `#a8b9ce` y bordes `#344257`.
Las variantes por tema conservan su semántica en ambos modos:

| Tema            | Acento / fondo suave / focus claro | Acento / fondo suave / focus oscuro |
| --------------- | ---------------------------------- | ----------------------------------- |
| Django          | `#047857` / `#d1fae5` / `#059669`  | `#6ee7b7` / `#123a30` / `#34d399`   |
| Redis           | `#b91c1c` / `#fee2e2` / `#dc2626`  | `#fca5a5` / `#431c24` / `#f87171`   |
| LLM Engineering | `#6d28d9` / `#ede9fe` / `#7c3aed`  | `#c4b5fd` / `#2e2049` / `#a78bfa`   |
| Custom          | `#0f766e` / `#ccfbf1` / `#0d9488`  | `#5eead4` / `#123a39` / `#2dd4bf`   |

Docker utiliza el azul global. El color acompaña a nombres y estados accesibles.
El tema se inicializa antes de pintar usando `localStorage.theme` o la preferencia
del sistema. Un fallo de almacenamiento permite cambiarlo durante la visita.
Los colores forzados y la preferencia de movimiento reducido tienen prioridad.

## Typography

IBM Plex Sans local, pesos 400, 500, 600 y 700; IBM Plex Mono 400 para código.
Se incluyen las licencias OFL en `source/assets/fonts`. No hay peticiones a servicios
de fuentes. Títulos de artículo de 30–38 px, H2 de 23–25 px, lectura de 17 px con
interlínea 1.85 (16 px en móvil). Navegación de 12–13 px y metadatos de 11 px.
La explicación utiliza una columna de hasta 720 px. Los párrafos y ejemplos
llevan el desarrollo; las listas sirven para pasos o comparaciones concretas.

## Layout

Cabecera sticky de 64 px reservados. Navegación de biblioteca de 244 px (224 px en
portátil). Documento como propietario del scroll vertical; sidebar e índice con
scroll acotado. Contenido de hasta 1180 px con padding de 44 px. Índice derecho
de 190 px separado por 40 px. A 1200 px el índice se convierte en un disclosure
antes del artículo. A 760 px también se pliega la biblioteca en el flujo.
Ambos disclosures funcionan sin JavaScript; la mejora responsive los cierra en móvil.

El catálogo conserva sus categorías y menús en un espacio más compacto. Cada tema
Custom abre directamente su guía. Las rutas anteriores siguen funcionando, incluidos
`/django.html`, `/docker.html`, `/redis.html` y las tres semanas de LLM Engineering.
La nueva guía usa `/sistemas-agenticos.html` y aparece en `/custom/` y en búsqueda.

Los artículos usan secciones separadas por espacio y una línea; el nombre de clase
histórico `learning-page-cards` se conserva por compatibilidad, sin encerrar cada
sección en otra tarjeta. Código y tablas admiten desplazamiento horizontal por
teclado sin desbordar el documento. La impresión oculta navegación y controles.

## Elevation & Depth

Superficies planas, bordes discretos. La elevación se reserva para búsqueda, menús
y mensajes de copia. Sin blur ni gradientes decorativos en la interfaz compartida.

## Shapes

Radios de 5–6 px para controles y bloques, 8 px para diálogos. Iconos existentes del
repositorio y una marca tipográfica pequeña. El estado activo combina texto, fondo
y borde; el foco tiene un outline separado del control.

## Components

| Capacidad             | Propietario                                    | Comportamiento verificable                                              |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| Catálogo y biblioteca | `study_catalogue` y partial `study-nav`        | Una lista común; enlace activo por ruta                                 |
| Menús de tecnología   | `learning.js` / `dialog` nativo                | Apertura, cerrar, Escape, backdrop y retorno de foco                    |
| Índice del artículo   | `learning.ejs` / `learning.js`                 | Solo H2; un enlace activo; scroll pasivo sin cambiar foco ni URL        |
| Búsqueda              | `main.js` / partial `search` / `dialog` nativo | Fuse local, tildes, previsualización, teclado, carga, error y reintento |
| Tema                  | `head.ejs` / `main.js`                         | Preferencia local; fallback al sistema; sin fallo si se bloquea storage |
| Copiar código         | `learning.js`                                  | Botón visible, feedback accesible y selección manual ante error         |
| Compartir             | `main.js` / `header.ejs`                       | Redes, correo y copia de enlace; cierre por Escape y retorno de foco    |
| Scrollbar             | `learning.css`                                 | Tokens globales, estándares y fallback WebKit; contraste forzado nativo |

La búsqueda conserva `q` en la URL con codificación y mantiene el fragmento del
artículo. Usa replaceState para evitar una entrada por pulsación. Borrar devuelve
foco al campo, invalida resultados anteriores y muestra el catálogo. Las entradas
IME se procesan al terminar la composición. Un error de carga ofrece reintentar.
Los resultados de red antiguos no sustituyen la consulta más reciente.

El índice usa anchors enlazables y enfoca el encabezado al activarlos. El scroll
manual actualiza el enlace activo sin crear historial. La búsqueda y los cuatro
menús son modales nativos; biblioteca e índice son disclosures, no overlays.
Sin cuentas, edición de datos, pagos ni acciones externas automáticas.

## Do's and Don'ts

La revisión editorial del usuario elimina rótulos como «En esta página», «Qué
aprenderás», cejas «Custom · Apuntes», subtítulos decorativos y comentarios sobre
la procedencia en el cuerpo de las guías. Los títulos nombran contenido concreto.
El índice conserva un botón con icono y nombre accesible; en móvil, «Índice» identifica
el control plegable. Las guías Base muestran el nombre de la tecnología como H1.

- Explicar conceptos antes de utilizarlos, con variables y resultados identificables.
- Conservar búsqueda, compartir, copia, temas, navegación y todas las rutas existentes.
- Mantener las guías Base compactas e independientes; Dockerfile y Compose amplían Docker.
- Fundamentar las tres semanas de LLM Engineering en sus notebooks y versiones del curso.
- Mantener Asincronía como material explicativo con fragmentos breves, sin programas completos,
  ejercicios, runtimes descargables ni laboratorios.
- Sistemas agénticos resume las 18 lecciones del proyecto de origen; conserva el caso CSV y
  distingue pseudocódigo, patrones generales y casos publicados. La procedencia se registra
  en `docs/sistemas-agenticos-source.json`.
- Verificar escritorio y móvil en ambos temas, teclado, contraste, lectura, menús, búsqueda,
  portapapeles, almacenamiento bloqueado y recuperación de errores.

## Reconciliación del diseño

| Regla anterior                            | Decisión del usuario                          | Implementación                                          |
| ----------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| Hero morado y decoración animada          | Usar el diseño limpio del proyecto actual     | Cabecera compacta y catálogo de consulta                |
| Cada sección en una tarjeta               | Priorizar lectura cómoda                      | Artículo continuo, medida limitada y separadores        |
| Índice izquierdo y cabecera que se oculta | Adoptar la navegación del proyecto actual     | Biblioteca izquierda, índice derecho y cabecera estable |
| Dos temas y controles de consulta         | Mantener claro y oscuro y las funcionalidades | Tokens semánticos y mismos controles en todas las guías |

El auditor estático se limita al tema mantenido; no interpreta EJS ni prueba acciones
en HTML generado. `test:build` inspecciona ese HTML y `test:ui` comprueba sus controles,
rutas, estados y accesibilidad en navegador. Los widgets heredados ajenos al catálogo
no forman parte de esta adaptación.
