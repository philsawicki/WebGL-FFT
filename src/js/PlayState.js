/**!
 * @file "Play" State Module for the Application.
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @copyright Copyright Philippe Sawicki 2015
 * @license MIT
 */


/**
 * "Play" State for the Application.
 * 
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @return {Object}
 * @public
 */
var PlayState = (function () {
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
     * Initialize the Application State.
     * 
     * @param  {Object} Application A reference to the Application.
     * @param  {Object} options     Initialization options for the State.
     * @return {void}
     * @public
     */
    var initialize = function (Application, options) {
        console.log('PlayState::initialize');

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
        console.log('PlayState::enter');

        //_Application.setStatus('Ready');
    };

    /**
     * Execute the Application State.
     * 
     * @return {void}
     * @public
     */
    var execute = function () {
        console.log('PlayState::execute');

        _launchExperience();
    };

    /**
     * Exit the Application State.
     * 
     * @return {void}
     * @public
     */
    var exit = function () {
        console.log('PlayState::exit');
    };

    /**
     * Display a "Launch Experiment" while waiting for user to be ready to start the animation.
     * 
     * @return {void}
     * @public
     */
    var _launchExperience = function () {
        // Hide the loading animation:
        var loader = document.getElementById('loader');
        Utils.removeCSSClass(loader, 'loading');

        // Show the "Launch Experiment" CTA:
        var playButtonContainer = document.getElementById('playButton');
        Utils.removeCSSClass(playButtonContainer, 'hidden');

        // Handle click on "Launch Experiment" CTA:
        var launchButton = document.getElementById('launchExperience');
        launchButton.addEventListener('click', function (event) {
            // Prevent default click behavior, with IE polyfill:
            //(event.preventDefault) ? event.preventDefault() : event.returnValue = false;
            Utils.preventDefaultEvent(event);

            // Prevent multiple clicks on the button by disabling the "<a>":
            launchButton.setAttribute('disabled', 'disabled');

            // Hide the "Launch Experiment" CTA:
            Utils.addCSSClass(playButtonContainer, 'hidden');

            // Send Google Analytics event to track how many people actually launch the experiment:
            ga('send', 'event', 'Button', 'Click', 'Launch Experience');

            _Application.changeState(_Application.getStates().LoadSceneState);
        });
    };


    return {
        initialize: initialize,
        enter: enter,
        execute: execute,
        exit: exit
    };
})();


module.exports = PlayState;
