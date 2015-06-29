/**!
 * @file "Loading Scene" Module State for the Application.
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @copyright Copyright Philippe Sawicki 2015
 * @license MIT
 */


/**
 * "Load Scene" State for the Application.
 * 
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @return {Object}
 * @public
 */
var LoadSceneState = (function () {
    'use strict';


    /**
     * A reference to the Application.
     * 
     * @type {Object}
     * @private
     */
    var _Application = undefined;

    /**
     * A reference to the Utils object.
     * 
     * @type {Object}
     * @private
     */
    var Utils = undefined;

    var _container;
    var _camera, _scene, _renderer;
    var _has_gl = false;
    var _delta;
    var _time;
    var _oldTime;
    var _shaderTime = 0;
    var _meshes = [];
    //var _overlay;
    var _texture;
    var _color;
    //var _vignette;
    var _mouse;
    var _gravity;
    var _mouseObj;
    var _isTouchDevice = false;
    var _scaleRatio = 1;
    var _nbLoadedResources = 0;


    /**
     * Initialize the Application State.
     * 
     * @param  {Object} Application A reference to the Application.
     * @param  {Object} options     Initialization options for the State.
     * @return {void}
     * @public
     */
    var initialize = function (Application, options) {
        console.log('LoadSceneState::initialize');

        _Application = Application;
        Utils = options.Utils || require('./Utils.js');


        _mouse = new THREE.Vector2(/*-0.5, 0.5*/0.0, 0.0);
        _gravity = new THREE.Vector3(0, /*-0.75*/0, 0);
        _mouseObj = {
            x: 0, 
            y: 0, 

            vx: 0, 
            vy: 0
        };

        _isTouchDevice = 'ontouchstart' in document || navigator.userAgent.match(/ipad|iphone|android/i) != null;
        if (_isTouchDevice) {
            _scaleRatio = 2;
        }
    };

    /**
     * Prepare the State for execution.
     * 
     * @return {void}
     * @public
     */
    var enter = function () {
        console.log('LoadSceneState::enter');
    };

    /**
     * Execute the Application State.
     * 
     * @return {void}
     * @public
     */
    var execute = function () {
        console.log('LoadSceneState::execute');
        

        _initScene();
    };

    /**
     * Exit the Application State.
     * 
     * @return {void}
     * @public
     */
    var exit = function () {
        console.log('LoadSceneState::exit');
    };

    //var _cameraControls;

    /**
     * Initialize the assets for the scene rendering.
     * 
     * @return {void}
     * @private
     */
    var _initScene = function () {
        _container = document.getElementById('container');
        //document.body.appendChild(_container);



        // Setup scene & camera:
        _scene = new THREE.Scene();

        _camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        _camera.position.z = 150;
        _camera.lookAt(_scene.position);

        //_cameraControls = new THREE.OrbitControls(_camera);
        //_cameraControls.damping = 0.2;
        //_cameraControls.addEventListener('change', _render);




        // Load texture for diffuse color:
        _color = THREE.ImageUtils.loadTexture('img/19335527-Hair-background-Hair-style-pattern-Vector-illustration-Stock-Vector-resize.jpg', undefined, _resourceLoadedCallback);
        _color.wrapS = _color.wrapT = THREE.RepeatWrapping;

        // Load texture for fur:
        _texture = new THREE.Texture( _generateTexture() );
        _texture.needsUpdate = true;
        _texture.wrapS = _texture.wrapT = THREE.RepeatWrapping;

        // Load model:
        //var _loader = new THREE.JSONLoader();
        //_loader.load('suzanne.js', _meshLoaded);
        _meshLoaded();


        // Load texture for background:
        //_vignette = THREE.ImageUtils.loadTexture('img/VignetteWithDirt_alpha_sq.png', undefined, _resourceLoadedCallback);

        // Set screen overlay using background texture as Sprite:
        //var overlayMaterial = new THREE.SpriteMaterial({
        //    map: _vignette, 
        //    useScreenCoordinates: true, 
        //    opacity: 0.4
        //});
        //_overlay = new THREE.Sprite(overlayMaterial);
        //_overlay.scale.set(window.innerWidth/_scaleRatio, window.innerHeight/_scaleRatio, 1);
        //_overlay.position.set((window.innerWidth/_scaleRatio)/2, (window.innerHeight/_scaleRatio)/2 , 0);
        //_camera.add(_overlay);

        _scene.add(_camera);



        try {
            // Create App renderer:
            _renderer = new THREE.WebGLRenderer({
                antialias: false,
                alpha: true
            });
            _renderer.setClearColor(0x000000, 0);
            //_renderer.setPixelRatio(window.devicePixelRatio);
            _renderer.setSize(window.innerWidth/_scaleRatio, window.innerHeight/_scaleRatio);

            _texture.anisotropy = _renderer.getMaxAnisotropy();

            if (_scaleRatio > 1) {
                _renderer.domElement.style.position = 'absolute';
                _renderer.domElement.style.top = '0px';
                _renderer.domElement.style.left = '0px';

                _renderer.domElement.style.webkitTransform = 'scale3d(' + _scaleRatio + ', ' + _scaleRatio + ', 1)';
                _renderer.domElement.style.webkitTransformOrigin = '0 0 0';
                _renderer.domElement.style.transform = 'scale3d(' + _scaleRatio + ', ' + _scaleRatio + ', 1)';
                _renderer.domElement.style.transformOrigin = '0 0 0';                
            }


            // Register window & document listeners:
            window.addEventListener('resize', _onWindowResize, false);
            document.addEventListener('mousemove', _onMouseMove, false);
            document.addEventListener('touchmove', _onTouchMove, false);

            // Add renderer to the DOM:
            _container.appendChild(_renderer.domElement);
            //_container.style.cursor = 'url(cursor.png), pointer';

            _has_gl = true;
        } catch (ex) {
            // WebGL no supported:
            var infoElement = document.getElementById('info');
            if (infoElement) {
                infoElement.innerHTML = '<p><br /><strong>Note:</strong> You need a modern browser that supports WebGL for this to run the way it is intended.<br />For example. <a href="http://www.google.com/landing/chrome/beta/" target="_blank">Google Chrome 9+</a> or <a href="http://www.mozilla.com/firefox/beta/" target="_blank">Firefox 4+</a>.<br /><br />If you are already using one of those browsers and still see this message, it\'s possible that you<br />have old blacklisted GPU drivers. Try updating the drivers for your graphic card.<br />Or try to set a "--ignore-gpu-blacklist" switch for the browser.</p><CENTER><BR><img src="../general/WebGL_logo.png" border="0"></CENTER>';
                infoElement.style.display = 'block';
            }
        }
    };

    /**
     * Called when a resource (texture, model) is loaded.
     * 
     * @return {void}
     * @private
     */
    var _resourceLoadedCallback = function () {
        if (++_nbLoadedResources === 2) {
            // Play the audio track:
            _Application.playAudio();

            // All resources have been loaded, proceed to animate the scene:
            _animate();
        }
    };

    /**
     * Called on window resize.
     * 
     * @param  {Object} event Window resize event.
     * @return {void}
     * @private
     */
    var _onWindowResize = function (event) {
        var width  = window.innerWidth;
        var height = window.innerHeight;

        _renderer.setSize(width/_scaleRatio, height/_scaleRatio);

        _camera.aspect = width / height;
        _camera.updateProjectionMatrix();

        //if (_overlay) {
        //    _overlay.scale.set( w/_scaleRatio, height/_scaleRatio, 1 );
        //    _overlay.position.set((width/_scaleRatio)/2, (height/_scaleRatio)/2 , 0);
        //}
    };

    /**
     * Called on mouse move event.
     * 
     * @param  {Object} event Mouse move event.
     * @return {void}
     * @private
     */
    var _onMouseMove = function (event) {
        // Prevent default click behavior, with IE polyfill:
        Utils.preventDefaultEvent(event);

        _mouse.x =   (event.clientX / window.innerWidth)  * 2 - 1;
        _mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    };

    /**
     * Called on touch event.
     * 
     * @param  {Object} event Touch event.
     * @return {void}
     * @private
     */
    var _onTouchMove = function (event) {
        // Prevent default click behavior, with IE polyfill:
        Utils.preventDefaultEvent(event);

        _mouse.x =   (event.touches[0].clientX / window.innerWidth)  * 2 - 1;
        _mouse.y = - (event.touches[0].clientY / window.innerHeight) * 2 + 1;
    };

    /**
     * Callback for the loading of the geometry data used to build the mesh.
     * 
     * @param  {Object} geometry The geometry for the mesh.
     * @return {void}
     * @private
     */
    var _meshLoaded = function (geometry) {
        geometry = new THREE.SphereGeometry(1, 32, 32);

        // Scale up the geometry:
        var size = 60 * 1.05;
        geometry.applyMatrix( new THREE.Matrix4().scale( new THREE.Vector3(size, size, size) ) );

        // Set the umber of "shells"/layers for the device:
        var nbShells = 60*2.5;
        if (_isTouchDevice) {
            nbShells = 45;
        }

        // Create meshes from the loaded geometry:
        for (var i = 0; i < nbShells; i++) {
            // Create attributes for the mesh:
            //var attributes = { };

            // Create uniforms for the mesh:
            var uniforms = {
                color:      { type: 'c',  value: new THREE.Color(0xffffff) },
                hairMap:    { type: 't',  value: _texture },
                colorMap:   { type: 't',  value: _color },
                offset:     { type: 'f',  value: i/nbShells },
                globalTime: { type: 'f',  value: _shaderTime },
                gravity:    { type: 'v3', value: _gravity },
            };

            // Inline vertex & fragment shaders:
            var fs = require('fs');
            var vertexShader   = fs.readFileSync(__dirname + './../shaders/hair.vert', 'utf8');
            var fragmentShader = fs.readFileSync(__dirname + './../shaders/hair.frag', 'utf8');

            // Create material options for the mesh:
            var material = new THREE.ShaderMaterial({
                uniforms:       uniforms,
                //attributes:     attributes,
                vertexShader:   vertexShader,   // document.getElementById('vertexshader').textContent,
                fragmentShader: fragmentShader, // document.getElementById('fragmentshader').textContent,
                transparent: true,
            });

            var mesh =  new THREE.Mesh(geometry, material);
            mesh.matrixAutoUpdate = false;
            mesh.frustumCulled = false;
            _scene.add(mesh);
            _meshes.push(mesh);
        }

        // Execute the "_resourceLoadedCallback", as the Mesh has been created:
        _resourceLoadedCallback();
    };

    /**
     * Generate texture for fur.
     * 
     * @return {void}
     * @private
     */
    var _generateTexture = function () {
        // Create a canvas where to draw the texture:
        var canvas = document.createElement('canvas');
        canvas.width  = 256;
        canvas.height = 256;

        var context = canvas.getContext('2d');

        for (var i = 0; i < 20000; ++i) {
            // r = hair? 1/0
            // g = hair strand length
            // b = hair strand darkness
            var fillStyle = [
                255,
                Math.floor( Utils.getRandomArbitrary(0, 255) ),
                Math.floor( Utils.getRandomArbitrary(0, 255) ),
                Math.floor( Utils.getRandomArbitrary(-12.0, 2.0) ) // 1
            ];
            //context.fillStyle = 'rgba(255,' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ',1)';
            context.fillStyle = 'rgba(' + fillStyle.join(',') + ')';
            
            context.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 2, 2);
        }

        return canvas;
    };

    /**
     * Animate the scene.
     * 
     * @return {void}
     * @private
     */
    var _animate = function () {
        requestAnimationFrame(_animate);

        _render();
        //_cameraControls.update();
    };

    /**
     * Render the scene to the screen.
     * 
     * @return {void}
     * @private
     */
    var _render = function () {
        _time = Date.now();
        _delta = _time - _oldTime; // Time elapsed since last frame was drawn.
        _oldTime = _time;

        if (isNaN(_delta) || _delta > 1000 || _delta == 0) {
            _delta = 1000/60; // Set default frame duration to 1/60 of a second.
        }

        var optimalDivider = _delta/16;
        var smoothing = Math.max(4, 20/optimalDivider);


        // Fake some gravity according to mouse movement:
        var xf = (_mouse.x - _mouseObj.x) / (smoothing*5);
        var yf = (_mouse.y - _mouseObj.y) / (smoothing*5);
        _mouseObj.vx += xf
        _mouseObj.vy += yf;
        _mouseObj.vx *= 0.96;
        _mouseObj.vy *= 0.94;
        _mouseObj.x += _mouseObj.vx;
        _mouseObj.y += _mouseObj.vy;

        _gravity.x = - (_mouse.x - _mouseObj.x) * 2;

        //var dif = Math.sin(_mouse.x)*150 - _camera.position.x;
        //_gravity.y = -0.75 + (Math.abs(dif)/150) - (_mouse.y - _mouseObj.y)*2;
        var FFT = _Application.getFFT();
        //_gravity.x = FFT[0] / 255 * 2;
        _gravity.y = 0.0; //Math.cos(FFT[1] / 255) * 2;
        //DOUBLE-EDGED SWORD: _gravity.z = Math.sin(FFT[2] / 255) * 2;
        
        //LERP: pu = p0 + (p1 - p0) * u
        var x = Math.PI * (FFT[1] - 255*2/3)/(255*2/3) - Math.PI / 2   + Math.PI / 4;
        var y = Math.PI * FFT[0]/255 - Math.PI / 2   - Math.PI / 4;
        //_gravity.x = Math.sin((FFT[0]-128) / 255 - 0.5);
        //_gravity.y = Math.sin((FFT[1]-128) / 255 - 0.5);
        _gravity.x = Math.sin(x) + Math.PI / 4;
        _gravity.y = Math.sin(y);
        //console.log(/*_gravity,*/ FFT[0]-128, FFT[1]-128);
        //console.log(_gravity, x, y);

        // Set the camera position based on mouse movement:
        _camera.position.x += (Math.sin(_mouse.x)*150 - _camera.position.x) / smoothing;
        _camera.position.z += (Math.cos(_mouse.x)*150 - _camera.position.z) / smoothing;
        _camera.position.y += (Math.sin(_mouse.y)*150 - _camera.position.y) / smoothing;

        _camera.lookAt(_scene.position);

        _shaderTime += _delta*0.005;

        for (var i = 0; i < _meshes.length; i++) {
            _meshes[i].material.uniforms.globalTime.value = _shaderTime;
        }

        if (_has_gl) {
            _renderer.render(_scene, _camera);
        }
    };


    return {
        initialize: initialize,
        enter: enter,
        execute: execute,
        exit: exit
    };
})();


module.exports = LoadSceneState;
