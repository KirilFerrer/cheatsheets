(() => {
  const panels = [...document.querySelectorAll('[data-python-demo]')];
  if (!panels.length) return;

  const range = (name, label, value, min, max, step, unit = '') => ({
    name,
    label,
    value,
    min,
    max,
    step,
    unit,
    type: 'range'
  });
  const select = (name, label, value, options) => ({ name, label, value, options, type: 'select' });
  const checkbox = (name, label, value = false) => ({ name, label, value, type: 'checkbox' });
  const examples = {
    io: {
      title: 'Esperar en serie o solapar las esperas',
      hint: 'Tareas cambia las llamadas; espera cambia su duración; límite cambia cuántas pueden esperar a la vez. Las barras se miden durante la ejecución.',
      params: [
        select('MODO', 'Ejecución', 'concurrente', [
          ['secuencial', 'for con await'],
          ['concurrente', 'gather con semáforo']
        ]),
        range('TAREAS', 'Tareas', 6, 2, 12, 1),
        range('ESPERA', 'Espera por tarea', 0.15, 0.05, 0.5, 0.05, ' s'),
        range('LIMITE', 'Límite simultáneo', 3, 1, 8, 1),
        checkbox('VARIABLE', 'Duraciones distintas para observar el orden')
      ]
    },
    latido: {
      title: '¿Puede atender otra tarea mientras trabaja?',
      hint: 'El latido es otra tarea del mismo bucle. Compara cuántas veces avanza durante un cálculo bloqueante, una espera y un cálculo que cede el control.',
      params: [
        select('MODO', 'Trabajo', 'bloqueante', [
          ['bloqueante', 'Cálculo sin await'],
          ['espera', 'await asyncio.sleep'],
          ['bloques', 'Cálculo por bloques']
        ]),
        range('DURACION', 'Duración del trabajo', 0.4, 0.2, 1, 0.1, ' s'),
        range('INTERVALO', 'Intervalo del latido', 0.05, 0.025, 0.1, 0.025, ' s')
      ]
    },
    carrera: {
      title: 'Compartir un contador entre corrutinas',
      hint: 'Cada incremento lee, cede y escribe. Activa el lock y compara el contador final y las lecturas intercaladas.',
      params: [
        range('TAREAS', 'Tareas', 4, 2, 8, 1),
        range('INCREMENTOS', 'Incrementos por tarea', 3, 1, 5, 1),
        checkbox('PROTEGER', 'Proteger con asyncio.Lock')
      ]
    },
    timeout: {
      title: 'Agotar el plazo y limpiar los recursos',
      hint: 'La duración es lo que necesita la operación. El plazo es lo que permite el llamador. Observa el orden de CancelledError, finally y TimeoutError.',
      params: [
        range('DURACION', 'Duración de la operación', 0.4, 0.1, 1.2, 0.1, ' s'),
        range('TIMEOUT', 'Plazo máximo', 0.2, 0.05, 1.5, 0.05, ' s')
      ]
    },
    grupo: {
      title: 'Un fallo y su efecto en la tarea hermana',
      hint: 'La tarea frágil falla a los 0,05 s. Compara si la tarea lenta termina normalmente o recibe una cancelación.',
      params: [
        select('MODO', 'Coordinación', 'taskgroup', [
          ['taskgroup', 'TaskGroup'],
          ['gather', 'gather']
        ]),
        range('DURACION', 'Duración de la tarea lenta', 0.6, 0.2, 1.2, 0.1, ' s'),
        checkbox('FALLAR', 'Provocar el fallo de la tarea frágil', true)
      ]
    },
    cola: {
      title: 'Limitar el trabajo que espera en memoria',
      hint: 'La capacidad limita los elementos pendientes dentro de la cola; los consumidores limitan los trabajos que ya se están procesando.',
      params: [
        range('TAREAS', 'Elementos', 8, 4, 12, 1),
        range('CAPACIDAD', 'Capacidad de la cola', 2, 1, 4, 1),
        range('CONSUMIDORES', 'Consumidores', 2, 1, 3, 1),
        range('ESPERA', 'Procesamiento por elemento', 0.1, 0.05, 0.3, 0.05, ' s')
      ]
    }
  };

  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  let runtime;
  let active;
  let sequence = 0;
  const instances = [];

  function discardRuntime(error) {
    if (!runtime) return;
    const discarded = runtime;
    runtime = null;
    window.clearTimeout(discarded.timer);
    discarded.worker.terminate();
    discarded.rejectBoot(error);
    discarded.pending?.reject(error);
  }

  function boot() {
    if (runtime) return runtime.ready;
    const worker = new Worker('/js/python-worker.js');
    const current = { worker };
    current.ready = new Promise((resolve, reject) => {
      current.resolveBoot = resolve;
      current.rejectBoot = reject;
    });
    runtime = current;
    current.timer = window.setTimeout(() => {
      discardRuntime(
        new Error(
          'La descarga de Python ha superado 45 segundos. Comprueba la conexión y pulsa Ejecutar para reintentar.'
        )
      );
    }, 45000);
    worker.onmessage = ({ data }) => {
      if (runtime !== current) return;
      if (data.type === 'ready') {
        window.clearTimeout(current.timer);
        current.resolveBoot(current);
      } else if (current.pending && data.id === current.pending.id) {
        if (data.type === 'result') current.pending.resolve(data.value);
        else current.pending.reject(new Error(data.message));
        current.pending = null;
      } else if (data.type === 'error') {
        discardRuntime(
          new Error(
            'No se pudo cargar Python. Comprueba la conexión y pulsa Ejecutar para reintentar.'
          )
        );
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      if (runtime !== current) return;
      discardRuntime(
        new Error(
          'No se pudo iniciar Python en el navegador. Comprueba la conexión y pulsa Ejecutar para reintentar. El código sigue disponible.'
        )
      );
    };
    return current.ready;
  }

  function refreshActions() {
    for (const panel of instances) {
      panel.run.disabled = !!active || !panel.template;
      panel.stop.disabled = active !== panel;
      panel.root.setAttribute('aria-busy', active === panel ? 'true' : 'false');
    }
  }

  function drawTimeline(parent, result) {
    if (!result.registros?.length) return;
    const figure = node('figure', 'python-timeline');
    figure.append(
      node(
        'figcaption',
        '',
        `Intervalos medidos · escala común de 0 a ${result.duracion.toFixed(3)} s`
      )
    );
    const edges = [];
    [...result.registros]
      .sort((a, b) => a.tarea - b.tarea)
      .forEach((record) => {
        const row = node('div', 'python-timeline-row');
        const track = node('div', 'python-timeline-track');
        const bar = node('span', 'python-timeline-bar');
        bar.style.left = `${(record.inicio / result.duracion) * 100}%`;
        bar.style.width = `${((record.fin - record.inicio) / result.duracion) * 100}%`;
        track.append(bar);
        row.append(
          node('span', '', `T${record.tarea}`),
          track,
          node(
            'span',
            'python-timeline-time',
            `${record.inicio.toFixed(3)} → ${record.fin.toFixed(3)} s`
          )
        );
        figure.append(row);
        edges.push([record.inicio, 1], [record.fin, -1]);
      });
    let running = 0;
    let peak = 0;
    edges
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])
      .forEach(([, delta]) => {
        running += delta;
        peak = Math.max(peak, running);
      });
    figure.append(
      node(
        'p',
        'python-timeline-caption',
        `Máximo observado: ${peak} ${peak === 1 ? 'operación pendiente' : 'operaciones pendientes'} a la vez. Una barra indica espera, no uso continuo de CPU.`
      )
    );
    parent.append(figure);
  }

  class PythonPanel {
    constructor(root) {
      this.root = root;
      this.name = root.dataset.pythonDemo;
      this.config = examples[this.name];
      this.values = {};
      this.revision = 0;
      this.hasRun = false;
      root.classList.add('python-lab');
      const heading = node('h3', '', this.config.title);
      heading.id = `demo-${this.name}-title`;
      root.setAttribute('role', 'region');
      root.setAttribute('aria-labelledby', heading.id);
      root.replaceChildren(heading, node('p', 'python-lab-hint', this.config.hint));
      const fields = node('fieldset', 'python-lab-controls');
      const legend = node('legend', 'sr-only', 'Parámetros del experimento');
      fields.append(legend);
      this.config.params.forEach((param) => this.addControl(fields, param));
      this.auto = node('input');
      this.auto.type = 'checkbox';
      this.auto.checked = true;
      this.auto.id = `demo-${this.name}-auto`;
      const autoLabel = node('label', 'python-lab-auto');
      autoLabel.htmlFor = this.auto.id;
      autoLabel.append(
        this.auto,
        document.createTextNode('Actualizar al cambiar parámetros, después de la primera ejecución')
      );
      this.run = node('button', 'python-lab-run', 'Ejecutar');
      this.run.type = 'button';
      this.run.disabled = true;
      this.stop = node('button', 'python-lab-stop', 'Detener');
      this.stop.type = 'button';
      this.stop.disabled = true;
      const actions = node('div', 'python-lab-actions');
      actions.append(this.run, this.stop);
      this.status = node('p', 'python-lab-status', 'Cargando el código del ejemplo…');
      this.status.setAttribute('role', 'status');
      this.result = node('div', 'python-lab-result');
      this.result.append(
        node('p', '', 'Aquí aparecerán el resultado y los eventos de la ejecución.')
      );
      const details = node('details', 'python-lab-source');
      details.open = true;
      const pre = node('pre');
      pre.tabIndex = 0;
      this.code = node('code', 'language-python');
      pre.append(this.code);
      details.append(node('summary', '', 'Código que se ejecuta'), pre);
      root.append(fields, autoLabel, actions, this.status, this.result, details);
      this.run.addEventListener('click', () => this.execute());
      this.stop.addEventListener('click', () => {
        this.pendingAuto = false;
        window.clearTimeout(this.debounce);
        discardRuntime(
          new Error('Ejecución detenida. Puedes cambiar los parámetros y volver a ejecutar.')
        );
      });
      this.auto.addEventListener('change', () => {
        if (!this.auto.checked) {
          this.pendingAuto = false;
          window.clearTimeout(this.debounce);
        } else if (this.hasRun && this.lastRevision !== this.revision) this.schedule();
      });
      instances.push(this);
      this.load();
    }

    async load() {
      try {
        const response = await fetch(`/assets/python/${this.name}.py`);
        if (!response.ok) throw new Error('El archivo del ejemplo no está disponible.');
        this.template = await response.text();
        this.updateCode();
        this.status.textContent =
          'Pulsa Ejecutar. La primera vez se descargará Python; después se reutilizará.';
        refreshActions();
      } catch {
        this.status.textContent =
          'No se pudo cargar el código. Comprueba la conexión y recarga la página.';
        this.root.dataset.state = 'error';
        refreshActions();
      }
    }

    addControl(fields, param) {
      this.values[param.name] = param.value;
      const label = node('label', `python-lab-field python-lab-field-${param.type}`);
      const id = `demo-${this.name}-${param.name.toLowerCase()}`;
      label.htmlFor = id;
      let input;
      if (param.type === 'select') {
        // Native platform popup; its geometry is intentionally owned by the browser.
        input = node('select');
        param.options.forEach(([value, title]) => {
          const option = node('option', '', title);
          option.value = value;
          input.append(option);
        });
        input.value = param.value;
      } else {
        input = node('input');
        input.type = param.type;
        if (param.type === 'checkbox') input.checked = param.value;
        else
          ['min', 'max', 'step', 'value'].forEach((key) => {
            input[key] = param[key];
          });
      }
      input.id = id;
      const title = node('span', '', param.label);
      const output = node('output', '');
      output.htmlFor = id;
      const updateValue = () => {
        this.values[param.name] =
          param.type === 'checkbox'
            ? input.checked
            : param.type === 'range'
              ? Number(input.value)
              : input.value;
        if (param.type === 'range')
          output.textContent = `${new Intl.NumberFormat('es', { maximumFractionDigits: 3 }).format(this.values[param.name])}${param.unit}`;
      };
      updateValue();
      if (param.type === 'checkbox') label.append(input, title);
      else {
        const caption = node('span', 'python-lab-field-caption');
        caption.append(title);
        if (param.type === 'range') caption.append(output);
        label.append(caption, input);
      }
      input.addEventListener('input', () => {
        updateValue();
        this.revision += 1;
        this.updateCode();
        this.root.dataset.state = 'modified';
        this.status.textContent =
          active === this
            ? 'Parámetros modificados durante la ejecución; el resultado anterior no se mostrará como actualizado.'
            : 'Parámetros modificados. El código ya muestra los nuevos valores.';
      });
      input.addEventListener('change', () => this.schedule());
      fields.append(label);
    }

    updateCode() {
      if (!this.template) return;
      let code = this.template;
      Object.entries(this.values).forEach(([name, value]) => {
        const literal =
          typeof value === 'boolean' ? (value ? 'True' : 'False') : JSON.stringify(value);
        code = code.replace(new RegExp(`^${name} = .+$`, 'm'), `${name} = ${literal}`);
      });
      this.code.textContent = code;
      document.dispatchEvent(new CustomEvent('learning:code-added', { detail: this.root }));
    }

    schedule() {
      if (!this.hasRun || !this.auto.checked) return;
      window.clearTimeout(this.debounce);
      this.debounce = window.setTimeout(() => {
        if (active === this) this.pendingAuto = true;
        else if (!active) this.execute();
        else
          this.status.textContent =
            'Hay otro experimento ejecutándose. Pulsa Ejecutar cuando termine.';
      }, 350);
    }

    async execute() {
      if (active || !this.template) return;
      active = this;
      this.pendingAuto = false;
      window.clearTimeout(this.debounce);
      const revision = this.revision;
      const code = this.code.textContent;
      let timer;
      refreshActions();
      this.root.dataset.state = 'running';
      this.status.textContent = runtime
        ? 'Ejecutando el código…'
        : 'Cargando Python por primera vez… Puedes detener la descarga.';
      try {
        const current = await boot();
        this.status.textContent = 'Ejecutando el código… Puedes detenerlo en cualquier momento.';
        const value = await new Promise((resolve, reject) => {
          const id = ++sequence;
          current.pending = { id, resolve, reject };
          timer = window.setTimeout(
            () =>
              discardRuntime(
                new Error(
                  'La ejecución ha superado 20 segundos y se ha detenido. Reduce los parámetros y vuelve a ejecutar.'
                )
              ),
            20000
          );
          current.worker.postMessage({ id, code });
        });
        this.hasRun = true;
        this.lastRevision = revision;
        if (revision === this.revision) {
          this.result.replaceChildren(node('p', 'python-lab-summary', value.resumen));
          drawTimeline(this.result, value);
          const events = node('pre', 'python-lab-events', value.eventos.join('\n'));
          events.tabIndex = 0;
          events.setAttribute('aria-label', 'Eventos de la ejecución');
          this.result.append(events);
          this.root.dataset.state = 'done';
          this.status.textContent = 'Ejecución terminada con los parámetros actuales.';
        } else {
          this.status.textContent =
            'La ejecución usó parámetros anteriores. Ejecuta de nuevo para obtener el resultado de los valores actuales.';
          this.root.dataset.state = 'modified';
          this.pendingAuto = this.auto.checked;
        }
      } catch (error) {
        this.root.dataset.state = 'error';
        this.status.textContent = String(error.message).slice(0, 2500);
      } finally {
        window.clearTimeout(timer);
        active = null;
        refreshActions();
        if (this.pendingAuto && this.auto.checked) this.schedule();
      }
    }
  }

  panels.forEach((root) => new PythonPanel(root));
  window.addEventListener('pagehide', () => {
    instances.forEach((panel) => {
      panel.pendingAuto = false;
      window.clearTimeout(panel.debounce);
    });
    discardRuntime(new Error('Ejecución detenida al abandonar la página.'));
  });
})();
