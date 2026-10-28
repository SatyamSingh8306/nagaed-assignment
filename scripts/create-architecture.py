"""Generate the one-page submission diagram using Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
image = Image.new("RGB", (1600, 1080), "#f4f8f6")
draw = ImageDraw.Draw(image)
fonts = Path("C:/Windows/Fonts")

def font(size, bold=False):
    return ImageFont.truetype(str(fonts / ("segoeuib.ttf" if bold else "segoeui.ttf")), size)

def text(x, y, value, size=23, color="#254b40", bold=False):
    draw.multiline_text((x, y), value, font=font(size, bold), fill=color, spacing=9)

def box(bounds, title, lines, color="#ffffff"):
    x, y, right, bottom = bounds
    draw.rounded_rectangle(bounds, radius=18, fill=color, outline="#abc3b8", width=2)
    text(x + 25, y + 19, title, 28, bold=True)
    text(x + 25, y + 66, lines, 22)

def arrow(start, end, label, position):
    draw.line([start, end], fill="#427762", width=4)
    x, y = end
    sx, sy = start
    if x > sx:
        head = [(x, y), (x-13, y-7), (x-13, y+7)]
    elif x < sx:
        head = [(x, y), (x+13, y-7), (x+13, y+7)]
    else:
        head = [(x, y), (x-7, y-13), (x+7, y-13)]
    draw.polygon(head, fill="#427762")
    text(*position, label, 20)

text(65, 35, "NagaEd | Registration & AI username suggestions", 38, bold=True)
text(65, 95, "React + Express + FastAPI / LangChain Groq + MySQL", 23)
box((65, 165, 420, 340), "Browser", "Register / Login / Dashboard\nJWT in tab sessionStorage\nSame-origin HTTP requests")
box((540, 165, 1035, 340), "web :8080 | Nginx + React", "Only published port: localhost:8080\nServes React, proxies API and docs\nAI throttling + browser security headers", "#e6f1eb")
arrow((420, 250), (540, 250), "HTTP", (451, 211))
box((65, 465, 675, 680), "api :3000 | Express", "Routes > Controllers > Services > Repository\nBcrypt + JWT validation + input validation\nLogin / registration / general rate limits")
box((855, 465, 1535, 680), "ai :8000 | FastAPI", "Router > AI service > Groq provider\nLangChain ChatGroq + Pydantic JSON validation\nBounded timeouts + transient retry + /docs")
draw.line([(680,340),(680,395),(365,395)],fill="#427762",width=4)
arrow((365,395),(365,465),"/api/*",(400,411))
draw.line([(895,340),(895,395),(1190,395)],fill="#427762",width=4)
arrow((1190,395),(1190,465),"/api/suggest-username, /docs",(1212,400))
box((65, 795, 675, 965), "db :3306 | MySQL 8.4", "Parameterized SQL; unique email; password hash\nPersistent volume: mysql_data\nSchema auto-initialized from backend/database")
arrow((365,680),(365,795),"MySQL protocol via db:3306",(385,719))
box((855, 795, 1535, 965), "Groq Cloud | External", "LLM: openai/gpt-oss-120b\nGROQ_API_KEY stays in the AI container\nThree creative, distinct username suggestions", "#f5edda")
arrow((1190,680),(1190,795),"HTTPS :443 + provider API key",(1210,705))
text(65, 1010, "Compose private network: web -> api:3000 / ai:8000; api -> db:3306. Secrets come from .env.", 22)
image.save(root / "architecture.png")
print(root / "architecture.png")
