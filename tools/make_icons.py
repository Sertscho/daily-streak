#!/usr/bin/env python3
"""Rendert icons/icon.svg zu PNG-Icons in icons/ über macOS Quick Look (qlmanage, keine Pakete nötig).

Aufruf: python3 tools/make_icons.py
"""
import os
import shutil
import struct
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "icons/icon.svg")
OUT = os.path.join(ROOT, "icons")
SIZES = {"icon-180.png": 180, "icon-192.png": 192, "icon-512.png": 512}


def main():
    for name, size in SIZES.items():
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(["qlmanage", "-t", "-s", str(size), "-o", tmp, SRC], check=True, capture_output=True)
            png = os.path.join(tmp, os.path.basename(SRC) + ".png")
            with open(png, "rb") as f:
                w, h = struct.unpack(">II", f.read(24)[16:24])
            assert (w, h) == (size, size), f"{name}: {w}x{h} statt {size}x{size}"
            shutil.move(png, os.path.join(OUT, name))
        print(os.path.join(OUT, name))


if __name__ == "__main__":
    main()
