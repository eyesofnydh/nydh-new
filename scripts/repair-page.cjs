// One-time migration: restore the maintained feature files and stylesheet order.
const fs = require('node:fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<style>[\s\S]*?<\/style>/g, '')
  .replace(/<script>\s*const canvas[\s\S]*?<\/script>/, '<script src="js/snake-game.js"></script>')
  .replace(/<script>\s*\(function\(\)[\s\S]*?<\/script>/, '<script src="js/dino-game.js"></script>');
html = html.replace(/\s*<link rel="stylesheet" href="css\/[^"]+">/g, '');
html = html.replace('<link rel="stylesheet" href="style.css" />', `<link rel="stylesheet" href="style.css" />
  <link rel="stylesheet" href="css/skills-chart.css">
  <link rel="stylesheet" href="css/guestbook.css">
  <link rel="stylesheet" href="css/snake-game.css">
  <link rel="stylesheet" href="css/responsive.css">`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, '<script defer src="$1"></script>');
html = html.replace('<a href=""><h1>', '<a href="#home" aria-label="Nidhin home"><h1>')
  .replace('<div class="close" role="button" tabindex="0" aria-label="Close menu">\r\n              <i class="fas fa-times"></i>\r\n            </div>', '<button type="button" class="close" aria-label="Close menu">×</button>')
  .replace(/<div class="hamburger"[^>]*>[\s\S]*?<\/div>/, '<button type="button" class="hamburger" aria-label="Open menu" aria-controls="navigation-menu" aria-expanded="false"><span aria-hidden="true">☰</span></button>')
  .replace(/<div class="mobile-warning">[\s\S]*?<\/div>/, '<p class="game-help">Arrow keys or WASD on desktop. Use the direction buttons on touch screens.</p>')
  .replace('onclick="startGame()"', 'data-snake-start')
  .replace('onclick="startGame()"', 'data-snake-start')
  .replaceAll('onclick="closePopup()"', 'data-snake-begin')
  .replace('<div class="popup-wrapper" id="popupWrapper">', '<div class="popup-wrapper" id="popupWrapper" style="display:none">')
  .replace('<div class="glass-popup">', '<div class="glass-popup" role="dialog" aria-label="Snake game instructions">')
  .replace('      ⏸️ MISSION PAUSED', '      ⏸️ MISSION PAUSED')
  .replace('to Resume</small>', 'or the pause button to resume</small>')
  .replace('    <!-- Game Over Message -->', `    <div class="snake-touch-controls" aria-label="Snake controls">
      <button type="button" data-direction="up" aria-label="Move up">↑</button>
      <div><button type="button" data-direction="left" aria-label="Move left">←</button>
      <button type="button" id="snake-pause" aria-label="Pause game" aria-pressed="false">Ⅱ</button>
      <button type="button" data-direction="right" aria-label="Move right">→</button></div>
      <button type="button" data-direction="down" aria-label="Move down">↓</button>
    </div>
    <!-- Game Over Message -->`)
  .replace('<span id="type2" class="typeit"></span>', '<span id="type2" class="typeit">Quality Analyst</span>')
  .replace('data-aos="fade-dowm"', 'data-aos="fade-down"')
  .replace(/<\/a>\s*<\/a>/g, '</a>')
  .replace(/target="_blank"(?! rel=)/g, 'target="_blank" rel="noopener noreferrer"')
  .replace('class="box123-popup-content box123-slide-in"', 'class="box123-popup-content box123-slide-in" role="dialog" aria-modal="true" aria-label="About Nidhin"')
  .replace('id="author-name"', 'id="author-name" aria-label="Your name" maxlength="100"')
  .replace('id="message-text"', 'id="message-text" aria-label="Guestbook message" maxlength="2000"')
  .replace('class="portfolio-item"', 'class="portfolio-item" tabindex="0"');
html = html.replaceAll('class="portfolio-item">', 'class="portfolio-item" tabindex="0">');
// Name icon-only links without changing their appearance.
html = html.replace(/<a ([^>]+)>\s*<i class="fab fa-([^" ]+)"><\/i>/g,
  (_, attrs, icon) => `<a ${attrs} aria-label="${icon}"><i class="fab fa-${icon}"></i>`);
html = html.replace('<canvas id="gameCanvas" width="800" height="500"></canvas>', '<canvas id="gameCanvas" width="800" height="500" aria-label="Snake game board">Use the direction controls to play Snake.</canvas>');
fs.writeFileSync('index.html', html);
let guest = fs.readFileSync('css/guestbook.css', 'utf8');
guest = guest.replaceAll('animation: float ', 'animation: guestbook-float ').replace('@keyframes float', '@keyframes guestbook-float');
fs.writeFileSync('css/guestbook.css', guest);
let css = fs.readFileSync('style.css', 'utf8');
css = css.replace('.label {\r\n  position: absolute;', '.top-reveal .label {\r\n  position: absolute;');
fs.writeFileSync('style.css', css);
