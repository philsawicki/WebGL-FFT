/**!
 * @file Application Module.
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @copyright Copyright Philippe Sawicki 2015
 * @license MIT
 */

var global = {
    trimStart: 0,
    trimEnd: 0
};







/**
 * Application.
 * 
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @return {Object}
 */
var Application = (function (window, undefined) {
    'use strict';


    /**
     * Current Application State.
     * 
     * @type {Object|undefined}
     * @private
     */
    var _state = undefined;

    /**
     * Global AudioContext for the Application.
     * 
     * @type {AudioContext|undefined}
     * @private
     */
    var _audioContext = undefined;

    /**
     * Audio object for the Application.
     * 
     * @type {AudioBufferSourceNode|undefined}
     * @private
     */
    var _sourceNode = undefined;

    /**
     * dat.GUI Controls for the Application.
     * 
     * @type {Object|undefined}
     * @private
     */
    var _gui = undefined;

    /**
     * Is the Application in Debug Mode?
     * 
     * @type {Boolean}
     * @private
     */
    var _isDebugMode = window.location.hash.indexOf('#debug') !== -1;

    /**
     * Audio Source node.
     * 
     * @type {Object|undefined}
     * @private
     */
    var _sourceNode = undefined;

    /**
     * JavaScript Audio Source node.
     * 
     * @type {Object|undefined}
     * @private
     */
    var _javascriptAudioNode = undefined;

    /**
     * Audio Analyser Node.
     * 
     * @type {Object|undefined}
     * @private
     */
    var _audioAnalyserNode = undefined;

    /**
     * Audio FFT data.
     * 
     * @type {Array}
     * @private
     */
    var _FFT = [0.0, 0.0, 0.0];

    var Utils = undefined;
    var States = {
        LoadingState: undefined,
        PlayState: undefined,
        LoadSceneState: undefined
    };


    /**
     * Initialize the Module.
     * 
     * @param  {Object} options Module configuration object.
     * @return {void}
     * @public
     */
    var initialize = function (options) {
        options = options || {};

        // Load Modules:
        Utils                 = options.Utils          || require('./Utils.js');
        States.LoadingState   = options.LoadingState   || require('./LoadingState.js');
        States.PlayState      = options.PlayState      || require('./PlayState.js');
        States.LoadSceneState = options.LoadSceneState || require('./LoadSceneState.js');


        if (_isDebugMode) {
            // Initialize the Debug Mode:
            _initializeDebugMode();
        }

        // Setup Audio Context:
        _initializeAudioContext();

        // Setup Graphic Context:
        _initializeGraphicContext();

        // Initialize the Application States:
        _initializeStates(this);

        // Setup Google Analytics Tracking:
        _setupGoogleAnalyticsTracking();

        // Set the initial Application state:
        changeState(States.LoadingState);
    };

    /**
     * Initialize the Audio Context for the Application.
     * 
     * @return {void}
     * @private
     */
    var _initializeAudioContext = function () {
        // Fix browser vendor for "AudioContext":
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;

        _audioContext = new AudioContext();


        // Setup a JavaScript Node:
        _javascriptAudioNode = _audioContext.createScriptProcessor(2048, 1, 1);
        // Connect the JavaScript Node to the destination node (i.e. the speakers) -- otherwise it won't play:
        _javascriptAudioNode.connect(_audioContext.destination);
 
        // Setup an analyzer:
        _audioAnalyserNode = _audioContext.createAnalyser();
        _audioAnalyserNode.smoothingTimeConstant = 0.8;
        _audioAnalyserNode.fftSize = 1024; //512
 
        // Create a buffer source node:
        _sourceNode = _audioContext.createBufferSource();

 
        _sourceNode.connect(_audioAnalyserNode);
        _audioAnalyserNode.connect(_javascriptAudioNode);
        _sourceNode.connect(_audioContext.destination);



        if (_isDebugMode) {
            var canvas = document.getElementById('FFTContainer');
            var canvasWidth = canvas.width;
            var canvasHeight = canvas.height;
            var ctx = canvas.getContext('2d');

            var gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
            gradient.addColorStop(1.00, '#000000');
            gradient.addColorStop(0.75, '#ff0000');
            gradient.addColorStop(0.25, '#ffff00');
            gradient.addColorStop(0.00, '#ffffff');
        }

        _javascriptAudioNode.onaudioprocess = function () {
            var array = new Uint8Array(_audioAnalyserNode.frequencyBinCount);
            _audioAnalyserNode.getByteFrequencyData(array);


            if (_isDebugMode) {
                // Clear the current state:
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
         
                // Set the fill style:
                ctx.fillStyle = gradient;

                var nbBuckets = array.length;
                var barWidth = Math.round(canvasWidth / nbBuckets);

                for (var i = 0; i < nbBuckets; i++) {
                    if (i >= global.trimStart && i <= global.trimEnd) {
                        ctx.fillRect(i*barWidth, canvasHeight-array[i], barWidth, canvasHeight);
                    }
                }
            }

            /*_FFT = [
                array[199],
                array[201],
                array[202]
            ];*/
            _FFT = [
                array[  4],
                array[194],
                array[202]
            ];
        };
    };

    /**
     * Initialize the Graohic Context for the Application.
     * 
     * @return {void}
     * @private
     */
    var _initializeGraphicContext = function () {
        // Fix browser vendor for "requestAnimationFrame" and "cancelAnimationFrame":
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
        window.cancelAnimationFrame  = window.cancelAnimationFrame  || window.webkitCancelAnimationFrame  || window.mozCancelAnimationFrame  || window.msCancelAnimationFrame;
    };

    /**
     * Initialize all the Application States.
     * 
     * @param  {Object} Application A reference to the Application.
     * @return {void}
     * @private
     */
    var _initializeStates = function (Application) {
        States.LoadingState.initialize(Application, { Utils: Utils });
        States.PlayState.initialize(Application, { Utils: Utils });
        States.LoadSceneState.initialize(Application, { Utils: Utils });
    };

    /**
     * Setup Google Analytics tracking of DOM Elements.
     * 
     * @return {void}
     * @private
     */
    var _setupGoogleAnalyticsTracking = function () {
        // Handle clicks on "Album Art" link:
        var trackCoverLink = document.getElementById('trackCoverLink');
        trackCoverLink.addEventListener('click', function (event) {
            // Prevent default click behavior, with IE polyfill:
            Utils.preventDefaultEvent(event);

            // Send Google Analytics event to track clicks on Album Art:
            ga('send', 'event', 'Button', 'Click', 'Album Art');
        });


        // Handle clicks on "Artist" link:
        var trackArtistLink = document.getElementById('trackArtistLink');
        trackArtistLink.addEventListener('click', function (event) {
            // Prevent default click behavior, with IE polyfill:
            Utils.preventDefaultEvent(event);

            // Send Google Analytics event to track clicks on Artist:
            ga('send', 'event', 'Button', 'Click', 'Artist');
        });


        // Handle clicks on "View on GitHub" link:
        var githubLink = document.getElementById('githubLink');
        githubLink.addEventListener('click', function (event) {
            // Send Google Analytics event to track clicks on "View on GitHub":
            ga('send', 'event', 'Button', 'Click', 'GitHub');
        });


        // Handle clicks on "About" link:
        var aboutLink = document.getElementById('aboutLink');
        aboutLink.addEventListener('click', function (event) {
            // Prevent default click behavior, with IE polyfill:
            Utils.preventDefaultEvent(event);

            // Show the "About" Modal:
            var aboutModal = document.getElementById('aboutModal');
            Utils.removeCSSClass(aboutModal, 'hidden');

            // Send Google Analytics event to track openings of the "About" Modal:
            ga('send', 'event', 'Button', 'Click', 'About Modal');

            var aboutModalClose = document.getElementById('aboutModalClose');
            aboutModalClose.addEventListener('click', function (event) {
                // Prevent default click behavior, with IE polyfill:
                Utils.preventDefaultEvent(event);

                // Hide the "About" Modal:
                Utils.addCSSClass(aboutModal, 'hidden');
            });
        });
    };

    /**
     * Initialize the required libraries used in Debug Mode.
     * 
     * @return {void}
     * @private
     */
    var _initializeDebugMode = function () {
        // Load the FPS counter:
        Utils.asyncLoadScript('https://rawgit.com/mrdoob/stats.js/master/build/stats.min.js', function () {
            _drawStats();
        });

        // Load the UI Controls to change Application-specific variables:
        Utils.asyncLoadScript('https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.5/dat.gui.min.js', function () {
            _initializeDebugControls();
        });
    };

    /**
     * Initialize the GUI for Application Controls.
     * 
     * @return {void}
     * @private
     */
    var _initializeDebugControls = function () {
        // Setup Application Controls ViewModel:
        var applicationControls = {
            playSound: function () {
                Application.playAudio();
            },
            trimStart: 0,
            trimEnd: 350
        };


        // Bind Application Controls to GUI:
        _gui = new dat.GUI({ autoPlace: false });
        _gui.add(applicationControls, 'playSound').name('Play Sound');
        _gui.add(applicationControls, 'trimStart', 0, 512, 1).onChange(function (value) {
            console.log('Trim Start', value);
            global.trimStart = value;
        });
        _gui.add(applicationControls, 'trimEnd', 0, 512, 1).onChange(function (value) {
            console.log('Trim End', value);
            global.trimEnd = value;
        });


        // Add Controls to the DOM:
        var customContainer = document.getElementById('GUIContainer');
        customContainer.appendChild(_gui.domElement);
    };

    /**
     * Draw performance stats to the screen.
     *
     * Stats Modes:
     *   * 0 (FPS): Frames rendered in the last second. The higher the number the better.
     *   * 1 (MS):  Milliseconds needed to render a frame. The lower the number the better.
     *   * 2 (MB):  MBytes of allocated memory. (Run Chrome with --enable-precise-memory-info)
     * 
     * @return {void}
     * @private
     */
    var _drawStats = function () {
        // FPS stats:
        var fpsStats = new Stats();
        fpsStats.setMode(0);
        fpsStats.domElement.style.cssText = 'position:fixed; left:5px; top:5px; z-index:10000;';
        document.body.appendChild(fpsStats.domElement);

        // MS stats:
        var msStats = new Stats();
        msStats.setMode(1);
        msStats.domElement.style.cssText = 'position:fixed; left:85px; top:5px; z-index:10000;';
        document.body.appendChild(msStats.domElement);

        // MB stats:
        var mbStats = new Stats();
        mbStats.setMode(2);
        mbStats.domElement.style.cssText = 'position:fixed; left:170px; top:5px; z-index:10000;';
        document.body.appendChild(mbStats.domElement);

        requestAnimationFrame(function loop () {
            fpsStats.update();
            msStats.update();
            mbStats.update();

            requestAnimationFrame(loop);
        });
    };

    /**
     * Change the Application State.
     * 
     * @param  {Object} newState The new Application State.
     * @return {void}
     * @public
     */
    var changeState = function (newState) {
        if (_state !== newState) {
            if (_state !== undefined) {
                _state.exit();
            }

            _state = newState;

            if (_state !== undefined) {
                _state.enter();
                _state.execute();
            }
        }
    };

    /**
     * Return the AudioContext for the Application.
     * 
     * @return {AudioContext} The AudioContext for the Application.
     * @public
     */
    var getAudioContext = function () {
        return _audioContext;
    };


    /**
     * Set the Audio Source Node Buffer for the Application.
     * 
     * @param {Object} sourceNode The Audio Source Node Buffer to play for the Application.
     * @todo Stop/remove/deallocate/delete any previously set audio source.
     * @public
     */
    var setSourceNodeBuffer = function (buffer) {
        if (_sourceNode) {
            // Make sure there is no sound currently playing:
            if (_sourceNode.buffer) {
                _sourceNode.stop(0);
            }

            _sourceNode.buffer = buffer;
        }
    };

    /**
     * Play the Audio for the Application, if any loaded.
     * 
     * @return {void}
     * @public
     */
    var playAudio = function () {
        if (_sourceNode) {
            var trackInfoContainer = document.getElementById('trackInfo');
            Utils.removeCSSClass(trackInfoContainer, 'hidden');

            _sourceNode.start(0);
        }
    };

    /**
     * Stop the Audio for the Application, if any loaded.
     * 
     * @return {void}
     * @public
     */
    var stopAudio = function () {
        if (_sourceNode) {
            _sourceNode.stop(0);
        }
    };

    /**
     * Return the FFT data extracted from the audio spectrum.
     * 
     * @return {Array} The FFT data extracted from the audio spectrum.
     * @public
     */
    var getFFT = function () {
        return _FFT;
    };

    /**
     * Set the display information for the audio track to play.
     * 
     * @param {Object} trackInfo The information about the audio track to play.
     * @return {void}
     * @public
     */
    var setTrackInfo = function (trackInfo) {
        var trackTitle = trackInfo.title;
        var trackArtworkURL = trackInfo.artwork_url;
        //var trackDescription = trackInfo.description;
        var trackPermalinkURL = trackInfo.permalink_url;
        //var trackPurchaseURL = trackInfo.purchage_url;
        //var trackArtistAvatar = trackInfo.user.avatar_url;
        var trackArtistPermalinkURL = trackInfo.user.permalink_url;
        //var trackArtistName = trackInfo.user.username;
        var trackAlbum = 'Self-titled (2013)';

        var trackArtistName = 'Boundary';
        var httpsPermalink = trackPermalinkURL.replace('http://', 'https://');
        if (httpsPermalink === 'https://soundcloud.com/boundarysound/boundary-abidjan') {
            trackTitle = 'Abidjan';
        } else if (httpsPermalink === 'https://soundcloud.com/boundarysound/boundary-double-edged-sword') {
            trackTitle = 'Double-Edged Sword';
        }

        document.getElementById('trackArtist').textContent = trackArtistName;
        document.getElementById('trackTitle').textContent  = trackTitle;
        document.getElementById('trackAlbum').textContent  = trackAlbum;
        var artistLink = document.getElementById('trackArtistLink');
        artistLink.href = trackArtistPermalinkURL;
        artistLink.title = 'Follow ' + trackArtistName + ' on Soundcloud';
        var coverLink = document.getElementById('trackCoverLink');
        coverLink.href = trackArtistPermalinkURL;
        coverLink.title = 'Follow ' + trackArtistName + ' on Soundcloud';
        
        var albumArt = document.getElementById('trackArtwork');
        //if (trackArtworkURL && trackArtworkURL.length > 0) {
        //    albumArt.onload = function (e) {
        //        // "Preload" the album art:
        //        var trackInfoContainer = document.getElementById('trackInfo');
        //        Utils.removeCSSClass(trackInfoContainer, 'hidden');
        //    };
        //} else {
        //    var trackInfoContainer = document.getElementById('trackInfo');
        //    Utils.removeCSSClass(trackInfoContainer, 'hidden');
        //}
        albumArt.src = trackArtworkURL;
    };

    /**
     * Return the States available for the Application.
     * 
     * @return {Array} The States available for the Application.
     * @public
     */
    var getStates = function () {
        return States;
    };


    return {
        initialize: initialize,
        changeState: changeState,

        getAudioContext: getAudioContext,
        setSourceNodeBuffer: setSourceNodeBuffer,

        playAudio: playAudio,
        stopAudio: stopAudio,

        getFFT: getFFT,

        setTrackInfo: setTrackInfo,

        getStates: getStates
    };
})(window);


module.exports = Application;
