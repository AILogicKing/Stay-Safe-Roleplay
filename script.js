document.addEventListener('DOMContentLoaded', () => {
  const shareUrl = window.location.href;
  const shareLink = document.getElementById('share-link');
  const shareQr = document.getElementById('share-qr');

  shareLink.href = shareUrl;
  shareQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`;

  document.getElementById('continue').addEventListener('click', () => {
    document.getElementById('welcome').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('game').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const locations = ['a community center', 'a school', 'a workplace', 'a home', 'a library', 'a store', 'a bus', 'a train', 'an office building', 'a park', 'a mall', 'a café', 'a restaurant', 'a gym', 'a movie theater', 'a parking lot', 'a street', 'an apartment building', 'a hotel', 'a hospital'];
  const scenarioTypes = ['loud noise', 'running people', 'unusual commotion', 'shouting', 'blocked exit', 'unfamiliar person', 'sounds of danger', 'alarm activation', 'emergency vehicle sounds', 'yelling'];
  const containerTypes = ['a room with a lock', 'a building with exits', 'an outdoor area', 'a vehicle', 'a large room', 'a small space', 'a multi-level building', 'an open floor plan', 'a confined space', 'a space with furniture'];
  const safeResponses = [
    { action: 'Move away from the sound to a known exit', wrong: ['Move toward the sound', 'Stay where you are and wait'] },
    { action: 'Lock or block the door, silence devices, and stay out of view', wrong: ['Open the door to investigate', 'Stand near the window'] },
    { action: 'Give your location to responders and follow their instructions', wrong: ['Post on social media first', 'Leave your location and move around'] },
    { action: 'Tell your trusted contact you are safe and following responders', wrong: ['Go back to find others', 'Share unconfirmed rumors'] },
    { action: 'Get to an external location away from the building', wrong: ['Hide in the building', 'Wait indoors for someone to come to you'] },
    { action: 'Stay quiet and out of sight until responders clear the area', wrong: ['Make noise to signal for help', 'Look around to see what is happening'] },
    { action: 'Follow evacuation routes if they are clearly safe', wrong: ['Use any route you can find', 'Wait for someone to guide you'] },
    { action: 'Keep your phone silent and available if safe to do so', wrong: ['Call multiple people to ask what to do', 'Record video of the situation'] },
    { action: 'Stay calm and help others around you move to safety if possible', wrong: ['Panic and run without direction', 'Focus only on yourself and ignore others'] },
    { action: 'Trust responder instructions over rumors from others', wrong: ['Follow what other people are doing', 'Wait for social media updates'] }
  ];

  function generateScenarios() {
    const combinations = [];

    locations.forEach((location) => {
      scenarioTypes.forEach((type) => {
        containerTypes.forEach((container) => {
          safeResponses.forEach((safeInfo) => {
            combinations.push({ location, type, container, safeInfo });
          });
        });
      });
    });

    for (let i = combinations.length - 1; i > 0; i -= 1) {
      const swapIndex = Math.floor(Math.random() * (i + 1));
      [combinations[i], combinations[swapIndex]] = [combinations[swapIndex], combinations[i]];
    }

    return combinations.slice(0, 10000).map(({ location, type, container, safeInfo }) => {
      const sceneHtml = `<em>At ${location}</em><p>You experience ${type}. You are in ${container}.</p><strong>What should you do?</strong>`;
      const choices = [
        [safeInfo.action, true, 'Good choice. This keeps you safe. Move away from danger and follow responder instructions.'],
        [safeInfo.wrong[0], false, 'This action increases risk. Prioritize getting to a safe location.'],
        [safeInfo.wrong[1], false, 'This approach does not prioritize your safety. Move away from danger when possible.']
      ];

      return { scene: sceneHtml, choices: choices };
    });
  }

  const scenarios = generateScenarios();
  let index = 0; let score = 0; let answered = false;
  const $ = (id) => document.getElementById(id);
  function render() { const item = scenarios[index]; answered = false; $('progress').textContent = `Scenario ${index + 1} of ${scenarios.length}`; $('scenario').textContent = String(index + 1).padStart(2, '0'); $('scene').innerHTML = item.scene; $('feedback').textContent = ''; $('feedback').className = ''; $('next').classList.add('hidden'); $('choices').innerHTML = item.choices.map((choice, i) => `<button class="choice" data-i="${i}"><span>${String.fromCharCode(65 + i)}</span>${choice[0]}</button>`).join(''); document.querySelectorAll('.choice').forEach((button) => button.addEventListener('click', () => choose(Number(button.dataset.i)))); }
  function choose(choiceIndex) { if (answered) return; answered = true; const choice = scenarios[index].choices[choiceIndex]; if (choice[1]) score += 1; document.querySelectorAll('.choice').forEach((button, i) => { button.disabled = true; if (i === choiceIndex) button.classList.add(choice[1] ? 'right' : 'wrong'); }); $('feedback').textContent = choice[2]; $('feedback').className = choice[1] ? 'good' : 'care'; if (score >= 3) unlock(); if (score >= 20) unlockSpecialGame(); $('next').textContent = index === scenarios.length - 1 ? 'Finish practice →' : 'Continue scenario →'; $('next').classList.remove('hidden'); }
  function unlock() { $('drill').classList.remove('hidden'); $('drill').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function unlockSpecialGame() { $('special-game-unlock').classList.remove('hidden'); }
  function hide(spot) { const results = { window: ['Too clear', 'The window leaves you visible from outside. Choose cover that blocks the view.'], desk: ['You may be seen', 'The desk lowers your profile, but the open room still exposes your position.'], room: ['Hidden well', 'Great hiding place. Secure the door, silence devices, stay quiet, and wait for responders.'] }; const result = results[spot]; document.querySelectorAll('[data-spot]').forEach((el) => el.classList.toggle('selected', el.dataset.spot === spot)); $('room-caption').textContent = result[0] + '. ' + result[1]; $('drill-feedback').innerHTML = `<b>${result[0]}.</b> ${result[1]}`; $('drill-feedback').className = spot === 'room' ? 'good' : 'care'; $('replay').classList.remove('hidden'); }
  document.querySelectorAll('[data-spot]').forEach((element) => element.addEventListener('click', () => hide(element.dataset.spot)));
  $('next').addEventListener('click', () => { if (index < scenarios.length - 1) { index += 1; render(); $('game').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  $('start').addEventListener('click', () => $('game').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  $('reset').addEventListener('click', () => { index = 0; score = 0; $('drill').classList.add('hidden'); initSpecialGame(); render(); window.scrollTo(0, 0); });
  $('launch-special-game').addEventListener('click', () => { $('special-game').classList.remove('hidden'); $('special-game').scrollIntoView({ behavior: 'smooth', block: 'start' }); initSpecialGame(); });

  // 3D School Alarm Lockdown Game Logic
  let sgLevel = 1;
  let sgSpot = 'closet';
  let sgDoorLocked = false;
  let sgPhoneSilenced = false;
  let sgCrouched = false;
  let sgTimerInterval = null;
  let sgTimerCount = 7;
  let sgRunning = false;

  let charX = 45;
  let charY = 20;

  function getFloorWidth() {
    const floor = $('sg-room-floor');
    return floor && floor.offsetWidth > 0 ? floor.offsetWidth : 500;
  }

  function getSpotCoords() {
    const fw = getFloorWidth();
    const layout = roomLayouts[sgLevel] || roomLayouts[1];
    return {
      closet: { x: layout.spots.closet.x || fw - 75, y: layout.spots.closet.y },
      desk: layout.spots.desk,
      bookshelf: { x: layout.spots.bookshelf.x || fw - 65, y: layout.spots.bookshelf.y },
      window: { x: layout.spots.window.x || Math.floor(fw / 2 + 20), y: -50 },
      door: { x: layout.spots.door.x || Math.floor(fw / 2 - 25), y: -25 }
    };
  }

  const levelNames = {
    1: 'Area 1: Science Classroom',
    2: 'Area 2: Main Corridor',
    3: 'Area 3: School Library'
  };

  const seedRoomLayouts = {
    1: {
      labels: ['SCIENCE CLASSROOM', 'SUPPLY CLOSET', 'TEACHER DESK', 'STUDENT TABLES', 'LAB STORAGE', 'WINDOW'],
      spots: { closet: { x: 45, y: 20 }, desk: { x: 160, y: 40 }, bookshelf: { x: 0, y: 20 }, window: { x: 0 }, door: { x: 45 } },
      furniture: { closet: ['15px', '', '10px'], desk: ['110px', '', '15px'], tables: ['110px', '', '70px'], bookshelf: ['', '15px', '10px'], window: ['50%', '', '15px'], door: ['25%', '', ''] }
    },
    2: {
      labels: ['MAIN CORRIDOR', 'SECURITY OFFICE', 'RECEPTION DESK', 'WAITING BENCHES', 'LOCKERS', 'GLASS EXIT'],
      spots: { closet: { x: 0, y: 22 }, desk: { x: 240, y: 38 }, bookshelf: { x: 45, y: 25 }, window: { x: 0 }, door: { x: 0 } },
      furniture: { closet: ['', '15px', '10px'], desk: ['220px', '', '18px'], tables: ['90px', '', '76px'], bookshelf: ['15px', '', '10px'], window: ['', '20px', '18px'], door: ['50%', '', ''] }
    },
    3: {
      labels: ['SCHOOL LIBRARY', 'ARCHIVE ROOM', 'LIBRARIAN DESK', 'READING TABLES', 'BOOKSHELVES', 'LIBRARY WINDOW'],
      spots: { closet: { x: 250, y: 22 }, desk: { x: 95, y: 35 }, bookshelf: { x: 0, y: 15 }, window: { x: 0 }, door: { x: 0 } },
      furniture: { closet: ['245px', '', '10px'], desk: ['45px', '', '18px'], tables: ['125px', '', '75px'], bookshelf: ['', '15px', '10px'], window: ['20px', '', '18px'], door: ['', '18%', ''] }
    }
  };

  const ROOM_COUNT = 120;
  const roomThemes = [
    ['SCIENCE CLASSROOM', 'SUPPLY CLOSET', 'TEACHER DESK', 'STUDENT TABLES', 'LAB STORAGE', 'WINDOW', '#234f5b', '#2b625f'],
    ['MAIN CORRIDOR', 'SECURITY OFFICE', 'RECEPTION DESK', 'WAITING BENCHES', 'LOCKERS', 'GLASS EXIT', '#29445f', '#41627c'],
    ['SCHOOL LIBRARY', 'ARCHIVE ROOM', 'LIBRARIAN DESK', 'READING TABLES', 'BOOKSHELVES', 'LIBRARY WINDOW', '#3c345b', '#5c507a'],
    ['ART STUDIO', 'SUPPLY ROOM', 'WORK TABLE', 'PROJECT TABLES', 'CANVAS RACK', 'NORTH WINDOW', '#5a3f38', '#765548'],
    ['CAFETERIA', 'STAFF ROOM', 'SERVICE COUNTER', 'LUNCH TABLES', 'FOOD STORAGE', 'DELIVERY DOOR', '#4b5538', '#66724b'],
    ['MUSIC ROOM', 'EQUIPMENT ROOM', 'CONDUCTOR DESK', 'PRACTICE SEATS', 'INSTRUMENT RACK', 'SIDE WINDOW', '#304f50', '#42706a']
  ];
  const roomArrangements = [
    { closet: [45, 20], desk: [160, 40], bookshelf: [0, 20], window: [0, -50], door: [45, -25], furniture: [['15px', '', '10px'], ['110px', '', '15px'], ['110px', '', '70px'], ['', '15px', '10px'], ['50%', '', '15px'], ['25%', '', '']] },
    { closet: [0, 22], desk: [240, 38], bookshelf: [45, 25], window: [0, -50], door: [0, -25], furniture: [['', '15px', '10px'], ['220px', '', '18px'], ['90px', '', '76px'], ['15px', '', '10px'], ['', '20px', '18px'], ['50%', '', '']] },
    { closet: [250, 22], desk: [95, 35], bookshelf: [0, 15], window: [0, -50], door: [0, -25], furniture: [['245px', '', '10px'], ['45px', '', '18px'], ['125px', '', '75px'], ['', '15px', '10px'], ['20px', '', '18px'], ['', '18%', '']] },
    { closet: [125, 20], desk: [275, 35], bookshelf: [45, 20], window: [0, -50], door: [0, -25], furniture: [['120px', '', '10px'], ['260px', '', '18px'], ['70px', '', '75px'], ['45px', '', '10px'], ['50%', '', '18px'], ['72%', '', '']] },
    { closet: [300, 22], desk: [65, 40], bookshelf: [170, 20], window: [0, -50], door: [0, -25], furniture: [['295px', '', '10px'], ['35px', '', '18px'], ['90px', '', '72px'], ['165px', '', '10px'], ['', '22px', '18px'], ['18%', '', '']] }
  ];
  const roomLayouts = { ...seedRoomLayouts };

  for (let design = 4; design <= ROOM_COUNT; design += 1) {
    const theme = roomThemes[(design - 1) % roomThemes.length];
    const arrangement = roomArrangements[(design - 1) % roomArrangements.length];
    const variation = Math.floor((design - 1) / roomArrangements.length);
    const offset = (variation % 3) * 18;
    roomLayouts[design] = {
      labels: theme.slice(0, 6).map((label, index) => `${label} ${variation + 1}`),
      spots: {
        closet: { x: arrangement.closet[0] + offset, y: arrangement.closet[1] },
        desk: { x: arrangement.desk[0] + offset, y: arrangement.desk[1] },
        bookshelf: { x: arrangement.bookshelf[0] + offset, y: arrangement.bookshelf[1] },
        window: { x: arrangement.window[0] + offset },
        door: { x: arrangement.door[0] + offset }
      },
      furniture: {
        closet: arrangement.furniture[0],
        desk: arrangement.furniture[1],
        tables: arrangement.furniture[2],
        bookshelf: arrangement.furniture[3],
        window: arrangement.furniture[4],
        door: arrangement.furniture[5]
      },
      colors: { backwall: theme[6], floor: theme[7] }
    };
  }

  function applyRoomLayout() {
    const layout = roomLayouts[sgLevel] || roomLayouts[1];
    const objects = [
      ['sg-closet-obj', layout.furniture.closet, layout.labels[1]],
      ['sg-desk-obj', layout.furniture.desk, layout.labels[2]],
      ['sg-student-desk', layout.furniture.tables, layout.labels[3]],
      ['sg-bookshelf-obj', layout.furniture.bookshelf, layout.labels[4]],
      ['sg-window-obj', layout.furniture.window, layout.labels[5]],
      ['sg-door-obj', layout.furniture.door, 'DOOR']
    ];

    $('sg-blackboard').querySelector('span').textContent = layout.labels[0];
    if (layout.colors) {
      $('sg-room-backwall').style.background = layout.colors.backwall;
      $('sg-room-floor').style.background = `linear-gradient(${layout.colors.floor}, #172925)`;
    }
    objects.forEach(([id, position, label]) => {
      const element = $(id);
      if (!element) return;
      element.style.left = position[0];
      element.style.right = position[1];
      element.style.top = position[2];
      if (element.querySelector('span')) element.querySelector('span').textContent = label;
    });

    const buttonLabels = { closet: layout.labels[1], desk: layout.labels[2], bookshelf: layout.labels[4], window: layout.labels[5] };
    document.querySelectorAll('.sg-btn-spot').forEach((button) => {
      const label = buttonLabels[button.dataset.sgspot];
      const small = button.querySelector('small');
      const labelNode = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
      if (label && labelNode) labelNode.textContent = ` ${label} `;
      if (small && button.dataset.sgspot === 'window') small.textContent = '(Exposed)';
    });
  }

  function initSpecialGame() {
    sgSpot = 'closet';
    isInsideCloset = false;
    const coords = getSpotCoords();
    charX = coords.closet.x;
    charY = coords.closet.y;
    sgDoorLocked = false;
    sgPhoneSilenced = false;
    sgCrouched = false;
    sgRunning = false;
    clearInterval(sgTimerInterval);
    updateSpecialGameUI();
  }

  let isInsideCloset = false;

  function detectSpotFromPosition() {
    const fw = getFloorWidth();
    const coords = getSpotCoords();
    const near = (spot, radiusX = 65, radiusY = 55) => Math.abs(charX - coords[spot].x) <= radiusX && Math.abs(charY - coords[spot].y) <= radiusY;
    const prompt = $('sg-interact-prompt');
    let promptHtml = '';

    if (isInsideCloset || near('closet')) {
      sgSpot = 'closet';
      if (!sgRunning) $('sg-room-caption').textContent = '🚪 In the room\'s secure cover area. (High cover - hidden from view)';
      promptHtml = isInsideCloset ? 'Press <span class="key-badge">E</span> to Step Out of Closet' : 'Press <span class="key-badge">E</span> to Hide in Closet';
    } else if (near('door', 55, 35)) {
      sgSpot = 'door';
      if (!sgRunning) $('sg-room-caption').textContent = `🔒 Door (${sgDoorLocked ? 'LOCKED' : 'UNLOCKED'})`;
      promptHtml = `Press <span class="key-badge">E</span> to ${sgDoorLocked ? 'Unlock' : 'Lock'} Door`;
    } else if (near('desk')) {
      sgSpot = 'desk';
      if (!sgRunning) $('sg-room-caption').textContent = sgCrouched ? '🧎 Crouched under nearby furniture. (Medium cover)' : '🪑 Near furniture. Press C to crouch under it.';
      promptHtml = `Press <span class="key-badge">C</span> to ${sgCrouched ? 'Stand Up' : 'Crouch Under Tables'}`;
    } else if (near('bookshelf')) {
      sgSpot = 'bookshelf';
      if (!sgRunning) $('sg-room-caption').textContent = '📚 Behind high cover. (Hidden from view)';
      promptHtml = 'Press <span class="key-badge">E</span> to Hide behind Bookshelf';
    } else if (near('window', 70, 35)) {
      sgSpot = 'window';
      if (!sgRunning) $('sg-room-caption').textContent = '🪟 Near an opening. (Exposed from outside)';
      promptHtml = '⚠️ Move away from the window!';
    } else {
      sgSpot = 'open';
      if (!sgRunning) $('sg-room-caption').textContent = '🚶 In Open Classroom Floor! Use WASD to move to cover.';
      promptHtml = `Press <span class="key-badge">C</span> to ${sgCrouched ? 'Stand Up' : 'Crouch'}`;
    }

    if (prompt) {
      if (promptHtml) {
        prompt.innerHTML = promptHtml;
        prompt.classList.remove('hidden');
      } else {
        prompt.classList.add('hidden');
      }
    }
  }

  function moveCharacter(dx, dy) {
    if (sgRunning) return;
    isInsideCloset = false;
    const fw = getFloorWidth();
    const maxX = fw - 35;
    charX = Math.max(15, Math.min(maxX, charX + dx));
    charY = Math.max(-50, Math.min(100, charY + dy));
    updateSpecialGameUI();
  }

  function updateSpecialGameUI() {
    applyRoomLayout();
    const layout = roomLayouts[sgLevel] || roomLayouts[1];
    $('sg-level-badge').textContent = `${layout.labels[0]} · Design ${sgLevel} of ${ROOM_COUNT}`;
    $('sg-timer-badge').textContent = sgRunning ? `Alarm: ${sgTimerCount}s` : 'Alarm: Ready';
    
    detectSpotFromPosition();

    // Spot selection
    document.querySelectorAll('.sg-btn-spot').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.sgspot === sgSpot);
    });
    document.querySelectorAll('.sg-closet-obj, .sg-desk-obj, .sg-bookshelf-obj, .sg-window-obj, .sg-student-desk').forEach((el) => {
      el.classList.remove('selected');
    });
    const spotObjMap = { closet: 'sg-closet-obj', desk: 'sg-desk-obj', bookshelf: 'sg-bookshelf-obj', window: 'sg-window-obj' };
    if (spotObjMap[sgSpot] && $(spotObjMap[sgSpot])) {
      $(spotObjMap[sgSpot]).classList.add('selected');
    }

    // Avatar positioning
    const avatar = $('sg-player-avatar');
    if (avatar) {
      avatar.classList.toggle('crouched', sgCrouched);
      avatar.classList.toggle('hidden-avatar', isInsideCloset || sgSpot === 'closet' || sgSpot === 'bookshelf');
      avatar.style.left = `${charX}px`;
      avatar.style.top = `${charY}px`;

      const scale = Math.max(0.75, Math.min(1.15, 0.85 + ((charY + 50) / 160) * 0.3));
      avatar.style.transform = `scale(${scale})`;
    }

    // Toggles
    const doorBtn = $('sg-act-door');
    if (doorBtn) {
      doorBtn.innerHTML = `🔒 Door: <b>${sgDoorLocked ? 'LOCKED' : 'UNLOCKED'}</b>`;
      doorBtn.classList.toggle('active', sgDoorLocked);
      $('sg-door-obj').classList.toggle('locked', sgDoorLocked);
      $('sg-door-lock-status').textContent = sgDoorLocked ? 'LOCKED' : 'UNLOCKED';
    }

    const phoneBtn = $('sg-act-phone');
    if (phoneBtn) {
      phoneBtn.innerHTML = `📱 Phone: <b>${sgPhoneSilenced ? 'SILENCED' : 'RINGER ON'}</b>`;
      phoneBtn.classList.toggle('active', sgPhoneSilenced);
    }

    const postureBtn = $('sg-act-posture');
    if (postureBtn) {
      postureBtn.innerHTML = `🧎 Position: <b>${sgCrouched ? 'CROUCHED' : 'STANDING'}</b>`;
      postureBtn.classList.toggle('active', sgCrouched);
    }
  }

  // Keyboard Movement Engine (WASD & Arrows & E & C & L)
  window.addEventListener('keydown', (e) => {
    if ($('special-game') && $('special-game').classList.contains('hidden')) return;

    const step = sgCrouched ? 8 : 14;
    let handled = false;

    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      moveCharacter(0, -step);
      handled = true;
    } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      moveCharacter(0, step);
      handled = true;
    } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      moveCharacter(-step, 0);
      handled = true;
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      moveCharacter(step, 0);
      handled = true;
    } else if (e.key === 'e' || e.key === 'E') {
      if (charY <= -20 && charX >= 20 && charX <= 120) {
        sgDoorLocked = !sgDoorLocked;
        $('sg-room-caption').textContent = sgDoorLocked ? '🔒 Door Locked!' : '🔓 Door Unlocked!';
      } else if (charX <= 100 && charY <= 60) {
        isInsideCloset = !isInsideCloset;
        if (isInsideCloset) {
          charX = 45;
          charY = 20;
          sgCrouched = true;
          $('sg-room-caption').textContent = '🚪 You jumped inside the Supply Closet and crouched down!';
        } else {
          charX = 95;
          charY = 30;
          $('sg-room-caption').textContent = '🚪 You stepped out of the Supply Closet.';
        }
      } else if (charX >= Math.max(220, fw - 130) && charY <= 60) {
        charX = Math.max(280, fw - 65);
        charY = 20;
        sgCrouched = true;
        $('sg-room-caption').textContent = '📚 You hid behind the Bookshelf!';
      } else {
        sgCrouched = !sgCrouched;
      }
      updateSpecialGameUI();
      handled = true;
    } else if (e.key === 'c' || e.key === 'C') {
      sgCrouched = !sgCrouched;
      updateSpecialGameUI();
      handled = true;
    } else if (e.key === 'l' || e.key === 'L') {
      sgDoorLocked = !sgDoorLocked;
      updateSpecialGameUI();
      handled = true;
    }

    if (handled) {
      e.preventDefault();
    }
  });

  window.addEventListener('resize', () => {
    if ($('special-game') && !$('special-game').classList.contains('hidden')) {
      updateSpecialGameUI();
    }
  });

  // Onscreen D-Pad buttons
  if ($('dpad-up')) $('dpad-up').addEventListener('click', () => moveCharacter(0, -15));
  if ($('dpad-down')) $('dpad-down').addEventListener('click', () => moveCharacter(0, 15));
  if ($('dpad-left')) $('dpad-left').addEventListener('click', () => moveCharacter(-15, 0));
  if ($('dpad-right')) $('dpad-right').addEventListener('click', () => moveCharacter(15, 0));

  // Floor click to walk
  if ($('sg-room-floor')) {
    $('sg-room-floor').addEventListener('click', (e) => {
      if (sgRunning) return;
      const rect = $('sg-room-floor').getBoundingClientRect();
      const clickX = e.clientX - rect.left - 12;
      const clickY = e.clientY - rect.top - 18;
      const fw = getFloorWidth();
      const maxX = fw - 35;
      charX = Math.max(15, Math.min(maxX, clickX));
      charY = Math.max(-50, Math.min(100, clickY));
      updateSpecialGameUI();
    });
  }

  // Spot selection handlers
  document.querySelectorAll('.sg-btn-spot').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (sgRunning) return;
      sgSpot = btn.dataset.sgspot;
      const coords = getSpotCoords();
      if (coords[sgSpot]) {
        charX = coords[sgSpot].x;
        charY = coords[sgSpot].y;
      }
      updateSpecialGameUI();
    });
  });

  // Action toggles
  if ($('sg-act-door')) {
    $('sg-act-door').addEventListener('click', () => {
      if (sgRunning) return;
      sgDoorLocked = !sgDoorLocked;
      updateSpecialGameUI();
    });
  }

  if ($('sg-act-phone')) {
    $('sg-act-phone').addEventListener('click', () => {
      if (sgRunning) return;
      sgPhoneSilenced = !sgPhoneSilenced;
      updateSpecialGameUI();
    });
  }

  if ($('sg-act-posture')) {
    $('sg-act-posture').addEventListener('click', () => {
      if (sgRunning) return;
      sgCrouched = !sgCrouched;
      updateSpecialGameUI();
    });
  }

  // Start Lockdown Timer
  if ($('sg-start-timer-btn')) {
    $('sg-start-timer-btn').addEventListener('click', () => {
      if (sgRunning) return;
      sgRunning = true;
      sgTimerCount = 5;
      $('sg-alarm-overlay').classList.add('active');
      $('sg-search-beam').classList.remove('sweeping');
      $('sg-start-timer-btn').classList.add('hidden');
      $('sg-retry-btn').classList.add('hidden');
      $('sg-next-level-btn').classList.add('hidden');
      $('sg-feedback-msg').textContent = '🚨 ALARM ACTIVE! Searcher is sweeping the building... Staying hidden...';
      
      updateSpecialGameUI();

      sgTimerInterval = setInterval(() => {
        sgTimerCount--;
        $('sg-timer-badge').textContent = `Alarm: ${sgTimerCount}s`;
        if (sgTimerCount <= 0) {
          clearInterval(sgTimerInterval);
          runSearchSweep();
        }
      }, 1000);
    });
  }

  function runSearchSweep() {
    $('sg-search-beam').classList.add('sweeping');
    $('sg-feedback-msg').textContent = '🔦 Search beam sweeping the room...';

    setTimeout(() => {
      $('sg-alarm-overlay').classList.remove('active');
      $('sg-search-beam').classList.remove('sweeping');
      sgRunning = false;

      // Evaluate stealth rating
      let score = 0;
      let failureReasons = [];

      if (sgSpot === 'closet') score += 40;
      else if (sgSpot === 'bookshelf') score += 35;
      else if (sgSpot === 'desk') score += 25;
      else if (sgSpot === 'window') {
        score += 0;
        failureReasons.push('Staying by the window left you completely visible from outside');
      } else if (sgSpot === 'open') {
        score += 0;
        failureReasons.push('Standing out in the open floor without cover made you easily visible');
      }

      if (sgDoorLocked) {
        score += 30;
      } else {
        failureReasons.push('Leaving the door unlocked allowed access into the room');
      }

      if (sgPhoneSilenced) {
        score += 20;
      } else {
        failureReasons.push('Your phone ringer rang and alerted nearby searchers');
      }

      if (sgCrouched) {
        score += 10;
      } else {
        failureReasons.push('Standing up exposed your silhouette');
      }

      if (score >= 75) {
        if (sgLevel < ROOM_COUNT) {
          $('sg-feedback-msg').innerHTML = `<b>Safe choice in ${levelNames[sgLevel]}.</b><br>You secured the door, silenced your phone, and stayed out of view. Continue following responder instructions.`;
          $('sg-next-level-btn').classList.remove('hidden');
        } else {
          $('sg-feedback-msg').innerHTML = `<b>Practice complete.</b><br>You rehearsed getting away, getting hidden, and staying out of view across all three areas.`;
          $('sg-retry-btn').textContent = 'Repeat drill';
          $('sg-retry-btn').classList.remove('hidden');
        }
      } else {
        $('sg-feedback-msg').innerHTML = `<b>Review your safety choices.</b><br>${failureReasons.join('. ')}. Try the drill again and prioritize cover, silence, and a secured door.`;
        $('sg-retry-btn').textContent = 'Repeat level';
        $('sg-retry-btn').classList.remove('hidden');
      }

      updateSpecialGameUI();
    }, 2500);
  }

  if ($('sg-retry-btn')) {
    $('sg-retry-btn').addEventListener('click', () => {
      if (sgLevel > ROOM_COUNT) sgLevel = 1;
      initSpecialGame();
      $('sg-start-timer-btn').classList.remove('hidden');
      $('sg-retry-btn').classList.add('hidden');
      $('sg-feedback-msg').textContent = 'Configure the room, then start the drill. This is practice, not live emergency guidance.';
    });
  }

  if ($('sg-next-level-btn')) {
    $('sg-next-level-btn').addEventListener('click', () => {
      sgLevel++;
      initSpecialGame();
      $('sg-start-timer-btn').classList.remove('hidden');
      $('sg-next-level-btn').classList.add('hidden');
      $('sg-feedback-msg').textContent = `Welcome to ${roomLayouts[sgLevel].labels[0]}. Configure your hiding spot and safety actions, then start the practice sweep.`;
    });
  }
  $('replay').addEventListener('click', () => { document.querySelectorAll('[data-spot]').forEach((el) => el.classList.remove('selected')); $('room-caption').textContent = 'A safety alert sounds. Choose a hiding place that keeps you out of sight.'; $('drill-feedback').textContent = 'Choose a spot to see the result.'; $('drill-feedback').className = ''; $('replay').classList.add('hidden'); });
  $('alert-form').addEventListener('submit', (event) => { event.preventDefault(); const contact = $('contact').value.trim() || 'your trusted contact'; const where = $('where').value.trim() || 'my current location'; $('preview').textContent = `Preview: “Hi ${contact}, I am safe at ${where}. I am following responder instructions.”`; });
  initSpecialGame();
  render();
});
