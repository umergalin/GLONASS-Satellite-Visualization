import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Timer } from 'three/addons/misc/Timer.js';

const [gray, orange, blue] = ["#808080", "#F3972A", "#37A8E7"];

const realEarthRadius = 6.4
const realGlonassOrbitRadius = realEarthRadius + 19.1;

const earthRadius = 1;

const orbitNum = 3;
const orbitAngleDifference = 360 / orbitNum;

const satelliteNum = 24;
const satelliteAngleDifference = 360 / (satelliteNum / orbitNum);
const satelliteOffsetDifference = 15;

const satelliteSpeed = 3;

const sceneSize = realGlonassOrbitRadius / realEarthRadius * earthRadius;
const cameraOffset = 8;

const timer = new Timer();
let renderDeltaTime = 0;

const starCanvas = document.getElementById("drawsContainer").querySelector("canvas");

function reportWindowSize() {
    const cameraSize = sceneSize + cameraOffset; // Visible area (how big scene can fit in cam)
    let aspectRatio = window.innerWidth / window.innerHeight;
    camera.left = cameraSize * aspectRatio / -2;
    camera.right = cameraSize * aspectRatio / 2;
    camera.top = cameraSize / 2;
    camera.bottom = cameraSize / -2;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;

    const starCanvasCtx = starCanvas.getContext("2d");
    starCanvasCtx.fillStyle = orange;
    starCanvasCtx.font = "24px Arial";
}
window.onresize = reportWindowSize;


const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("threeContainer").append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.OrthographicCamera();
scene.add(camera);
camera.near = -(sceneSize + cameraOffset) * 5;
camera.far = (sceneSize + cameraOffset) * 5;
camera.updateProjectionMatrix();
reportWindowSize();
const x = (sceneSize + cameraOffset) * Math.cos(THREE.MathUtils.degToRad(-30));
const z = (sceneSize + cameraOffset) * Math.sin(THREE.MathUtils.degToRad(-30));
camera.position.set(x, 0, z);
camera.lookAt(0, 0, 0);


const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false; 
controls.enableZoom = false;

let satelliteModel = null;

async function loadModels() {
    const loader = new GLTFLoader();

    loader.load("./models/earth.glb", function (gltf) {
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

    const gltfSatellite = await loader.loadAsync("./models/satellite.glb");
    satelliteModel = gltfSatellite.scene;

    const grayMaterial = new THREE.MeshBasicMaterial({ color: gray });

    const materials = {
        //'WhiteMaterial': new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Красный материал
        'BlueMaterial': new THREE.MeshBasicMaterial({ color: 0x37A8E7 }), // Зеленый материал
        //'YellowMaterial': new THREE.MeshBasicMaterial({ color: 0xffff00 })  // Желтый материал
    };

    satelliteModel.traverse((object) => {
        if (object.isMesh) {
            const materialName = object.material.name;
            console.log("имя материала: " + materialName);
            if (materials[materialName]) {
                console.log("мэч");
                object.material = materials[materialName];

            } else {
                object.material = grayMaterial;
            }
        }
    });

    const satelliteScale = 0.1;
    satelliteModel.scale.set(satelliteScale, satelliteScale, satelliteScale);
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

let animationQueue = [];

function createSatelliteOrbit(ascendingNodeLongitude, satelliteOffset) {
    const geometry = new THREE.CircleGeometry(sceneSize, 128);
    geometry.rotateX(THREE.MathUtils.degToRad(90 + 64.8)); // black magic 1
    geometry.rotateY(THREE.MathUtils.degToRad(ascendingNodeLongitude));
    const vertices = geometry.attributes.position.array;

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const pointsMaterial = new THREE.PointsMaterial({
        color: 0x000,
        size: 1,
    });

    const circlePoints = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(circlePoints);

    const orbitPlane = new THREE.Group();
    orbitPlane.rotateY(THREE.MathUtils.degToRad(ascendingNodeLongitude)); // black magic 2
    orbitPlane.rotateX(THREE.MathUtils.degToRad(64.8));
    scene.add(orbitPlane);

    for (let i = 0; i < satelliteNum / orbitNum; i++) {
        const satelliteModelClone = satelliteModel.clone();

        const angle = THREE.MathUtils.degToRad(satelliteOffset + i * satelliteAngleDifference);

        const x = Math.cos(angle) * sceneSize;
        const y = 0;
        const z = Math.sin(angle) * sceneSize;

        satelliteModelClone.position.set(x, y, z);
        satelliteModelClone.lookAt(0, 0, 0);
        satelliteModelClone.rotateZ(THREE.MathUtils.degToRad(90));
        satelliteModelClone.rotateX(THREE.MathUtils.degToRad(90));

        orbitPlane.add(satelliteModelClone);
    }

    const rotateSatellitePlane = function () {
        orbitPlane.rotateY(THREE.MathUtils.degToRad(satelliteSpeed * renderDeltaTime));
    }
    animationQueue.push(rotateSatellitePlane);
}


function createStarSphere() {
    const starsAmount = 100;

    const surfaceGeometry = new THREE.SphereGeometry(sceneSize + cameraOffset + 10, 32, 16);
    const surface = new THREE.Mesh(surfaceGeometry);

    const sampler = new MeshSurfaceSampler(surface).build();

    const points = [];
    const _position = new THREE.Vector3();

    for (let i = 0; i < starsAmount; i++) {
        sampler.sample(_position);
        points.push(_position.clone());
    }

    const ctx = starCanvas.getContext("2d");
    ctx.fillStyle = orange;
    ctx.font = "24px Arial";

    const updateStars = function () {
        ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);

        points.forEach((point) => {
            const screenPosition = point.clone().project(camera);

            const x = (screenPosition.x + 1) / 2 * window.innerWidth;
            const y = (1 - screenPosition.y) / 2 * window.innerHeight;

            if (screenPosition.z > 0 && screenPosition.z < 1) {
                ctx.fillText('*', x, y);
            }
        });
    }

    animationQueue.push(updateStars)
}

await loadModels();

for (let i = 0; i < orbitNum; i++) {
    createSatelliteOrbit(i * orbitAngleDifference, i * satelliteOffsetDifference);
}

function update() {
    timer.update();
    renderDeltaTime = timer.getDelta();

    controls.update();

    for (let i = 0; i < animationQueue.length; i++) {
        animationQueue[i]();
    }

    renderer.render(scene, camera);
}


controls.update();
createStarSphere();
renderer.setAnimationLoop(update);