// --- GAME DATA & CONFIG ---
const FIGHTERS = {
    buakaw: { id: 'buakaw', name: 'บัวขาว บัญชาเมฆ', alias: 'ดำดอทคอม', power: 90, speed: 75, hp: 120, color: '#DC2626', trunk: 'red', style: 'มวยดุดัน เดินหน้าฆ่ามัน' },
    saenchai: { id: 'saenchai', name: 'แสนชัย พี.เค.', alias: 'โคตรมวย', power: 75, speed: 95, hp: 100, color: '#2563EB', trunk: 'blue', style: 'มวยฝีมือ หลบหลีกพริ้วไหว' },
    rodtang: { id: 'rodtang', name: 'รถถัง จิตรเมืองนนท์', alias: 'ดิ ไอรอนแมน', power: 85, speed: 80, hp: 130, color: '#D97706', trunk: 'yellow', style: 'มวยบู๊ คางหินทนทาน' },
    samart: { id: 'samart', name: 'สามารถ พยัคฆ์อรุณ', alias: 'พยัคฆ์หน้าหยก', power: 80, speed: 90, hp: 110, color: '#4B5563', trunk: 'white', style: 'มวยคลาสสิก สายตาดีเลิศ' }
};

const MAX_ROUNDS = 5;
const ROUND_TIME = 60;

const COMMENTARY_LINES = {
    intro: ["ยินดีต้อนรับสู่เวทีลุมพินีระดับตำนาน!", "วันนี้เรามีศึกสายเลือดที่พลาดไม่ได้!", "บรรยากาศในสนามวันนี้คึกคักสุดๆ ครับท่านผู้ชม"],
    punch: ["หมัดขวาตรงเข้าหน้า!", "โอ้โห แย็บซ้ายสวยงามครับ", "ต่อยเข้าเป้าจังๆ!", "หมัดหนักจริงๆ ครับคนนี้"],
    kick: ["เตะก้านคอ!!", "หวดแข้งซ้ายเข้าชายโครง!", "เตะหนักหน่วงมากครับ!", "จังหวะสาดแข้งทำได้เยี่ยม!"],
    hit: ["โดนเข้าไปเต็มๆ!", "มีอาการครับ มีอาการ!", "ต้องถอยแล้วครับจังหวะนี้", "หน้าสะบัดเลยครับ!"],
    miss: ["วืดครับ!", "หลบได้สวยงาม", "สับหลอกไปหนึ่งที", "จังหวะยังไม่พอดีครับ"],
    roundEnd: ["หมดยกครับ! พักกันก่อน", "เกมการชกสูสีมากในยกนี้", "ต้องไปแก้เกมกันที่มุมครับ"]
};

// --- GLOBAL STATE ---
let gameState = 'BOOT';
let player1 = null;
let player2 = null;
let requestRef = null;

const engine = {
    p1: { x: 150, y: 0, hp: 100, maxHp: 100, state: 'idle', frame: 0, dir: 1, isHit: false, score: 0 },
    p2: { x: 600, y: 0, hp: 100, maxHp: 100, state: 'idle', frame: 0, dir: -1, isHit: false, score: 0 },
    round: 1,
    time: ROUND_TIME,
    keys: { w: false, a: false, s: false, d: false, j: false, k: false },
    particles: [],
    cameraFlashes: [],
    commentary: "เตรียมตัวรันระบบเวทีลุมพินี...",
    commentaryTimer: 0,
    frameCount: 0
};

// --- DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const screens = document.querySelectorAll('.screen');

// --- UTILITIES ---
function switchScreen(screenId) {
    screens.forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    gameState = screenId.replace('screen-', '').toUpperCase().replace('-', '_');
}

function updateCommentary(type) {
    const lines = COMMENTARY_LINES[type];
    if (lines && Math.random() > 0.4) {
        const line = lines[Math.floor(Math.random() * lines.length)];
        engine.commentary = `นักพากย์: "${line}"`;
        engine.commentaryTimer = 180;
    }
}

// --- INITIALIZATION & EVENTS ---
window.onload = () => {
    // 1. Boot Sequence
    setTimeout(() => {
        switchScreen('screen-menu');
    }, 3000);

    // 2. Render Fighter Select Grid
    const grid = document.getElementById('fighter-grid');
    Object.values(FIGHTERS).forEach(fighter => {
        const btn = document.createElement('button');
        btn.className = "bg-gray-800 border-2 border-gray-600 hover:border-red-500 p-4 flex flex-col items-center justify-center hover:bg-gray-700 transition-all group w-full text-left";
        btn.innerHTML = `
            <div class="text-2xl font-bold mb-2 text-white group-hover:text-red-400 w-full text-center">${fighter.name}</div>
            <div class="text-sm text-gray-400 mb-4 w-full text-center">ฉายา: ${fighter.alias}</div>
            <div class="w-full space-y-2 text-xs">
                <div class="flex justify-between"><span>พลังหมัด:</span><div class="w-1/2 bg-gray-900 h-3"><div class="bg-red-500 h-full" style="width: ${fighter.power}%"></div></div></div>
                <div class="flex justify-between"><span>ความเร็ว:</span><div class="w-1/2 bg-gray-900 h-3"><div class="bg-blue-500 h-full" style="width: ${fighter.speed}%"></div></div></div>
                <div class="flex justify-between"><span>ความอึด:</span><div class="w-1/2 bg-gray-900 h-3"><div class="bg-green-500 h-full" style="width: ${(fighter.hp/150)*100}%"></div></div></div>
            </div>
            <div class="mt-4 text-xs text-yellow-300 italic w-full text-center">${fighter.style}</div>
        `;
        btn.onclick = () => handleSelectFighter(fighter.id);
        grid.appendChild(btn);
    });

    // 3. Button Listeners
    document.getElementById('btn-start').onclick = () => switchScreen('screen-select');
    document.getElementById('btn-fight').onclick = startFight;
    document.getElementById('btn-next-round').onclick = nextRound;
    document.getElementById('btn-reset').onclick = resetGame;

    // 4. Keyboard Listeners
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (engine.keys.hasOwnProperty(key)) engine.keys[key] = true;
    });
    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (engine.keys.hasOwnProperty(key)) engine.keys[key] = false;
    });
};

// --- GAME LOGIC ---
function handleSelectFighter(fighterId) {
    if (!player1) {
        player1 = FIGHTERS[fighterId];
        const available = Object.keys(FIGHTERS).filter(id => id !== fighterId);
        player2 = FIGHTERS[available[Math.floor(Math.random() * available.length)]];
        
        // Update Intro UI
        document.getElementById('intro-p1-name').innerText = player1.name;
        document.getElementById('intro-p1-alias').innerText = player1.alias;
        document.getElementById('intro-p2-name').innerText = player2.name;
        document.getElementById('intro-p2-alias').innerText = player2.alias;
        
        switchScreen('screen-intro');
    }
}

function startFight() {
    engine.p1.maxHp = player1.hp; engine.p1.hp = player1.hp;
    engine.p2.maxHp = player2.hp; engine.p2.hp = player2.hp;
    engine.round = 1;
    engine.time = ROUND_TIME;
    updateCommentary('intro');
    switchScreen('screen-fight');
    if (requestRef) cancelAnimationFrame(requestRef);
    requestRef = requestAnimationFrame(gameLoop);
}

function nextRound() {
    if (engine.round < MAX_ROUNDS) {
        engine.round++;
        engine.time = ROUND_TIME;
        engine.p1.x = 150; engine.p2.x = 600;
        engine.p1.hp = Math.min(engine.p1.maxHp, engine.p1.hp + 20);
        engine.p2.hp = Math.min(engine.p2.maxHp, engine.p2.hp + 20);
        switchScreen('screen-fight');
        requestRef = requestAnimationFrame(gameLoop);
    } else {
        endGame();
    }
}

function endGame() {
    document.getElementById('game-winner').innerText = engine.p1.hp > 0 ? player1.name : player2.name;
    switchScreen('screen-game-over');
    cancelAnimationFrame(requestRef);
}

function resetGame() {
    player1 = null; player2 = null;
    switchScreen('screen-menu');
}

// --- CORE GAME LOOP ---
function gameLoop() {
    if (gameState !== 'FIGHT') return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    engine.frameCount++;

    // Timer
    if (engine.frameCount % 60 === 0 && engine.time > 0) {
        engine.time--;
        if (engine.time === 0) {
            updateCommentary('roundEnd');
            document.getElementById('round-end-title').innerText = `หมดยกที่ ${engine.round}`;
            document.getElementById('round-end-p1-hp').innerText = `P1 HP: ${Math.floor(engine.p1.hp)}`;
            document.getElementById('round-end-p2-hp').innerText = `COM HP: ${Math.floor(engine.p2.hp)}`;
            document.getElementById('btn-next-round').innerText = engine.round < MAX_ROUNDS ? `ลุยต่อยก ${engine.round + 1}` : 'ดูผลการตัดสิน';
            switchScreen('screen-round-end');
            return; // Stop loop
        }
    }

    // Movement P1
    const speed = 4;
    if (engine.p1.state !== 'punch' && engine.p1.state !== 'kick' && engine.p1.state !== 'hit') {
        if (engine.keys.a) { engine.p1.x -= speed; engine.p1.state = 'walk'; }
        else if (engine.keys.d) { engine.p1.x += speed; engine.p1.state = 'walk'; }
        else { engine.p1.state = 'idle'; }
    }

    // Bounds
    engine.p1.x = Math.max(50, Math.min(engine.p1.x, width - 100));
    engine.p2.x = Math.max(50, Math.min(engine.p2.x, width - 100));

    // Attacks P1
    if (engine.keys.j && engine.p1.state !== 'punch' && engine.p1.state !== 'kick' && engine.p1.state !== 'hit') {
        engine.p1.state = 'punch'; engine.p1.frame = 20;
        checkHit(engine.p1, engine.p2, 5, 'punch');
    }
    if (engine.keys.k && engine.p1.state !== 'punch' && engine.p1.state !== 'kick' && engine.p1.state !== 'hit') {
        engine.p1.state = 'kick'; engine.p1.frame = 30;
        checkHit(engine.p1, engine.p2, 10, 'kick');
    }

    // AI P2
    if (engine.p2.state !== 'hit') {
        const dist = engine.p2.x - engine.p1.x;
        if (dist > 120) {
            engine.p2.x -= speed * 0.6; engine.p2.state = 'walk';
        } else if (dist < 80) {
            engine.p2.x += speed * 0.5; engine.p2.state = 'walk';
        } else {
            if (Math.random() < 0.02 && engine.p2.state === 'idle') {
                const isKick = Math.random() > 0.5;
                engine.p2.state = isKick ? 'kick' : 'punch';
                engine.p2.frame = isKick ? 30 : 20;
                checkHit(engine.p2, engine.p1, isKick ? 8 : 4, isKick ? 'kick' : 'punch');
            } else if (engine.p2.state !== 'punch' && engine.p2.state !== 'kick') {
                engine.p2.state = 'idle';
            }
        }
    }

    // State tick downs
    if (engine.p1.frame > 0) { engine.p1.frame--; if (engine.p1.frame === 0) engine.p1.state = 'idle'; }
    if (engine.p2.frame > 0) { engine.p2.frame--; if (engine.p2.frame === 0) engine.p2.state = 'idle'; }

    // Facing
    if (engine.p1.x < engine.p2.x) { engine.p1.dir = 1; engine.p2.dir = -1; } 
    else { engine.p1.dir = -1; engine.p2.dir = 1; }

    // Win condition
    if (engine.p1.hp <= 0 || engine.p2.hp <= 0) {
        endGame();
        return;
    }

    // DRAW
    drawBackground(ctx, width, height, engine);
    drawFighter(ctx, engine.p1, player1, true);
    drawFighter(ctx, engine.p2, player2, false);
    drawReferee(ctx, width/2, height - 150);
    drawHUD(ctx, width, height, engine);
    drawParticles(ctx, engine);

    requestRef = requestAnimationFrame(gameLoop);
}

function checkHit(attacker, defender, damage, type) {
    const reach = type === 'kick' ? 120 : 90;
    const dist = Math.abs(attacker.x - defender.x);
    if (dist < reach) {
        setTimeout(() => {
            if (defender.state !== 'hit') {
                defender.hp -= damage;
                defender.state = 'hit';
                defender.frame = 15;
                defender.x += attacker.dir * 20;
                
                for(let i=0; i<5; i++) {
                    engine.particles.push({
                        x: defender.x, y: 150,
                        vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 1) * 10,
                        life: 30
                    });
                }
                updateCommentary('hit');
            }
        }, 100);
        updateCommentary(type);
    } else {
        updateCommentary('miss');
    }
}

// --- RENDERERS ---
function drawBackground(ctx, w, h, engine) {
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#222';
    for(let i=0; i<w; i+=40) { ctx.fillRect(i, h/2 - Math.random()*50, 30, h/2); }

    if (Math.random() < 0.1) engine.cameraFlashes.push({x: Math.random()*w, y: Math.random()*(h/2), life: 5});
    engine.cameraFlashes.forEach((flash, idx) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${flash.life / 5})`;
        ctx.beginPath(); ctx.arc(flash.x, flash.y, 10, 0, Math.PI*2); ctx.fill();
        flash.life--;
        if(flash.life <= 0) engine.cameraFlashes.splice(idx, 1);
    });

    ctx.fillStyle = '#2a4d69'; ctx.fillRect(0, h - 150, w, 150);
    
    ctx.lineWidth = 4;
    ['#dc2626', '#ffffff', '#2563eb'].forEach((color, i) => {
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(0, h - 250 + (i*30)); ctx.lineTo(w, h - 250 + (i*30)); ctx.stroke();
    });

    ctx.fillStyle = '#eee';
    ctx.fillRect(50, h - 300, 20, 300);
    ctx.fillRect(w - 70, h - 300, 20, 300);
}

function drawFighter(ctx, state, fighterData, isP1) {
    if (!fighterData) return;
    const { x, y, dir } = state;
    const baseY = 450;

    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(dir, 1);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = fighterData.trunk === 'red' ? '#fca5a5' : '#93c5fd';
    if (state.state === 'hit') ctx.fillStyle = '#ff0000';

    ctx.fillRect(-15, -120, 30, 60); // Torso
    
    ctx.fillStyle = fighterData.trunk === 'red' ? '#dc2626' : (fighterData.trunk === 'blue' ? '#2563eb' : fighterData.trunk);
    ctx.fillRect(-17, -60, 34, 25); // Trunks
    
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(-12, -150, 24, 28); // Head
    ctx.fillStyle = '#fff';
    ctx.fillRect(-14, -145, 28, 5); // Mongkol

    ctx.fillStyle = '#fca5a5';
    let frontArmX = 5, frontArmY = -110, backArmX = -15, backArmY = -110;
    let frontLegX = 0, frontLegY = -35, backLegX = -10, backLegY = -35;

    if (state.state === 'walk') {
        const bob = Math.sin(engine.frameCount * 0.2) * 10;
        frontLegX += bob; backLegX -= bob;
    } else if (state.state === 'punch') {
        frontArmX += 40;
    } else if (state.state === 'kick') {
        frontLegX += 45; frontLegY -= 40;
        ctx.translate(-10, 0);
    }

    ctx.fillStyle = fighterData.trunk === 'red' ? '#991b1b' : '#1e3a8a';
    ctx.fillRect(frontArmX, frontArmY, 15, 15);
    ctx.fillRect(backArmX, backArmY, 15, 15);

    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(frontLegX-5, frontLegY, 12, 35);
    ctx.fillRect(backLegX-5, backLegY, 12, 35);

    ctx.fillStyle = '#444';
    ctx.fillRect(frontLegX-6, frontLegY+20, 14, 10);
    ctx.fillRect(backLegX-6, backLegY+20, 14, 10);

    ctx.restore();
}

function drawReferee(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y + 150);
    ctx.fillStyle = '#fff'; ctx.fillRect(-15, -100, 30, 50);
    ctx.fillStyle = '#111'; ctx.fillRect(-15, -50, 30, 50);
    ctx.fillStyle = '#fca5a5'; ctx.fillRect(-10, -120, 20, 20);
    ctx.restore();
}

function drawHUD(ctx, w, h, engine) {
    const hpWidth = 300, hpHeight = 25;
    
    ctx.fillStyle = '#333'; ctx.fillRect(50, 30, hpWidth, hpHeight);
    ctx.fillStyle = '#dc2626'; ctx.fillRect(50, 30, Math.max(0, (engine.p1.hp / engine.p1.maxHp) * hpWidth), hpHeight);
    
    ctx.fillStyle = '#333'; ctx.fillRect(w - 350, 30, hpWidth, hpHeight);
    ctx.fillStyle = '#2563eb'; 
    const p2hp = Math.max(0, (engine.p2.hp / engine.p2.maxHp) * hpWidth);
    ctx.fillRect(w - 50 - p2hp, 30, p2hp, hpHeight);

    ctx.fillStyle = '#fff';
    ctx.font = '20px "Courier New", monospace';
    ctx.textAlign = 'left'; ctx.fillText(player1 ? player1.name : 'P1', 50, 80);
    ctx.textAlign = 'right'; ctx.fillText(player2 ? player2.name : 'COM', w - 50, 80);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.fillText(engine.time, w/2, 50);
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText(`ROUND ${engine.round}/${MAX_ROUNDS}`, w/2, 80);

    if (engine.commentaryTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(w/2 - 250, h - 80, 500, 60);
        ctx.strokeStyle = '#fff'; ctx.strokeRect(w/2 - 250, h - 80, 500, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '18px Tahoma, sans-serif';
        ctx.fillText(engine.commentary, w/2, h - 45);
        engine.commentaryTimer--;
    }
}

function drawParticles(ctx, engine) {
    ctx.fillStyle = '#dc2626';
    engine.particles.forEach((p, idx) => {
        ctx.fillRect(p.x, p.y, 4, 4);
        p.x += p.vx; p.y += p.vy; p.vy += 0.5;
        p.life--;
        if(p.life <= 0) engine.particles.splice(idx, 1);
    });
}