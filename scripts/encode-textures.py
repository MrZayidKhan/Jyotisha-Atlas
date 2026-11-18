"""Encode optional source images from outputs into the public WebP assets.

Requires Pillow. Production builds use the committed derivatives and do not run this script.
See public/ATTRIBUTION.md for source links.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "outputs"
ORIGINAL = INPUT / "source-textures"
TEXTURES = ROOT / "public" / "textures"
ASSETS = ROOT / "public" / "assets"


def encode(source: Path, destination: Path, width: int, quality: int, grayscale=False, lift_shadows=False):
    with Image.open(source) as original:
        image = original.convert("L" if grayscale else "RGB")
        if width != image.width:
            height = round(image.height * width / image.width)
            image = image.resize((width, height), Image.Resampling.LANCZOS)
        if lift_shadows:
            curve = [min(255, round(255 * (value / 255) ** 0.72)) for value in range(256)]
            image = image.point(curve * 3)
        image.save(destination, quality=quality, method=6)


def texture_source(name: str):
    original = ORIGINAL / name
    return original if original.exists() else TEXTURES / name


if __name__ == "__main__":
    encode(INPUT / "lroc_color_2k.jpg", TEXTURES / "moon-preview.webp", 768, 76)
    encode(INPUT / "lroc_color_2k.jpg", TEXTURES / "moon-2k.webp", 2048, 86)
    encode(INPUT / "lroc_color_poles_4k.tif", TEXTURES / "moon-4k.webp", 4096, 88)
    encode(INPUT / "ldem_3_8bit.jpg", TEXTURES / "moon-relief.webp", 1024, 90, grayscale=True)
    for width in (2048, 4096):
        encode(texture_source(f"{width//1024}k_stars_milky_way.jpg"), TEXTURES / f"sky-{width//1024}k.webp", width, 87, lift_shadows=True)
    for name in ("earth_daymap", "mercury", "venus_atmosphere", "mars", "jupiter", "saturn", "sun"):
        target = "earth" if name == "earth_daymap" else name
        encode(texture_source(f"2k_{name}.jpg"), TEXTURES / f"{target}.webp", 1536, 84)
    for width in (480, 960, 1600):
        encode(ASSETS / "moon-nearside.jpg", ASSETS / f"moon-nearside-{width}.webp", width, 88)
    encode(ASSETS / "moon-nearside.jpg", ASSETS / "moon-icon.webp", 64, 88)
