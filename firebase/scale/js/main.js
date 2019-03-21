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
const database = firebase.database().ref('box/')

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

const g = new THREE.CubeGeometry(1, 1, 1)
const m = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
})

const mesh = new THREE.Mesh(g, m)
mesh.name = 'cube'
mesh.position.set(0, 0.5, 0)
marker.add(mesh)

// // マーカーを隠す
// const videoTex = new THREE.VideoTexture(source.domElement)
// videoTex.minFilter = THREE.NearestFilter

// const cloak = new THREEx.ArMarkerCloak(videoTex)
// cloak.object3d.material.uniforms.opacity.value = 1.0
// marker.add(cloak.object3d)

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
    renderer.render(scene, camera)
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
            scale: JSON.stringify(obj[0].object.scale),
            position: JSON.stringify(obj[0].object.position),
        })
    }
})

document.querySelector('.btn__scale-up').addEventListener('touchstart', function () {
    console.log('scale-up')
    mesh.scale.x += 0.05 
    mesh.scale.y += 0.05
    mesh.scale.z += 0.05
    database.push({
        scale: JSON.stringify(mesh.scale),
        position: JSON.stringify(mesh.position),
    })
})

document.querySelector('.btn__scale-down').addEventListener('touchstart', function () {
    console.log('scale-down')
    mesh.scale.x -= 0.05 
    mesh.scale.y -= 0.05
    mesh.scale.z -= 0.05
    database.push({
        scale: JSON.stringify(mesh.scale),
        position: JSON.stringify(mesh.position),
    })
})

document.querySelector('.btn__up').addEventListener('touchstart', function () {
    console.log('up')
    mesh.position.y += 0.05
    database.push({
        scale: JSON.stringify(mesh.scale),
        position: JSON.stringify(mesh.position),
    })
})

document.querySelector('.btn__down').addEventListener('touchstart', function () {
    console.log('down')
    mesh.position.y -= 0.05
    database.push({
        scale: JSON.stringify(mesh.scale),
        position: JSON.stringify(mesh.position),
    })
})

database.limitToLast(1).on('child_added', function (snapshot) {
    const data = snapshot.val()
    if (data) {
        const s = JSON.parse(data.scale)
        const p = JSON.parse(data.position)
        mesh.scale.x = s.x
        mesh.scale.y = s.y
        mesh.scale.z = s.z
        mesh.position.x = p.x
        mesh.position.y = p.y
        mesh.position.z = p.z
    }
})

window.addEventListener('resize', onResize)

renderScene()
