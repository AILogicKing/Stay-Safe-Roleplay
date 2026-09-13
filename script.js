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
    const scenarios = [];
    const usedCombinations = new Set();
    
    for (let i = 0; i < 10000; i++) {
      let location, type, container, safeInfo;
      let combination;
      
      do {
        location = locations[Math.floor(Math.random() * locations.length)];
        type = scenarioTypes[Math.floor(Math.random() * scenarioTypes.length)];
        container = containerTypes[Math.floor(Math.random() * containerTypes.length)];
        safeInfo = safeResponses[Math.floor(Math.random() * safeResponses.length)];
        combination = `${location}-${type}-${container}-${safeInfo.action}`;
      } while (usedCombinations.has(combination) && scenarios.length < 10000);
      
      usedCombinations.add(combination);
      
      const sceneHtml = `<em>At ${location}</em><p>You experience ${type}. You are in ${container}.</p><strong>What should you do?</strong>`;
      const choices = [
        [safeInfo.action, true, 'Good choice. This keeps you safe. Move away from danger and follow responder instructions.'],
        [safeInfo.wrong[0], false, 'This action increases risk. Prioritize getting to a safe location.'],
        [safeInfo.wrong[1], false, 'This approach does not prioritize your safety. Move away from danger when possible.']
      ];
      
      scenarios.push({ scene: sceneHtml, choices: choices });
    }
    
    return scenarios;
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
  $('reset').addEventListener('click', () => { index = 0; score = 0; $('drill').classList.add('hidden'); $('special-game-unlock').classList.add('hidden'); $('special-game').classList.add('hidden'); render(); window.scrollTo(0, 0); });
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
    return {
      closet: { x: 45, y: 20 },
      desk: { x: 160, y: 40 },
      bookshelf: { x: Math.max(280, fw - 65), y: 20 },
      window: { x: Math.floor(fw / 2 + 20), y: -50 }
    };
  }

  const levelNames = {
    1: 'Area 1: Science Classroom',
    2: 'Area 2: Main Corridor',
    3: 'Area 3: School Library'
  };

  function initSpecialGame() {
    sgSpot = 'closet';
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
    const prompt = $('sg-interact-prompt');
    let promptHtml = '';

    if (isInsideCloset || (charX <= 90 && charY <= 50)) {
      sgSpot = 'closet';
      if (!sgRunning) $('sg-room-caption').textContent = '🚪 In Supply Closet! (High Cover - Hidden from view)';
      promptHtml = isInsideCloset ? 'Press <span class="key-badge">E</span> to Step Out of Closet' : 'Press <span class="key-badge">E</span> to Hide in Closet';
    } else if (charY <= -15 && charX >= 20 && charX <= 120) {
      sgSpot = 'door';
      if (!sgRunning) $('sg-room-caption').textContent = `🔒 Classroom Door (${sgDoorLocked ? 'LOCKED' : 'UNLOCKED'})`;
      promptHtml = `Press <span class="key-badge">E</span> to ${sgDoorLocked ? 'Unlock' : 'Lock'} Door`;
    } else if (charX >= 100 && charX <= 220 && charY >= 10 && charY <= 90) {
      sgSpot = 'desk';
      if (!sgRunning) $('sg-room-caption').textContent = sgCrouched ? '🧎 Crouched under Classroom Tables & Desks! (Medium Cover)' : '🪑 By Classroom Tables & Desks. Press C to crouch under!';
      promptHtml = `Press <span class="key-badge">C</span> to ${sgCrouched ? 'Stand Up' : 'Crouch Under Tables'}`;
    } else if (charX >= Math.max(220, fw - 130) && charY <= 60) {
      sgSpot = 'bookshelf';
      if (!sgRunning) $('sg-room-caption').textContent = '📚 Behind Bookshelf! (High Cover)';
      promptHtml = 'Press <span class="key-badge">E</span> to Hide behind Bookshelf';
    } else if (charY <= -15 && charX >= fw / 2 - 40 && charX <= fw / 2 + 80) {
      sgSpot = 'window';
      if (!sgRunning) $('sg-room-caption').textContent = '🪟 Near Window! (Exposed from outside!)';
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
    $('sg-level-badge').textContent = levelNames[sgLevel] || 'Area 1: Science Classroom';
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
        if (sgLevel < 3) {
          $('sg-feedback-msg').innerHTML = `<b>✅ SAFE! You survived the sweep in ${levelNames[sgLevel]}!</b><br>Great decisions: door locked, phone silenced, and well hidden.`;
          $('sg-next-level-btn').classList.remove('hidden');
        } else {
          $('sg-feedback-msg').innerHTML = `<b>🎉 CHAMPION! You cleared all 3 School Lockdown areas!</b><br>You mastered getting away, getting hidden, and staying safe under pressure!`;
          $('sg-retry-btn').textContent = 'Play Again 🔄';
          $('sg-retry-btn').classList.remove('hidden');
        }
      } else {
        $('sg-feedback-msg').innerHTML = `<b>❌ CAUGHT! You were spotted.</b><br>${failureReasons.join('. ')}.`;
        $('sg-retry-btn').textContent = 'Retry Level 🔄';
        $('sg-retry-btn').classList.remove('hidden');
      }

      updateSpecialGameUI();
    }, 2500);
  }

  if ($('sg-retry-btn')) {
    $('sg-retry-btn').addEventListener('click', () => {
      if (sgLevel > 3) sgLevel = 1;
      initSpecialGame();
      $('sg-start-timer-btn').classList.remove('hidden');
      $('sg-retry-btn').classList.add('hidden');
      $('sg-feedback-msg').textContent = 'Click "Start Lockdown" when you are ready to test your hiding strategy.';
    });
  }

  if ($('sg-next-level-btn')) {
    $('sg-next-level-btn').addEventListener('click', () => {
      sgLevel++;
      initSpecialGame();
      $('sg-start-timer-btn').classList.remove('hidden');
      $('sg-next-level-btn').classList.add('hidden');
      $('sg-feedback-msg').textContent = `Welcome to ${levelNames[sgLevel]}! Configure your 3D hiding spot and safety actions.`;
    });
  }
  $('replay').addEventListener('click', () => { document.querySelectorAll('[data-spot]').forEach((el) => el.classList.remove('selected')); $('room-caption').textContent = 'A safety alert sounds. Choose a hiding place that keeps you out of sight.'; $('drill-feedback').textContent = 'Choose a spot to see the result.'; $('drill-feedback').className = ''; $('replay').classList.add('hidden'); });
  $('alert-form').addEventListener('submit', (event) => { event.preventDefault(); const contact = $('contact').value.trim() || 'your trusted contact'; const where = $('where').value.trim() || 'my current location'; $('preview').textContent = `Preview: “Hi ${contact}, I am safe at ${where}. I am following responder instructions.”`; });
  render();
});
