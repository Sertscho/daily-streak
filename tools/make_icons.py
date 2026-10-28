#!/usr/bin/env python3
"""Erzeugt icons/icon-180.png, icon-192.png und icon-512.png (nur Standardbibliothek).

Aufruf: python3 tools/make_icons.py
Form: dunkles Vollquadrat, Flamme als Tropfen (Kreis + Tangenten zur Spitze),
dieselbe Geometrie wie icons/icon.svg. 4x4 Supersampling für weiche Kanten.
"""
import math
import os
import struct
import zlib

BG = (0x14, 0x11, 0x0F)
OUTER = (0xFF, 0x7A, 0x1A)
INNER = (0xFF, 0xB5, 0x47)
SS = 4  # Supersampling je Achse
DESIGN = 512.0  # Koordinatensystem wie icon.svg


def in_triangle(p, a, b, c):
    def sign(p1, p2, p3):
        return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
    d1, d2, d3 = sign(p, a, b), sign(p, b, c), sign(p, c, a)
    has_neg = d1 < 0 or d2 < 0 or d3 < 0
    has_pos = d1 > 0 or d2 > 0 or d3 > 0
    return not (has_neg and has_pos)


def teardrop(tip, center, r):
    """Testfunktion: Punkt liegt im Kreis oder im Dreieck Spitze–Tangentenpunkte."""
    tx, ty = tip
    cx, cy = center
    dx, dy = tx - cx, ty - cy
    d = math.hypot(dx, dy)
    ux, uy = dx / d, dy / d        # Richtung Mitte -> Spitze
    nx, ny = -uy, ux               # senkrecht dazu
    th = math.acos(r / d)
    c, s = math.cos(th), math.sin(th)
    t1 = (cx + r * (c * ux + s * nx), cy + r * (c * uy + s * ny))
    t2 = (cx + r * (c * ux - s * nx), cy + r * (c * uy - s * ny))

    def inside(x, y):
        if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
            return True
        return in_triangle((x, y), tip, t1, t2)
    return inside


def render_rows(size):
    outer = teardrop((256, 56), (256, 330), 112)
    inner = teardrop((256, 236), (256, 352), 56)
    scale = DESIGN / size
    offs = [(i + 0.5) / SS for i in range(SS)]
    n = SS * SS
    rows = []
    for py in range(size):
        row = bytearray(b'\x00')  # PNG-Filter: None
        for px in range(size):
            r = g = b = 0
            for oy in offs:
                y = (py + oy) * scale
                for ox in offs:
                    x = (px + ox) * scale
                    if inner(x, y):
                        col = INNER
                    elif outer(x, y):
                        col = OUTER
                    else:
                        col = BG
                    r += col[0]
                    g += col[1]
                    b += col[2]
            row += bytes((r // n, g // n, b // n))
        rows.append(bytes(row))
    return rows


def png_bytes(width, height, rows):
    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', crc)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)  # 8 bit RGB
    idat = zlib.compress(b''.join(rows), 9)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, 'icons')
    os.makedirs(out_dir, exist_ok=True)
    for size in (180, 192, 512):
        path = os.path.join(out_dir, f'icon-{size}.png')
        with open(path, 'wb') as f:
            f.write(png_bytes(size, size, render_rows(size)))
        print(f'geschrieben: {path} ({size}x{size})')


if __name__ == '__main__':
    main()
