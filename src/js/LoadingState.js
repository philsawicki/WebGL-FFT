/**!
 * @file "Loading" State Module for the Application.
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @copyright Copyright Philippe Sawicki 2015
 * @license MIT
 */


/**
 * "Loading" State for the Application.
 * 
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @return {Object}
 * @public
 */
var LoadingState = (function () {
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

    /**
     * SoundCloud API ClientID.
     * 
     * @type {String}
     * @private
     */
    var _clientParameter = 'client_id=3b2585ef4a5eff04935abe84aad5f3f3';

    /**
     * URL of the track to play.
     * 
     * @type {String}
     * @private
     */
    //var _soundcloudTrackURL = 'https://soundcloud.com/boundarysound/boundary-double-edged-sword';
    //var _soundcloudTrackURL = 'https://soundcloud.com/aviciiofficial/avicii-levels-original-mix';
    var _soundcloudTrackURL = 'https://soundcloud.com/boundarysound/boundary-abidjan';


    /**
     * Initialize the Application State.
     * 
     * @param  {Object} Application A reference to the Application.
     * @param  {Object} options     Initialization options for the State.
     * @return {void}
     * @public
     */
    var initialize = function (Application, options) {
        console.log('LoadingState::initialize');

        _Application = Application;
        Utils = options.Utils || require('./Utils.js');
    };

    /**
     * Prepare the State for execution.
     * 
     * @return {void}
     * @public
     */
    var enter = function () {
        console.log('LoadingState::enter');
    };

    /**
     * Execute the Application State.
     * 
     * @return {void}
     * @public
     */
    var execute = function () {
        console.log('LoadingState::execute');

        //_Application.setStatus('Loading track...');


        var soundcloudURL = 'http://api.soundcloud.com/resolve.json?url=' + _soundcloudTrackURL + '&' + _clientParameter
        Utils.ajaxGet(soundcloudURL, function (response) {
            var trackInfo = JSON.parse(response);

            var streamURL = trackInfo.stream_url + '?' + _clientParameter;
            _loadAudio(streamURL);

            _Application.setTrackInfo(trackInfo);
        });
    };

    /**
     * Exit the Application State.
     * 
     * @return {void}
     * @public
     */
    var exit = function () {
        console.log('LoadingState::exit');
    };

    /**
     * Load the Audio to play.
     * 
     * @param  {String} audioURL The URL of the Audio stream to download.
     * @return {void}
     * @private
     */
    var _loadAudio = function (audioURL) {
        console.log('LoadingState::_loadAudio');


        // Load the specified sound:
        var request = new XMLHttpRequest();
        request.open('GET', audioURL, true);
        request.responseType = 'arraybuffer';
        // When loaded, decode the data:
        request.onload = function () {
            var audioContext = _Application.getAudioContext();
            audioContext.decodeAudioData(request.response, _soundLoaded, _soundLoadError);
        }
        request.send(null);
    };

    /**
     * Callback executed once the audio data has been loaded and decoded.
     * 
     * @param  {Object} buffer Audio data buffer for the track to play.
     * @return {void}
     * @private
     */
    var _soundLoaded = function (buffer) {
        console.log('LoadingState::_playSound');


        _Application.setSourceNodeBuffer(buffer);
        console.log(_Application, _Application.getStates(), _Application.getStates().PlayState);
        _Application.changeState(_Application.getStates().PlayState);
    };

    /**
     * Callback executed if the audio data could not be decoded.
     * 
     * @param  {Object} error Error details
     * @return {void}
     * @private
     */
    var _soundLoadError = function (error) {
        console.log(error);
    }


    return {
        initialize: initialize,
        enter: enter,
        execute: execute,
        exit: exit
    };
})();


module.exports = LoadingState;
