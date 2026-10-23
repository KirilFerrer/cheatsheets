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
lectura continua e índice del artículo a la derecha. La revisión posterior del usuario
conserva esa estética y recupera una portada más visual: categorías separadas y tarjetas
de color con iconos y subtemas visibles. La selección de temas pertenece a la portada;
no hay un menú general lateral, tampoco en móvil. El logotipo y las migas llevan al inicio.
Mantiene las funcionalidades de consulta y los temas claro y oscuro, sin portada comercial
ni animación ambiental.

Se ofrecen diez guías en seis temas. Custom contiene Asincronía y Sistemas agénticos,
con enlaces directos. Docker, Django, Redis y LLM Engineering conservan sus cuatro
menús de temas. `study_catalogue()` en `themes/coo/scripts/study-catalogue.js` es el
propietario común del catálogo, los diálogos y el índice Custom. Custom deriva de los
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
Las tarjetas de temas comparten `--topic-start`, `--topic-end` y `--topic-text` en
`learning.css`. El degradado corto identifica la tecnología; el texto blanco tiene
contraste en ambos extremos. La misma tarjeta se usa en portada, Custom y submenús.

| Tema            | Inicio    | Final     |
| --------------- | --------- | --------- |
| Docker          | `#175fc5` | `#16499d` |
| Django          | `#08785e` | `#075c49` |
| Redis           | `#c43747` | `#962c44` |
| LLM Engineering | `#713bbc` | `#50319b` |
| Custom          | `#0b7b80` | `#0b5965` |

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

Cabecera sticky de 64 px reservados. Documento como propietario del scroll vertical;
el índice del artículo tiene scroll acotado. Contenido centrado de hasta 1180 px con
padding de 44 px. Índice derecho de 190 px separado por 40 px. A 1200 px el índice
se convierte en un disclosure antes del artículo. Funciona sin JavaScript; la mejora
responsive lo cierra en móvil. Ningún espacio queda reservado a un menú general.

La portada tiene un máximo de 1120 px y dos columnas de categorías, con Custom ocupando
la fila completa. Los encabezados y separadores distinguen categorías; los iconos,
colores y nombres identifican las tarjetas. Los subtemas aparecen dentro de la tarjeta
y un chevrón hacia abajo indica que abre un menú; una flecha lateral indica un enlace.
A 760 px se usa una columna, incluidas las tarjetas Custom. Cada tema
Custom abre directamente su guía. Las rutas anteriores siguen funcionando, incluidos
`/django.html`, `/docker.html`, `/redis.html` y las tres semanas de LLM Engineering.
La nueva guía usa `/sistemas-agenticos.html` y aparece en `/custom/` y en búsqueda.

Los artículos usan secciones separadas por espacio y una línea; el nombre de clase
histórico `learning-page-cards` se conserva por compatibilidad, sin encerrar cada
sección en otra tarjeta. Código y tablas admiten desplazamiento horizontal por
teclado sin desbordar el documento. La impresión oculta navegación y controles.

## Elevation & Depth

Superficies planas y bordes discretos en la lectura. La elevación se reserva para
búsqueda, menús, mensajes de copia y feedback de hover/foco en tarjetas de temas.
Los degradados se limitan a esas tarjetas; no hay blur ni fondos decorativos en las guías.

## Shapes

Radios de 5–6 px para controles y bloques, 8 px para diálogos y 9 px para tarjetas de temas. Iconos existentes del
repositorio y una marca tipográfica pequeña. El estado activo combina texto, fondo
y borde; el foco tiene un outline separado del control.

## Components

| Capacidad           | Propietario                                    | Comportamiento verificable                                               |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| Catálogo            | `study_catalogue` y `index.ejs`                | Categorías y tarjetas comunes con menús o enlaces directos               |
| Menús de tecnología | `learning.js` / `dialog` nativo                | Sin cruz; cierre por Escape o clic exterior, foco contenido y restaurado |
| Índice del artículo | `learning.ejs` / `learning.js`                 | Solo H2; un enlace activo; scroll pasivo sin cambiar foco ni URL         |
| Búsqueda            | `main.js` / partial `search` / `dialog` nativo | Fuse local, tildes, previsualización, teclado, carga, error y reintento  |
| Tema                | `head.ejs` / `main.js`                         | Preferencia local; fallback al sistema; sin fallo si se bloquea storage  |
| Copiar código       | `learning.js`                                  | Botón visible, feedback accesible y selección manual ante error          |
| Compartir           | `main.js` / `header.ejs`                       | Redes, correo y copia de enlace; cierre por Escape y retorno de foco     |
| Scrollbar           | `learning.css`                                 | Tokens globales, estándares y fallback WebKit; contraste forzado nativo  |

La búsqueda conserva `q` en la URL con codificación y mantiene el fragmento del
artículo. Usa replaceState para evitar una entrada por pulsación. Borrar devuelve
foco al campo, invalida resultados anteriores y muestra el catálogo. Las entradas
IME se procesan al terminar la composición. Un error de carga ofrece reintentar.
Los resultados de red antiguos no sustituyen la consulta más reciente.

El índice usa anchors enlazables y enfoca el encabezado al activarlos. El scroll
manual actualiza el enlace activo sin crear historial. La búsqueda y los cuatro
menús son modales nativos; el índice es un disclosure. El clic en el contenido del
submenú no lo cierra. Volver a la portada con Atrás limpia los diálogos y libera el scroll.
Sin cuentas, edición de datos, pagos ni acciones externas automáticas.

## Do's and Don'ts

La revisión editorial del usuario elimina rótulos como «En esta página», «Qué
aprenderás», cejas «Custom · Apuntes», subtítulos decorativos y comentarios sobre
la procedencia en el cuerpo de las guías. Los títulos nombran contenido concreto.
El índice conserva un botón con icono y nombre accesible; en móvil, «Índice» identifica
el control plegable. Las guías Base muestran el nombre de la tecnología como H1.

- Explicar conceptos antes de utilizarlos, con variables y resultados identificables.
- Conservar búsqueda, compartir, copia, temas, navegación y todas las rutas existentes.
- Elegir temas desde la portada; no volver a añadir una biblioteca lateral redundante.
- Mantener los submenús sin botón de cierre; clic fuera y Escape los cierran y devuelven el foco.
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

| Regla anterior                         | Decisión del usuario                            | Implementación                                                          |
| -------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| Hero morado y decoración animada       | Usar el diseño limpio del proyecto actual       | Cabecera compacta y catálogo de consulta                                |
| Cada sección en una tarjeta            | Priorizar lectura cómoda                        | Artículo continuo, medida limitada y separadores                        |
| Biblioteca general a la izquierda      | El usuario la considera redundante              | Se elimina del layout, CSS, JavaScript y móvil; selección desde portada |
| Catálogo en filas con tarjetas neutras | Recuperar el formato visual y colorido anterior | Categorías en dos columnas y tarjetas de tecnología con color           |
| Cruz de cierre en submenús             | Cerrar solo con clic exterior o Escape          | Se elimina el botón; se mantienen foco, Escape y backdrop               |
| Dos temas y controles de consulta      | Mantener claro y oscuro y las funcionalidades   | Tokens semánticos y mismos controles en todas las guías                 |

El auditor estático se limita al tema mantenido; no interpreta EJS ni prueba acciones
en HTML generado. `test:build` inspecciona ese HTML y `test:ui` comprueba sus controles,
rutas, estados y accesibilidad en navegador. Los widgets heredados ajenos al catálogo
no forman parte de esta adaptación.
