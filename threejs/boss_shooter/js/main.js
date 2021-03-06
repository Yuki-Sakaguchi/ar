/**
 * 画面にタップをするとショットを打つ
 * 丸の位置のマップを画面の真ん中に表示し、向きに合わせてマップを回転させる
 * 
 * THREE.Clockで時間経過
 * camera.quaternionでカメラの向きとShotクラスのオブジェクトの向きを合わせる
 * オブジェクトの当たり判定はRaycaster
 */


// デバイスの情報 ----------------------------------------
let alpha = 0, beta = 0, gamma = 0

window.addEventListener('deviceorientation', dat => {
    alpha = dat.alpha  // z軸（表裏）まわりの回転の角度（反時計回りがプラス）
    beta  = dat.beta   // x軸（左右）まわりの回転の角度（引き起こすとプラス）
    gamma = dat.gamma  // y軸（上下）まわりの回転の角度（右に傾けるとプラス）
})

/**
 * マッピング関数
 * @param {number} n 
 * @param {number} start1 
 * @param {number} stop1 
 * @param {number} start2 
 * @param {number} stop2 
 */
function map(n, start1, stop1, start2, stop2) {
    return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}


// three.js ----------------------------------------
let camera, scene, light, renderer, controls, clock, delta
let enemyList = [], ENEMY_MAX_COUNT = 1, shotList = [], createDelayTime = 2000, far = 4000, isClear = false
let player, nav

let elCanvas = document.querySelector('#canvas')
let elResult = document.querySelector('#result')

/**
 * オブジェクトの生成用のクラス
 * @class Factory
 * @extends THREE.Mesh
 */
class Factory extends THREE.Mesh {
    constructor () {
        // オブジェクト生成
        let geometry = new THREE.SphereGeometry(100, 64, 64)
        let material = new THREE.MeshNormalMaterial()
        super(geometry, material)

        this.degree = -140
        this.offsetZ = 0
        this.offsetY = 100
        this.radius = 1500
        this.degreeIncrement = 0.3

        this.life = 30
        this.isInvincible = false
    }

    /**
     * オブジェクトの位置を移動
     */
    move () {
        let x = ui.createRandom(-far, far)
        let y = ui.createRandom(-far/3, far/3)
        let z = ui.createRandom(-far, far)
        this.position.set(x, y, z)
        setTimeout(() => {
            this.move()
        }, 5000)
    }

    /**
     * 引数分のダメージを受ける
     * 0.5秒は無敵
     * @param {number} point 
     */
    damage (point) {
        this.isInvincible = true
        this.life -= point
        this.scale.x += 0.5
        this.scale.y += 0.5
        this.scale.z += 0.5
        setTimeout(() => {
            this.isInvincible = false
        }, 500)
    }
}

/**
 * 球を発射する
 * @class Shot
 * @extends THREE.Mesh
 */
class Shot extends THREE.Mesh {
    constructor () {
        let geometry = new THREE.SphereGeometry(100, 16, 16);
        let material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        super(geometry, material)

        // 初期位置と方向をカメラに合わせる
        this.quaternion.copy(camera.quaternion);
        this.position.set(0, 250, 0)

        this.speed = 5000
        this.power = 1
    }
    
    /**
     * オブジェクトの位置を移動
     */
    move () {
        this.translateZ(-this.speed * delta)
    }
}

/**
 * 設定の初期化
 */
function init () {
    // カメラ設定
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, far)
    camera.position.y = 300

    // ジャイロセンサーとカメラを紐づける
    controls = new THREE.DeviceOrientationControls(camera, true)

    // シーン追加
    scene = new THREE.Scene()

    // ライトを追加
    light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(0, 1000, 30)
    scene.add(light)

    // 時間経過
    clock = new THREE.Clock()

    // レンダラーを追加
    renderer = new THREE.WebGLRenderer({ canvas: elCanvas, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    })

    // clickでショットを発車
    window.addEventListener('click', () => {
        let shot = new Shot()
        scene.add(shot)
        shotList.push(shot)
    })

    // BOSSオブジェクトを生成する
    setTimeout(() => {
        let enemy = new Factory()
        scene.add(enemy)
        enemyList.push(enemy)
        enemy.move()
        ui.createShape()
    }, 5000)
}

/**
 * 描画
 */
function render () {
    // 時間更新
    delta = clock.getDelta()

    // コントローラー更新
    controls.update()

    // ショット
    if (shotList.length > 0) {
        // オブジェクトを回転
        for (let i = 0; i < shotList.length; i++) {
            let shot = shotList[i]
            shot.move()
            if (Math.abs(shot.position.x) > far || Math.abs(shot.position.y) > far || Math.abs(shot.position.z) > far) {
                scene.remove(shot)
                shotList.splice(i, 1)
            }
        }
    }

    // 球とショットの当たり判定
    if (enemyList.length > 0 && shotList.length > 0) {
        for (let i = 0; i < enemyList.length; i++) {
            let enemy = enemyList[i]
            let target = factoryShapeList[i]
            if (enemy.isInvincible) {
                continue
            }
            for (let vertexIndex = 0; vertexIndex < enemy.geometry.vertices.length; vertexIndex++) {
                let localVertex = enemy.geometry.vertices[vertexIndex].clone()
                let globalVertex = localVertex.applyMatrix4(enemy.matrix)
                let directionVector = globalVertex.sub(enemy.position)
                
                let ray = new THREE.Raycaster(enemy.position, directionVector.clone().normalize())
                let collisionResults = ray.intersectObjects(shotList)
                if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
                    if (enemy.isInvincible) {
                        continue
                    }
                    enemy.damage(collisionResults[0].object.power)
                    if (enemy.life <= 0) {
                        scene.remove(enemy)
                        enemy.material.dispose()
                        enemy.geometry.dispose()
                        enemyList[i] = enemy = undefined
    
                        ui.stage.removeChild(target.shape)
                        enemyList.splice(i, 1)
                        factoryShapeList.splice(i, 1)

                        isClear = true
    
                        break
                    }
                }
            }
        }
    }

    // オブジェクトの数を表示
    if (!isClear) {
        if (enemyList[0]) {
            elResult.textContent = enemyList[0].life
        }
    } else {
        elResult.textContent = 0;
        alert('CLEAR!!')
    }

    renderer.render(scene, camera)
    window.requestAnimationFrame(render)
}

init()
render()


// create.js ----------------------------------------
let factoryShapeList = []

let ui = new Leonardo({
    target: '#nav',
    isRetina: true,
    isTouch: true
})

/**
 * Three.jsが作る敵オブジェクトと同期させるUIオブジェクトの生成クラス
 * @class FactoryShape
 */
class FactoryShape {
    constructor () {
        this.shape = new createjs.Shape()
        this.shape.graphics.beginFill(createjs.Graphics.getHSL(240, 100, 50)).drawCircle(0, 0, 8)
    }
}

ui.init = function() {
    /** x軸を画面の真ん中にように */
    const getX = () => this.divisionRetina(this.stage.canvas.width) / 2

    /** y軸を画面の真ん中より下の方に */
    const getY = () => this.divisionRetina(this.stage.canvas.height) - 50

    // 自分の位置を表示
    let player = new createjs.Shape()
    player.graphics.beginFill("#aa2200")
    player.graphics.moveTo(0, 0)
    player.graphics.lineTo(8, 16)
    player.graphics.lineTo(-8, 16)
    player.graphics.lineTo(0, 0)
    player.x = getX()
    player.y = getY()
    player.regX = 2
    player.regY = 8
    this.stage.addChild(player)

    /** オブジェクトの数に合わせてナビオブジェクトの生成 */
    this.createShape = () => {
        const target = new FactoryShape()
        factoryShapeList.push(target)
        this.stage.addChild(target.shape)
    }

    /** ナビオブジェクトの移動 */
    this.move = () => {
        if (factoryShapeList.length > 0) {
            for (let i = 0; i < factoryShapeList.length; i++) {
                const target = factoryShapeList[i].shape
                let R = 50
                let radian = Math.atan2(enemyList[i].position.z - camera.position.z, enemyList[i].position.x - camera.position.x)
                let rad = radian + (alpha * (Math.PI / 180)); // デバイスの角度をプラスした位置に変更
                let cos = Math.cos(rad)
                let sin = Math.sin(rad)
                target.x = cos * R + getX()
                target.y = sin * R + getY()

                // 位置が高いと薄くなり、低いと濃くなる
                let righten = map(enemyList[i].position.y, -far/3, far/3, 0, 100)
                target.graphics.beginFill(createjs.Graphics.getHSL(240, 100, righten)).drawCircle(0, 0, 8)
            }
        }
    }

    // レティクルを表示
    // ローダーで扱えば、Bitmapで画像を表示時にすぐwidth, heightが取れる
    let bkloader = new createjs.ImageLoader('images/reticule.png', false)
    bkloader.addEventListener('complete', () => {
        let bmp = new createjs.Bitmap('images/reticule.png')
        bmp.x = getX()
        bmp.y = this.divisionRetina(this.stage.canvas.height) / 2
        bmp.regX = bmp.image.width / 2
        bmp.regY = bmp.image.height / 2
        bmp.scaleX = bmp.scaleY = 0.3
        this.stage.addChild(bmp)
    })
    bkloader.load()
}

ui.update = function(e) {
    this.move()
}

ui.play()