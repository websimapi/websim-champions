import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let room, tv, consoleBox, cartridge;
let raycaster, mouse;
let selectedObject = null;
let initialMousePos = new THREE.Vector2();
let initialObjectPos = new THREE.Vector3();
let plane = new THREE.Plane();
let intersection = new THREE.Vector3();

function init() {
    const container = document.getElementById('intro-container');
    
    // Scene
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 2.5);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);

    // Controls (optional, for debugging)
    // controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(0, 1, 0);
    // controls.update();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 3, 2);
    scene.add(pointLight);

    // Create objects
    createRoom();
    createTV();
    createConsole();
    createCartridge();

    // Interaction setup
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('touchstart', onTouchStart, false);
    window.addEventListener('touchmove', onTouchMove, false);
    window.addEventListener('touchend', onTouchEnd, false);

    window.addEventListener('resize', onWindowResize, false);

    // Fade in scene and hide preloader
    setTimeout(() => {
        container.classList.add('visible');
        document.getElementById('preloader').classList.add('finished');
    }, 500);

    animate();
}

function createRoom() {
    const textureLoader = new THREE.TextureLoader();
    const wallTexture = textureLoader.load('https://www.transparenttextures.com/patterns/concrete-wall.png');
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(4, 4);

    const floorTexture = textureLoader.load('https://www.transparenttextures.com/patterns/wood-pattern.png');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 8);
    
    room = new THREE.Group();

    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, color: 0x888888 });
    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, color: 0x604030 });
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    room.add(floor);

    // Walls
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMaterial);
    backWall.position.set(0, 2.5, -5);
    room.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMaterial);
    leftWall.position.set(-5, 2.5, 0);
    leftWall.rotation.y = Math.PI / 2;
    room.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMaterial);
    rightWall.position.set(5, 2.5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    room.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), ceilingMaterial);
    ceiling.position.y = 5;
    ceiling.rotation.x = Math.PI / 2;
    room.add(ceiling);

    scene.add(room);
}

function createTV() {
    tv = new THREE.Group();
    
    // Screen
    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.77 * 1.2, 1 * 1.2), screenMaterial); // 16:9 aspect ratio
    screen.name = "tv_screen";
    
    // Bezel
    const bezelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.1 });
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.77 * 1.2 + 0.1, 1 * 1.2 + 0.1, 0.1), bezelMaterial);
    bezel.position.z = -0.05;
    
    tv.add(screen);
    tv.add(bezel);
    
    tv.position.set(0, 1.5, -4.9);
    scene.add(tv);
}

function createConsole() {
    const consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    const consoleGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.4);
    consoleBox = new THREE.Mesh(consoleGeometry, consoleMaterial);
    consoleBox.position.set(0, 0.05, -0.5);
    scene.add(consoleBox);

    // "Wire" to TV
    const points = [];
    points.push(new THREE.Vector3(0, 0.1, -0.7)); // From console
    points.push(new THREE.Vector3(0, 0.1, -2.5)); // Mid point on floor
    points.push(new THREE.Vector3(0, 1.0, -4.8)); // To TV
    const curve = new THREE.CatmullRomCurve3(points);
    const wireGeometry = new THREE.TubeGeometry(curve, 20, 0.01, 8, false);
    const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x101010 });
    const wire = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wire);
}

function createCartridge() {
    const cartridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x902020, roughness: 0.6 });
    const cartridgeGeometry = new THREE.BoxGeometry(0.15, 0.03, 0.12);
    cartridge = new THREE.Mesh(cartridgeGeometry, cartridgeMaterial);
    cartridge.position.set(0.5, 0.015, -0.2);
    scene.add(cartridge);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function handlePointerDown(x, y) {
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cartridge);
    
    if (intersects.length > 0) {
        selectedObject = cartridge;
        plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(plane.normal), selectedObject.position);
        initialMousePos.set(x, y);
        initialObjectPos.copy(selectedObject.position);
    }
}

function handlePointerMove(x, y) {
    if (selectedObject) {
        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(plane, intersection);

        // Move the object, but clamp its position
        let newY = Math.max(0.015, intersection.y); // Don't go through floor
        let newX = Math.max(-1, Math.min(1, intersection.x));
        let newZ = Math.max(-1, Math.min(1, intersection.z));

        selectedObject.position.set(newX, newY, newZ);
        
        // Check for insertion
        const dist = selectedObject.position.distanceTo(consoleBox.position);
        if (dist < 0.2) {
            insertCartridge();
        }
    }
}

function handlePointerUp() {
    selectedObject = null;
}

// Mouse events
function onMouseDown(event) { handlePointerDown(event.clientX, event.clientY); }
function onMouseMove(event) { handlePointerMove(event.clientX, event.clientY); }
function onMouseUp(event) { handlePointerUp(); }
// Touch events
function onTouchStart(event) { if (event.touches.length > 0) handlePointerDown(event.touches[0].clientX, event.touches[0].clientY); }
function onTouchMove(event) { if (event.touches.length > 0) handlePointerMove(event.touches[0].clientX, event.touches[0].clientY); }
function onTouchEnd(event) { handlePointerUp(); }


function insertCartridge() {
    if (window.gameStarting) return;
    window.gameStarting = true;
    selectedObject = null;
    
    // Animate cartridge into console
    cartridge.position.set(consoleBox.position.x, consoleBox.position.y + 0.05, consoleBox.position.z);
    cartridge.rotation.set(0, 0, 0);

    // Start audio
    window.resumeAudioContext();
    
    // Play sound effect
    const insertSound = new Audio('/stone_shift.mp3');
    insertSound.volume = 0.5;
    insertSound.play();
    
    // Turn on TV screen
    const tvScreen = tv.getObjectByName("tv_screen");
    const textureLoader = new THREE.TextureLoader();
    const tvTexture = textureLoader.load('/main-menu-background.png');
    tvScreen.material.map = tvTexture;
    tvScreen.material.needsUpdate = true;

    // Zoom into TV
    const targetPosition = new THREE.Vector3(0, 1.5, -3.8);
    const duration = 2000;
    const startTime = Date.now();

    function zoomAnimation() {
        const elapsedTime = Date.now() - startTime;
        const t = Math.min(1, elapsedTime / duration);
        camera.position.lerpVectors(camera.position, targetPosition, t * 0.1);
        
        if (t < 1) {
            requestAnimationFrame(zoomAnimation);
        } else {
            // Transition complete
            document.getElementById('intro-container').style.opacity = '0';
            document.getElementById('start-overlay').classList.add('visible');
            setTimeout(() => {
                // Cleanup
                document.getElementById('intro-container').remove();
                window.removeEventListener('mousedown', onMouseDown);
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                window.removeEventListener('touchstart', onTouchStart);
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onTouchEnd);
                window.removeEventListener('resize', onWindowResize);
            }, 1000);
        }
    }
    zoomAnimation();
}

function animate() {
    requestAnimationFrame(animate);
    // controls.update(); // If using OrbitControls
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);