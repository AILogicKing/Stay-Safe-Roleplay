(() => {
  const threeUrl = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
  const section = document.getElementById('barrier-practice');
  const canvas = document.getElementById('barrier-canvas');
  const startTimerButton = document.getElementById('barrier-start-timer');
  const status = document.getElementById('barrier-status');
  const countdown = document.getElementById('barrier-countdown');
  const testButton = document.getElementById('barrier-test');
  const resetButton = document.getElementById('barrier-reset');
  const hideButton = document.getElementById('avatar-hide');
  if (!section || !canvas || !startTimerButton || !status || !countdown || !testButton || !resetButton || !hideButton) return;

  let game;
  let loading = false;
  let unlocked = false;
  let startRequested = false;

  startTimerButton.addEventListener('click', () => {
    if (startTimerButton.disabled) return;
    startRequested = true;
    startTimerButton.disabled = true;
    status.textContent = 'Starting your 20-second round...';
    if (game) game.startChallenge();
    else loadGame();
  });

  function createGame(THREE) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#17355b');
    scene.fog = new THREE.Fog('#17355b', 18, 34);

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 50);
    camera.position.set(0, 3.3, 4.65);
    camera.lookAt(0, 1.9, -0.4);

    scene.add(new THREE.HemisphereLight('#fff7df', '#7d9b85', 2.2));
    const roomLight = new THREE.PointLight('#fff4cf', 34, 18);
    roomLight.position.set(0, 3.15, 0);
    scene.add(roomLight);
    const sunlight = new THREE.DirectionalLight('#fff5db', 3.2);
    sunlight.position.set(-5, 11, 7);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(1024, 1024);
    sunlight.shadow.camera.left = -9;
    sunlight.shadow.camera.right = 9;
    sunlight.shadow.camera.top = 9;
    sunlight.shadow.camera.bottom = -9;
    scene.add(sunlight);

    const makeMaterial = (color, extra = {}) => new THREE.MeshStandardMaterial({
      color,
      roughness: 0.78,
      ...extra
    });
    const materials = {
      wall: makeMaterial('#fff7df'),
      blueWall: makeMaterial('#81cbe2'),
      floor: makeMaterial('#efd89d'),
      trim: makeMaterial('#17355b'),
      wood: makeMaterial('#d7813c'),
      woodLight: makeMaterial('#f2ad5e'),
      door: makeMaterial('#ed5b31'),
      doorInset: makeMaterial('#ff9a54'),
      robot: makeMaterial('#ffe04b', { metalness: 0.12, roughness: 0.4 }),
      robotBlue: makeMaterial('#087fae', { metalness: 0.18, roughness: 0.4 }),
      dark: makeMaterial('#17355b', { roughness: 0.4 }),
      glow: makeMaterial('#35c8d0', { emissive: '#087f89', emissiveIntensity: 0.55 }),
      chalk: makeMaterial('#267e83')
    };

    function addBox(parent, dimensions, material, position, castShadow = true) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
      mesh.position.set(...position);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    addBox(scene, [10, 0.2, 10], materials.floor, [0, -0.12, 0], false);
    const floorGrid = new THREE.GridHelper(10, 20, '#397b8a', '#c5aa75');
    floorGrid.position.y = 0.012;
    scene.add(floorGrid);

    addBox(scene, [0.2, 3.6, 10], materials.wall, [-5, 1.7, 0]);
    addBox(scene, [0.2, 3.6, 10], materials.blueWall, [5, 1.7, 0]);
    addBox(scene, [3.8, 3.6, 0.2], materials.wall, [-3.1, 1.7, -4.9]);
    addBox(scene, [3.8, 3.6, 0.2], materials.blueWall, [3.1, 1.7, -4.9]);
    addBox(scene, [10, 3.6, 0.2], materials.wall, [0, 1.7, 4.9]);
    addBox(scene, [10, 0.18, 10], materials.wall, [0, 3.58, 0], false);
    addBox(scene, [1.2, 0.08, 0.55], materials.robot, [-2.1, 3.43, 0.4], false);
    addBox(scene, [1.2, 0.08, 0.55], materials.robot, [2.1, 3.43, 0.4], false);

    addBox(scene, [0.18, 2.9, 0.32], materials.trim, [-1.12, 1.36, -4.84]);
    addBox(scene, [0.18, 2.9, 0.32], materials.trim, [1.12, 1.36, -4.84]);
    addBox(scene, [2.42, 0.18, 0.32], materials.trim, [0, 2.82, -4.84]);

    const doorHinge = new THREE.Group();
    doorHinge.position.set(-1.02, 0, -4.72);
    scene.add(doorHinge);
    addBox(doorHinge, [2.04, 2.65, 0.16], materials.door, [1.02, 1.32, 0]);
    addBox(doorHinge, [1.58, 2.08, 0.035], materials.doorInset, [1.02, 1.34, 0.1], false);
    const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), materials.robot);
    doorKnob.position.set(1.78, 1.24, 0.16);
    doorHinge.add(doorKnob);

    // Classroom details: all scenery, none of it draggable.
    const chalkWhite = makeMaterial('#fdfdf2', { roughness: 1 });
    const cork = makeMaterial('#c98f55');
    const glass = makeMaterial('#d8f0fa', { emissive: '#8fc9e0', emissiveIntensity: 0.3 });
    const noteColors = ['#ffe04b', '#35c8d0', '#ff9a54', '#f2a7c3', '#9de8e5', '#84bb4e'];

    addBox(scene, [2.4, 1.35, 0.08], materials.trim, [-3.05, 2.0, -4.79], false);
    addBox(scene, [2.2, 1.15, 0.12], materials.chalk, [-3.05, 2.0, -4.77], false);
    addBox(scene, [1.3, 0.04, 0.01], chalkWhite, [-3.25, 2.3, -4.705], false);
    addBox(scene, [1.0, 0.04, 0.01], chalkWhite, [-3.4, 2.12, -4.705], false);
    addBox(scene, [1.5, 0.04, 0.01], chalkWhite, [-3.15, 1.94, -4.705], false);
    addBox(scene, [0.5, 0.04, 0.01], makeMaterial('#ffe04b'), [-2.55, 2.3, -4.705], false);
    addBox(scene, [2.3, 0.06, 0.16], materials.woodLight, [-3.05, 1.38, -4.72], false);

    addBox(scene, [0.06, 1.2, 1.7], glass, [-4.84, 1.9, -2.2], false);
    addBox(scene, [0.12, 0.1, 1.9], materials.trim, [-4.82, 2.55, -2.2], false);
    addBox(scene, [0.12, 0.1, 1.9], materials.trim, [-4.82, 1.25, -2.2], false);
    addBox(scene, [0.12, 1.4, 0.1], materials.trim, [-4.82, 1.9, -3.1], false);
    addBox(scene, [0.12, 1.4, 0.1], materials.trim, [-4.82, 1.9, -1.3], false);
    addBox(scene, [0.1, 1.2, 0.06], materials.trim, [-4.82, 1.9, -2.2], false);
    addBox(scene, [0.1, 0.06, 1.7], materials.trim, [-4.82, 1.9, -2.2], false);
    addBox(scene, [0.25, 0.06, 1.9], materials.woodLight, [-4.78, 1.22, -2.2], false);

    addBox(scene, [2.3, 1.3, 0.06], materials.trim, [3.0, 1.95, -4.79], false);
    addBox(scene, [2.14, 1.14, 0.06], cork, [3.0, 1.95, -4.76], false);
    [[2.4, 2.3], [3.0, 2.2], [3.6, 2.3], [2.55, 1.7], [3.2, 1.65], [3.75, 1.75]].forEach(([x, y], index) => {
      addBox(scene, [0.4, 0.4, 0.012], makeMaterial(noteColors[index]), [x, y, -4.725], false);
    });

    const clockRim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 28), materials.trim);
    clockRim.rotation.x = Math.PI / 2;
    clockRim.position.set(0, 3.2, -4.78);
    scene.add(clockRim);
    const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 28), makeMaterial('#fffdf8'));
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(0, 3.2, -4.75);
    scene.add(clockFace);
    addBox(scene, [0.035, 0.18, 0.02], materials.trim, [0, 3.27, -4.72], false);
    addBox(scene, [0.13, 0.03, 0.02], materials.door, [0.06, 3.2, -4.72], false);

    [[-3.1, '#ed5b31'], [-1.9, '#35c8d0']].forEach(([z, color]) => {
      addBox(scene, [0.05, 1.05, 0.8], materials.trim, [4.87, 2.0, z], false);
      addBox(scene, [0.05, 0.9, 0.65], makeMaterial(color), [4.85, 2.0, z], false);
      addBox(scene, [0.02, 0.12, 0.5], chalkWhite, [4.82, 2.25, z], false);
      addBox(scene, [0.02, 0.5, 0.4], makeMaterial('#ffe04b'), [4.82, 1.9, z], false);
    });

    const shelf = new THREE.Group();
    shelf.position.set(-4.62, 0, -4.0);
    scene.add(shelf);
    addBox(shelf, [0.06, 1.7, 1.6], materials.wood, [-0.22, 0.85, 0]);
    addBox(shelf, [0.5, 1.7, 0.06], materials.wood, [0, 0.85, -0.77]);
    addBox(shelf, [0.5, 1.7, 0.06], materials.wood, [0, 0.85, 0.77]);
    for (const boardY of [0.05, 0.55, 1.05, 1.55, 1.7]) addBox(shelf, [0.5, 0.05, 1.6], materials.woodLight, [0, boardY, 0]);
    [0.075, 0.575, 1.075].forEach((baseY, row) => {
      for (let book = 0; book < 8; book += 1) {
        const height = 0.28 + ((book * 7 + row * 3) % 4) * 0.04;
        addBox(shelf, [0.3, height, 0.1], makeMaterial(noteColors[(book + row * 2) % noteColors.length]), [0.02, baseY + height / 2, -0.62 + book * 0.18], false);
      }
    });

    const teacherDesk = new THREE.Group();
    teacherDesk.position.set(-3.0, 0, -3.9);
    scene.add(teacherDesk);
    addBox(teacherDesk, [1.7, 0.1, 0.85], materials.wood, [0, 0.78, 0]);
    addBox(teacherDesk, [0.5, 0.6, 0.75], materials.woodLight, [0.5, 0.45, 0]);
    for (const legX of [-0.78, 0.78]) {
      for (const legZ of [-0.36, 0.36]) addBox(teacherDesk, [0.08, 0.74, 0.08], materials.trim, [legX, 0.37, legZ], false);
    }
    addBox(teacherDesk, [0.4, 0.12, 0.3], makeMaterial('#ed5b31'), [-0.4, 0.89, 0.1], false);
    addBox(teacherDesk, [0.36, 0.1, 0.26], makeMaterial('#087fae'), [-0.4, 1.0, 0.1], false);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), makeMaterial('#35a9bd'));
    globe.position.set(0.55, 1.1, -0.1);
    teacherDesk.add(globe);
    const globeStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.2, 12), materials.trim);
    globeStand.position.set(0.55, 0.93, -0.1);
    teacherDesk.add(globeStand);

    const plant = new THREE.Group();
    plant.position.set(4.25, 0, -4.2);
    scene.add(plant);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.42, 16), materials.door);
    pot.position.y = 0.21;
    pot.castShadow = true;
    plant.add(pot);
    [[0, 0.7, 0, 0.3], [-0.15, 0.95, 0.05, 0.22], [0.15, 1.0, -0.05, 0.24]].forEach(([x, y, z, radius]) => {
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 12), makeMaterial('#3aa655'));
      leaves.position.set(x, y, z);
      leaves.castShadow = true;
      plant.add(leaves);
    });

    addBox(scene, [3.4, 0.02, 2.0], materials.trim, [0, 0.02, -0.6], false);
    addBox(scene, [3.1, 0.02, 1.7], makeMaterial('#ffbd69'), [0, 0.032, -0.6], false);

    addBox(scene, [0.1, 0.2, 10], materials.trim, [-4.85, 0.1, 0], false);
    addBox(scene, [0.1, 0.2, 10], materials.trim, [4.85, 0.1, 0], false);
    addBox(scene, [3.73, 0.2, 0.1], materials.trim, [-2.985, 0.1, -4.8], false);
    addBox(scene, [3.73, 0.2, 0.1], materials.trim, [2.985, 0.1, -4.8], false);
    addBox(scene, [0.04, 0.08, 10], makeMaterial('#35c8d0'), [-4.88, 1.0, 0], false);
    addBox(scene, [0.04, 0.08, 10], makeMaterial('#ed5b31'), [4.88, 1.0, 0], false);
    addBox(scene, [3.73, 0.08, 0.04], makeMaterial('#35c8d0'), [-2.985, 1.0, -4.78], false);
    addBox(scene, [3.73, 0.08, 0.04], makeMaterial('#ed5b31'), [2.985, 1.0, -4.78], false);

    const targets = [];
    const targetSpots = [new THREE.Vector3(-0.78, 0, -2.55), new THREE.Vector3(0.78, 0, -2.55)];
    targetSpots.forEach((spot) => {
      const marker = new THREE.Mesh(
        new THREE.RingGeometry(0.43, 0.61, 36),
        makeMaterial('#35c8d0', { side: THREE.DoubleSide, transparent: true, opacity: 0.9, emissive: '#087f89', emissiveIntensity: 0.45 })
      );
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(spot.x, 0.025, spot.z);
      scene.add(marker);
      targets.push(marker);
    });

    const furnitureKinds = ['chair', 'book stack', 'table'];
    const furniturePalette = ['#ed8a3d', '#e7bd42', '#35a9bd', '#f07947', '#84bb4e', '#5f8de0', '#e873a4', '#47a879'];
    let furnitureRoundIndex = 0;
    let previousFurnitureKey = '';

    function randomBetween(minimum, maximum) {
      return minimum + Math.random() * (maximum - minimum);
    }

    function createRandomFurnitureRound() {
      const shuffledKinds = [...furnitureKinds];
      for (let index = shuffledKinds.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffledKinds[index], shuffledKinds[swapIndex]] = [shuffledKinds[swapIndex], shuffledKinds[index]];
      }
      const kinds = shuffledKinds.slice(0, 2);
      if ([...kinds].sort().join('|') === previousFurnitureKey) {
        kinds[1] = furnitureKinds.find((kind) => !kinds.includes(kind));
      }
      previousFurnitureKey = [...kinds].sort().join('|');
      return {
        kinds,
        starts: [[-randomBetween(2.2, 2.5), randomBetween(1.05, 1.35)], [randomBetween(2.2, 2.5), randomBetween(1.05, 1.35)]],
        targets: [-randomBetween(0.74, 0.82), randomBetween(0.74, 0.82)],
        targetZ: randomBetween(-2.64, -2.46),
        rotations: [randomBetween(-0.16, 0.16), randomBetween(-0.16, 0.16)],
        scales: [randomBetween(0.94, 1.06), randomBetween(0.94, 1.06)],
        colors: [
          furniturePalette[Math.floor(Math.random() * furniturePalette.length)],
          furniturePalette[Math.floor(Math.random() * furniturePalette.length)]
        ]
      };
    }

    let furnitureRound = createRandomFurnitureRound();

    function createFurniture(kind, position, tint) {
      const item = new THREE.Group();
      item.position.set(position[0], 0, position[1]);
      item.userData.kind = kind;
      scene.add(item);

      if (kind === 'table') {
        addBox(item, [1.82, 0.18, 1.04], makeMaterial(tint), [0, 0.86, 0]);
        addBox(item, [1.56, 0.12, 0.82], materials.woodLight, [0, 0.7, 0]);
        for (const legX of [-0.72, 0.72]) {
          for (const legZ of [-0.39, 0.39]) addBox(item, [0.12, 0.68, 0.12], materials.trim, [legX, 0.35, legZ]);
        }
        item.userData.colorMesh = item.children[0];
      } else if (kind === 'chair') {
        const seat = addBox(item, [1.78, 0.2, 1.08], makeMaterial(tint), [0, 0.78, 0]);
        addBox(item, [1.78, 0.9, 0.16], materials.woodLight, [0, 1.28, -0.47]);
        for (const legX of [-0.72, 0.72]) {
          addBox(item, [0.12, 0.68, 0.12], materials.trim, [legX, 0.35, -0.39]);
          addBox(item, [0.12, 0.68, 0.12], materials.trim, [legX, 0.35, 0.39]);
        }
        item.userData.colorMesh = seat;
      } else {
        const bookColors = [tint, '#f2ad5e', '#35a9bd', '#ed5b31'];
        for (let book = 0; book < 4; book += 1) {
          const height = 0.19;
          const offsetX = book % 2 === 0 ? -0.04 : 0.04;
          const offsetZ = book % 2 === 0 ? -0.04 : 0.04;
          const cover = addBox(item, [1.72, height, 0.82], makeMaterial(bookColors[book]), [offsetX, 0.14 + book * 0.21, offsetZ]);
          if (book === 0) item.userData.colorMesh = cover;
          addBox(item, [1.56, 0.07, 0.025], materials.woodLight, [offsetX, 0.14 + book * 0.21, 0.42 + offsetZ], false);
        }
      }

      item.children.forEach((child) => { child.userData.dragRoot = item; });
      item.userData.targetScale = randomBetween(0.94, 1.06);
      item.userData.rotation = randomBetween(-0.16, 0.16);
      item.userData.colorMesh = item.userData.colorMesh || item.children[0];
      return item;
    }

    const furniture = furnitureRound.kinds.map((kind, index) => createFurniture(kind, furnitureRound.starts[index], furnitureRound.colors[index]));
    furniture.forEach((item, index) => {
      item.rotation.y = furnitureRound.rotations[index];
      item.scale.setScalar(furnitureRound.scales[index]);
      targetSpots[index].set(furnitureRound.targets[index], 0, furnitureRound.targetZ);
      targets[index].position.set(furnitureRound.targets[index], 0.025, furnitureRound.targetZ);
    });

    function disposeFurniture(item) {
      scene.remove(item);
      item.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else if (!Object.values(materials).includes(object.material)) object.material.dispose();
      });
    }

    function applyFurnitureRound() {
      furnitureRoundIndex += 1;
      furnitureRound = createRandomFurnitureRound();
      furniture.forEach((item, index) => {
        disposeFurniture(item);
        furniture[index] = createFurniture(furnitureRound.kinds[index], furnitureRound.starts[index], furnitureRound.colors[index]);
        furniture[index].rotation.y = furnitureRound.rotations[index];
        furniture[index].scale.setScalar(furnitureRound.scales[index]);
        targetSpots[index].set(furnitureRound.targets[index], 0, furnitureRound.targetZ);
        targets[index].position.set(furnitureRound.targets[index], 0.025, furnitureRound.targetZ);
      });
      extraMovables.forEach((item) => item.position.copy(item.userData.home.position));
    }

    const cabinet = new THREE.Group();
    cabinet.position.set(4.5, 0, -1.0);
    cabinet.rotation.y = -Math.PI / 2;
    scene.add(cabinet);
    addBox(cabinet, [1.05, 1.72, 0.58], materials.robotBlue, [0, 0.86, 0]);
    for (const shelfY of [0.38, 0.9, 1.42]) {
      addBox(cabinet, [0.92, 0.07, 0.62], materials.woodLight, [0, shelfY, 0.03]);
    }

    // Every classroom item is draggable; any two pieces can fill the doorway markers.
    const extraMovables = [teacherDesk, shelf, plant, cabinet];
    extraMovables.forEach((item) => {
      item.userData.home = { position: item.position.clone() };
      item.children.forEach((child) => { child.userData.dragRoot = item; });
    });
    const allMovables = () => [...furniture, ...extraMovables];

    const bot = new THREE.Group();
    scene.add(bot);

    const makeMaskedLimb = (start, end, radius, material) => {
      const startPoint = new THREE.Vector3(...start);
      const endPoint = new THREE.Vector3(...end);
      const direction = endPoint.clone().sub(startPoint);
      const length = direction.length();
      const limb = new THREE.Mesh(
        new THREE.CapsuleGeometry(radius, Math.max(length - radius * 2, 0.01), 4, 10),
        material
      );
      limb.position.copy(startPoint.add(endPoint).multiplyScalar(0.5));
      limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      limb.castShadow = true;
      bot.add(limb);
      return limb;
    };

    const maskClothing = makeMaterial('#20232c', { roughness: 0.92 });
    const maskFace = makeMaterial('#101217', { roughness: 0.98 });
    const eyeMaterial = makeMaterial('#d8e1e8', { roughness: 0.52 });
    const jacket = makeMaterial('#31435a', { roughness: 0.84 });
    const pants = makeMaterial('#263248', { roughness: 0.9 });
    const shoeMaterial = makeMaterial('#172332', { roughness: 0.84 });
    const accent = makeMaterial('#35c8d0', { roughness: 0.6 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.29, 0.48, 5, 12), jacket);
    torso.position.set(0, 1.02, 0);
    torso.castShadow = true;
    bot.add(torso);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.13, 12), maskClothing);
    collar.position.set(0, 1.43, 0);
    bot.add(collar);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 20, 16), maskClothing);
    head.scale.set(0.86, 1.08, 0.88);
    head.position.set(0, 1.76, 0);
    head.castShadow = true;
    bot.add(head);

    const skiMask = new THREE.Mesh(new THREE.SphereGeometry(0.255, 20, 16), maskFace);
    skiMask.scale.set(0.87, 0.72, 0.9);
    skiMask.position.set(0, 1.68, 0.13);
    skiMask.castShadow = true;
    bot.add(skiMask);

    for (const eyeX of [-0.095, 0.095]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.027, 12, 10), eyeMaterial);
      eye.position.set(eyeX, 1.79, 0.342);
      bot.add(eye);
    }

    const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.42, 0.012), accent);
    zipper.position.set(0, 1.03, 0.286);
    bot.add(zipper);

    makeMaskedLimb([-0.22, 1.34, 0], [-0.4, 0.83, 0.13], 0.11, jacket);
    makeMaskedLimb([0.22, 1.34, 0], [0.4, 0.83, 0.13], 0.11, jacket);
    for (const handX of [-0.4, 0.4]) {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), maskClothing);
      hand.position.set(handX, 0.8, 0.13);
      bot.add(hand);
    }

    makeMaskedLimb([-0.14, 0.65, 0], [-0.16, 0.17, 0], 0.13, pants);
    makeMaskedLimb([0.14, 0.65, 0], [0.16, 0.17, 0], 0.13, pants);
    for (const shoeX of [-0.16, 0.16]) {
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.13, 0.38), shoeMaterial);
      shoe.position.set(shoeX, 0.09, 0.09);
      shoe.castShadow = true;
      bot.add(shoe);
    }
    bot.position.set(0, 0, -3.92);

    const avatar = new THREE.Group();
    scene.add(avatar);
    const avatarShirt = makeMaterial('#16a9c4', { roughness: 0.82 });
    const avatarPants = makeMaterial('#315284', { roughness: 0.86 });
    const avatarSkin = makeMaterial('#f1b77f', { roughness: 0.88 });
    const avatarHair = makeMaterial('#653d2d', { roughness: 0.95 });
    const avatarShoes = makeMaterial('#ed5b31', { roughness: 0.82 });

    const addAvatarLimb = (start, end, radius, material) => {
      const startPoint = new THREE.Vector3(...start);
      const endPoint = new THREE.Vector3(...end);
      const direction = endPoint.clone().sub(startPoint);
      const limb = new THREE.Mesh(
        new THREE.CapsuleGeometry(radius, Math.max(direction.length() - radius * 2, 0.01), 4, 10),
        material
      );
      limb.position.copy(startPoint.add(endPoint).multiplyScalar(0.5));
      limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      limb.castShadow = true;
      avatar.add(limb);
    };

    const avatarTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.38, 4, 10), avatarShirt);
    avatarTorso.position.set(0, 0.91, 0);
    avatarTorso.castShadow = true;
    avatar.add(avatarTorso);
    const avatarHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), avatarSkin);
    avatarHead.position.set(0, 1.48, 0);
    avatarHead.castShadow = true;
    avatar.add(avatarHead);
    const avatarHairCap = new THREE.Mesh(new THREE.SphereGeometry(0.205, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), avatarHair);
    avatarHairCap.position.set(0, 1.52, 0);
    avatar.add(avatarHairCap);
    for (const eyeX of [-0.065, 0.065]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), materials.dark);
      eye.position.set(eyeX, 1.48, 0.19);
      avatar.add(eye);
    }
    addAvatarLimb([-0.18, 1.17, 0], [-0.29, 0.7, 0.1], 0.085, avatarShirt);
    addAvatarLimb([0.18, 1.17, 0], [0.29, 0.7, 0.1], 0.085, avatarShirt);
    addAvatarLimb([-0.105, 0.6, 0], [-0.12, 0.13, 0], 0.105, avatarPants);
    addAvatarLimb([0.105, 0.6, 0], [0.12, 0.13, 0], 0.105, avatarPants);
    for (const shoeX of [-0.12, 0.12]) {
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.1, 0.28), avatarShoes);
      shoe.position.set(shoeX, 0.07, 0.07);
      avatar.add(shoe);
    }
    const avatarStart = new THREE.Vector3(0, 0, 0.6);
    avatar.position.copy(avatarStart);

    const hideSpot = new THREE.Vector3(0, 0, 2.15);
    const hideMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.52, 0.78, 36),
      makeMaterial('#35c8d0', { side: THREE.DoubleSide, emissive: '#087f89', emissiveIntensity: 0.55 })
    );
    hideMarker.rotation.x = -Math.PI / 2;
    hideMarker.position.set(hideSpot.x, 0.035, hideSpot.z);
    scene.add(hideMarker);
    const hideBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.14, 1.25, 12), materials.glow);
    hideBeacon.position.set(hideSpot.x, 0.64, hideSpot.z);
    scene.add(hideBeacon);
    const hideBeaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), materials.glow);
    hideBeaconLight.position.set(hideSpot.x, 1.36, hideSpot.z);
    scene.add(hideBeaconLight);

    // Corridor sits far behind the classroom door so the same scene can swap views.
    const corridorSpot = new THREE.Vector3(2.1, 0, -31.2);
    const corridorEntry = new THREE.Vector3(0, 0, -26.6);
    const classroomView = { position: new THREE.Vector3(0, 3.3, 4.65), target: new THREE.Vector3(0, 1.9, -0.4) };
    const corridorView = { position: new THREE.Vector3(0, 3.3, -25.35), target: new THREE.Vector3(0, 1.9, -30.4) };
    addBox(scene, [6, 0.2, 10], materials.floor, [0, -0.12, -30], false);
    addBox(scene, [0.2, 3.6, 10], materials.wall, [-3, 1.7, -30]);
    addBox(scene, [0.2, 3.6, 10], materials.blueWall, [3, 1.7, -30]);
    addBox(scene, [6, 3.6, 0.2], materials.wall, [0, 1.7, -35]);
    addBox(scene, [6, 0.18, 10], materials.wall, [0, 3.58, -30], false);
    for (const lightZ of [-27.5, -31, -34]) addBox(scene, [1.2, 0.08, 0.55], materials.robot, [0, 3.43, lightZ], false);
    for (let locker = 0; locker < 6; locker += 1) {
      addBox(scene, [0.5, 1.9, 0.7], locker % 2 ? materials.robotBlue : materials.door, [-2.65, 0.95, -27 - locker * 1.25]);
    }
    addBox(scene, [0.5, 1.9, 2.4], materials.robotBlue, [2.65, 0.95, -32.4]);
    const corridorLight = new THREE.PointLight('#fff4cf', 34, 18);
    corridorLight.position.set(0, 3.15, -30);
    scene.add(corridorLight);
    const corridorMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.52, 0.78, 36),
      makeMaterial('#35c8d0', { side: THREE.DoubleSide, emissive: '#087f89', emissiveIntensity: 0.55 })
    );
    corridorMarker.rotation.x = -Math.PI / 2;
    corridorMarker.position.set(corridorSpot.x, 0.035, corridorSpot.z);
    scene.add(corridorMarker);
    const corridorBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.14, 1.25, 12), materials.glow);
    corridorBeacon.position.set(corridorSpot.x, 0.64, corridorSpot.z);
    scene.add(corridorBeacon);
    let inCorridor = false;

    function setLocation(corridor) {
      inCorridor = corridor;
      const view = corridor ? corridorView : classroomView;
      camera.position.copy(view.position);
      camera.lookAt(view.target);
    }

    let avatarHidden = false;
    let secondsLeft = 20;
    let timerInterval = null;
    let timerExpired = false;
    let challengeComplete = false;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const dragPoint = new THREE.Vector3();
    let dragging = null;
    let testing = false;

    function updatePointer(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
    }

    function isInTarget(desk, target) {
      return Math.abs(desk.position.x - target.x) < 0.58 && Math.abs(desk.position.z - target.z) < 0.56;
    }

    // A piece only counts toward one marker.
    function markerFill() {
      const used = new Set();
      return targetSpots.map((spot) => {
        const item = allMovables().find((candidate) => !used.has(candidate) && isInTarget(candidate, spot));
        if (item) used.add(item);
        return Boolean(item);
      });
    }

    function isAtHideSpot() {
      const spot = inCorridor ? corridorSpot : hideSpot;
      return Math.hypot(avatar.position.x - spot.x, avatar.position.z - spot.z) < 0.78;
    }

    function updateCountdown() {
      countdown.textContent = unlocked
        ? timerExpired ? 'Time is up' : `${secondsLeft} seconds left`
        : 'Click Start timer when ready.';
    }

    function startChallenge() {
      unlocked = true;
      clearInterval(timerInterval);
      secondsLeft = 20;
      timerExpired = false;
      challengeComplete = false;
      avatarHidden = false;
      avatar.visible = true;
      setLocation(false);
      avatar.position.copy(avatarStart);
      startTimerButton.disabled = true;
      testButton.disabled = false;
      status.textContent = '20 seconds: hide and block the door, or walk out the door to the main corridor.';
      updateCountdown();
      updatePlacementStatus();

      timerInterval = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft <= 0 && !challengeComplete) {
          secondsLeft = 0;
          timerExpired = true;
          clearInterval(timerInterval);
          timerInterval = null;
        }
        updateCountdown();
        updatePlacementStatus();
      }, 1000);
    }

    function moveAvatar(dx, dz) {
      if (!unlocked || timerExpired || challengeComplete) return;
      avatarHidden = false;
      avatar.visible = true;
      const nextX = avatar.position.x + dx;
      const nextZ = avatar.position.z + dz;
      if (dx || dz) avatar.rotation.y = Math.atan2(dx, dz);

      if (inCorridor) {
        if (nextZ > -25.6) {
          setLocation(false);
          avatar.position.set(0, 0, -3.8);
        } else {
          avatar.position.x = THREE.MathUtils.clamp(nextX, -2.6, 2.6);
          avatar.position.z = THREE.MathUtils.clamp(nextZ, -34.4, -25.6);
        }
        updatePlacementStatus();
        return;
      }

      if (nextZ < -4.2 && Math.abs(nextX) < 1) {
        const placed = markerFill().filter(Boolean).length;
        if (placed === targetSpots.length) {
          status.textContent = 'The door is blocked by furniture. Move a piece away to go out.';
          return;
        }
        doorHinge.rotation.y = -1.15;
        setLocation(true);
        avatar.position.copy(corridorEntry);
        updatePlacementStatus();
        return;
      }

      avatar.position.x = THREE.MathUtils.clamp(nextX, -4.35, 4.35);
      avatar.position.z = THREE.MathUtils.clamp(nextZ, -4.35, 4.35);
      updatePlacementStatus();
    }

    function hideAvatar() {
      if (!unlocked || timerExpired || challengeComplete) return;
      if (!isAtHideSpot()) {
        status.textContent = 'Move your avatar to the blue floor marker, then hide.';
        return;
      }
      avatarHidden = true;
      avatar.visible = false;
      updatePlacementStatus();
    }

    document.querySelectorAll('[data-avatar-move]').forEach((button) => {
      button.addEventListener('click', () => {
        const [dx, dz] = button.dataset.avatarMove.split(',').map(Number);
        moveAvatar(dx * 0.55, dz * 0.55);
      });
    });
    hideButton.addEventListener('click', hideAvatar);

    window.addEventListener('keydown', (event) => {
      if (!unlocked || (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]'))) return;
      const key = event.key.toLowerCase();
      const step = 0.55;
      const moves = {
        w: [0, -step], arrowup: [0, -step],
        s: [0, step], arrowdown: [0, step],
        a: [-step, 0], arrowleft: [-step, 0],
        d: [step, 0], arrowright: [step, 0]
      };
      if (moves[key]) {
        moveAvatar(...moves[key]);
        event.preventDefault();
      } else if (key === 'e') {
        hideAvatar();
        event.preventDefault();
      }
    });

    function updatePlacementStatus() {
      const filled = markerFill();
      const placed = filled.filter(Boolean).length;
      const atHideSpot = isAtHideSpot();
      hideButton.disabled = !unlocked || !atHideSpot || avatarHidden || timerExpired || challengeComplete;
      targets.forEach((target, index) => {
        const isPlaced = filled[index];
        target.material.color.set(isPlaced ? '#51c878' : '#35c8d0');
        target.material.emissive.set(isPlaced ? '#16843e' : '#087f89');
      });
      if (!testing) {
        if (unlocked && !timerExpired && !challengeComplete && avatarHidden && (placed === 2 || inCorridor)) {
          challengeComplete = true;
          clearInterval(timerInterval);
          timerInterval = null;
          testButton.disabled = false;
          status.textContent = inCorridor
            ? `You got out and hid in the corridor with ${secondsLeft} seconds left. Stay quiet and follow responders.`
            : `You hid and built the barrier with ${secondsLeft} seconds left. Test the barrier.`;
        } else if (timerExpired) {
          testButton.disabled = true;
          status.textContent = 'Time is up. Reset furniture to try again.';
        } else if (challengeComplete) {
          testButton.disabled = false;
          status.textContent = inCorridor
            ? `Hidden in the corridor. ${secondsLeft} seconds remained. Reset to play again.`
            : `Barrier ready. ${secondsLeft} seconds remained. Test it or start a new round.`;
        } else if (unlocked) {
          testButton.disabled = false;
          const hideProgress = avatarHidden ? 'Hidden' : atHideSpot ? 'At the blue spot: press E or Hide here' : 'Move to the blue hide spot';
          status.textContent = inCorridor
            ? `Main corridor: hide at the blue marker by the lockers on the right. ${hideProgress}.`
            : `Round ${furnitureRoundIndex + 1}: ${furnitureRound.kinds.join(' + ')}. ${hideProgress}. Barrier ${placed} of 2.`;
        } else {
          startTimerButton.disabled = false;
          testButton.disabled = true;
          status.textContent = 'Press Start timer when you are ready.';
        }
      }
    }

    function pointOnFloor(event) {
      updatePointer(event);
      return raycaster.ray.intersectPlane(dragPlane, dragPoint);
    }

    canvas.addEventListener('pointerdown', (event) => {
      if (!unlocked || testing || timerExpired || challengeComplete) return;
      updatePointer(event);
      const intersections = raycaster.intersectObjects(allMovables().flatMap((item) => item.children), false);
      const hit = intersections.find((intersection) => intersection.object.userData.dragRoot);
      if (!hit) return;
      dragging = hit.object.userData.dragRoot;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
      event.preventDefault();
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!dragging || timerExpired || challengeComplete || !pointOnFloor(event)) return;
      dragging.position.x = THREE.MathUtils.clamp(dragPoint.x, -4.1, 4.1);
      dragging.position.z = THREE.MathUtils.clamp(dragPoint.z, -3.8, 4.2);
      updatePlacementStatus();
    });

    canvas.addEventListener('pointerup', (event) => {
      if (!dragging) return;
      dragging = null;
      canvas.style.cursor = 'grab';
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      updatePlacementStatus();
    });
    canvas.addEventListener('pointercancel', () => { dragging = null; canvas.style.cursor = 'grab'; });

    testButton.addEventListener('click', () => {
      if (testing || !unlocked || timerExpired) return;
      testing = true;
      testButton.disabled = true;
      resetButton.disabled = true;
      const placed = markerFill().filter(Boolean).length;
      const blocked = placed === targetSpots.length;
      const startZ = bot.position.z;
      const endZ = blocked ? -3.12 : 0.9;
      const startTime = performance.now();
      status.textContent = 'The friendly practice bot is checking the doorway...';

      function moveBot(now) {
        const progress = Math.min((now - startTime) / 1500, 1);
        const eased = progress * progress * (3 - 2 * progress);
        bot.position.z = THREE.MathUtils.lerp(startZ, endZ, eased);
        if (!blocked) doorHinge.rotation.y = -1.15 * eased;
        if (progress < 1) {
          requestAnimationFrame(moveBot);
          return;
        }
        testing = false;
        testButton.disabled = timerExpired;
        resetButton.disabled = false;
        status.textContent = blocked
          ? 'Barrier holds! The practice bot stopped at the furniture. Stay out of sight and follow responders.'
          : `Barrier incomplete: ${placed} of ${targetSpots.length} pieces in place. The bot reached the doorway.`;
      }

      requestAnimationFrame(moveBot);
    });

    function reset() {
      if (testing) return;
      applyFurnitureRound();
      doorHinge.rotation.y = 0;
      bot.position.set(0, 0, -3.92);
      resetButton.disabled = false;
      canvas.style.cursor = 'grab';
      clearInterval(timerInterval);
      timerInterval = null;
      unlocked = false;
      secondsLeft = 20;
      timerExpired = false;
      challengeComplete = false;
      avatarHidden = false;
      avatar.visible = true;
      setLocation(false);
      avatar.position.copy(avatarStart);
      startTimerButton.disabled = false;
      testButton.disabled = true;
      updateCountdown();
      updatePlacementStatus();
    }

    resetButton.addEventListener('click', reset);

    function resizeRenderer() {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / bounds.height;
      camera.updateProjectionMatrix();
    }
    const resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(canvas.parentElement);
    window.addEventListener('resize', resizeRenderer);
    resizeRenderer();
    canvas.style.cursor = 'grab';
    renderer.setAnimationLoop(() => renderer.render(scene, camera));
    updatePlacementStatus();

    return { reset, startChallenge };
  }

  async function loadGame() {
    if (loading || game) return;
    loading = true;
    try {
      const THREE = await import(threeUrl);
      game = createGame(THREE);
      if (startRequested) game.startChallenge();
    } catch (error) {
      status.textContent = 'The 3D classroom could not load. Check your internet connection and try again.';
      console.error('Unable to load the 3D classroom.', error);
      startTimerButton.disabled = false;
      startRequested = false;
    } finally {
      loading = false;
    }
  }

  loadGame();
})();