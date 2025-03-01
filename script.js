import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { rotate } from 'three/tsl';




const realEarthRadius = 6.4
const realGlonassOrbitRadius = realEarthRadius + 19.1;

const earthRadius = 1;


const orbitNum = 3;
const orbitAngleDifference = 360 / orbitNum;

const satelliteNum = 24;
const satelliteAngleDifference = 360 / (satelliteNum / orbitNum);
const satelliteOffsetDifference = 15;

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
const x = (sceneSize + cameraOffset) * Math.cos(THREE.MathUtils.degToRad(-30));
const z = (sceneSize + cameraOffset) * Math.sin(THREE.MathUtils.degToRad(-30));
camera.position.set(x, 0, z);


const controls = new OrbitControls(camera, renderer.domElement);
// controls.enablePan = false; отлючил для отладки
// controls.enableZoom = false;

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

    const grayMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });

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

    console.log("модель загружена");

    // Добавляем модель в сцену
    // satelliteModel.position.set(0, sceneSize, 0);
    // scene.add(satelliteModel);
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

function createSatelliteOrbit(ascendingNodeLongitude, satelliteOffset) {
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

    const orbitPlane = new THREE.Group();
    orbitPlane.rotateY(THREE.MathUtils.degToRad(ascendingNodeLongitude));
    orbitPlane.rotateX(THREE.MathUtils.degToRad(64.8));
    scene.add(orbitPlane);

    console.log("offset: " + satelliteOffset);
    for (let i = 0; i < satelliteNum / orbitNum; i++) {
        const satelliteModelClone = satelliteModel.clone();

        console.log("angle: " + (satelliteOffset + i * satelliteAngleDifference));
        
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
}


await loadModels();

for (let i = 0; i < orbitNum; i++) {
    createSatelliteOrbit(i * orbitAngleDifference, i * satelliteOffsetDifference);
}



function update() {
    controls.update();
    renderer.render(scene, camera);
}


controls.update();
renderer.setAnimationLoop(update);