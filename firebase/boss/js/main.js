/**
 * AR.js + Three.js + FirebaseでインタラクティブなAR体験
 *      参考：https://qiita.com/mkoku/items/48b39e2750bceb72fbf6
 *      参考：https://console.firebase.google.com/u/0/project/aem-ar/database/aem-ar/data
 */

/**
 * TODO
 *      マーカーを隠して影を落とす or マーカーを好きな画像でやってみる
 */

/**
 * Firebaseを初期化
 */
const config = {
    apiKey: "AIzaSyDIyr7KlpDG2BniArbM9PKUs33xTgiXFuI",
    authDomain: "aem-ar.firebaseapp.com",
    databaseURL: "https://aem-ar.firebaseio.com",
    projectId: "aem-ar",
    storageBucket: "aem-ar.appspot.com",
    messagingSenderId: "551006910853"
}
firebase.initializeApp(config)
const database = firebase.database().ref('boss_state/')

// -------------------------------------------------------------
/**
 * three.jsオブジェクトを生成
 */

const scene = new THREE.Scene()

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
})
renderer.setClearColor(new THREE.Color('black'), 0)
renderer.setSize(640, 480)
renderer.domElement.style.position = 'absolute'
renderer.domElement.style.top = '0px'
renderer.domElement.style.left = '0px'
document.body.appendChild(renderer.domElement)

const camera = new THREE.Camera()
scene.add(camera)

const light = new THREE.DirectionalLight(0xffffff)
light.position.set(0, 0, 2)
scene.add(light)

// ARマーカーをトラッキングするメディアソース
const source = new THREEx.ArToolkitSource({ sourceType: 'webcam' })
source.init(function onReady () {
    onResize()
})

// ARマーカーを検出設定
const context = new THREEx.ArToolkitContext({
    debug: false,
    cameraParametersUrl: 'camera_para.dat',
    detectionMode: 'mono',
    imageSmoothingEnabled: true,
    maxDetectionRate: 60,
    convasWidth: source.parameters.sourceWidth,
    canvasHeight: source.parameters.sourceHeight,
})
context.init(function onCompleted () {
    camera.projectionMatrix.copy(context.getProjectionMatrix())
})

// -------------------------------------------------------------
/**
 * ARのマーカーの検知を生成
 */

const marker = new THREE.Group()
const controls = new THREEx.ArMarkerControls(context, marker, {
    type: 'pattern',
    patternUrl: 'hiro.patt',
})
scene.add(marker)

const g = new THREE.OctahedronGeometry(4, 0)
const m = new THREE.MeshStandardMaterial({
    // transparent: true,
    color: 0x0000FF,
    opacity: 0.8,
    // side: THREE.DoubleSide,
})

const mesh = new THREE.Mesh(g, m)
mesh.name = 'cube'
mesh.position.set(0, 2, 0)
// mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 45
marker.add(mesh)

// // マーカーを隠す
// const videoTex = new THREE.VideoTexture(source.domElement)
// videoTex.minFilter = THREE.NearestFilter

// const cloak = new THREEx.ArMarkerCloak(videoTex)
// cloak.object3d.material.uniforms.opacity.value = 1.0
// marker.add(cloak.object3d)

// -------------------------------------------------------------

const MAX_HP = 1000
let hp = MAX_HP
const dispHp = document.querySelector('#hp')
setHp()

function setHp () {
    dispHp.textContent = hp
    dispHp.style.height = getPar()+'%'
    resizeBox()
}

function getPar () {
    return (100 - (Math.floor(((MAX_HP - hp) / MAX_HP) * 10) * 10))
}

// -------------------------------------------------------------

/**
 * リサイズ時にサイズを調整する
 */
function onResize () {
    source.onResizeElement()
    source.copyElementSizeTo(renderer.domElement)
    if (context.arController !== null) {
        source.copyElementSizeTo(context.arController.canvas)
    }
}

/**
 * 描画
 */
function renderScene () {
    requestAnimationFrame(renderScene)
    if (source.ready === false) return false
    context.update(source.domElement)
    // TWEEN.update()
    
    mesh.rotation.y+= 0.01;

    renderer.render(scene, camera)
}

function resizeBox () {
    const par = getPar()
    console.log(mesh)
    mesh.scale.x = mesh.scale.y = mesh.scale.z = par/100
}

window.addEventListener('touchstart', function (e) {
    const mouseX = (e.pageX/window.innerWidth)*2-1
    const mouseY = -(e.pageY/window.innerHeight)*2+1
    const pos = new THREE.Vector3(mouseX, mouseY, 1)
    pos.unproject(camera)

    const ray = new THREE.Raycaster(camera.position, pos.sub(camera.position).normalize())
    const obj = ray.intersectObjects(scene.children, true)

    if (obj.length > 0) {
        database.push({
            hp: MAX_HP,
        })
    }
})

document.querySelector('.btn__attack').addEventListener('touchstart', attack)
function attack () {
    console.log('attack')
    hp -= 5;
    if (hp <= 0) {
      hp = 0
      document.querySelector('.btn__attack').removeEventListener('touchstart', attack)
    }

    database.push({
        hp: hp,
    })
}

database.limitToLast(1).on('child_added', function (snapshot) {
    console.log('child_added')
    const data = snapshot.val()
    if (data) {
        hp = parseInt(data.hp);
    }
    setHp()

    if (hp == 0) {
        alert('ボスは倒されました！')
    }
})

window.addEventListener('resize', onResize)

renderScene()

// ダブルタップ無効
let lastTouchEndTime = 0;
document.addEventListener('touchend', (event) => {
  const now = new Date().getTime();
  if((now - lastTouchEndTime) < 350) {
    event.preventDefault();
  }
  lastTouchEndTime = now;
});
