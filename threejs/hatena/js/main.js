/**
 * three.jsのメイン処理
 */

function getParam() {
    var arg = {};
    var pair = location.search.substring(1).split('&');
    for (var i = 0; pair[i]; i++) {
        var kv = pair[i].split('=');
        arg[kv[0]] = kv[1];
    }
    return arg;
}

(function() {
    var elCanvas = document.querySelector('#canvas')
    var elResult = document.querySelector('#result')
    var elStar = document.querySelector('#star')
    var camera, scene, renderer, controls, mouse, raycaster, isTouch
    var mesh = [],
        currentTime = 0,
        createInterval = defaultInterval = 50
        param = getParam(),
        boxCount = param.box != null && Number.isNaN(param.box) ? param.box : 200


    /**
     * 設定の初期化
     */
    function init () {
        // カメラ設定
        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 4000)
        camera.position.y = 300
        camera.position.z = 1000

        // ジャイロセンサーとカメラを紐づける
        controls = new THREE.DeviceOrientationControls(camera, true)

        // シーン追加
        scene = new THREE.Scene()

        // レンダラーを追加
        renderer = new THREE.WebGLRenderer({ canvas: elCanvas, antialias: true, alpha: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
        window.addEventListener('resize', onWindowResize)

        // マウスのクリック
        mouse = new THREE.Vector2()
        elCanvas.addEventListener('touchstart', onDown)
        elCanvas.addEventListener('touchend', onUp)

        // レイキャスト作成
        raycaster = new THREE.Raycaster()

        // スターボタン
        elStar.addEventListener('click', onStar)
    }

    /**
     * クリックした時の処理
     */
    function onDown (event) {
        isTouch = true

        // 画面の割合を計算
        var element = event.currentTarget
        var x = event.pageX - element.offsetLeft
        var y = event.pageY - element.offsetTop
        var w = element.offsetWidth
        var h = element.offsetHeight
        mouse.x = (x/w) * 2 - 1
        mouse.y = -(y/h) * 2 + 1
    }

    /**
     * クリックを解除した時
     */
    function onUp (event) {
        isTouch = false
    }

    /**
     * スター状態
     */
    function onStar (event) {
        createInterval = createInterval === defaultInterval ? 1 : defaultInterval

        var starClass = 'is-star'
        if (createInterval === defaultInterval) {
            elStar.classList.remove(starClass)
        } else {
            elStar.classList.add(starClass)
        }
    }

    /**
     * キューブを生成する
     */
    function createBox () {
        var texture = new THREE.TextureLoader().load('images/hatena.jpg')
        var geometry = new THREE.BoxBufferGeometry(100, 100, 100)
        var material = new THREE.MeshBasicMaterial({ map: texture })
        var meshBox = new THREE.Mesh(geometry, material)
        scene.add(meshBox)
        mesh.push(meshBox)

        var interval = 750
        meshBox.position.x = createRandom(-interval*2, interval*2)
        meshBox.position.y = createRandom(-interval, interval)
        meshBox.position.z = createRandom(-interval, interval*5)
    }

    /**
     * ランダムの値を生成
     */
    function createRandom (min, max) {
        return Math.floor(Math.random() * (max + 1 - min)) + min
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
     * 描画
     */
    function render () {
        currentTime += 1

        // コントローラー更新
        controls.update()

        // レイキャストからクリックされているオブジェクトを取得
        raycaster.setFromCamera(mouse, camera)
        if (isTouch) {
            var intersects = raycaster.intersectObjects(scene.children)
            if (intersects.length > 0) {
                // 当たり判定があったものは消す
                for (var i = 0; i < intersects.length; i++) {
                    var m = intersects[i].object
                    mesh.splice(mesh.indexOf(m), 1)
                    scene.remove(m)
                }
            }
        }

        // 回転
        if (mesh.length > 0) {
            // オブジェクトを回転
            for (var i = 0; i < mesh.length; i++) {
                mesh[i].rotation.x += 0.01
                mesh[i].rotation.y += 0.01
                mesh[i].rotation.z += 0.01
            }
        }

        // オブジェクトの数を表示
        elResult.textContent = mesh.length
        
        // 1秒に1回BOXを生成
        if (currentTime % createInterval === 0) {
            createBox()
        }

        renderer.render(scene, camera)
        window.requestAnimationFrame(render)
    }

    init()
    render()
})()