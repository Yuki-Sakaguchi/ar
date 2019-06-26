/**
 * 丸の位置のマップを画面の真ん中に表示
 */

// three.js ----------------------------------------

// グローバル変数
let camera, scene, renderer, controls
let box = [], boxMaxCount = 1, createDelayTime = 5000
let player, nav

// Element
let elCanvas = document.querySelector('#canvas')
let elResult = document.querySelector('#result')
let elTxt = document.querySelector('#txt')


/**
 * ボックス生成
 */
let indexBox = 0
class Factory {
    constructor () {
        this.degree = -140
        this.offsetZ = 0
        this.offsetY = 100
        this.radius = 700
        this.degreeIncrement = 0.5

        let geometry
        let material
        if (indexBox % 2 == 0) {
            // 球体
            geometry = new THREE.SphereGeometry(100, 32, 32);
            material = new THREE.MeshNormalMaterial();
        } else {
            // 立方体
            geometry = new THREE.BoxGeometry(100, 100, 100);
            material = new THREE.MeshNormalMaterial();
        }
        this.mesh = new THREE.Mesh(geometry, material); //オブジェクトの作成
        scene.add(this.mesh);

        indexBox++;
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

    // オブジェクトの数を表示
    elResult.textContent = box.length

    renderer.render(scene, camera)
    window.requestAnimationFrame(render)
}

init()
render()


// create.js ----------------------------------------

let game = new Leonardo({
    target: '#nav',
    isRetina: true,
    isTouch: true
})

game.init = function() {
    
    const addShape = color => {
        let shape = new createjs.Shape()
        shape.graphics.beginFill(color).drawCircle(0, 0, 15)
        return shape
    }

    const addTri = color => {
        let shape = new createjs.Shape()
        shape.graphics.beginFill(color)
        shape.graphics.moveTo(0, 0)
        shape.graphics.lineTo(10, 20)
        shape.graphics.lineTo(-10, 20)
        shape.graphics.lineTo(0, 0)
        return shape
    }

    const getX = () => {
        return this.divisionRetina(this.stage.canvas.width) / 2
    }

    const getY = () => {
        return this.divisionRetina(this.stage.canvas.height) / 2
    }

    // 画面の真ん中に自分の位置を表示
    let player = addTri("DarkRed")
    player.x = getX()
    player.y = getY()
    this.stage.addChild(player)

    // 回っている丸
    let target = addShape("blue")
    this.stage.addChild(target)

    // デバイスの角度
    let alpha = 0
    let beta = 0
    let gamma = 0
    window.addEventListener("deviceorientation", (dat) => {
        alpha = dat.alpha;  // z軸（表裏）まわりの回転の角度（反時計回りがプラス）
        beta  = dat.beta;   // x軸（左右）まわりの回転の角度（引き起こすとプラス）
        gamma = dat.gamma;  // y軸（上下）まわりの回転の角度（右に傾けるとプラス）
    });

    // カメラと球の位置をplayerとtargetに反映
    this.setTargetPosition = () => {
        // プレイヤーの向きを反映
        player.rotation = -(alpha)
                
        if (box.length == 0) {
            return false
        }

        // ターゲットの位置を反映
        let R = 100
        let radian = Math.atan2(box[0].mesh.position.z - camera.position.z, box[0].mesh.position.x - camera.position.x)
        let cos = Math.cos(radian)
        let sin = Math.sin(radian)
        target.x = cos * R + getX()
        target.y = sin * R + getY()
    }

    this.setDeviceParameter = () => {
        elTxt.innerHTML = `
            alpha = ${alpha}<br>
            beta = ${beta}<br>
            gamma = ${gamma}
        `
    }
}

game.update = function(e) {
    this.setTargetPosition()
    this.setDeviceParameter()
}

game.play()