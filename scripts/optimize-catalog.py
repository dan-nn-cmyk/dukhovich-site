"""Собирает WebP из PNG-исходников каталога: полноразмерные фото и превью в thumbs/.
Запуск из корня: python scripts/optimize-catalog.py"""
from pathlib import Path
from PIL import Image

src = Path("assets/img/catalog")
(src / "thumbs").mkdir(exist_ok=True)
for png in sorted(src.glob("*.png")):
    im = Image.open(png).convert("RGB")
    im.save(src / f"{png.stem}.webp", quality=82, method=6)
    im.thumbnail((240, 480))
    im.save(src / "thumbs" / f"{png.stem}.webp", quality=78, method=6)
    print(png.name)
