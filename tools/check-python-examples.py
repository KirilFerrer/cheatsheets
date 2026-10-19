"""Run the actual standalone programs published in the Asincronía guide."""

import ast
import re
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / "source/_posts/python-asincronia.md").read_text()
programs = re.findall(r"^```python\n(.*?)^```", source, re.M | re.S)
assert len(programs) == 11, "The guide must retain its complete examples"


def execute(program):
    with tempfile.TemporaryDirectory(prefix="sheet-codes-example-") as directory:
        script = Path(directory) / "example.py"
        script.write_text(program)
        result = subprocess.run(
            [sys.executable, "-W", "error", str(script)],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=directory,
        )
        assert result.returncode == 0, result.stderr
        assert not result.stderr, result.stderr
        return result.stdout.strip().splitlines()


outputs = [execute(program) for program in programs]
resources = ["usuarios", "pedidos", "productos"]
results = [f"datos de {name}" for name in resources]
sequential = [line for name in resources for line in (f"Inicio: {name}", f"Fin: {name}")]
for index in (0, 2):
    assert outputs[index][:6] == sequential
    assert ast.literal_eval(outputs[index][6]) == results
    assert outputs[index][7].startswith("Tiempo:")

assert outputs[1] == [
    "Corrutina creada",
    "Inicio: usuarios",
    "Fin: usuarios",
    "Resultado: datos de usuarios",
]
assert outputs[3][:3] == [f"Inicio: {name}" for name in resources]
assert set(outputs[3][3:6]) == {f"Fin: {name}" for name in resources}
assert ast.literal_eval(outputs[3][6]) == results

tasks = outputs[4]
assert tasks[0] == "Consultas programadas"
assert tasks.index("Fin: pedidos") < tasks.index("Fin: usuarios")
assert tasks.index("La tarea principal también continúa") < tasks.index("Fin: usuarios")
assert tasks[-2:] == ["Resultado: datos de usuarios", "Resultado: datos de pedidos"]
assert outputs[5] == ["Latido: 1", "Latido: 2", "Latido: 3", "Resultado: contenido recibido"]

active = peak = 0
for line in outputs[6][:-1]:
    if line.startswith("Entra:"):
        active += 1
        peak = max(peak, active)
    elif line.startswith("Sale:"):
        active -= 1
    assert 0 <= active <= 2, "The semaphore must bound active operations"
assert active == 0 and peak == 2
assert outputs[6][-1] == "Resultados: [0, 1, 2, 3, 4]"

assert outputs[7] == ["Abrir recurso", "Cerrar recurso", "Plazo agotado"]
assert execute(programs[7].replace("asyncio.timeout(0.1)", "asyncio.timeout(0.5)")) == [
    "Abrir recurso",
    "Consulta terminada",
    "Cerrar recurso",
    "Resultado: datos",
]
assert outputs[8] == [
    "Inicio de la consulta lenta",
    "Consulta lenta cancelada",
    "Cerrar consulta lenta",
    "Errores de validación: 1",
]
assert outputs[9] == ["Esperado: 2", "Obtenido: 1"]
assert execute(programs[9].replace("PROTEGER = False", "PROTEGER = True")) == [
    "Esperado: 2",
    "Obtenido: 2",
]
assert [line for line in outputs[10] if line.startswith("Procesado:")] == [
    f"Procesado: {number}" for number in range(4)
]
assert outputs[10][-1] == "Todos los elementos procesados"
print(f"Verified {len(programs)} published Python programs and the timeout/lock variants.")
