from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

from captcha_solver import CaptchaSolver, CaptchaType


FONT = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 32)
SMALL_FONT = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 22)


def make_image(text, size=(140, 52), transparent=False, small=False):
    image = Image.new(
        "RGBA" if transparent else "RGB",
        size,
        (255, 255, 255, 0) if transparent else "white",
    )
    draw = ImageDraw.Draw(image)
    font = SMALL_FONT if small else FONT
    box = draw.textbbox((0, 0), text, font=font)
    x = (size[0] - (box[2] - box[0])) // 2
    y = (size[1] - (box[3] - box[1])) // 2 - box[1]
    draw.text(
        (x, y),
        text,
        font=font,
        fill=(20, 20, 20, 255) if transparent else "#141414",
    )
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def main():
    cases = [
        ("4827", make_image("4827"), "0123456789"),
        ("A7B2", make_image("A7B2"), "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"),
        (
            "K9M4",
            make_image("K9M4", transparent=True),
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        ),
        ("7356", make_image("7356", size=(80, 30), small=True), "0123456789"),
    ]

    solver = CaptchaSolver()
    passed = 0
    for expected, image_bytes, charset in cases:
        result = solver.solve_image(image_bytes, charset=charset)
        actual = result.answer if result.success else f"ERROR: {result.error}"
        print(f"{expected} -> {actual}")
        passed += int(
            result.success
            and result.captcha_type == CaptchaType.TEXT
            and actual == expected
        )

    if passed != len(cases):
        raise SystemExit(f"REAL_OCR_SMOKE={passed}/{len(cases)}")
    print(f"REAL_OCR_SMOKE={passed}/{len(cases)}")


if __name__ == "__main__":
    main()
