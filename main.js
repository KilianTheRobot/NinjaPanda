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

  // speed mechanics
  let baseSpeed = 300; // px/s
  let speed = baseSpeed;
  const speedIncreasePerSecond = 6; // px/s per second

  // timing
  let lastTime = 0;

  function reset(){
    running = true;
    score = 0;
    speed = baseSpeed;
    obstacles = [];
    spawnTimer = 0.8;
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
    const h = 30 + Math.random() * 60;
    const w = 20 + Math.random() * 40;
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
      spawnTimer = 0.9 + Math.random() * 0.8 - Math.min(0.6, speed/1000);
    }

    // update obstacles
    for(let i = obstacles.length-1;i>=0;i--){
      obstacles[i].x -= speed * dt;
      if(obstacles[i].x + obstacles[i].w < -50) obstacles.splice(i,1);
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

    // collisions
    for(const o of obstacles){
      if(rectOverlap(player.x, player.y, player.w, player.h, o.x, o.y, o.w, o.h)){
        gameOver();
        return;
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

    // sky background
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#cbeeff');
    grad.addColorStop(1,'#e8faff');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    // clouds (parallax)
    drawCloud(W*0.2 + Math.sin(performance.now()/1000)*40, H*0.18, 80, 30, '#fff');
    drawCloud(W*0.7 + Math.cos(performance.now()/1300)*50, H*0.12, 120, 40, '#fff');

    // ground
    ctx.fillStyle = '#7ad0ff';
    ctx.fillRect(0, groundY(), W, H - groundY());

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

    // obstacles
    for(const o of obstacles){
      ctx.fillStyle = '#ff6b6b';
      roundRect(ctx, o.x, o.y, o.w, o.h, 6, true, false);
      // small detail
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(o.x + 4, o.y + 4, Math.min(10, o.w-8), 6);
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
      player.vy = -780; // impulse
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
