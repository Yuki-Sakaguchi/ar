/**
 * three.jsのメイン処理
 */
(function() {

    // グローバル変数
    var camera, scene, renderer, controls, alpha = 0, beta = 0, gamma = 0

    // Element
    var elCanvas = document.getElementById('canvas')
    var elStart = document.getElementById('start')
    var elTxt = document.getElementById('txt');

    var context = elCanvas.getContext("2d");

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

        displayData();
        drawOrientation();

        renderer.render(scene, camera)
        window.requestAnimationFrame(render)
    }

    function displayData() {
        // データを表示するdiv要素の取得
        elTxt.innerHTML = "alpha: " + alpha + "<br>"  // x軸の値
                        + "beta:  " + beta  + "<br>"  // y軸の値
                        + "gamma: " + gamma;          // z軸の値
    }
        
    /**
     * コンパスのような絵を描く
     */
    function drawOrientation() {
        var centerX = elCanvas.width  / 2;            // canvasの中心のX座標
        var centerY = elCanvas.height / 2;	        // canvasの中心のY座標
        var radius  = 100;                          // 枠円の半径および針の長さ
        var radianAlpha = alpha * Math.PI / 180;    // 角度をラジアンに変換
        context.clearRect(0, 0, elCanvas.width, elCanvas.height);   // canvasの内容を消す clearRect(x, y, w, h)
        context.beginPath();                        // 描画開始
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI);  // 枠円を描く
        context.strokeStyle = "rgb(0, 0, 0)";       // 枠円の線の色
        context.lineWidth = 2;                      // 線の太さ
        context.stroke();                           // 線を描画
        context.beginPath();                        // 描画開始
        context.moveTo(centerX, centerY);           // 中心に移動
        // 線を引く（cosでx座標、sinでy座標が得られる。長さradiusを掛ける。-90度すると真上に向く。）
        context.lineTo(centerX + Math.cos(radianAlpha - Math.PI / 2) * radius,
                    centerY + Math.sin(radianAlpha - Math.PI / 2) * radius);
        context.strokeStyle = "rgb(255, 0, 0)";     // 針の線の色
        context.lineWidth = 5;                      // 線の太さ
        context.stroke();                           // 線を描画
    }

    // 処理開始
    elStart.addEventListener('click', function () {
        this.remove()
        init()
        render()
    })

    // ジャイロセンサの値が変化したら実行される deviceorientation イベント
    window.addEventListener("deviceorientation", (dat) => {
        alpha = dat.alpha;  // z軸（表裏）まわりの回転の角度（反時計回りがプラス）
        beta  = dat.beta;   // x軸（左右）まわりの回転の角度（引き起こすとプラス）
        gamma = dat.gamma;  // y軸（上下）まわりの回転の角度（右に傾けるとプラス）
    });

})()