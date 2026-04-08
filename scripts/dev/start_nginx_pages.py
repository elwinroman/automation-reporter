from __future__ import annotations

import subprocess
import sys
import tempfile
import time
from pathlib import Path


PID_DIR = Path(tempfile.gettempdir()) / "automation-reporter"
PID_FILE = PID_DIR / "nginx-pages.pid"
LOG_FILE = PID_DIR / "nginx-pages.log"
SERVER_SCRIPT = Path(__file__).resolve().with_name("serve_nginx_pages.py")
DEFAULT_PORT = 8082


def is_running(pid: int) -> bool:
  try:
    if sys.platform == "win32":
      result = subprocess.run(
        ["tasklist", "/FI", f"PID eq {pid}"],
        capture_output=True,
        text=True,
        check=False,
      )
      return str(pid) in result.stdout

    result = subprocess.run(["kill", "-0", str(pid)], check=False)
    return result.returncode == 0
  except Exception:
    return False


def remove_pid_file() -> None:
  for _ in range(10):
    try:
      PID_FILE.unlink(missing_ok=True)
      return
    except PermissionError:
      time.sleep(0.2)

  raise SystemExit(f"No se pudo eliminar el archivo PID: {PID_FILE}")


def listening_pid(port: int) -> int | None:
  try:
    if sys.platform == "win32":
      result = subprocess.run(
        [
          "powershell",
          "-NoProfile",
          "-Command",
          f"$c = Get-NetTCPConnection -LocalPort {port} -State Listen -ErrorAction SilentlyContinue; if ($c) {{ $c | Select-Object -First 1 -ExpandProperty OwningProcess }}",
        ],
        capture_output=True,
        text=True,
        check=False,
      )
      value = result.stdout.strip()
      return int(value) if value.isdigit() else None

    result = subprocess.run(["lsof", f"-i:{port}", "-t"], capture_output=True, text=True, check=False)
    pid_text = result.stdout.strip().splitlines()
    return int(pid_text[0]) if pid_text else None
  except Exception:
    return None


def main() -> None:
  PID_DIR.mkdir(parents=True, exist_ok=True)

  if PID_FILE.exists():
    existing_pid = int(PID_FILE.read_text(encoding="utf-8").strip())
    if is_running(existing_pid):
      print(f"Nginx pages simulation already running with PID {existing_pid}.")
      return
    remove_pid_file()

  with LOG_FILE.open("ab") as log_handle:
    kwargs: dict[str, object] = {
      "stdout": log_handle,
      "stderr": log_handle,
      "stdin": subprocess.DEVNULL,
      "cwd": str(Path(__file__).resolve().parents[2]),
      "start_new_session": True,
    }

    if sys.platform == "win32":
      kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS

    process = subprocess.Popen([sys.executable, str(SERVER_SCRIPT)], **kwargs)

  actual_pid = process.pid
  for _ in range(20):
    detected_pid = listening_pid(DEFAULT_PORT)
    if detected_pid:
      actual_pid = detected_pid
      break
    time.sleep(0.2)

  PID_FILE.write_text(str(actual_pid), encoding="utf-8")
  print(f"Nginx pages simulation started with PID {actual_pid}.")
  print(f"PID file: {PID_FILE}")
  print(f"Log file: {LOG_FILE}")


if __name__ == "__main__":
  main()
