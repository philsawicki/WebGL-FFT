/**!
 * @file Utils and Helpers Module for the Application.
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @copyright Copyright Philippe Sawicki 2015
 * @license MIT
 */


/**
 * Utils & Helpers.
 * 
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @return {Object}
 * @public
 */
var Utils = (function () {
    'use strict';


    /**
     * Perform an AJAX HTTP GET request to the given URL.
     * 
     * @param  {String}   url      The URL to HTTP GET.
     * @param  {Function} callback The callback function to execute once the HTTP GET is completed.
     * @return {void}
     * @oublic
     */
    var ajaxGet = function (url, callback) {
        var request = new XMLHttpRequest();

        request.onreadystatechange = function () { 
            if (request.readyState === 4 && request.status === 200 && typeof callback === 'function') {
                callback(request.responseText);
            }
        };

        request.open('GET', url, true);
        request.send(null);
    };

    /**
     * Async load the given JavaScript file.
     * 
     * @param  {String}    url      The URL of the JavaScript file to download.
     * @param  {Function?} callback The (optional) callback to execute once the file is loaded.
     * @return {void}
     * @public
     */
    var asyncLoadScript = function (url, callback) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;

        if (script.readyState) {
            script.onreadystatechange = function () {
                if (script.readyState === 'loaded' || script.readyState === 'complete') {
                    script.onreadystatechange = null;
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }
            };
        } else {
            script.onload = function () {
                if (callback && typeof callback === 'function') {
                    callback();
                }
            };
        }

        script.src = url;
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
    };

    /**
     * Remove the given CSS class from the given DOMElement.
     * 
     * @param  {DOMElement} element   DOM Element from which to remove the class.
     * @param  {String}     className CSS class name to remove from the element.
     * @return {void}
     * @public
     */
    var removeCSSClass = function (element, className) {
        if (element.classList) {
            element.classList.remove(className);
        } else {
            element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    };

    /**
     * Add the given CSS class to the given DOMElement.
     * 
     * @param {DOMElement} element   DOM Element to which to add the class.
     * @param {String}     className CSS class name to add to the element.
     * @return {void}
     * @public
     */
    var addCSSClass = function (element, className) {
        if (element.classList) {
            element.classList.add(className);
        } else {
            element.className += ' ' + className;
        }
    };

    /**
     * Prevent default click behavior, with IE polyfill.
     * 
     * @param  {Event} event The event object raised by the Event.
     * @return {void}
     * @public
     */
    var preventDefaultEvent = function (event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    };

    /**
     * Return a random number between min (inclusive) and max (exclusive).
     *
     * @param {Float|Integer} min The minimal value of the range (inclusive).
     * @param {Float|Integer} max The maximal value of the range (exclusive).
     * @return {Float} A random number between min (inclusive) and max (exclusive).
     * @public
     */
    var getRandomArbitrary = function (min, max) {
        return Math.random() * (max - min) + min;
    };

    /**
     * Returns a random integer between min (inclusive) and max (inclusive).
     * Using Math.round() would return a non-uniform distribution!
     * 
     * @param {Integer} min The minimal value of the range (inclusive).
     * @param {Integer} max The maximal value of the range (inclusive).
     * @return {Integer} A random number between min (inclusive) and max (inclusive).
     * @public
     */
    var getRandomInteger = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };


    return {
        ajaxGet: ajaxGet,
        asyncLoadScript: asyncLoadScript,

        removeCSSClass: removeCSSClass,
        addCSSClass: addCSSClass,

        getRandomArbitrary: getRandomArbitrary,
        getRandomInteger: getRandomInteger,

        preventDefaultEvent: preventDefaultEvent
    };
})();


module.exports = Utils;
