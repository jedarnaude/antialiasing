
// Force WebGL
if (!Detector.webgl)
    Detector.addGetWebGLMessage();

var container, stats;

var camera, camera, sceneRTT, scene, renderer, zmesh1;

var Viewport = function (_x, _y, _w, _h) {
    this.x = _x;
    this.y = _y;
    this.width = _w;
    this.height = _h;
};

var viewportScaleFactor = 0.5;
var renderSizeFactor = 1.0 / viewportScaleFactor;
var viewport = new Viewport(0, 0, window.innerWidth * viewportScaleFactor , window.innerHeight * viewportScaleFactor );

// TODO: multiple views at the same time with all techniques at once
var data = {
    noAA: {
        func: renderNoAA,
        rtt: undefined,
        composer: undefined,
        viewport: new Viewport(0, 0, viewport.width * 0.5, viewport.height * 0.5)
    },
    SSAA: {
        func: renderSSAA,
        rtt: undefined,
        composer: undefined,
        viewport: new Viewport(viewport.width * 0.5, viewport.height * 0.5, viewport.width * 0.5, viewport.height * 0.5)
    },
    DLAA: {
        func: renderDLAA,
        rtt: undefined,
        composer: undefined,
        viewport: new Viewport(viewport.width * 0.5, viewport.height * 0.5, viewport.width * 0.5, viewport.height * 0.5)
    },
    FXAA: undefined,
    SMAA: undefined
}

var renderFunc;

initRenderer();
initScene();
animate();

function initRenderer() {
    renderer = new THREE.WebGLRenderer({antialias : true});
    renderer.setClearColor( 0xBBBBBB, 1 );
    renderer.setSize(viewport.width * renderSizeFactor, viewport.height * renderSizeFactor);
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
        case 52:
            renderFunc = renderSMAA;
            break;
        case 51:
            renderFunc = data.DLAA.func;
            break;
        case 50:
            renderFunc = data.SSAA.func;
            break;
        case 49:
        default:
            renderFunc = data.noAA.func;
    }
}

function initScene() {
    // Init scenes
    scene = new THREE.Scene();
    sceneRTT = new THREE.Scene();

    // Set our camera
    camera = new THREE.OrthographicCamera( window.innerWidth * -0.5, window.innerWidth * 0.5, window.innerHeight * 0.5, window.innerHeight * -0.5, -10000, 10000 );
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
    data.SSAA.rtt = new THREE.WebGLRenderTarget(viewport.width * 2, viewport.height * 2, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
    data.DLAA.rtt = new THREE.WebGLRenderTarget(viewport.width, viewport.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });

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
        vertexShader: document.getElementById('Default_vs').textContent,
        fragmentShader: document.getElementById('Screen_fs').textContent,

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
    renderer.render(scene, camera);
}

function renderSSAA() {
    quad.material.uniforms.tDiffuse.value = data.SSAA.rtt;
    renderer.render(sceneRTT, camera, data.SSAA.rtt, true);
    renderer.render(scene, camera);
}

function renderDLAA() {
    // Create our composer
    if (data.DLAA.composer == undefined) {
        data.DLAA.composer = new THREE.EffectComposer(renderer, data.DLAA.rtt);
        data.DLAA.composer.addPass(new THREE.RenderPass(sceneRTT, camera));

        var effect = new THREE.ShaderPass(
            {
                uniforms: { tDiffuse: { type: "t", value: data.DLAA.rtt }, viewport: { type: "v2", value: new THREE.Vector2(viewport.width,viewport.height)} },
                vertexShader: document.getElementById('Default_vs').textContent,
                fragmentShader: document.getElementById('DLAA_fs').textContent
            }
        );
        effect.renderToScreen = true;
        data.DLAA.composer.addPass( effect );
    }

    data.DLAA.composer.render();
}

function renderSMAA() {
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
    var time = 0.0015;

    if (zmesh1) {
        zmesh1.rotation.y = time;
    }

    // Render our stuff
    renderer.clear();
    renderFunc();
}
