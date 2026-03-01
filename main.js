import * as THREE from 'three';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RapierPhysics } from 'three/addons/physics/RapierPhysics.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import TOON_TONE from './images/threeTone.jpg'

let physics;
let dragControls;
let orbitControls;
let renderer;
let scene;
let camera;
let allObjects = [];
let keyboardModel;
let cameraModel;
let controllerModel;
let pencilModel;
let spheres = [];
let canScale = true;

// For hover detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredSphere = null;

const audioLoader = new THREE.AudioLoader();

const sphereHoverListener = new THREE.AudioListener();
let hoverSound;

const popListener = new THREE.AudioListener();
let popSound;

const clickListener = new THREE.AudioListener();
let clickSound;


let hitKeyboard = false;
let hitCamera = false;
let hitController = false;
let hitPaper = false;

let wasHitKeyboard = false;
let wasHitCamera = false;
let wasHitController = false;
let wasHitPaper = false;

let prevHitKeyboard = false;
let prevHitCamera = false;
let prevHitController = false;
let prevHitPaper = false;

init();

async function init(){

    physics = await RapierPhysics();
    console.log(Object.keys(physics))

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1000);
    camera.add(sphereHoverListener);
    hoverSound = new THREE.Audio(sphereHoverListener);
    audioLoader.load('/sounds/hover3.wav', (buffer) => {
        hoverSound.setBuffer(buffer);
        hoverSound.setVolume(0.5);
    });

    camera.add(popListener);
    popSound = new THREE.Audio(popListener);
    audioLoader.load('/sounds/pop.wav', (buffer) => {
        popSound.setBuffer(buffer);
        popSound.setVolume(0.3);
    });

    camera.add(clickListener);
    clickSound = new THREE.Audio(clickListener);
    audioLoader.load('/sounds/click.wav', (buffer) => {
        clickSound.setBuffer(buffer);
        clickSound.setVolume(0.3);
    });
    

    //ADD 3D MODELS
    //box
    const loader = new GLTFLoader();
    const boxGltf = await loader.loadAsync('/models/box.glb');
    //const keyboardModel = keyboardGltf.scene;
    //keyboardModel.scale.set(25, 25, 25);
    //scene.add(keyboardModel);
    //const keyboardBox = new THREE.Box3().setFromObject(keyboardModel);
    //const keyboardSize = keyboardBox.getSize(new THREE.Vector3());

    keyboardModel = await addModelWithBoxCollider('/models/keyboard.glb', [0, 25, 0], [25,25,25], 1)
    cameraModel = await addModelWithBoxCollider('/models/1990s_low_poly_camera.glb', [0, 28, 0], [100, 100, 100], 1)
    controllerModel = await addModelWithBoxCollider('/models/controller2.glb', [0, 31, 0], [1, 1, 1], 1)
    pencilModel = await addModelWithBoxCollider('/models/pencilpaper2.glb', [0, 34, 0], [.1, .1, .1], 1)

    const boxModel = boxGltf.scene;
    boxModel.scale.set(25, 25, 25);
    scene.add(boxModel);
    // Measure the model
    const box = new THREE.Box3().setFromObject(boxModel);
    const size = box.getSize(new THREE.Vector3());
    //size += new THREE.Vector3(1, 1, 1)
    const center = box.getCenter(new THREE.Vector3());
    const T = 0.2; // wall thickness
    boxModel.traverse((child) => {
    if (child.isMesh) {
        child.receiveShadow = true;
    }
    }); 

    const scaleXZ = 0.65; // adjust this until it fits

    // Floor
    makeWall(size.x * scaleXZ, T, size.z * scaleXZ,  0, -size.y / 2, 0, center);
    // Left wall
    makeWall(T, size.y, size.z * scaleXZ,  -size.x / 2 * scaleXZ, 0, 0, center);
    // Right wall
    makeWall(T, size.y, size.z * scaleXZ,   size.x / 2 * scaleXZ, 0, 0, center);
    // Front wall
    makeWall(size.x * scaleXZ, size.y, T,  0, 0,  size.z / 2 * scaleXZ, center);
    // Back wall
    makeWall(size.x * scaleXZ, size.y, T,  0, 0, -size.z / 2 * scaleXZ, center);

    // IMPORTANT: register the new colliders with physics
    //physics.addScene(scene);


    const canvas = document.querySelector('#c');
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setClearColor(0x0A0B0B);
    renderer.setSize(window.innerWidth / 1.25, window.innerHeight / 1.25);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // softer shadows


    //modal logic
    // Wire up close buttons — add inside init() after renderer is created
    document.getElementById('close-coding').addEventListener('click', () => closeModal('modal-coding'));
    document.getElementById('close-gamedev').addEventListener('click', () => closeModal('modal-gamedev'));
    document.getElementById('close-photos').addEventListener('click', () => closeModal('modal-photos'));
    document.getElementById('close-paper').addEventListener('click', () => closeModal('modal-paper'));
    window.openModal = openModal;
    window.closeModal = closeModal;
    
    // Close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.open').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });

    // Right click handler — add inside init()
    renderer.domElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(allObjects, false);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            if (hit === allObjects[0]) openModal('modal-coding');
            if (hit === allObjects[1]) openModal('modal-photos');
            if (hit === allObjects[2]) openModal('modal-gamedev');
            if (hit === allObjects[3]) openModal('modal-paper');
        }
    });


    const THICKNESS = 0.075;
    const outlineMaterial = new THREE.ShaderMaterial({
        vertexShader: /*glsl*/`
        void main(){
            vec3 newPosition = position + normal * ${THICKNESS};
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1);
        }
        `,
        fragmentShader: /*glsl*/`
        void main(){
            gl_FragColor = vec4(1, 1, 1, 1);
        }
        `,
        side: THREE.BackSide
    });

    for(let i = 0; i < 100; i++){
        const texture = await new THREE.TextureLoader().loadAsync(TOON_TONE);
        const spotTexture = createNoiseTexture();
        texture.minFilter = texture.magFilter = THREE.NearestFilter;
        const geometry = new THREE.SphereGeometry(1);
        
        const hue = Math.random();

        const material = new THREE.MeshToonMaterial({
            color: new THREE.Color().setHSL(hue, 0.6, 0.5),
            gradientMap: texture,
            map: spotTexture
        });
        let sphere = new THREE.Mesh(geometry, material);
        let outline = new THREE.Mesh(geometry, outlineMaterial);

        // Start with outline hidden — only show on hover
        outline.visible = false;

        sphere.userData.physics = { mass: 1 };
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        sphere.add(outline);
        sphere.position.set(
            (Math.random() - 0.5) * 3 + i / 10 - 5,
            Math.random() * 20 + 15,
            (Math.random() - 0.5) * 3 + i / 10 - 5
        );
        allObjects.push(sphere);
        spheres.push(sphere);
        scene.add(sphere);
    }

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-20, 15, 20); // position relative to camera
    camera.add(light);
    scene.add(camera);
    /*light.castShadow = true;
    light.shadow.mapSize.width = 4048;  // higher = sharper shadows
    light.shadow.mapSize.height = 4048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = -50;
    light.shadow.camera.right = 50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    light.shadow.bias = -0.005; // negative values fix most shadow acne*/

    //const light2 = new THREE.DirectionalLight(0xffffff, .75);
    //light2.position.set(5, -10, -20);
    //scene.add(light2);

    const floorCollider = new THREE.Mesh(
    new THREE.BoxGeometry(200, 5, 200), // huge XZ extent
    new THREE.MeshBasicMaterial({ color: 0xb3b0a8 })
    );
    floorCollider.position.y = -10; // lower than your respawn threshold of -20
    floorCollider.userData.physics = { mass: 0 };
    floorCollider.visible = false;
    floorCollider.receiveShadow = true;
    scene.add(floorCollider);

    physics.addScene(scene);

    // --- Drag Controls (left mouse button = 0) ---
    dragControls = new DragControls(allObjects, camera, renderer.domElement);

    const _onPointerDown = dragControls._onPointerDown.bind(dragControls);

    window.addEventListener('pointerdown', (e) => {
    if (e.button === 2) dragControls.enabled = false;
    if (e.button === 1) dragControls.enabled = false;
    if (e.button === 0 && e.altKey) {
        dragControls.enabled = false;
        orbitControls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: null
        };
    }
    }, true);


    window.addEventListener('pointerup', (e) => {
    if (e.button === 2) dragControls.enabled = true;
    if (e.button === 1) dragControls.enabled = true;
    if (e.button === 0) {
        dragControls.enabled = true;
        // restore original config so normal left click still drags
        orbitControls.mouseButtons = {
            LEFT: null,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: null
        };
    }
    }, true);

    dragControls.addEventListener('dragstart', function(event) {
        // Disable orbit while dragging a sphere
        canScale = false;
        orbitControls.enabled = false;
        physics.removeMesh(event.object);
    });

    dragControls.addEventListener('dragend', function(event) {
        canScale = true;
        orbitControls.enabled = true;
        physics.addMesh(event.object, 1, 0);
    });

    // --- Orbit Controls (right mouse button = 2) ---
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.set(0, 0, 0);       // orbit around origin
    orbitControls.mouseButtons = {
        LEFT: null,                            // don't hijack left click
        MIDDLE: THREE.MOUSE.ROTATE,
        RIGHT: null
    };
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;

    

    // --- Hover detection ---
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    camera.position.set(0, 15, 25)
    orbitControls.update()
    renderer.setAnimationLoop(animate);
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    

    // Save previous states
    prevHitKeyboard = wasHitKeyboard;
    prevHitCamera = wasHitCamera;
    prevHitController = wasHitController;
    prevHitPaper = wasHitPaper;

    // Update current states
    wasHitKeyboard = hitKeyboard = checkKeyboard(event);
    wasHitCamera = hitCamera = checkCamera(event);
    wasHitController = hitController = checkController(event);
    wasHitPaper = hitPaper = checkPaper(event);

    if (hitKeyboard && !prevHitKeyboard) {
        popSound.play();
    }
    if (hitCamera && !prevHitCamera) {
        popSound.play();
    }
    if (hitController && !prevHitController) {
        popSound.play();
    }
    if (hitPaper && !prevHitPaper) {
        popSound.play();
    }

    var hitModel = false;
    if(hitKeyboard || hitCamera || hitController || hitPaper)
    {
        hitModel = true
    }

    
    // Only test against the sphere meshes themselves, not their children
    var intersects = raycaster.intersectObjects(spheres, false); // false = non-recursive
    if (intersects.length > 0 && hitModel == false) {
        const hit = intersects[0].object;
        if (hit !== hoveredSphere) {
            if (hoveredSphere) {
                hoveredSphere.children[0].visible = false;
            }
            hoveredSphere = hit;
            hoveredSphere.children[0].visible = true;
            //if (hoverSound.isPlaying) hoverSound.stop();
            
                hoverSound.play();
        }
    } else {
        if (hoveredSphere) {
            hoveredSphere.children[0].visible = false;
            hoveredSphere = null;
        }
    }

    
}

function checkKeyboard(event){
    if(canScale == false)
    {
        if(keyboardModel.scale.x == 30){
            return true;
        }
        else{
            return false;
        }
    }
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Only test against the sphere meshes themselves, not their children
    const intersects = raycaster.intersectObjects(allObjects, false); // false = non-recursive

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit == allObjects[0])
        {
            // Play sounds only on the frame we first enter the hover
            
            keyboardModel.scale.set(30, 30, 30);
            return true;
        }
        else{
            keyboardModel.scale.set(25, 25, 25);
        }
    }
    else{
        keyboardModel.scale.set(25, 25, 25);
    }
}

function checkCamera(event){
    if(canScale == false)
    {
        if(cameraModel.scale.x == 120){
            return true;
        }
        else{
            return false;
        }
    }
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Only test against the sphere meshes themselves, not their children
    const intersects = raycaster.intersectObjects(allObjects, false); // false = non-recursive

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit == allObjects[1])
        {
            cameraModel.scale.set(120, 120, 120);
            return true;
        }
        else{
            cameraModel.scale.set(100, 100, 100);
        }
    }
    else{
        cameraModel.scale.set(100, 100, 100);
    }
}

function checkController(event){
    if(canScale == false)
    {
        if(controllerModel.scale.x == 1.2){
            return true;
        }
        else{
            return false;
        }
    }
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Only test against the sphere meshes themselves, not their children
    const intersects = raycaster.intersectObjects(allObjects, false); // false = non-recursive

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit == allObjects[2])
        {
            controllerModel.scale.set(1.2, 1.2, 1.2);
            return true;
        }
        else{
            controllerModel.scale.set(1, 1, 1);
        }
    }
    else{
        controllerModel.scale.set(1, 1, 1);
    }
}

function checkPaper(event){
    if(canScale == false)
    {
        if(pencilModel.scale.x == .12){
            return true;
        }
        else{
            return false;
        }
    }
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Only test against the sphere meshes themselves, not their children
    const intersects = raycaster.intersectObjects(allObjects, false); // false = non-recursive

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit == allObjects[3])
        {
            pencilModel.scale.set(.12, .12, .12);
            return true;
        }
        else{
            pencilModel.scale.set(.1, .1, .1);
        }
    }
    else{
        pencilModel.scale.set(.1, .1, .1);
    }
}


function animate() {
    scene.traverse((obj) => {
        if (obj.userData.syncModel) {
            obj.userData.syncModel.position.copy(obj.position);
            obj.userData.syncModel.quaternion.copy(obj.quaternion);
        }
    });

    for (const sphere of allObjects) {
        if (sphere.position.y < -20 && !sphere.userData.respawning) {
            sphere.userData.respawning = true;

            physics.setMeshPosition(
                sphere,
                new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    Math.random() * 5 + 15,
                    (Math.random() - 0.5) * 10
                ),
                0  // index — required even for non-instanced meshes
            );

            // Reset velocity so it doesn't keep flying
            physics.setMeshVelocity(sphere, new THREE.Vector3(0, 0, 0), 0);

            sphere.userData.respawning = false;
        }
    }

    orbitControls.update();
    renderer.render(scene, camera);
}

// Helper to make an invisible static collider
function makeWall(w, h, d, x, y, z, center) {
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    wall.position.set(center.x + x, center.y + y, center.z + z);
    wall.userData.physics = { mass: 0 };
    scene.add(wall);
}

async function addModelWithBoxCollider(path, position, scale, mass = 0) {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(path);
    const model = gltf.scene;
    model.scale.set(...scale);
    model.position.set(...position);
    scene.add(model);
    model.traverse((child) => {
    if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
    }
});

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const collider = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    

    
    // Start with outline hidden — only show on hover
    //utline.visible = false;

    collider.position.copy(center);
    collider.userData.physics = { mass };
    scene.add(collider);
    allObjects.push(collider);
    if (mass > 0) {
        collider.userData.syncModel = model;
    }

    return model;
}

function createSpotTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Background color
    ctx.fillStyle = '#3256a8';
    ctx.fillRect(0, 0, 512, 512);

    // Draw dots
    ctx.fillStyle = '#4a7fd4';
    const dotRadius = 5;
    const spacing = 128;
    for (let x = 0; x < 512; x += spacing) {
        for (let y = 0; y < 512; y += spacing) {
            ctx.beginPath();
            ctx.arc(x + spacing / 2, y + spacing / 2, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    return new THREE.CanvasTexture(canvas);
}


function createNoiseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(512, 512);
    const data = imageData.data;

    // Simple value noise — interpolated random grid
    const gridSize = 8; // lower = bigger blobs, higher = finer grain
    const grid = [];
    const cells = gridSize + 1;
    for (let i = 0; i < cells * cells; i++) {
        grid[i] = Math.random();
    }

    function smoothstep(t) {
        return t * t * (3 - 2 * t);
    }

    function valueNoise(x, y) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const tx = smoothstep(x - xi);
        const ty = smoothstep(y - yi);

        const c00 = grid[(yi % gridSize) * cells + (xi % gridSize)];
        const c10 = grid[(yi % gridSize) * cells + ((xi + 1) % gridSize)];
        const c01 = grid[((yi + 1) % gridSize) * cells + (xi % gridSize)];
        const c11 = grid[((yi + 1) % gridSize) * cells + ((xi + 1) % gridSize)];

        return (
            c00 * (1 - tx) * (1 - ty) +
            c10 * tx * (1 - ty) +
            c01 * (1 - tx) * ty +
            c11 * tx * ty
        );
    }

    // Base color — tweak these to match your sphere color
    const baseR = 50, baseG = 86, baseB = 168;
    const noiseStrength = 25; // 0 = invisible, 255 = extreme

    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
            const nx = (x / 512) * gridSize;
            const ny = (y / 512) * gridSize;
            const n = valueNoise(nx, ny);
            const offset = (n - 0.5) * noiseStrength;

            const i = (y * 512 + x) * 4;
            data[i]     = Math.min(255, Math.max(0, baseR + offset));
            data[i + 1] = Math.min(255, Math.max(0, baseG + offset));
            data[i + 2] = Math.min(255, Math.max(0, baseB + offset));
            data[i + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
}

// Add this helper function
function openModal(id) {
    clickSound.play();
    document.getElementById(id).classList.add('open');
}

function closeModal(id) {
    clickSound.play();
    document.getElementById(id).classList.remove('open');
}