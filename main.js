// NinjaPanda Runner - main game script
(function(){
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highscoreEl = document.getElementById('highscore');
  const overlay = document.getElementById('overlay');
  const overlayContent = document.getElementById('overlay-content');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayScore = document.getElementById('overlay-score');
  const restartBtn = document.getElementById('restart');

  // resolution handling
  function resizeCanvas(){
    const ratio = canvas.width / canvas.height;
    const w = canvas.clientWidth;
    canvas.width = Math.max(600, Math.floor(w));
    canvas.height = Math.floor(canvas.width / ratio);
  }
  // initial virtual size
  canvas.width = 900;
  canvas.height = 400;
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // game state
  let running = false;
  let score = 0;
  let highscore = parseInt(localStorage.getItem('np_highscore') || '0',10) || 0;
  highscoreEl.textContent = 'Best: ' + highscore;

  // world
  const groundY = () => canvas.height * 0.8;
  const gravity = 2000; // px/s^2

  // player
  const player = {
    x: 80,
    y: 0,
    w: 64,
    h: 64,
    vy: 0,
    onGround: false
  };

  // panda sprite (user will replace assets/panda.png)
  const pandaImg = new Image();
  pandaImg.src = 'assets/panda.png';
  pandaImg.onerror = ()=>{ /* placeholder drawing */ };

  // obstacles
  let obstacles = [];
  let spawnTimer = 0;

  // speed mechanics (easier settings)
  let baseSpeed = 200; // px/s (reduced from 300)
  let speed = baseSpeed;
  const speedIncreasePerSecond = 3; // px/s per second (reduced from 6)

  // timing
  let lastTime = 0;

  function reset(){
    running = true;
    score = 0;
    speed = baseSpeed;
    obstacles = [];
    spawnTimer = 1.2; // Längere Wartezeit am Start (vorher 0.8)
    player.y = groundY() - player.h;
    player.vy = 0;
    player.onGround = true;
    overlay.style.display = 'none'; // Komplett ausblenden
    overlayContent.style.visibility = 'collapse'; // Overlay-Content ausblenden
    overlay.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function gameOver(){
    running = false;
    overlay.style.display = ''; // Wieder anzeigen
    overlayContent.style.visibility = 'visible'; // Overlay-Content wieder anzeigen
    overlay.classList.remove('hidden');
    overlayTitle.textContent = 'Game Over';
    overlayScore.textContent = 'Score: ' + Math.floor(score);
    if(Math.floor(score) > highscore){
      highscore = Math.floor(score);
      localStorage.setItem('np_highscore', String(highscore));
      highscoreEl.textContent = 'Best: ' + highscore;
      overlayTitle.textContent = 'Neuer Highscore!';
    }
  }

  function spawnObstacle(){
    const h = 20 + Math.random() * 40; // Kleinere Höhe (vorher 30-90, jetzt 20-60)
    const w = 15 + Math.random() * 25; // Schmaler (vorher 20-60, jetzt 15-40)
    const y = groundY() - h;
    obstacles.push({x: canvas.width + 20, y, w, h});
  }

 function loop(t){
    if(!running) return;
    const dt = Math.min(0.05, (t - lastTime) / 1000);
    lastTime = t;

    // update speed
    speed += speedIncreasePerSecond * dt;

    // spawn obstacles
    spawnTimer -= dt;
    if(spawnTimer <= 0){
      spawnObstacle();
      spawnTimer = 1.2 + Math.random() * 1.0 - Math.min(0.4, speed/1000);
    }

    // update obstacles - mit Sicherheitsprüfungen
    if(!Array.isArray(obstacles)) {
      console.warn('Obstacles wurde zurückgesetzt');
      obstacles = [];
    }
    
    // Update und Bereinigung der Hindernisse
    for(let i = obstacles.length-1; i >= 0; i--){
      if(obstacles[i] && typeof obstacles[i].x === 'number' && typeof obstacles[i].w === 'number'){
        obstacles[i].x -= speed * dt;
        if(obstacles[i].x + obstacles[i].w < -50){
          obstacles.splice(i,1);
        }
      } else {
        obstacles.splice(i,1); // Entferne ungültige Hindernisse
      }
    }

    // update player physics
    if(!player.onGround){
      player.vy += gravity * dt;
      player.y += player.vy * dt;
      if(player.y + player.h >= groundY()){
        player.y = groundY() - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }

    // collisions mit Sicherheitsprüfungen
    for(const o of obstacles){
      if(o && typeof o.x === 'number' && typeof o.y === 'number' && 
         typeof o.w === 'number' && typeof o.h === 'number'){
        if(rectOverlap(player.x, player.y, player.w, player.h, o.x, o.y, o.w, o.h)){
          gameOver();
          return;
        }
      }
    }

    // scoring
    score += 10 * dt * (speed/baseSpeed);
    scoreEl.textContent = 'Score: ' + Math.floor(score);

    render();
    requestAnimationFrame(loop);
  }

  function rectOverlap(x1,y1,w1,h1,x2,y2,w2,h2){
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  function render(){
    const W = canvas.width, H = canvas.height;
    // clear
    ctx.clearRect(0,0,W,H);

    // sky background with rainbow gradient
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#87CEEB');  // Hellblau oben
    grad.addColorStop(0.3,'#E0B0FF'); // Pastell-Lila
    grad.addColorStop(0.6,'#FFB6C1'); // Helles Rosa
    grad.addColorStop(1,'#98FB98');   // Helles Grün unten
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    // bunte Wolken (parallax)
    const cloudColors = ['#FFB6C1', '#B0E0E6', '#DDA0DD', '#F0E68C'];
    drawCloud(W*0.2 + Math.sin(performance.now()/1000)*40, H*0.18, 80, 30, cloudColors[0]);
    drawCloud(W*0.5 + Math.cos(performance.now()/1200)*30, H*0.25, 60, 25, cloudColors[1]);
    drawCloud(W*0.7 + Math.cos(performance.now()/1300)*50, H*0.12, 120, 40, cloudColors[2]);
    drawCloud(W*0.9 + Math.sin(performance.now()/900)*35, H*0.2, 70, 28, cloudColors[3]);

    // ground with pattern
    const groundGrad = ctx.createLinearGradient(0, groundY(), 0, H);
    groundGrad.addColorStop(0, '#90EE90');  // Helles Grün
    groundGrad.addColorStop(1, '#228B22');  // Dunkleres Grün
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY(), W, H - groundY());
    
    // Bunte Blumen im Boden
    for(let x = 0; x < W; x += 100) {
      const offset = Math.sin(x * 0.1 + performance.now() * 0.001) * 10;
      ctx.fillStyle = ['#FF69B4', '#FFD700', '#FF6B6B', '#4169E1'][Math.floor(x/100) % 4];
      ctx.beginPath();
      ctx.arc(x + 20, groundY() + 15 + offset, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // player (panda)
    if(pandaImg.complete && pandaImg.naturalWidth){
      ctx.drawImage(pandaImg, player.x, player.y, player.w, player.h);
    } else {
      // placeholder panda: white circle with black eyes
      ctx.fillStyle = '#fff';
      roundRect(ctx, player.x, player.y, player.w, player.h, 12, true, false);
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(player.x+player.w*0.3, player.y+player.h*0.35, 6,9,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(player.x+player.w*0.7, player.y+player.h*0.35, 6,9,0,0,Math.PI*2); ctx.fill();
    }

    // bunte Hindernisse
    const obstacleColors = [
      {main: '#FF69B4', detail: '#FFB6C1'}, // Pink
      {main: '#87CEEB', detail: '#B0E0E6'}, // Hellblau
      {main: '#DDA0DD', detail: '#E6E6FA'}, // Lavendel
      {main: '#98FB98', detail: '#90EE90'}  // Hellgrün
    ];
    
    for(const o of obstacles){
      if(o && typeof o.x === 'number' && typeof o.y === 'number' && 
         typeof o.w === 'number' && typeof o.h === 'number') {
        const color = obstacleColors[Math.floor(Math.abs(o.x)/100) % obstacleColors.length];
        // Hauptfarbe mit Gradient
        const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
        grad.addColorStop(0, color.main);
        grad.addColorStop(1, color.detail);
        ctx.fillStyle = grad;
        roundRect(ctx, o.x, o.y, o.w, o.h, 6, true, false);
      
      // Glitzernde Details
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.6 + Math.sin(performance.now() * 0.005 + o.x) * 0.4;
        ctx.beginPath();
        ctx.arc(o.x + o.w/2, o.y + o.h/3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    // ground line
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath(); ctx.moveTo(0, groundY()); ctx.lineTo(W, groundY()); ctx.stroke();
  }

  function drawCloud(x,y,w,h,color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, w*0.6, h*0.6, 0, 0, Math.PI*2);
    ctx.ellipse(x + w*0.4, y + 5, w*0.45, h*0.5, 0, 0, Math.PI*2);
    ctx.ellipse(x - w*0.35, y + 5, w*0.45, h*0.45, 0, 0, Math.PI*2);
    ctx.fill();
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof radius === 'undefined') radius = 5;
    if (typeof radius === 'number') radius = {tl: radius, tr: radius, br: radius, bl: radius};
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // input handling
  function jump(){
    if(!running) return;
    if(player.onGround){
      player.vy = -850; // Stärkerer Sprung (vorher -780)
      player.onGround = false;
    }
  }

  window.addEventListener('keydown', (e)=>{
    if(e.code === 'Space' || e.code === 'ArrowUp'){
      e.preventDefault();
      jump();
    }
    if(e.key === 'r' || e.key === 'R'){
      if(!running) reset();
    }
  });

  // touch / click controls
  canvas.addEventListener('touchstart', (e)=>{ 
    e.preventDefault(); 
    if(!running) {
      reset();
    } else {
      jump();
    }
  });
  canvas.addEventListener('mousedown', ()=>{ 
    if(!running) {
      reset();
    } else {
      jump();
    }
  });

  restartBtn.addEventListener('click', ()=>{ 
    reset();
  });

  // initial render and start
  render();
  overlay.classList.remove('hidden');
  overlayTitle.textContent = 'Bereit?';
  overlayScore.textContent = 'Tippe um zu starten';

  // start when overlay clicked
  overlay.addEventListener('click', (e)=>{
    if(e.target === overlay || e.target === restartBtn) return;
    reset();
  });

})();
