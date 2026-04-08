from __future__ import annotations

import argparse
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


DEFAULT_PORT = 8082
DEFAULT_HOST = "127.0.0.1"


def read_dotenv_value(dotenv_path: Path, key: str) -> str | None:
  if not dotenv_path.exists():
    return None

  for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
      continue

    current_key, value = line.split("=", 1)
    if current_key.strip() != key:
      continue

    value = value.strip().strip('"').strip("'")
    return value or None

  return None


def resolve_reports_root(cli_root: str | None) -> Path:
  if cli_root:
    return Path(cli_root).expanduser().resolve()

  env_root = os.environ.get("LOGS_DIRECTORY")
  if env_root:
    return Path(env_root).expanduser().resolve()

  repo_root = Path(__file__).resolve().parents[2]
  dotenv_root = read_dotenv_value(repo_root / ".env", "LOGS_DIRECTORY")
  if dotenv_root:
    return Path(dotenv_root).expanduser().resolve()

  raise SystemExit(
    "No se pudo resolver la carpeta de logs. Usa --root o define LOGS_DIRECTORY en el entorno o en .env.",
  )


def build_parser() -> argparse.ArgumentParser:
  parser = argparse.ArgumentParser(
    description="Sirve por HTTP los reportes HTML para simular nginx pages en desarrollo.",
  )
  parser.add_argument(
    "--root",
    help="Directorio raiz de logs/reportes HTML. Si se omite, usa LOGS_DIRECTORY.",
  )
  parser.add_argument(
    "--port",
    type=int,
    default=DEFAULT_PORT,
    help=f"Puerto HTTP local. Default: {DEFAULT_PORT}.",
  )
  parser.add_argument(
    "--host",
    default=DEFAULT_HOST,
    help=f"Host a bindear. Default: {DEFAULT_HOST}. Usa 0.0.0.0 para exponer en red.",
  )
  return parser


def main() -> None:
  args = build_parser().parse_args()
  root = resolve_reports_root(args.root)

  if not root.exists():
    raise SystemExit(f"La carpeta de logs no existe: {root}")
  if not root.is_dir():
    raise SystemExit(f"La ruta indicada no es un directorio: {root}")

  handler = partial(SimpleHTTPRequestHandler, directory=str(root))
  server = ThreadingHTTPServer((args.host, args.port), handler)

  print(f"Serving nginx pages simulation from: {root}")
  print(f"Base URL: http://{args.host}:{args.port}")
  print("Usa esta base en frontend/.env.local como VITE_REPORTS_BASE_URL.")
  print("Ctrl+C para detener.")

  try:
    server.serve_forever()
  except KeyboardInterrupt:
    print("\nStopping server.")
  finally:
    server.server_close()


if __name__ == "__main__":
  main()
