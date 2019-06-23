/**
 * three.jsのメイン処理
 */
(function() {

    // グローバル変数
    var camera, scene, renderer, controls
    var mesh = []

    // Element
    var elCanvas = document.querySelector('#canvas')
    var elStart = document.querySelector('#start')

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

        renderer.render(scene, camera)
        window.requestAnimationFrame(render)
    }

    // 処理開始
    elStart.addEventListener('click', function () {
        this.remove()
        init()
        render()
    })

})()