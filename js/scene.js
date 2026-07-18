/* BNDR scene — the Three.js glass cube, wrapped in a hard fail-safe. */
(function () {
  let AppState = null;

  function showFallback() {
    try {
      var c = document.getElementById("webgl-container");
      if (!c || c.dataset.bndrState === "fallback") return;
      c.dataset.bndrState = "fallback";
      c.classList.add("webgl-fallback");
      c.innerHTML =
        '<div class="fallback-orb" aria-hidden="true"></div>' +
        '<div class="fallback-orb orb-b" aria-hidden="true"></div>';
      var hint = document.getElementById("drag-hint");
      if (hint) hint.style.display = "none";
    } catch (e) {}
  }

function setupThreeJS() {
        const container = document.getElementById("webgl-container");
        if (!container) return;

        let isWebGLVisible = true;
        const webglObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              isWebGLVisible = entry.isIntersecting;
            });
          },
          { rootMargin: "0px", threshold: 0.01 },
        );
        webglObserver.observe(container);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          35,
          window.innerWidth / window.innerHeight,
          0.1,
          100,
        );
        camera.position.z = 16;

        let basePosX = window.innerWidth > 800 ? 1.7 : 0;
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, window.innerWidth < 800 ? 1.0 : 2),
        );
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        container.appendChild(renderer.domElement);

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const envScene = new THREE.Scene();
        const envLight1 = new THREE.PointLight(0xffffff, 2, 0);
        const envLight2 = new THREE.PointLight(0xccff00, 4, 0);
        const envLight3 = new THREE.PointLight(0xff0055, 4, 0);
        envLight3.position.set(0, -20, 10);
        envScene.add(envLight1, envLight2, envLight3);
        const renderTarget = pmremGenerator.fromScene(envScene, 0.04);
        scene.environment = renderTarget.texture;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);
        const pointLight1 = new THREE.PointLight(0xccff00, 8, 50);
        pointLight1.position.set(6, 6, 6);
        scene.add(pointLight1);
        const pointLight2 = new THREE.PointLight(0xff0055, 10, 50);
        pointLight2.position.set(-6, -6, -2);
        scene.add(pointLight2);

        const shadowCanvas = document.createElement("canvas");
        shadowCanvas.width = 512;
        shadowCanvas.height = 512;
        const ctx = shadowCanvas.getContext("2d");
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, "rgba(4, 4, 5, 0.5)");
        gradient.addColorStop(1, "rgba(4, 4, 5, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
        const shadowMaterial = new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          depthWrite: false,
          opacity: 0.85,
        });
        const shadowPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(12, 12),
          shadowMaterial,
        );
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -4;
        scene.add(shadowPlane);

        const boxGroup = new THREE.Group();
        scene.add(boxGroup);
        boxGroup.position.set(-20, -15, 10);

        const glassMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x0a0a0b,
          metalness: 0.6,
          roughness: 0.15,
          transmission: 0.95,
          thickness: 3.0,
          ior: 1.9,
          clearcoat: 1.0,
          clearcoatRoughness: 0.02,
          envMapIntensity: 1.5,
          side: THREE.FrontSide,
          transparent: true,
        });

        const innerMaterial = new THREE.MeshStandardMaterial({
          color: 0x020202,
          metalness: 1.0,
          roughness: 0.1,
          emissive: 0xccff00,
          emissiveIntensity: 0.25,
        });

        const s = 2.2;
        const thickness = 0.15;
        const faceDefinitions = [
          {
            id: 0,
            p: [0, 0, s],
            r: [0, 0, 0],
            pivot: [-s, 0, 0],
            axis: "y",
            dir: 1,
          },
          {
            id: 1,
            p: [0, 0, -s],
            r: [0, Math.PI, 0],
            pivot: [s, 0, 0],
            axis: "y",
            dir: 1,
          },
          {
            id: 2,
            p: [s, 0, 0],
            r: [0, Math.PI / 2, 0],
            pivot: [0, 0, -s],
            axis: "y",
            dir: 1,
          },
          {
            id: 3,
            p: [-s, 0, 0],
            r: [0, -Math.PI / 2, 0],
            pivot: [0, 0, s],
            axis: "y",
            dir: 1,
          },
          {
            id: 4,
            p: [0, s, 0],
            r: [-Math.PI / 2, 0, 0],
            pivot: [0, -s, 0],
            axis: "x",
            dir: -1,
          },
          {
            id: 5,
            p: [0, -s, 0],
            r: [Math.PI / 2, 0, 0],
            pivot: [0, s, 0],
            axis: "x",
            dir: 1,
          },
        ];

        const doors = [];
        const geometry = new THREE.BoxGeometry(
          s * 2,
          s * 2,
          thickness,
          2,
          2,
          2,
        );
        const centerGeo = new THREE.IcosahedronGeometry(s * 1.2, 0);
        const centerMesh = new THREE.Mesh(centerGeo, innerMaterial);
        boxGroup.add(centerMesh);

        faceDefinitions.forEach((def) => {
          const pivotGroup = new THREE.Group();
          pivotGroup.position.set(...def.p);
          pivotGroup.rotation.set(...def.r);
          pivotGroup.userData = { origPos: new THREE.Vector3(...def.p) };

          const hinge = new THREE.Group();
          hinge.position.set(...def.pivot);
          pivotGroup.add(hinge);

          const mesh = new THREE.Mesh(geometry, glassMaterial);
          mesh.position.set(-def.pivot[0], -def.pivot[1], -def.pivot[2]);

          hinge.add(mesh);
          boxGroup.add(pivotGroup);

          doors.push({
            mesh,
            pivotGroup,
            axis: def.axis,
            dir: def.dir,
            parentHinge: hinge,
          });
        });

        let currentRotation = { x: 0.5, y: 0.5 };
        let spinRate = { x: 0, y: 0 };
        let isDragging = false;
        let dragHistory = [];
        let vel = new THREE.Vector3(0, 0, 0);
        let gyroGoal = { x: 0, y: 0 };
        let currentGyroOffset = { x: 0, y: 0 };
        let isGyroActive = false;
        let dragHintTimeout = null;

        window.addEventListener("resize", () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          basePosX = window.innerWidth > 800 ? 1.7 : 0;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(
            Math.min(
              window.devicePixelRatio,
              window.innerWidth < 800 ? 1.0 : 2,
            ),
          );
        });

        function handleInteractionStart(e) {
          if (
            e &&
            e.target &&
            e.target.closest(".page-layer, .drawer, .modal-overlay, .nav-pill")
          )
            return;
          if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
          ) {
            DeviceOrientationEvent.requestPermission()
              .then((permissionState) => {
                if (permissionState === "granted") {
                  window.addEventListener("deviceorientation", gyroHandler);
                }
              })
              .catch(console.error);
          } else {
            window.addEventListener("deviceorientation", gyroHandler);
          }
          window.removeEventListener("mousedown", handleInteractionStart);
          window.removeEventListener("touchstart", handleInteractionStart);
        }
        window.addEventListener("mousedown", handleInteractionStart);
        window.addEventListener("touchstart", handleInteractionStart, {
          passive: true,
        });

        function startDrag(clientX, clientY) {
          isDragging = true;
          dragHistory = [{ x: clientX, y: clientY, time: Date.now() }];
          const dragHint = document.getElementById("drag-hint");
          if (dragHint) {
            dragHint.classList.add("is-hidden");
            clearTimeout(dragHintTimeout);
          }
          document.body.classList.add("is-dragging-3d");
        }
        function trackDrag(clientX, clientY) {
          if (!isDragging) return;
          const last = dragHistory[dragHistory.length - 1];
          spinRate.y += (clientX - last.x) * 0.0008;
          spinRate.x += (clientY - last.y) * 0.0008;
          dragHistory.push({ x: clientX, y: clientY, time: Date.now() });
          if (dragHistory.length > 6) dragHistory.shift();
        }
        function endDrag() {
          isDragging = false;
          document.body.classList.remove("is-dragging-3d");
          if (dragHistory.length > 1) {
            const oldest = dragHistory[0];
            const newest = dragHistory[dragHistory.length - 1];
            const dt = Math.max(16, newest.time - oldest.time);
            vel.x += ((newest.x - oldest.x) / dt) * 1.2;
            vel.y -= ((newest.y - oldest.y) / dt) * 1.2;
            vel.z += ((newest.y - oldest.y) / dt) * 5.0;
          }
          dragHistory = [];

          const dragHint = document.getElementById("drag-hint");
          if (dragHint) {
            clearTimeout(dragHintTimeout);
            dragHintTimeout = setTimeout(() => {
              if (
                !isDragging &&
                AppState.currentPath === "/home" &&
                window.scrollY <= 10
              ) {
                dragHint.classList.remove("is-hidden");
              }
            }, 4000);
          }
        }

        window.addEventListener("mousedown", (e) => {
          if (
            e.target.closest(
              "button, a, input, textarea, details, .glass-panel, .gallery-card, .drawer, .modal-overlay",
            )
          )
            return;
          startDrag(e.clientX, e.clientY);
        });
        window.addEventListener("mousemove", (e) =>
          trackDrag(e.clientX, e.clientY),
        );
        window.addEventListener("mouseup", endDrag);
        window.addEventListener(
          "touchstart",
          (e) => {
            if (
              e.target.closest(
                "button, a, input, textarea, details, .glass-panel, .gallery-card, .drawer, .modal-overlay",
              )
            )
              return;
            if (e.touches.length === 1)
              startDrag(e.touches[0].clientX, e.touches[0].clientY);
          },
          { passive: true },
        );
        window.addEventListener(
          "touchmove",
          (e) => {
            if (
              e.target.closest(
                "button, a, input, textarea, details, .glass-panel, .gallery-card, .drawer, .modal-overlay",
              )
            )
              return;
            if (e.touches.length === 1)
              trackDrag(e.touches[0].clientX, e.touches[0].clientY);
          },
          { passive: true },
        );
        window.addEventListener(
          "touchend",
          (e) => {
            if (
              e.target.closest(
                "button, a, input, textarea, details, .glass-panel, .gallery-card, .drawer, .modal-overlay",
              )
            )
              return;
            endDrag();
          },
          { passive: true },
        );

        function gyroHandler(e) {
          if (!e.beta || !e.gamma) return;
          isGyroActive = true;
          gyroGoal.x =
            THREE.MathUtils.degToRad(Math.max(-90, Math.min(90, e.beta)) - 45) *
            0.8;
          gyroGoal.y =
            THREE.MathUtils.degToRad(Math.max(-90, Math.min(90, e.gamma))) *
            0.8;
        }

        const clock = new THREE.Clock();

        function animate() {
          requestAnimationFrame(animate);

          AppState.currentScrollProgress +=
            (AppState.goalScrollProgress - AppState.currentScrollProgress) *
            0.15;

          doors.forEach((door) => {
            const goalAngle =
              (Math.PI / 1.6) * door.dir * AppState.currentScrollProgress;
            door.parentHinge.rotation[door.axis] +=
              (goalAngle - door.parentHinge.rotation[door.axis]) * 0.2;
            const fractureAmount = AppState.currentScrollProgress * 2.5;
            const origPos = door.pivotGroup.userData.origPos;
            const goalPos = origPos.clone().multiplyScalar(1 + fractureAmount);
            door.pivotGroup.position.lerp(goalPos, 0.2);
          });

          innerMaterial.emissiveIntensity =
            0.25 + AppState.currentScrollProgress * 2.5;
          centerMesh.rotation.x = AppState.currentScrollProgress * Math.PI;
          centerMesh.rotation.y =
            AppState.currentScrollProgress * Math.PI * 0.5;
          centerMesh.scale.setScalar(1 + AppState.currentScrollProgress * 0.4);

          if (!isDragging) {
            vel.x += (basePosX - boxGroup.position.x) * 0.015;
            vel.y += (0 - boxGroup.position.y) * 0.015;
            vel.z += (0 - boxGroup.position.z) * 0.004;
            if (
              vel.lengthSq() < 0.001 &&
              boxGroup.position.distanceToSquared(
                new THREE.Vector3(basePosX, 0, 0),
              ) < 1
            ) {
              vel.x += (Math.random() - 0.5) * 0.001;
              vel.y += (Math.random() - 0.5) * 0.001;
              vel.z += (Math.random() - 0.5) * 0.002;
            }
            boxGroup.position.add(vel);
            vel.multiplyScalar(0.94);
          }

          currentRotation.x += spinRate.x;
          currentRotation.y += spinRate.y;
          const damping = isGyroActive && !isDragging ? 0.99 : 0.95;
          spinRate.x *= damping;
          spinRate.y *= damping;
          spinRate.x = Math.max(-0.08, Math.min(0.08, spinRate.x));
          spinRate.y = Math.max(-0.08, Math.min(0.08, spinRate.y));

          if (isGyroActive) {
            if (!AppState.isScrolling) {
              currentGyroOffset.x += (gyroGoal.x - currentGyroOffset.x) * 0.1;
              currentGyroOffset.y += (gyroGoal.y - currentGyroOffset.y) * 0.1;
            } else {
              currentGyroOffset.x *= 0.9;
              currentGyroOffset.y *= 0.9;
            }
          }

          boxGroup.rotation.x = currentRotation.x + currentGyroOffset.x;
          boxGroup.rotation.y = currentRotation.y + currentGyroOffset.y;

          const time = clock.getElapsedTime();
          pointLight1.position.y = 6 + Math.sin(time * 0.8) * 2.5;
          pointLight2.position.x = -6 + Math.cos(time * 0.8) * 2.5;

          shadowPlane.position.x = boxGroup.position.x;
          shadowPlane.position.z = boxGroup.position.z;

          const distY = Math.max(
            0,
            boxGroup.position.y - shadowPlane.position.y,
          );
          const zScale = Math.max(0.2, 1 + boxGroup.position.z * 0.04);
          shadowPlane.scale.setScalar(
            (1 + Math.sin(time * 2) * 0.03) * zScale + distY * 0.05,
          );
          shadowPlane.material.opacity = Math.max(
            0,
            0.85 - distY * 0.06 - Math.sin(time * 2) * 0.05,
          );

          if (isWebGLVisible) {
            renderer.render(scene, camera);
          }
        }
        animate();
      }
    
  function initScene() {
    AppState = window.BNDRAppState || {
      goalScrollProgress: 0,
      currentScrollProgress: 0,
      isScrolling: false,
      currentPath: "/home",
    };
    try {
      setupThreeJS();
      var c = document.getElementById("webgl-container");
      if (c) c.dataset.bndrState = "live";
    } catch (e) {
      console.warn("BNDR: WebGL unavailable, engaging fallback.", e);
      showFallback();
    }
  }

  window.BNDRScene = { init: initScene, fallback: showFallback };
})();
