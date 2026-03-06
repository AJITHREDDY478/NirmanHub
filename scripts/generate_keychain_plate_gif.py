from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

W, H = 720, 720
SCALE = 2
WW, HH = W * SCALE, H * SCALE
OUT = "public/samples/number-plate-keychain-style-realistic.gif"


def get_font(size, bold=False):
    try:
        return ImageFont.truetype("arialbd.ttf" if bold else "arial.ttf", size)
    except Exception:
        return ImageFont.load_default(size=max(14, size // 2))


def background():
    img = Image.new("RGB", (WW, HH), (224, 224, 224))
    draw = ImageDraw.Draw(img)
    top = (235, 235, 235)
    bottom = (213, 213, 213)
    for y in range(HH):
        t = y / (HH - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        draw.line([(0, y), (WW, y)], fill=(r, g, b))
    return img.convert("RGBA")


def draw_metal_ring(draw, cx, cy, r):
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(55, 55, 58), width=12)
    draw.ellipse((cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8), outline=(175, 175, 175), width=3)
    draw.arc((cx - r + 4, cy - r + 4, cx + r - 4, cy + r - 4), start=210, end=335, fill=(220, 220, 220), width=4)


def draw_chain(draw, px, py, angle_rad):
    link_w, link_h = 30, 56
    links = 5
    for i in range(links):
        frac = (i + 1) / links
        cx = int(px + math.sin(angle_rad) * frac * 24)
        cy = int(py + 30 + i * 48)
        tilt = math.sin(angle_rad) * 6 * (1 if i % 2 == 0 else -1)
        bbox = (cx - link_w // 2, cy - link_h // 2, cx + link_w // 2, cy + link_h // 2)
        tmp = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
        tdraw = ImageDraw.Draw(tmp)
        tdraw.ellipse((30, 16, 90, 104), outline=(75, 75, 78), width=7)
        tdraw.ellipse((36, 22, 84, 98), outline=(170, 170, 170), width=2)
        tmp = tmp.rotate(tilt, resample=Image.Resampling.BICUBIC, expand=True)
        draw.bitmap((bbox[0] - 16, bbox[1] - 16), tmp, fill=None)


def plate_image(text_top, text1, text2):
    pw, ph = 460, 285
    plate = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    draw = ImageDraw.Draw(plate)

    draw.rounded_rectangle((8, 8, pw - 8, ph - 8), radius=28, fill=(247, 247, 247), outline=(22, 22, 22), width=8)
    draw.rounded_rectangle((36, 22, pw - 36, 72), radius=16, fill=(30, 30, 30))

    draw.ellipse((pw // 2 - 10, 76, pw // 2 + 10, 96), fill=(28, 28, 28))

    f_top = get_font(44, bold=True)
    f_mid = get_font(80, bold=True)

    b0 = draw.textbbox((0, 0), text_top, font=f_top)
    draw.text(((pw - (b0[2] - b0[0])) // 2, 30), text_top, fill=(245, 245, 245), font=f_top)

    b1 = draw.textbbox((0, 0), text1, font=f_mid)
    draw.text(((pw - (b1[2] - b1[0])) // 2, 108), text1, fill=(18, 18, 18), font=f_mid)

    b2 = draw.textbbox((0, 0), text2, font=f_mid)
    draw.text(((pw - (b2[2] - b2[0])) // 2, 186), text2, fill=(18, 18, 18), font=f_mid)

    return plate


def frame(i, total):
    img = background()
    draw = ImageDraw.Draw(img)

    t = (i / total) * 2 * math.pi
    angle = math.sin(t) * 10
    angle_rad = math.radians(angle)

    ring_cx, ring_cy = WW // 2, 130
    draw_metal_ring(draw, ring_cx, ring_cy, 84)

    chain_start_y = ring_cy + 80
    draw_chain(draw, ring_cx, chain_start_y, angle_rad)

    shadow = Image.new("RGBA", (520, 140), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    width = 260 + int(abs(math.sin(t)) * 100)
    sdraw.ellipse((260 - width // 2, 45, 260 + width // 2, 100), fill=(40, 40, 40, 85))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    img.alpha_composite(shadow, (WW // 2 - 260, 560))

    plate = plate_image("YOUR NAME", "MH 09", "AB 0542")
    plate = plate.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)

    px = WW // 2 - plate.width // 2 + int(math.sin(t) * 12)
    py = 300
    img.alpha_composite(plate, (px, py))

    out = img.resize((W, H), resample=Image.Resampling.LANCZOS)
    return out.convert("P", palette=Image.Palette.ADAPTIVE)


def main():
    total = 36
    frames = [frame(i, total) for i in range(total)]
    frames[0].save(
        OUT,
        save_all=True,
        append_images=frames[1:],
        duration=90,
        loop=0,
        optimize=True,
        disposal=2,
    )
    print(f"Generated {OUT} with {len(frames)} frames")


if __name__ == "__main__":
    main()
