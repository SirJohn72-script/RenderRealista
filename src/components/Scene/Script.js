import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader'
import * as dat from 'dat.gui'

//Global variables
let currentRef = null;
const gui = new dat.GUI({ width: 400 })
const sceneParams = {
  envMapIntensity: 0.38, 
  dlColor: 0xf71257,
  alColor: 0x1ae2d8,
}

//Scene, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xff0000)
const camera = new THREE.PerspectiveCamera(25, 100 / 100, 0.1, 100);
scene.add(camera);
camera.position.set(5, 5, 5);
camera.lookAt(new THREE.Vector3());

const renderer = new THREE.WebGLRenderer();
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.physicallyCorrectLights = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.5
renderer.setSize(100, 100);
// THREE.NoToneMapping
// THREE.LinearToneMapping
// THREE.ReinhardToneMapping
// THREE.CineonToneMapping
// THREE.ACESFilmicToneMapping

const rendererTweaks = gui.addFolder("Renderer")
rendererTweaks.add(renderer, 'toneMapping', {
'THREE.NoToneMapping': THREE.NoToneMapping, 
'THREE.LinearToneMapping': THREE.LinearToneMapping, 
'THREE.ReinhardToneMapping': THREE.ReinhardToneMapping, 
'THREE.CineonToneMapping': THREE.CineonToneMapping, 
'THREE.ACESFilmicToneMapping': THREE.ACESFilmicToneMapping
}).onChange(() => {
  renderer.toneMapping = Number(renderer.toneMapping)
  scene.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.material.needsUpdate = true
    }
  })
})

rendererTweaks.add(renderer, 'toneMappingExposure')
  .min(1)
  .max(5)
  .step(0.0001)


//OrbitControls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

//Resize canvas
const resize = () => {
  renderer.setSize(currentRef.clientWidth, currentRef.clientHeight);
  camera.aspect = currentRef.clientWidth / currentRef.clientHeight;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", resize);

//Animate the scene
const animate = () => {
  orbitControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
animate();

//load model 3d
const loadingManager = new THREE.LoadingManager(
  () => { 
    // console.log("Todo cargado")
   
  }, 
  (
    itemUrl, 
    itemsToLoad, 
    itemsLoaded
  ) => {
    // console.log((itemsToLoad/itemsLoaded )*100)
  }, 
  ()=>{}
)

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('./draco/')
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)
gltfLoader.load('./draco/helmet.gltf',
  (gltf) => {
    while (gltf.scene.children.length) {
      scene.add(gltf.scene.children[0])
    }
    castAndReceiveShadows()
  }, 
  () => {
    // console.log("Progress")
  }, 
  () => {
    // console.log("Error")
  }
)

//cast and receive shadows
const castAndReceiveShadows = () => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material.envMapIntensity = sceneParams.envMapIntensity
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}

//Plane base
const planeBase = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(5, 5), 
  new THREE.MeshStandardMaterial()
)
planeBase.rotation.x = Math.PI * -0.5
planeBase.position.y = -1 
// scene.add(planeBase)

//Lights
const folderLights = gui.addFolder("Lights")

const light1 = new THREE.DirectionalLight(0xf71257, 4.3)
light1.position.set(0, 6, 1)
light1.castShadow = true
light1.shadow.mapSize.set(1024, 1024)
light1.shadow.bias = 0.0005
light1.shadow.normalBias = 0.0005
scene.add(light1)


folderLights.add(light1, 'intensity')
  .min(1)
  .max(10)
  .step(0.0001)
  .name("DL Intensity")

folderLights.addColor(sceneParams, 'dlColor')
  .onChange(() => {
    light1.color.set(sceneParams.dlColor)
  })

const al = new THREE.AmbientLight(0x1ae2d8, 0.61)
scene.add(al)
folderLights.add(al, 'intensity')
  .min(0)
  .max(1)
  .step(0.0001)
  .name("AL Intensity")

folderLights.addColor(sceneParams, 'alColor')
  .onChange(() => {
    al.color.set(sceneParams.alColor)
  })


const envMap = new THREE.CubeTextureLoader().load(
  [
    './envmap/px.png', 
    './envmap/nx.png', 
    './envmap/py.png', 
    './envmap/ny.png', 
    './envmap/pz.png', 
    './envmap/nz.png', 
  ]
)
scene.environment = envMap
folderLights.add(sceneParams, 'envMapIntensity')
  .min(0)
  .max(2)
  .step(0.0001)
  .name("EnvMap Intensity")
  .onChange(() => {
    scene.traverse(child => {
      if (child instanceof THREE.Mesh && 
        child.material instanceof THREE.MeshStandardMaterial) {
          child.material.envMapIntensity = sceneParams.envMapIntensity
        }
    })
  })

//Init and mount the scene
export const initScene = (mountRef) => {
  currentRef = mountRef.current;
  resize();
  currentRef.appendChild(renderer.domElement);
};

//Dismount and clena up the buffer from the scene
export const cleanUpScene = () => {
  gui.destroy()
  scene.dispose();
  currentRef.removeChild(renderer.domElement);
};
