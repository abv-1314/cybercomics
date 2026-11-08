# Тестовая обёртка: python3 concepts/issues/wrap.py <slug>  ->  concepts/issues/test/<slug>.html (открывать через file://)
# Берёт фрагмент и шрифты из этого репозитория. Папка test/ в git не попадает.
import sys, os
H = os.path.dirname(os.path.abspath(__file__))
S = os.path.normpath(os.path.join(H, '..', '..', 'src', 'static'))
for slug in sys.argv[1:]:
    frag = open(f'{H}/{slug}.html', encoding='utf8').read().replace('IMGROOT/', f'file://{S}/img/')
    fonts = open(f'{S}/fonts.css', encoding='utf8').read().replace('url(fonts/', f'url(file://{S}/fonts/')
    page = ('<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<style>{fonts}\nbody{{margin:0;background:#fff7e3;color:#141414;font-family:Rubik,system-ui,sans-serif}}'
            '.site-header-stub{height:120px;display:grid;place-items:center;border-bottom:3px solid #141414;font-family:"Russo One"}</style></head>'
            f'<body><div class="site-header-stub">[шапка выпуска сайта]</div><main style="padding:24px 16px 80px">{frag}</main></body></html>')
    os.makedirs(f'{H}/test', exist_ok=True)
    open(f'{H}/test/{slug}.html', 'w', encoding='utf8').write(page)
    print('ok', f'{H}/test/{slug}.html')
