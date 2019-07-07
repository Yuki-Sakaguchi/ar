/**
 * 画面にタップをするとショットを打つ
 * 丸の位置のマップを画面の真ん中に表示し、向きに合わせてマップを回転させる
 * 
 * THREE.Clockで時間経過
 * camera.quaternionでカメラの向きとShotクラスのオブジェクトの向きを合わせる
 */

// three.js ----------------------------------------

// グローバル変数
let camera, scene, light, renderer, controls, clock, delta
let box = [], boxMaxCount = 6, shoots = [], createDelayTime = 2000
let player, nav

// Element
let elCanvas = document.querySelector('#canvas')
let elResult = document.querySelector('#result')
let elTxt = document.querySelector('#txt')


/**
 * ボックス生成
 */
class Factory {
    constructor () {
        this.degree = -140
        this.offsetZ = 0
        this.offsetY = 100
        this.radius = 1500
        this.degreeIncrement = 0.5

        let geometry = new THREE.SphereGeometry(100, 32, 32);
        geometry.computeBoundingSphere();

        let material = new THREE.MeshNormalMaterial();

        this.mesh = new THREE.Mesh(geometry, material); //オブジェクトの作成
        scene.add(this.mesh);
    }

    set () {
        this.degree += this.degreeIncrement
        let rad = this.degree * Math.PI / 180;
        this.x = this.radius * Math.cos(rad); // X座標 = 半径 x Cosθ
        this.z = this.radius * Math.sin(rad); // Y座標 = 半径 x Sinθ
        this.mesh.position.set(this.x, this.offsetY, this.z+this.offsetZ)
    }
}

/**
 * ショットを打つ
 */
class Shoot {
    constructor () {
        this.speed = 5000

        let geometry = new THREE.SphereGeometry(100, 16, 16);
        geometry.computeBoundingSphere();

        let material = new THREE.MeshLambertMaterial({ color: 0xffff00 });

        this.mesh = new THREE.Mesh(geometry, material); //オブジェクトの作成
        scene.add(this.mesh);
        this.mesh.quaternion.copy(camera.quaternion);
        this.mesh.position.set(0, 200, 0)
    }

    set () {
        this.mesh.translateZ(-this.speed * delta)
    }
}

/**
 * 設定の初期化
 */
function init () {
    // カメラ設定
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 4000)
    camera.position.y = 300

    // ジャイロセンサーとカメラを紐づける
    controls = new THREE.DeviceOrientationControls(camera, true)

    // シーン追加
    scene = new THREE.Scene()

    // ライトを追加
    light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1000, 30);
    scene.add(light);

    // 時間経過
    clock = new THREE.Clock();

    // レンダラーを追加
    renderer = new THREE.WebGLRenderer({ canvas: elCanvas, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    window.addEventListener('resize', onWindowResize)

    // BOX生成
    let timer = 0
    timer = setInterval(function() {
        if (box.length < boxMaxCount) {
            box.push(new Factory())
        } else {
            clearInterval(timer)
        }
    }, createDelayTime)

    // playerのナビを配置
    const g = new THREE.SphereGeometry(12, 12, 12)
    const m = new THREE.MeshNormalMaterial()
    player = new THREE.Mesh(g, m)
    scene.add(player)
    player.position.y = 300

    // clickでショットを打つ
    window.addEventListener('click', () => shoots.push(new Shoot()))
}

/**
 * windowのリサイズイベント
 */
function onWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

/**
 * ランダムの値を生成
 */
function createRandom (min, max) {
    return Math.floor(Math.random() * (max + 1 - min)) + min
}

/**
 * 描画
 */
function render () {
    delta = clock.getDelta();

    // コントローラー更新
    controls.update()

    // 回転
    if (box.length > 0) {
        // オブジェクトを回転
        for (let i = 0; i < box.length; i++) {
            box[i].set()
            // box[i].mesh.rotation.setFromRotationMatrix(camera.matrix)
            box[i].mesh.rotation.x += 0.01
            box[i].mesh.rotation.y += 0.01
            box[i].mesh.rotation.z += 0.01
        }
    }

    // ショット
    if (shoots.length > 0) {
        // オブジェクトを回転
        for (let i = 0; i < shoots.length; i++) {
            shoots[i].set()
        }
    }

    // 球とショットの当たり判定
    if (box.length > 0 && shoots.length > 0) {
        let shootsList = []
        for (let i = 0; i < shoots.length; i++) {
            shootsList.push(shoots[i].mesh)
        }
        for (let i = 0; i < box.length; i++) {
            let b = box[i]
            let originPoint = b.mesh.position.clone();
            for (let vertexIndex = 0; vertexIndex < b.mesh.geometry.vertices.length; vertexIndex++) {
                let localVertex = b.mesh.geometry.vertices[vertexIndex].clone()
                let globalVertex = localVertex.applyMatrix4( b.mesh.matrix );
                let directionVector = globalVertex.sub( b.mesh.position );
                
                let ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
                let collisionResults = ray.intersectObjects(shootsList)
                if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
                    console.log('HIT')
                    b.scaleX *= 0.9 
                    b.scaleY *= 0.9
                    // s.mesh.material.color.set(0x00ff00);
                } else {
                    // s.mesh.material.color.set(0xffff00);
                }
            }
        }
    }

    // オブジェクトの数を表示
    elResult.textContent = box.length

    renderer.render(scene, camera)
    window.requestAnimationFrame(render)
}

init()
render()


// create.js ----------------------------------------

// デバイスの角度
let alpha = 0
let beta = 0
let gamma = 0

window.addEventListener("deviceorientation", (dat) => {
    alpha = dat.alpha;  // z軸（表裏）まわりの回転の角度（反時計回りがプラス）
    beta  = dat.beta;   // x軸（左右）まわりの回転の角度（引き起こすとプラス）
    gamma = dat.gamma;  // y軸（上下）まわりの回転の角度（右に傾けるとプラス）
});

let ui = new Leonardo({
    target: '#nav',
    isRetina: true,
    isTouch: true
})

// 回っている丸
const targets = []
class FactoryShape {
    constructor () {
        this.shape = new createjs.Shape()
        this.shape.graphics.beginFill('#007bff').drawCircle(0, 0, 8)
    }
}

ui.init = function() {
    const addTri = color => {
        let shape = new createjs.Shape()
        shape.graphics.beginFill(color)
        shape.graphics.moveTo(0, 0)
        shape.graphics.lineTo(8, 16)
        shape.graphics.lineTo(-8, 16)
        shape.graphics.lineTo(0, 0)
        return shape
    }

    /** x軸を画面の真ん中にように */
    this.getX = () => {
        return this.divisionRetina(this.stage.canvas.width) / 2
    }

    /** y軸を画面の真ん中より下の方に */
    this.getY = () => {
        return this.divisionRetina(this.stage.canvas.height) - 50
    }

    // 画面の真ん中に自分の位置を表示
    let player = addTri("#aa2200")
    player.x = this.getX()
    player.y = this.getY()
    player.regX = 2
    player.regY = 8
    this.stage.addChild(player)

    this.setDeviceParameter = () => {
        elTxt.innerHTML = `
            alpha = ${alpha}<br>
            beta = ${beta}<br>
            gamma = ${gamma}
        `
    }

    // オブジェクトの数に合わせてナビオブジェクトの生成
    this.createShape = () => {
        if (box.length == 0) {
            return false
        }
        if (targets.length != box.length) {
            const target = new FactoryShape()
            targets.push(target)
            this.stage.addChild(target.shape)
        }
    }

    // ナビオブジェクトの移動
    this.move = () => {
        if (targets.length > 0) {
            for (let i = 0; i < targets.length; i++) {
                const target = targets[i].shape
                let R = 50
                let radian = Math.atan2(box[i].mesh.position.z - camera.position.z, box[i].mesh.position.x - camera.position.x)
                let rad = radian + (alpha * (Math.PI / 180)); // デバイスの角度をプラスした位置に変更
                let cos = Math.cos(rad)
                let sin = Math.sin(rad)
                target.x = cos * R + this.getX()
                target.y = sin * R + this.getY()
            }
        }
    }

    // レティクルを表示
    // ローダーで扱えば、Bitmapで画像を表示時にすぐwidth, heightが取れる
    let bkloader = new createjs.ImageLoader('images/reticule.png',false)
    bkloader.addEventListener('complete', () => {
        let bmp = new createjs.Bitmap('images/reticule.png')
        bmp.x = this.getX()
        bmp.y = this.divisionRetina(this.stage.canvas.height) / 2
        bmp.regX = bmp.image.width / 2
        bmp.regY = bmp.image.height / 2
        bmp.scaleX = bmp.scaleY = 0.3
        this.stage.addChild(bmp)
    })
    bkloader.load()
}

ui.update = function(e) {
    this.setDeviceParameter()
    this.createShape()
    this.move()
}

ui.play()