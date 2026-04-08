from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
VENV_DIR = REPO_ROOT / ".venv"
START_SCRIPT = REPO_ROOT / "scripts" / "dev" / "start_nginx_pages.py"


def venv_python() -> Path:
  if os.name == "nt":
    return VENV_DIR / "Scripts" / "python.exe"
  return VENV_DIR / "bin" / "python"


def ensure_venv() -> Path:
  python_path = venv_python()
  if python_path.exists():
    return python_path

  print(f"Creating virtual environment in {VENV_DIR}...")
  subprocess.run(
    [sys.executable, "-m", "venv", "--without-pip", str(VENV_DIR)],
    check=True,
    cwd=str(REPO_ROOT),
  )

  if not python_path.exists():
    raise SystemExit(f"Could not create virtual environment Python at: {python_path}")

  return python_path


def run_in_venv(script_path: Path) -> int:
  python_path = ensure_venv()
  result = subprocess.run([str(python_path), str(script_path)], cwd=str(REPO_ROOT), check=False)
  return result.returncode


def build_parser() -> argparse.ArgumentParser:
  parser = argparse.ArgumentParser(
    description="Manage nginx pages simulation for development.",
  )
  parser.add_argument("action", choices=["setup", "start"])
  return parser


def main() -> None:
  args = build_parser().parse_args()

  if args.action == "setup":
    python_path = ensure_venv()
    print(f"Virtual environment ready: {python_path}")
    return

  if args.action == "start":
    raise SystemExit(run_in_venv(START_SCRIPT))


if __name__ == "__main__":
  main()
