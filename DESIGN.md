# Sheet Codes

The visual baseline is the deployed site at https://app.sheet-codes.workers.dev,
recovered on 18 September 2026. Keep its catalogue with five cards:
Django, Docker, Redis, LLM Engineering and Asincronía. Django and Redis each expose `Base`. Docker exposes
`Base`, `Dockerfile` and `Docker Compose`, in that order, with the latter two as
focused follow-up guides. LLM Engineering exposes `Week 1`, `Week 2` and `Week 3`, in that
order, through the same horizontal topic panel. All catalogue cards occupy one
grid column and share the same dimensions at each viewport width. Each week has its own page and index
at `/llm-week-1.html`, `/llm-week-2.html` and `/llm-week-3.html`. The catalogue and search expose nine guides in five topics.
Custom is the homepage section for specific programming topics. Its first card,
`Asincronía`, links directly to `/python-asincronia.html`. Do not add an intermediate
Custom card or menu, or group it under a heading named Conceptos. The section's
cards and its collection index at `/custom/` derive from posts in the `Custom`
category so later topics do not require a second hand-maintained list.
The other four catalogue cards retain their existing topic dialogs.
Single-option panels use a compact 320px preferred width; panels with more
options size to their cards within viewport bounds.
Hide empty catalogue categories so every visible group contains a guide.

Preserve the purple home hero, centered catalogue, floating navigation, light and
dark themes, readable article column and collapsible table of contents. All
guides use the same sequential section cards. Guide accents match their catalogue
cards: Django green, Docker blue, Redis red and LLM Engineering purple, in light and dark themes. Inline
code, links, active index entries and focus indicators share each guide's accent.
The runtime owner is `themes/coo/source/css/learning.css`: `--learn-accent`,
`--learn-tint` and `--learn-focus` define text, tinted backgrounds and focus rings.
Django uses light values `#047857`, `#d1fae5`, `#059669` and dark values `#6ee7b7`,
`#123a30`, `#34d399`, respectively. Docker inherits the blue defaults; Redis keeps
its existing red overrides. LLM Engineering uses light values `#6d28d9`, `#ede9fe`
and `#7c3aed`, and dark values `#c4b5fd`, `#2e2049` and `#a78bfa`, respectively,
through `.learning-llm` in the same runtime stylesheet. Catalogue cards use
the existing Tailwind gradient pattern with violet-700 and purple-900.

Custom follows the same token ownership model: runtime CSS is canonical and this
document records its accepted values (Model B). `.learning-custom` maps accent,
tint and focus to `#0f766e`, `#ccfbf1`, `#0d9488` in light mode and `#5eead4`,
`#123a39`, `#2dd4bf` in dark mode. Its catalogue cards use teal-700 to cyan-900.
Asincronía is explanatory study material in the shared reading layout. Develop
each concept in prose and use short code fragments only to clarify a specific
operation or execution relationship. Explain the names and context each fragment
relies on. Do not include complete programs, file-creation or execution walkthroughs,
exercises, laboratories, in-page execution panels, runtime downloads or charts.
Keep normal code copying and the reading index. The reader practices independently;
the guide does not prescribe activities.

Catalogue panels and card hover effects animate only opacity and transforms.
Use a dimmed backdrop without blur and pause the home decorations while a topic
panel is open, so the background does not compete with the active interaction.
Panels close on a backdrop click or Escape; keyboard focus cycles between the
topic links and returns to the opening card when the panel closes.

The reading index lists only the main section headings (H2) in every guide;
subheadings remain in the article. It tracks the section at the top of the visible article during
scrolling, anchor navigation and restored page positions. Account for the floating
header, keep one current link, and reveal that link within a long desktop index.
Passive scrolling must not change keyboard focus or the URL/history.

Keep the main routes `/django.html`, `/docker.html` and `/redis.html`. Each Base
is an independent, compact guide for readers who know basic Python and terminal
usage but are new to that technology. Aim for 15–20 minutes of reading, covering
fundamentals and a working implementation in a coherent sequence.

Introduce concepts before using them. Explain each new library object, method
and relevant parameter, where variables originate, which file or terminal is
used, and what result to expect. Use related, fully explained examples and a
formal public-course voice. Exclude exercises, downloadable laboratories,
personal references and advanced topic catalogues. Docker's additional guides
develop image construction and Compose configuration without expanding Base into
a reference manual. Further subtopics can be added when requested; do not publish
empty placeholders or separate glossaries.

The LLM Engineering weeks stay grounded in the course notebooks. All weeks use
plain subject headings, short explanations, working code and concrete results.
Cover JSON, Python data structures, API calls, history, streaming and scraping.
Use the existing reading index for navigation. Tables are limited to explicitly
requested compact comparisons, such as Week 2's client/library selection.
Do not add quick-reference introductions, commentary about the reader's request
or promotional headings.
Keep explanations tied to implementation and identify shared variables.
Week 2 covers model clients, usage, caching, Gradio 5, generators, chat history,
tool calls, SQLite, images, audio and Blocks events. Match the course's installed
API and Gradio versions, and explain the input/output contracts with runnable code.
Week 3 follows the five linked Colab notebooks: hosted GPU execution, the Hub,
pipelines, image and speech demonstrations, tokenizers, chat templates, model
loading, quantization, generation, memory and audio-to-minutes composition.
Keep repeated demonstrations brief. Explain where inference runs and connect
messages, tensors and decoded output. Use Transformers 4.57.6 as in the course,
with explicit shared state and sequential GPU model loading.

Verify the four catalogue dialogs and direct Custom topic links, keyboard navigation, search, theme switching,
code copying, local anchors and mobile overflow whenever the reading shell changes.
