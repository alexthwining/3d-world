import * as THREE from './js_library/three.module.js';
import {OrbitControls} from './js_library/OrbitControls.js';
import {OBJLoader} from './js_library/OBJLoader.js';
import {MTLLoader} from './js_library/MTLLoader.js';
import {GUI} from './js_library/lil-gui.module.min.js';

// SETUP canvas
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas});

// SETUP camera - perspectiveCamera
const fov = 75; // field of view
const aspect = (window.innerWidth) / (window.innerHeight);  // changed to aspect ratio of the window
const near = 0.1; // near plane
const far = 300; // far plane
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 10, 20); // set camera position (x,y,z)

// SETUP scene
const scene = new THREE.Scene();

// SETUP orbit controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 5, 0); // point in which the controls revolve around
controls.update();

// SETUP loaderManager
const loadManager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadManager);

// move center cylinder
let cylindMesh;

function otherStuff() {
  
  // ADJUST renderer
  {
    // set size to the window width and height
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  
  // ADJUST scene FOR FOG
  {
    const color = 0xcdfab6;
    const near = 50;
    const far = 100;
    scene.fog = new THREE.Fog(color, near, far);
  }

  // CREATE loading bar
  {
    // using the loading manager to update the progress bar
    // use load manager to add textures to cube
    const loadingElem = document.querySelector('#loading');
    const progressBarElem = document.querySelector('.progressbar');

    loadManager.onLoad = () => {
      loadingElem.style.display = 'none';
      // const cube = new THREE.Mesh(geometry, diffTextMats);
      // scene.add(cube);
      // cube.position.x = 6;
    };

    // edits the progress based on the images loaded
    loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
      const progress = itemsLoaded / itemsTotal;
      progressBarElem.style.transform = `scaleX(${progress})`;
    }
  }

  // SETUP skybox
  {
    // credits for skybox texture: https://opengameart.org/content/miramar-skybox
    const skyLoader = new THREE.CubeTextureLoader();
    const texture = skyLoader.load([
      './textures/miramar_ft.jpg',
      './textures/miramar_bk.jpg',
      './textures/miramar_up.jpg',
      './textures/miramar_dn.jpg',
      './textures/miramar_rt.jpg',
      './textures/miramar_lf.jpg',
      ]);
      scene.background = texture; 
  }

}

// SETUP camera resizing function
function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
  const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
  const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
  const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
 
  // compute a unit vector that points in the direction the camera is now
  // from the center of the box
  //const direction = (new THREE.Vector3()).subVectors(camera.position, boxCenter).normalize();

  // compute a unit vector that points in the direction the camera is now
  // in the xz plane from the center of the box
  const direction = (new THREE.Vector3()).subVectors(camera.position, boxCenter).multiply(new THREE.Vector3(1, 0, 1)).normalize();
 
  // move the camera to a position distance units way from the center
  // in whatever direction the camera was from the center already
  camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
 
  // pick some near and far values for the frustum that
  // will contain the box.
  camera.near = boxSize / 100;
  camera.far = boxSize * 100;
 
  camera.updateProjectionMatrix();
 
  // point the camera to look at the center of the box
  camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
}

// ------------- LIGHTING -----------------
// ------- LIGHTING GUI HELPERS ---------

// color picker GUI helper
class ColorGUIHelper {
  constructor(object, prop) {
    this.object = object;
    this.prop = prop;
  }
  get value() {
    return `#${this.object[this.prop].getHexString()}`;
  }
  set value(hexString) {
    this.object[this.prop].set(hexString);
  }
}

class DegRadHelper {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
  }
  get value() {
    return THREE.MathUtils.radToDeg(this.obj[this.prop]);
  }
  set value(v) {
    this.obj[this.prop] = THREE.MathUtils.degToRad(v);
  }
}

function makeXYZGUI(gui, vector3, name, onChangeFn) {
  const folder = gui.addFolder(name);
  folder.add(vector3, 'x', -50, 50).onChange(onChangeFn);
  folder.add(vector3, 'y', 0, 50).onChange(onChangeFn);
  folder.add(vector3, 'z', -50, 50).onChange(onChangeFn);
  folder.open();
}

// create a global GUI for all lights
let gui = new GUI();

// add hemisphere light and folder for controls
function addHemisphereLight() {
  const skyColor = 0xB1E1FF;  // light blue
  const groundColor = 0xB97A20;  // brownish orange
  const intensity = 0.75;
  const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  scene.add(light);

  const folder = gui.addFolder("Hemisphere");
  folder.addColor(new ColorGUIHelper(light, 'color'), 'value').name('skyColor');
  folder.addColor(new ColorGUIHelper(light, 'groundColor'), 'value').name('groundColor');
  folder.add(light, 'intensity', 0, 2, 0.01);
}

let dlight;

function addDirectionalLight() {
  const color = 0xFFFFFF;
  const intensity = 0.88;
  dlight = new THREE.DirectionalLight(color, intensity);
  dlight.position.set(0, 100, 0);
  dlight.target.position.set(0, 0, 0);
  scene.add(dlight);
  scene.add(dlight.target);

  // const helper = new THREE.DirectionalLightHelper(dlight);
  // scene.add(helper);

  const folder = gui.addFolder("Directional");
  folder.addColor(new ColorGUIHelper(dlight, 'color'), 'value').name('color');
  folder.add(dlight, 'intensity', 0, 2, 0.01);
  folder.add(dlight.position, 'x', -100, 100).name('x');
  folder.add(dlight.position, 'y', -100, 100).name('y');
  folder.add(dlight.position, 'z', -100, 100).name('z');
  folder.add(dlight.target.position, 'x', -100, 100).name('target x');
  folder.add(dlight.target.position, 'y', -100, 100).name('target y');
  folder.add(dlight.target.position, 'z', -100, 100).name('target z');
}

let slight;

function addSpotLight() {
  const color = 0xFFFFFF;
  const intensity = 0.93;
  const distance = 0; // max range of light (default 0 (no limit))
  const angle = Math.PI/4; // /2 is biggest angle, increase divisor to have smaller angle
  const penumbra = 0.03; // 0 hard line, increase to feather
  slight = new THREE.SpotLight(color, intensity, distance, angle, penumbra);
  slight.position.set(47, 22, -27);
  slight.target.position.set(-31, -36, 3);
  slight.castShadow = true;
  scene.add(slight);
  scene.add(slight.target);

  //Set up shadow properties for the light
  slight.shadow.mapSize.width = 512; // default
  slight.shadow.mapSize.height = 512; // default
  slight.shadow.camera.near = 0.5; // default
  slight.shadow.camera.far = 500; // default
  slight.shadow.focus = 1; // default

  // const helper = new THREE.SpotLightHelper(slight);
  // scene.add(helper);

  const folder = gui.addFolder("SpotLight");
  folder.addColor(new ColorGUIHelper(slight, 'color'), 'value').name('color');
  folder.add(slight, 'intensity', 0, 2, 0.01);
  folder.add(new DegRadHelper(slight, 'angle'), 'value', 0, 90).name('angle');
  folder.add(slight, 'penumbra', 0, 1, 0.01);
  folder.add(slight.position, 'x', -100, 100).name('x');
  folder.add(slight.position, 'y', -100, 100).name('y');
  folder.add(slight.position, 'z', -100, 100).name('z');
  folder.add(slight.target.position, 'x', -100, 100).name('target x');
  folder.add(slight.target.position, 'y', -100, 100).name('target y');
  folder.add(slight.target.position, 'z', -100, 100).name('target z');
}

function setupLighting() {
  addHemisphereLight();
  addDirectionalLight();
  addSpotLight();
}


// --------- SETUP RENDER TO TEXTURE -------------
let renderTarget;
let rtCamera;
let rtScene;
let heartus = [];

function setupRT() {
  const rtWidth = 512;
  const rtHeight = 512;
  renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);

  const rtFov = 75;
  const rtAspect = rtWidth / rtHeight;
  const rtNear = 0.01;
  const rtFar = 50;
  rtCamera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
  rtCamera.position.z = 3;

  rtScene = new THREE.Scene();
  rtScene.background = new THREE.Color('blue');

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    rtScene.add(light);
  }

  const shape = new THREE.Shape();
  const x = -2.5;
  const y = -5;
  shape.moveTo(x + 2.5, y + 2.5);
  shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2, y, x, y);
  shape.bezierCurveTo(x - 3, y, x - 3, y + 3.5, x - 3, y + 3.5);
  shape.bezierCurveTo(x - 3, y + 5.5, x - 1.5, y + 7.7, x + 2.5, y + 9.5);
  shape.bezierCurveTo(x + 6, y + 7.7, x + 8, y + 4.5, x + 8, y + 3.5);
  shape.bezierCurveTo(x + 8, y + 3.5, x + 8, y, x + 5, y);
  shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);

  const extrudeSettings = {
    steps: 2,  // ui: steps
    depth: 2,  // ui: depth
    bevelEnabled: true,  // ui: bevelEnabled
    bevelThickness: 1,  // ui: bevelThickness
    bevelSize: 1,  // ui: bevelSize
    bevelSegments: 2,  // ui: bevelSegments
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  function makeInstance(geometry, x) {
    const heartMat = new THREE.MeshPhongMaterial({
    color: 0xEFA8B8,
    });
   
    const heartMesh = new THREE.Mesh(geometry, heartMat);
    heartMesh.scale.set(0.05, 0.05, 0.05);
    heartMesh.position.set(x, 0, 0);

    rtScene.add(heartMesh);
   
    return heartMesh;
  }

  heartus = [
    makeInstance(geometry, -4),
    makeInstance(geometry, -2),
    makeInstance(geometry, 0),
    makeInstance(geometry, 2),
    makeInstance(geometry, 4),
  ];
}

// -------- WORLD CREATION -----------------

// creates grass textured plane and center hexagon
function addGround() {
  // CREATE a plane
  // credit for grass texture: https://www.pinterest.com/pin/432204895467171249/
  const planeSize = 200; // size of the plane
  const planeTexture = loader.load('./textures/grass.jpg'); // texture of plane
  planeTexture.wrapS = THREE.RepeatWrapping; // repeating
  planeTexture.wrapT = THREE.RepeatWrapping;
  planeTexture.magFilter = THREE.NearestFilter;
  const repeats = planeSize / 20;
  planeTexture.repeat.set(repeats, repeats);

  // create plane geometry
  const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
  const planeMat = new THREE.MeshPhongMaterial({
    map: planeTexture,
    side: THREE.DoubleSide,
  });
  const planeMesh = new THREE.Mesh(planeGeo, planeMat);
  planeMesh.receiveShadow = true;
  planeMesh.rotation.x = Math.PI * -0.5;
  scene.add(planeMesh);

  // add center
  const cylindGeo = new THREE.CylinderGeometry(4, 5, 1, 6);
  // credit for center texture: https://wallpapercave.com/winter-digital-landscape-wallpapers
  const cylindTexture = loader.load('./textures/center.jpg');
  const cylindMat = new THREE.MeshPhongMaterial({
    map: cylindTexture,
    side: THREE.DoubleSide,
  });
  cylindMesh = new THREE.Mesh(cylindGeo, cylindMat);
  cylindMesh.castShadow = true;
  cylindMesh.position.set(0, 0.51, 0);
  scene.add(cylindMesh);
}

// tested normal maps for textures
const baseNormal = loader.load('./textures/NormalMap3.png');
const midNormal = loader.load('./textures/NormalMap2.png');

// adds the low poly pagodas to the world
function addBuildings() {
  // ----- CREATE BUILDINGS -------
  class LowPolyPagoda {
    constructor(scene, x=0, y=0, z=0) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.scene = scene;
      this.create(this.scene);
    }

    create(scene) {
      const phongMat = new THREE.MeshPhongMaterial();

      const coneGeo = new THREE.ConeGeometry(3, 4, 16);
      const coneMat = new THREE.MeshPhongMaterial();
      //coneMat.normalMap = midNormal;
      coneMat.color = new THREE.Color(0xEEDA03);
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.castShadow = true;
      coneMesh.position.set(this.x, this.y+15, this.z);
      this.scene.add(coneMesh);

      const sphereGeo = new THREE.SphereGeometry(4, 12, 12);
      const sphereMat = new THREE.MeshPhongMaterial({
        map: renderTarget.texture,
      });
      //sphereMat.normalMap = midNormal;
      sphereMat.color = new THREE.Color(0xC4A287);
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.castShadow = true;
      sphereMesh.position.set(this.x, this.y+11, this.z);
      this.scene.add(sphereMesh);

      const cylG = new THREE.CylinderGeometry(4, 6, 9, 15);
      const cylMat = new THREE.MeshPhongMaterial();
      cylMat.normalMap = baseNormal;
      cylMat.color = new THREE.Color(0xD45113);
      const cylMesh = new THREE.Mesh(cylG, cylMat);
      cylMesh.castShadow = true;
      cylMesh.position.set(this.x, this.y+4, this.z);
      this.scene.add(cylMesh);

      const boxGeo = new THREE.BoxGeometry(15, 3, 15);
      const boxMat = new THREE.MeshPhongMaterial();
      boxMat.normalMap = midNormal;
      boxMat.color = new THREE.Color(0x813405);
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.castShadow = true;
      boxMesh.position.set(this.x, this.y+1, this.z);
      this.scene.add(boxMesh);
    }
  }

  // x axis pagodas
  for(let i=1; i < 4; i++) {
    const build = new LowPolyPagoda(scene, (i * 30), 0, 0);
  }

  // -x axis pagodas
  for(let i=1; i < 4; i++) {
    const build = new LowPolyPagoda(scene, (i * -30), 0, 0);
  }

  // z axis pagodas
  for(let i=1; i < 4; i++) {
    const build = new LowPolyPagoda(scene, 0, 0, (i * 30));
  }

  // -z axis pagodas
  for(let i=1; i < 4; i++) {
    const build = new LowPolyPagoda(scene, 0, 0, (i * -30));
  }

  // diagonal bottom right
  for(let i=1; i < 4; i++) {
    const build = new LowPolyPagoda(scene, (i * 30), 0, (i * 30));
  }

  // diagonal bottom left
  for(let i=1; i < 4; i++) {
    const build = new LowPolyPagoda(scene, (i * -30), 0, (i * 30));
  }

  // diagonal top right
  for(let i=1; i < 4; i++) {
    const build = new LowPolyPagoda(scene, (i * 30), 0, (i * -30));
  }

  // diagonal top left
  for(let i=1; i < 4; i++) {
    const build = new LowPolyPagoda(scene, (i * -30), 0, (i * -30));
  }
  
}

// CREATE balloon function
// dont want to keep making object loader so pass into function
// source for adding color to already made obj: https://stackoverflow.com/questions/21321450/add-color-to-obj-in-threejs
// the obj i used didnt come with a mtl file so i added colors retroactively

let outBall;
function makeBalloon(bscale, bx, by, bz, color) {
  const objLoader = new OBJLoader;
  objLoader.load(
    './models/hotballoon.obj', 
    function (obj) {      
      obj.scale.set(bscale, bscale, bscale);
      obj.position.set(bx, by, bz);
      obj.traverse( function(child) {
        if (child instanceof THREE.Mesh) {
          child.material.color.set(color);
        }
      });
      outBall = obj;
      scene.add(obj);
  });

  return outBall;
}

function makeFruitBranches(fscale, fx, fy, fz) {
  const mtlLoader = new MTLLoader();
  mtlLoader.load('./models/fruit-tree.mtl', (mtl) => {
    mtl.preload();
    const objLoader = new OBJLoader();
    objLoader.setMaterials(mtl);
    objLoader.load('./models/fruit-tree.obj', (root) => {
      root.scale.set(fscale, fscale, fscale);
      root.position.set(fx, fy, fz);
      root.updateMatrixWorld();
      scene.add(root);

      // // compute the box that contains all the stuff
      // // from root and below
      // const box = new THREE.Box3().setFromObject(root);
   
      // const boxSize = box.getSize(new THREE.Vector3()).length();
      // const boxCenter = box.getCenter(new THREE.Vector3());
   
      // // set the camera to frame the box
      // frameArea(boxSize * 1.2, boxSize, boxCenter, camera);
   
      // // update the Trackball controls to handle the new size
      // controls.maxDistance = boxSize * 10;
      // controls.target.copy(boxCenter);
      // controls.update();
    })
  })
}


// trying to figure out why the object wont go into an array

function addBalloons(arr) {
  // ----- ADD THE BALLOOOOOONS --------
  // variable to animate the balloon height
  // let balloons = [
  //   makeBalloon(objLoader, 0.2, 10, -80, 5, 0x6E3FD5), // purple
  //   makeBalloon(objLoader, 0.2, 62, -80, -5, 0x465362), // dark blue
  //   makeBalloon(objLoader, 0.2, 110, -80, -26, 0xA5D8FF), // light blue
  //   makeBalloon(objLoader, 0.2, 94, -80, -82, 0x70F8BA), // aquamraine
  //   makeBalloon(objLoader, 0.2, 53, -80, -117, 0xCAFE48), // lime green
  //   makeBalloon(objLoader, 0.2, 6, -80, -102, 0xFC7753), // orange
  //   makeBalloon(objLoader, 0.2, -39, -80, -87, 0x4281A4), // celadon blue
  //   makeBalloon(objLoader, 0.2, -21, -80, -19, 0xE4959E), // pinksih
  // ];

  makeBalloon(0.2, 10, -80, 5, 0x6E3FD5); // purple
  makeBalloon(0.2, 62, -80, -5, 0x465362); // dark blue
  makeBalloon(0.2, 110, -80, -26, 0xA5D8FF); // light blue
  makeBalloon(0.2, 94, -80, -82, 0x70F8BA); // aquamraine
  makeBalloon(0.2, 53, -80, -117, 0xCAFE48); // lime green
  makeBalloon(0.2, 6, -80, -102, 0xFC7753); // orange
  makeBalloon(0.2, -39, -80, -87, 0x4281A4); // celadon blue
  makeBalloon(0.2, -21, -80, -19, 0xE4959E); // pinksih

}

// adds in the ground, buildings and balloons
function setupWorld() {
  // adds the ground and center hexagon
  addGround();

  // add buildings in all directions
  addBuildings();

  let balloons = [];
  // add balloons to array hopefully
  addBalloons(balloons);

  // causes lag when loading lol
  makeFruitBranches(0.0019, -40, 0, -70);
    
}

// ------ ANIMATION AND RENDERING -------
// how to animate things
function render(time) {
  time *= 0.001;  // convert time to seconds

  cylindMesh.rotation.y = (time);
  slight.position.x = Math.sin(time) * 75;
  

  // rotate all the hearts in the render target scene
  heartus.forEach((heart, ndx) => {
    const speed = 1 + ndx * .1;
    const rot = time * speed;
    heart.rotation.x = rot;
    heart.rotation.y = rot;
    heart.position.x = Math.sin(time) * 3 + ndx;
    heart.position.z = Math.sin(time) * 3 + ndx;
  });

  // draw render target scene to render target
  renderer.setRenderTarget(renderTarget);
  renderer.render(rtScene, rtCamera);
  renderer.setRenderTarget(null);


  // render things on the canvas
  renderer.render(scene, camera);
 
  requestAnimationFrame(render);
}


function main() {
  otherStuff();
  setupLighting();
  setupRT();
  setupWorld();

  // should be 60 fps loop
  requestAnimationFrame(render);
}

main();
