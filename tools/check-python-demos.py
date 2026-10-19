"""Check the same Python sources served to the educational browser panels."""

import ast
import asyncio
from pathlib import Path
import re
import subprocess
import sys
import tempfile


async def run(name, **parameters):
    source = (Path(__file__).resolve().parents[1] / "source/assets/python" / f"{name}.py").read_text()
    for key, value in parameters.items():
        source, replaced = re.subn(rf"^{key} = .+$", f"{key} = {value!r}", source, flags=re.M)
        assert replaced == 1, (name, key)
    source, replaced = re.subn(r"^await main\(\)$", "resultado = await main()", source, flags=re.M)
    assert replaced == 1, name
    namespace = {"__name__": "__main__"}
    code = compile(source, f"{name}.py", "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    await eval(code, namespace)
    return namespace["resultado"]


async def main():
    sequential = await run("io", MODO="secuencial", ESPERA=0.01)
    concurrent = await run("io", ESPERA=0.01)
    intervals = sequential["registros"]
    assert all(a["fin"] <= b["inicio"] for a, b in zip(intervals, intervals[1:]))
    edges = sorted((point, delta) for record in concurrent["registros"] for point, delta in [(record["inicio"], 1), (record["fin"], -1)])
    running = peak = 0
    for _, delta in edges:
        running += delta
        peak = max(peak, running)
    assert peak == 3
    ordered = await run("io", VARIABLE=True, ESPERA=0.01)
    assert "[0, 1, 2, 3, 4, 5]" in ordered["eventos"][1]
    for protect in [False, True]:
        result = await run("carrera", PROTEGER=protect)
        assert (result["obtenido"] == result["esperado"]) is protect
    for duration, timeout, expired in [(0.01, 0.1, False), (0.1, 0.01, True)]:
        result = await run("timeout", DURACION=duration, TIMEOUT=timeout)
        events = "\n".join(result["eventos"])
        assert "Cerrar recurso en finally" in events
        assert ("TimeoutError fuera" in events) is expired
        if expired:
            assert events.index("Cerrar recurso") < events.index("TimeoutError fuera")
    for mode in ["taskgroup", "gather"]:
        for fail in [False, True]:
            result = await run("grupo", MODO=mode, DURACION=0.08, FALLAR=fail)
            events = "\n".join(result["eventos"])
            assert ("lenta es cancelada" in events) is (fail and mode == "taskgroup")
            assert "libera sus recursos" in events
    for mode in ["bloqueante", "espera", "bloques"]:
        result = await run("latido", MODO=mode, DURACION=0.1, INTERVALO=0.01)
        beats = sum(event.startswith("Latido") for event in result["eventos"])
        assert beats == 1 if mode == "bloqueante" else beats > 1
    for capacity, consumers in [(1, 1), (2, 2), (4, 3)]:
        result = await run("cola", CAPACIDAD=capacity, CONSUMIDORES=consumers, ESPERA=0.005)
        assert result["procesados"] == list(range(8))
        assert result["maximo"] <= capacity
    print("Verified six Python demos: ordering, concurrency limit, heartbeat, races, timeouts, group cleanup and bounded queues.")


def check_native_examples():
    root = Path(__file__).resolve().parents[1]
    guide = (root / "source/_posts/python-asincronia.md").read_text()
    examples = [code for code in re.findall(r"```python\n(.*?)\n```", guide, re.S)
                if 'if __name__ == "__main__":' in code]
    assert len(examples) == 6, "The complete local programs must remain covered"
    with tempfile.TemporaryDirectory(prefix="sheet-codes-python-") as directory:
        for index, code in enumerate(examples):
            script = Path(directory) / f"example_{index}.py"
            script.write_text(code)
            result = subprocess.run([sys.executable, str(script)], capture_output=True,
                                    text=True, timeout=30, cwd=directory)
            assert result.returncode == 0, (index, result.stdout, result.stderr)
            assert result.stdout.strip(), f"Example {index} produced no visible result"
    print(f"Verified {len(examples)} complete local programs, including threads, spawned processes, CPU results and HTTP.")


if __name__ == "__main__":
    asyncio.run(main())
    check_native_examples()
