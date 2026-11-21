#!/usr/bin/env python3
"""resources/logo.png theke Android er shob icon + splash banay (resources/android/res/ e).
Logo bodlale: python3 scripts/make_icons.py   (Pillow lagbe: pip install pillow)"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "resources" / "logo.png"
OUT = ROOT / "resources" / "android" / "res"

DENS = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
logo = Image.open(SRC).convert("RGBA")


def mask(size, shape, frac=0.18):
    s = size * 4
    m = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(m)
    if shape == "circle":
        d.ellipse((0, 0, s - 1, s - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * frac), fill=255)
    return m.resize((size, size), Image.LANCZOS)


def shaped(im, size, shape, frac=0.18):
    im = im.resize((size, size), Image.LANCZOS)
    im.putalpha(mask(size, shape, frac))
    return im


for name, px in DENS.items():
    d = OUT / f"mipmap-{name}"
    d.mkdir(parents=True, exist_ok=True)
    # purano (legacy) icon
    shaped(logo, px, "round", 0.18).save(d / "ic_launcher.png")
    shaped(logo, px, "circle").save(d / "ic_launcher_round.png")
    # adaptive icon (108dp canvas)
    S = px * 108 // 48
    bg = logo.resize((S, S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(S * 0.05)).convert("RGB")
    bg.save(d / "ic_launcher_bg_ludo.png")
    fg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    t = int(S * 0.66)
    tile = shaped(logo, t, "round", 0.12)
    fg.paste(tile, ((S - t) // 2, (S - t) // 2), tile)
    fg.save(d / "ic_launcher_fg_ludo.png")

any26 = OUT / "mipmap-anydpi-v26"
any26.mkdir(parents=True, exist_ok=True)
xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_bg_ludo"/>
    <foreground android:drawable="@mipmap/ic_launcher_fg_ludo"/>
</adaptive-icon>
"""
(any26 / "ic_launcher.xml").write_text(xml)
(any26 / "ic_launcher_round.xml").write_text(xml)

# splash er logo (drawable-nodpi => pixel size e dekhay)
nd = OUT / "drawable-nodpi"
nd.mkdir(parents=True, exist_ok=True)
shaped(logo, 360, "round", 0.14).save(nd / "splash_logo.png")

# splash background + logo
dr = OUT / "drawable"
dr.mkdir(parents=True, exist_ok=True)
(dr / "splash.xml").write_text("""<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <shape android:shape="rectangle">
            <solid android:color="#0D3D96"/>
        </shape>
    </item>
    <item>
        <bitmap android:src="@drawable/splash_logo" android:gravity="center"/>
    </item>
</layer-list>
""")
print("icons ready:", OUT)
