import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';




const realEarthRadius = 6.4
const realGlonassOrbitRadius = realEarthRadius + 19.1;

const earthRadius = 1;

const orbitNum = 3;
const orbitAngleDifference = 120;

const sceneSize = realGlonassOrbitRadius / realEarthRadius * earthRadius;
const cameraOffset = 8;


// Orthographic camera update
function reportWindowSize() {
    const cameraSize = sceneSize + cameraOffset; // Visible area (how big scene can fit in cam)
    let aspectRatio = window.innerWidth / window.innerHeight;
    camera.left = cameraSize * aspectRatio / -2;
    camera.right = cameraSize * aspectRatio / 2;
    camera.top = cameraSize / 2;
    camera.bottom = cameraSize / -2;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.onresize = reportWindowSize;


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); 

const camera = new THREE.OrthographicCamera();
scene.add(camera);
reportWindowSize();
const x = (sceneSize + cameraOffset) * Math.cos(THREE.MathUtils.degToRad(30));
const z = (sceneSize + cameraOffset) * Math.sin(THREE.MathUtils.degToRad(30));
camera.position.set(x, 0, z);


const controls = new OrbitControls(camera, renderer.domElement);
// controls.enablePan = false; отлючил для отладки
// controls.enableZoom = false;

function loadModels() {
    const loader = new GLTFLoader();

    loader.load('./models/earth.glb', function (gltf) {
        const textureLoader = new THREE.TextureLoader();

        const earthMaterial = new THREE.MeshBasicMaterial({ map: textureLoader.load('./models/earth_texture.jpg'), });

        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = earthMaterial;
            }
        });

        scene.add(gltf.scene);
    }, undefined, function (error) {
        console.error(error);
    });
}

/* function createZeroMeridian() {
    const geometry = new THREE.CircleGeometry(sceneSize, 128);
    const vertices = geometry.attributes.position.array;

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const pointsMaterial = new THREE.PointsMaterial({
        color: 0xff0000, // Цвет точек
        size: 3,       // Размер точек
    });

    const circlePoints = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(circlePoints);
}

createZeroMeridian(); */

function createSatelliteOrbit(ascendingNodeLongitude) {
    const geometry = new THREE.CircleGeometry(sceneSize, 128);
    geometry.rotateX(THREE.MathUtils.degToRad(90 + 64.8));
    geometry.rotateY(THREE.MathUtils.degToRad(ascendingNodeLongitude));
    const vertices = geometry.attributes.position.array;

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const pointsMaterial = new THREE.PointsMaterial({
        color: 0x000, // Цвет точек
        size: 1,       // Размер точек
    });

    const circlePoints = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(circlePoints);
}


for(let i = 0; i < orbitNum; i++) {
    createSatelliteOrbit(i * orbitAngleDifference);
}



function update() {
    controls.update();
    renderer.render(scene, camera);
}

loadModels();
controls.update();
renderer.setAnimationLoop(update);