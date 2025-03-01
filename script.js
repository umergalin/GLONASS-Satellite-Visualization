import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Orthographic camera update
function reportWindowSize() {
    const camSize = 1; // Visible area (how big scene can fit in cam)
    let aspectRatio = window.innerWidth / window.innerHeight;
    camera.left = camSize * aspectRatio / -2;
    camera.right = camSize * aspectRatio / 2;
    camera.top = camSize / 2;
    camera.bottom = camSize / -2;
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
camera.position.set(0, 3, 0);

const controls = new OrbitControls(camera, renderer.domElement);

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

function update() {
    controls.update();
    renderer.render(scene, camera);
}

loadModels();
controls.update();
renderer.setAnimationLoop(update);