"""Génère l'illustration de style anime du projet de conteneurs (SVG), puis scripts/render-illustration.js la convertit en image.

Une baleine porte les cinq dépôts d'images Docker Hub sous forme de conteneurs ;
un personnage chibi pousse une image depuis son portable, devant un grand soleil couchant.
"""
import random

random.seed(7)
W, H = 1200, 450
o = []
add = o.append


def sparkle(x, y, s=1.0, fill="#fff", op=1.0):
    add(f'<path transform="translate({x} {y}) scale({s})" d="M0 -9 Q0.8 -0.8 9 0 Q0.8 0.8 0 9 Q-0.8 0.8 -9 0 Q-0.8 -0.8 0 -9Z" fill="{fill}" opacity="{op}"/>')


def cloud(x, y, s, top="#ffc6e8", under="#6a46c4", op=0.65):
    add(f'<g transform="translate({x} {y}) scale({s})" opacity="{op}">')
    add(f'<ellipse cx="0" cy="14" rx="120" ry="16" fill="{under}"/>')
    for cx, cy, r in [(-60, 2, 30), (-20, -14, 42), (28, -6, 36), (70, 4, 26)]:
        add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{top}"/>')
    add(f'<ellipse cx="0" cy="20" rx="125" ry="14" fill="{under}" opacity=".55"/>')
    add('</g>')


add(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="JetBrains Mono Variable, monospace">')
add('''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050818"/><stop offset=".42" stop-color="#252a78"/><stop offset=".74" stop-color="#8f52e0"/><stop offset="1" stop-color="#ff9fcf"/></linearGradient>
<radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe0"/><stop offset=".62" stop-color="#ffd7e8"/><stop offset="1" stop-color="#ff9fcf"/></radialGradient>
<radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb8e0" stop-opacity=".75"/><stop offset="1" stop-color="#ffb8e0" stop-opacity="0"/></radialGradient>
<linearGradient id="whale" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#69b0ff"/><stop offset="1" stop-color="#3f6fe6"/></linearGradient>
<linearGradient id="belly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0faff"/><stop offset="1" stop-color="#bfe0ff"/></linearGradient>
<linearGradient id="iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b57c4"/><stop offset="1" stop-color="#0b1550"/></linearGradient>
<linearGradient id="seaFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d4cb8"/><stop offset="1" stop-color="#091245"/></linearGradient>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>''')

# --- ciel
add(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
for _ in range(70):
    x, y = random.randint(10, W - 10), random.randint(6, 190)
    add(f'<circle cx="{x}" cy="{y}" r="{random.choice([0.8, 1.1, 1.5])}" fill="#fff" opacity="{random.choice([.4, .6, .9])}"/>')
for x, y, s in [(90, 60, 1.3), (330, 36, 1.0), (700, 46, 1.4), (790, 30, 1.0), (1130, 54, 1.5), (210, 150, .8), (1150, 160, 1.0)]:
    sparkle(x, y, s)

# soleil + halo
add('<circle cx="1000" cy="250" r="230" fill="url(#halo)"/>')
add('<circle cx="1000" cy="250" r="112" fill="url(#sun)"/>')
for dy in (30, 60, 88):
    add(f'<rect x="880" y="{250 + dy}" width="240" height="{2 + dy // 30}" fill="#ff9fcf" opacity=".55"/>')

cloud(120, 120, 1.0)
cloud(470, 70, .8, op=.5)
cloud(760, 104, .9, op=.55)
cloud(1110, 92, 1.0, op=.6)
cloud(250, 330, 1.3, op=.5)
cloud(1000, 360, 1.4, op=.55)

# mer (arrière)
add(f'<rect x="0" y="370" width="{W}" height="{H - 370}" fill="url(#sea)"/>')
add('<path d="M0 372 H1200" stroke="#9fd8ff" stroke-width="2" opacity=".5"/>')
add('<rect x="880" y="372" width="240" height="78" fill="#ffb3d9" opacity=".22" filter="url(#soft)"/>')

# pétales : derrière la baleine et les conteneurs, pour ne jamais masquer une étiquette
for _ in range(16):
    x, y, r = random.randint(30, 1170), random.randint(40, 340), random.randint(0, 180)
    add(f'<ellipse cx="{x}" cy="{y}" rx="6" ry="3.2" fill="#ffc2e0" opacity="{random.choice([.5, .7, .9])}" transform="rotate({r} {x} {y})"/>')

# --- baleine (queue, corps, ventre, nageoire)
add('<g stroke="#2347a8" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">')
add('<path d="M360 270 C320 270 285 245 275 215 C255 222 232 214 222 190 C250 188 266 194 276 202 C270 178 276 158 292 146 C298 170 308 188 326 204 C348 224 372 238 380 252 Z" fill="url(#whale)"/>')
add('<path d="M330 290 C330 215 420 190 520 188 C640 186 790 205 805 290 C815 352 725 394 605 396 C470 398 330 362 330 290 Z" fill="url(#whale)"/>')
add('</g>')
add('<path d="M362 318 C440 376 706 390 796 316 C782 362 706 396 605 396 C484 396 384 368 362 318 Z" fill="url(#belly)"/>')
add('<path d="M388 216 C450 198 560 194 650 200" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".3"/>')
add('<path d="M540 338 C562 330 604 346 616 378 C588 374 550 364 540 338 Z" fill="#3c5fd0" stroke="#2347a8" stroke-width="3" stroke-linejoin="round"/>')
for x in (396, 428, 462):  # rainures du ventre
    add(f'<path d="M{x} 340 q10 14 28 20" stroke="#8ab6e8" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".7"/>')

# jet d'eau
add('<g stroke="#d7f1ff" stroke-width="5" stroke-linecap="round" fill="none">')
add('<path d="M764 204 q-4 -32 -24 -48"/><path d="M764 204 q10 -36 30 -44"/><path d="M764 204 q2 -42 2 -58"/>')
add('</g>')
for x, y, r in [(738, 150, 4), (796, 152, 4), (766, 138, 5), (722, 168, 3), (812, 172, 3)]:
    add(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#d7f1ff"/>')
sparkle(776, 122, 1.2, "#fff")

# visage de la baleine
add('<ellipse cx="736" cy="326" rx="17" ry="9" fill="#ff8fb8" opacity=".7"/>')
add('<ellipse cx="745" cy="283" rx="21" ry="25" fill="#fff" stroke="#14214f" stroke-width="2.5"/>')
add('<ellipse cx="748" cy="287" rx="15" ry="20" fill="url(#iris)"/>')
add('<ellipse cx="749" cy="289" rx="8" ry="11" fill="#150c3a"/>')
add('<circle cx="741" cy="277" r="6.5" fill="#fff"/><circle cx="755" cy="297" r="3.2" fill="#fff" opacity=".9"/>')
add('<path d="M722 274 Q744 250 770 270" stroke="#14214f" stroke-width="4.5" fill="none" stroke-linecap="round"/>')
add('<path d="M723 274 L714 267" stroke="#14214f" stroke-width="3" stroke-linecap="round"/>')
add('<path d="M764 332 Q782 346 798 330" stroke="#14214f" stroke-width="3.5" fill="none" stroke-linecap="round"/>')

# --- conteneurs sur le dos : les cinq dépôts Docker Hub
CRATES = [("ecommerce", "#22d3ee"), ("ticket-api", "#a78bfa"), ("next-app", "#f472b6"), ("todo-app", "#fbbf24"), ("rynah_app", "#4ade80")]
POS = [(420, 142), (524, 142), (628, 142), (472, 90), (576, 90)]


def crate(x, y, w, h, color, label, fs=14):
    add(f'<g transform="translate({x} {y})">')
    add(f'<rect width="{w}" height="{h}" rx="4" fill="{color}" stroke="#0a1244" stroke-width="2.5"/>')
    for i in range(1, 6):
        add(f'<line x1="{i * w / 6:.1f}" y1="5" x2="{i * w / 6:.1f}" y2="{h - 5}" stroke="#0a1244" stroke-width="1.4" opacity=".28"/>')
    add(f'<rect x="3" y="3" width="{w - 6}" height="5" rx="2" fill="#fff" opacity=".4"/>')
    add(f'<text x="{w / 2}" y="{h / 2 + fs / 3 + 3}" text-anchor="middle" font-size="{fs}" font-weight="800" fill="#07102b">{label}</text>')
    add('</g>')


for (label, color), (x, y) in zip(CRATES, POS):
    crate(x, y, 104, 52, color, label)
add('<text x="472" y="80" font-size="12" font-weight="700" fill="#e8f1ff" opacity=".9">hub.docker.com/u/rynah</text>')

# --- personnage chibi devant le soleil
add('<path d="M945 336 C945 286 965 262 1000 262 C1035 262 1055 286 1055 336 Z" fill="#6d4aff" stroke="#2c1a8f" stroke-width="3"/>')
add('<ellipse cx="1000" cy="262" rx="40" ry="14" fill="#5a3de0" stroke="#2c1a8f" stroke-width="3"/>')
add('<rect x="990" y="240" width="20" height="26" rx="8" fill="#f7cdb4"/>')
add('<path d="M984 280 v22 M1016 280 v22" stroke="#e9e3ff" stroke-width="3" stroke-linecap="round"/>')
crate(925, 332, 150, 80, "#22d3ee", "latest", 16)
# ordinateur
add('<rect x="956" y="280" width="88" height="48" rx="6" fill="#d9dff0" stroke="#5b6894" stroke-width="3"/>')
add('<rect x="948" y="324" width="104" height="9" rx="4" fill="#aab4cf" stroke="#5b6894" stroke-width="2.5"/>')
add('<g transform="translate(1000 304)"><circle r="13" fill="#0f1b4d"/><ellipse cx="-1" cy="1" rx="8" ry="5" fill="#22d3ee"/><path d="M6 1 l6 -4 v8z" fill="#22d3ee"/><circle cx="-4" cy="-1" r="1.2" fill="#0f1b4d"/></g>')
for sx in (940, 1038):
    add(f'<rect x="{sx}" y="296" width="22" height="36" rx="11" fill="#6d4aff" stroke="#2c1a8f" stroke-width="3"/>')
# tête
add('<ellipse cx="1000" cy="196" rx="55" ry="54" fill="#1d1a46"/>')
add('<ellipse cx="1000" cy="203" rx="44" ry="42" fill="#ffe3d0" stroke="#d9a58a" stroke-width="2"/>')
add('<path d="M960 214 q-4 -22 6 -38 q-4 28 14 44 q-16 4 -20 -6Z" fill="#f2c4aa" opacity=".6"/>')
add('<path d="M950 196 C946 152 972 140 1000 140 C1030 140 1054 152 1050 196 C1042 176 1034 168 1022 166 C1016 182 1004 186 996 170 C988 182 972 184 964 168 C958 178 954 188 950 196 Z" fill="#2c2766" stroke="#14122e" stroke-width="2.5" stroke-linejoin="round"/>')
add('<path d="M972 150 q12 -8 26 -6 M1004 146 q16 0 28 8" stroke="#5d56b8" stroke-width="3.5" stroke-linecap="round" fill="none"/>')
add('<path d="M953 206 C948 224 952 240 962 246 C958 232 960 218 962 206 Z M1047 206 C1052 224 1048 240 1038 246 C1042 232 1040 218 1038 206 Z" fill="#2c2766" stroke="#14122e" stroke-width="2"/>')
for ex in (982, 1018):
    add(f'<g transform="translate({ex} 208)"><ellipse rx="10" ry="13" fill="#fff"/><ellipse cx="1" cy="1" rx="8" ry="11" fill="url(#iris)"/><ellipse cx="1" cy="2" rx="4" ry="6" fill="#150c3a"/><circle cx="-3" cy="-4" r="3.4" fill="#fff"/><circle cx="4" cy="5" r="1.7" fill="#fff" opacity=".9"/><path d="M-11 -4 Q0 -17 11 -4" stroke="#14122e" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>')
add('<path d="M972 191 L989 188 M1011 188 L1028 191" stroke="#2c2766" stroke-width="3" stroke-linecap="round"/>')
add('<path d="M994 228 Q1000 238 1006 228 Z" fill="#c0405f" stroke="#7a1f3a" stroke-width="1.6" stroke-linejoin="round"/>')
add('<ellipse cx="967" cy="222" rx="8" ry="4.5" fill="#ff7aa8" opacity=".55"/><ellipse cx="1033" cy="222" rx="8" ry="4.5" fill="#ff7aa8" opacity=".55"/>')
# casque audio
add('<path d="M946 198 C944 128 1056 128 1054 198" stroke="#22d3ee" stroke-width="7" fill="none" stroke-linecap="round"/>')
for hx in (936, 1048):
    add(f'<rect x="{hx}" y="190" width="16" height="38" rx="8" fill="#22d3ee" stroke="#0e7490" stroke-width="2.5"/><rect x="{hx + 4}" y="198" width="8" height="22" rx="4" fill="#a5f3fc" opacity=".7"/>')

# bulle + push
add('<g><rect x="800" y="118" width="132" height="36" rx="18" fill="#0b1240" stroke="#22d3ee" stroke-width="2.5"/><path d="M910 154 l18 22 l-4 -24z" fill="#0b1240" stroke="#22d3ee" stroke-width="2.5" stroke-linejoin="round"/><rect x="908" y="150" width="14" height="6" fill="#0b1240"/>')
add('<text x="866" y="141" text-anchor="middle" font-size="14" font-weight="800" fill="#e8f1ff">docker push <tspan fill="#4ade80">✓</tspan></text></g>')
add('<path d="M926 296 C880 300 842 262 808 214" stroke="#22d3ee" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 10" fill="none"/>')
add('<g transform="translate(866 262) rotate(-24)"><rect x="-26" y="-13" width="52" height="26" rx="3" fill="#4ade80" stroke="#0a1244" stroke-width="2.2"/><text y="5" text-anchor="middle" font-size="12" font-weight="800" fill="#07102b">v2.0</text></g>')
add('<path d="M826 276 h-26 M830 266 h-20 M834 286 h-18" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>')

# eau avant
wave = "M0 392 " + "q30 -13 60 0 t60 0 " * 10
add(f'<path d="{wave} L1200 450 L0 450 Z" fill="url(#seaFront)"/>')
add('<path d="M0 392 ' + 'q30 -13 60 0 t60 0 ' * 10 + '" stroke="#bfe6ff" stroke-width="3" fill="none" opacity=".7"/>')
add('<path d="M0 412 ' + 'q40 -10 80 0 t80 0 ' * 8 + '" stroke="#7fb4ff" stroke-width="2" fill="none" opacity=".45"/>')

# pétales et étoiles filantes
for x, y, s in [(690, 330, .9), (380, 120, 1.1), (900, 300, 1.2), (1100, 250, .9), (600, 25, 1.0), (60, 250, 1.1)]:
    sparkle(x, y, s, "#fff", .95)
add('<g transform="translate(250 60) rotate(-18)"><path d="M0 0 H70" stroke="url(#sky)" stroke-width="2"/><path d="M0 0 H70" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/><circle r="3.2" fill="#fff"/></g>')

add('</svg>')
open("scripts/docker-whale.svg", "w").write("\n".join(o))
print("scripts/docker-whale.svg", sum(len(x) for x in o), "octets")
