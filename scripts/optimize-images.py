"""Generate smaller web assets while keeping all original artwork untouched."""
from pathlib import Path
import re
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
output = root / 'images' / 'optimized'
output.mkdir(exist_ok=True)
page = (root / 'index.html').read_text(encoding='utf-8')
stats = {'before': 0, 'after': 0}
converted = {}

def convert(source, max_size):
    source = source.removeprefix('./')
    if source in converted:
        return converted[source]
    file = root / source
    if not file.exists() or file.suffix.lower() not in ('.jpg', '.png'):
        return None
    with Image.open(file) as original:
        image = ImageOps.exif_transpose(original).convert('RGBA' if 'A' in original.getbands() else 'RGB')
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        name = re.sub(r'[^a-zA-Z0-9-]', '-', file.stem).strip('-') + '.webp'
        target = output / name
        image.save(target, 'WEBP', quality=88, method=6)
        result = (target.relative_to(root).as_posix(), image.width, image.height)
        stats['before'] += file.stat().st_size
        stats['after'] += target.stat().st_size
        converted[source] = result
        return result

def replace_image(match):
    tag = match.group(0)
    src = re.search(r'src="([^"]+)"', tag)
    if not src or '/optimized/' in src[1]:
        return tag
    hero = 'class="character1"' in tag
    result = convert(src[1], 1800 if hero else 1000)
    if not result:
        return tag
    image_path, width, height = result
    tag = tag.replace(src[0], f'src="{image_path}"')
    tag = tag.replace(' />', '>')
    attrs = f' width="{width}" height="{height}" decoding="async"'
    attrs += ' fetchpriority="high"' if hero else ' loading="lazy"'
    return tag[:-1] + attrs + '>'

page = re.sub(r'<img\b[^>]*>', replace_image, page, flags=re.S)
(root / 'index.html').write_text(page, encoding='utf-8')
head = convert('images/nidhiHead.png', 256)
if head:
    for filename in ('js/skills-chart.js', 'css/responsive.css'):
        file = root / filename
        file.write_text(file.read_text(encoding='utf-8').replace('images/nidhiHead.png', head[0]), encoding='utf-8')
    with Image.open(root / 'images/nidhiHead.png') as image:
        image.thumbnail((64, 64), Image.Resampling.LANCZOS)
        image.save(output / 'favicon.png', optimize=True)
    page = (root / 'index.html').read_text(encoding='utf-8').replace('href="images/nidhiHead.png"', 'href="images/optimized/favicon.png"')
    (root / 'index.html').write_text(page, encoding='utf-8')
print(f"Converted referenced images: {stats['before']:,} to {stats['after']:,} bytes")
