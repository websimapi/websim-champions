import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let room, tv, tvScreen, consoleBody, cartridge;
let raycaster, mouse, plane;
let draggableObject = null;
let isTransitioning = false;
let transitionCallback = null;

const TV_ASPECT = 16 / 9;
const TV_WIDTH = 8;
const TV_HEIGHT = TV_WIDTH / TV_ASPECT;

export function initScene() {
    const container = document.getElementById('three-container');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x100510);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3.5, 9);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    const spotLight = new THREE.SpotLight(0xffffff, 3, 30, Math.PI / 4, 0.5, 2);
    spotLight.position.set(0, 15, 10);
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    const tvLight = new THREE.PointLight(0x6688ff, 0, 15);
    tvLight.position.set(0, 4, -4.5);
    scene.add(tvLight);
    
    // Room
    createRoom();

    // Game Objects
    createTV();
    createConsole();
    createCartridge();

    // Controls for debugging
    // controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(0, 3, 0);
    // controls.update();

    // Interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    plane = new THREE.Plane();
    
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    animate();
}

function createRoom() {
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x332233, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x553344, roughness: 1 });
    const wallGeo = new THREE.PlaneGeometry(30, 15);
    
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 7.5, -10);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = backWall.clone();
    leftWall.position.set(-15, 7.5, 5);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = backWall.clone();
    rightWall.position.set(15, 7.5, 5);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);
    
    const ceiling = floor.clone();
    ceiling.position.y = 15;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);
}

function createTV() {
    const tvGroup = new THREE.Group();
    tvGroup.position.set(0, 4, -9.8);
    
    const tvBodyGeo = new THREE.BoxGeometry(TV_WIDTH + 0.5, TV_HEIGHT + 0.5, 0.5);
    const tvBodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
    const tvBody = new THREE.Mesh(tvBodyGeo, tvBodyMat);
    tvBody.castShadow = true;
    tvGroup.add(tvBody);

    const screenGeo = new THREE.PlaneGeometry(TV_WIDTH, TV_HEIGHT);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x050508 });
    tvScreen = new THREE.Mesh(screenGeo, screenMat);
    tvScreen.position.z = 0.26;
    tvGroup.add(tvScreen);
    
    scene.add(tvGroup);
    tv = tvGroup;
}

function createConsole() {
    const consoleGeo = new THREE.BoxGeometry(2, 0.5, 1.5);
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x403040, roughness: 0.2 });
    consoleBody = new THREE.Mesh(consoleGeo, consoleMat);
    consoleBody.position.set(0, 0.25, 2);
    consoleBody.castShadow = true;
    scene.add(consoleBody);
}

function createCartridge() {
    const cartridgeGeo = new THREE.BoxGeometry(0.6, 0.1, 0.4);
    const cartridgeMat = new THREE.MeshStandardMaterial({ color: 0x880000, roughness: 0.3, metalness: 0.2 });
    cartridge = new THREE.Mesh(cartridgeGeo, cartridgeMat);
    cartridge.position.set(2, 0.05, 2.5);
    cartridge.castShadow = true;
    cartridge.name = "cartridge";
    scene.add(cartridge);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(event) {
    if (draggableObject || isTransitioning) return;
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([cartridge]);
    
    if (intersects.length > 0) {
        draggableObject = intersects[0].object;
        plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(plane.normal), draggableObject.position);
        // if(controls) controls.enabled = false;
    }
}

function onMouseMove(event) {
    if (!draggableObject || isTransitioning) return;
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, draggableObject.position);
}

function onMouseUp(event) {
    if (!draggableObject || isTransitioning) return;

    const distanceToConsole = draggableObject.position.distanceTo(consoleBody.position);
    if (distanceToConsole < 0.8) {
        cartridge.position.copy(consoleBody.position);
        cartridge.position.y += 0.2;
        cartridge.rotation.x = Math.PI / 4;
        
        // Disable further interaction
        draggableObject = null;
        cartridge.name = "inserted_cartridge"; 
        
        // Call the main game start function
        window.startGame();
    }
    
    draggableObject = null;
    // if(controls) controls.enabled = true;
}

export function startTransition(callback) {
    isTransitioning = true;
    transitionCallback = callback;
    
    const tvScreenMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(document.getElementById('start-overlay'))
    });
    tvScreen.material = tvScreenMaterial;
    
    // Animate tv light
    const tvLight = scene.getObjectByProperty('type', 'PointLight');
    const lightTween = { intensity: 0 };
    animateValue(lightTween, { intensity: 5 }, 1000);
    const updateLight = () => {
        if(tvLight) tvLight.intensity = lightTween.intensity;
    };
    registerUpdate(updateLight);
}


function animate() {
    requestAnimationFrame(animate);
    
    // Run all registered update functions for tweens/animations
    updateFunctions.forEach(fn => fn());

    if (isTransitioning) {
        const targetPosition = tv.position.clone().add(new THREE.Vector3(0, 0, 5));
        camera.position.lerp(targetPosition, 0.02);
        
        const targetLookAt = tv.position.clone();
        const currentLookAt = new THREE.Vector3().lerpVectors(camera.position, targetPosition, -1);
        const newLookAt = currentLookAt.lerp(targetLookAt, 0.02);
        camera.lookAt(newLookAt);

        if (camera.position.distanceTo(targetPosition) < 0.1) {
            isTransitioning = false;
            if (transitionCallback) transitionCallback();
        }
    }
    
    if (tvScreen.material.map) {
        tvScreen.material.map.needsUpdate = true;
    }

    // if(controls) controls.update();
    renderer.render(scene, camera);
}

// Simple animation helper
const updateFunctions = [];
function animateValue(start, end, duration) {
    const keys = Object.keys(end);
    const startTime = Date.now();

    const update = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        keys.forEach(key => {
            start[key] = start[key] + (end[key] - start[key]) * progress;
        });
        if (progress === 1) {
           deregisterUpdate(update);
        }
    };
    registerUpdate(update);
}

function registerUpdate(fn) {
    updateFunctions.push(fn);
}
function deregisterUpdate(fn) {
    const index = updateFunctions.indexOf(fn);
    if(index > -1) updateFunctions.splice(index, 1);
}