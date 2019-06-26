/**
 * ブラウザのカメラにアクセスする
 */
(function () {
    const elCanvas = document.querySelector('#canvas')
    const video = document.querySelector('#video')

    const medias = { 
        audio: false,
        video: {
            facingMode: {
                exact: 'environment' // リアカメラを使う
            },
            width: 640,
            height: 480,
            frameRate: { // フレームレート低めで設定
                ideal: 26,
                max: 24
            }
        }
    }

    function successCallback (stream) {
        video.srcObject = stream;
    }

    function errorCallback (err) {
        alert(err);
    }

    function draw() {
        // elCanvas.width  = window.innerWidth;
        // elCanvas.height = window.innerHeight;
        // ctx.drawImage(video, 0, 0);
        // requestAnimationFrame(draw);
    }

    navigator.mediaDevices.getUserMedia(medias)
        .then(successCallback)
        .catch(errorCallback)

    requestAnimationFrame(draw);
})()