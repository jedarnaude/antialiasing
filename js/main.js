
// Force WebGL
if (!Detector.webgl)
    Detector.addGetWebGLMessage();

var container, stats;

var camera, camera, sceneRTT, sceneScreen, scene, renderer, zmesh1, zmesh2;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var rtTexture, material, quad;

var delta = 0.01;

var Viewport = function (_x, _y, _w, _h) {
    this.x = _x;
    this.y = _y;
    this.width = _w;
    this.height = _h;
};

var viewport = new Viewport(0, 0, window.innerWidth, window.innerHeight);

// TODO: multiple views at the same time with all techniques at once
var data = {
    noAA: {
        func: renderNoAA,
        rtt: undefined,
        viewport: new Viewport(0, 0, viewport.width * 0.5, viewport.height * 0.5)
    },
    SSAA: {
        func: renderSSAA,
        rtt: undefined,
        viewport: new Viewport(viewport.width * 0.5, viewport.height * 0.5, viewport.width * 0.5, viewport.height * 0.5)
    },
    MSAA: undefined,
    MLAA: undefined,
    FXAA: undefined
}

var renderFunc;

initRenderer();
initScene();
animate();

function initRenderer() {
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xBBBBBB, 1 );
    renderer.setSize(viewport.width, viewport.height);
    renderer.autoClear = false;
    document.getElementById('container').appendChild(renderer.domElement);

    // add Stats.js - https://github.com/mrdoob/stats.js
    stats = new Stats();
    stats.domElement.style.position	= 'absolute';
    stats.domElement.style.bottom	= '0px';
    document.body.appendChild( stats.domElement );

    window.addEventListener("keypress", swapAA, false);
}

function swapAA(e) {
    switch (e.keyCode) {
        case 50:
            renderFunc = renderSSAA;
            break;
        case 49:
        default:
            renderFunc = renderNoAA;
    }
}

function initScene() {
    // Init scenes
    scene = new THREE.Scene();
    sceneRTT = new THREE.Scene();

    // Set our camera
    camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
    camera.position.z = 100;

    // Some utils for our camera
    THREEx.WindowResize.bind(renderer, camera);
//    cameraControls	= new THREEx.DragPanControls(camera)

    // Some lights for now
    var light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 0, 1 ).normalize();
    sceneRTT.add( light );

    // Prepare our RTTs
    data.noAA.rtt = new THREE.WebGLRenderTarget(viewport.width, viewport.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
    data.SSAA.rtt = new THREE.WebGLRenderTarget(viewport.width * 2, viewport.height * 2, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat });

    // Our scene
    var geometry = new THREE.TorusGeometry( 100, 25, 15, 30 );
    var material = new THREE.MeshPhongMaterial( { color: 0x555555, specular: 0xffaa00, shininess: 5 } );

    // Our torus
    zmesh1 = new THREE.Mesh( geometry, material );
    zmesh1.position.set( 0, 0, 100 );
    zmesh1.scale.set( 1.5, 1.5, 1.5 );
    zmesh1.rotation.set(0, -1.15, 0);
    sceneRTT.add( zmesh1 );

    // Global scene
    var plane = new THREE.PlaneGeometry( window.innerWidth, window.innerHeight );
    var materialScreen = new THREE.ShaderMaterial( {
        uniforms: { tDiffuse: { type: "t", value: data.noAA.rtt } },
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragment_shader_screen' ).textContent,

        depthWrite: false

    } );

    quad = new THREE.Mesh( plane, materialScreen );
    quad.position.z = -100;
    scene.add( quad );

    renderFunc = renderNoAA;
}

function renderNoAA() {
    quad.material.uniforms.tDiffuse.value = data.noAA.rtt;
    renderer.render(sceneRTT, camera, data.noAA.rtt, true);
}

function renderSSAA() {
    quad.material.uniforms.tDiffuse.value = data.SSAA.rtt;
    renderer.render( sceneRTT, camera, data.SSAA.rtt, true );
}

function renderMSAA() {
    // Manually done MSAA
}

function renderMLAA() {
    // No clue how this works
}

function renderFXAA() {
    // No clue how this works
}

function animate() {
    requestAnimationFrame( animate );
    render();
    stats.update();
}

function render() {
    var time = Date.now();

    // Render our stuff
    renderer.clear();
    renderFunc();
    renderer.render( scene, camera );
}
