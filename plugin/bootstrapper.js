function ininPluginBootstrapper(baseScriptsUrl, baseStylesUrl, baseImagesUrl, isWebClientRunning) {

    var __baseScriptsUrl = baseScriptsUrl;
    var __baseStylesUrl = baseStylesUrl;
    var __baseImagesUrl = baseImagesUrl;

    this.ininLoadScripts = function (callback) {
        var scripts = [
                        { Src: 'common.js' },
                        { Src: 'jquery-1.6.1.min.js', OnLoad: function () { ININ.$ = jQuery.noConflict(true); } },
                        { Src: 'inin-jquery-extensions.js' },
                        { Src: 'ClickToDial.js' }
                    ];


        var scriptLoadActionAsync = function (script, onFinished) {

            var onDoneLoadingScript = function () {
                if (script.OnLoad) {
                    script.OnLoad();
                }
                onFinished();
            }

            var scriptNode = document.createElement('script');
            scriptNode.src = __baseScriptsUrl + script.Src;
            scriptNode.onload = onDoneLoadingScript;
            document.head.appendChild(scriptNode);
        };

        this.ininForeachAsync(scripts, scriptLoadActionAsync, callback);
        /*
        var webClientRunningNode = document.createElement('script');
        webClientRunningNode.innerText='var WebClientIsRunning = ' + isWebClientRunning + ';';
        document.head.appendChild(webClientRunningNode);

*/

    }

    this.fireonBootStrapperComplete = function () {
    //    ININ.ClickToDial.Plugin.baseScriptsUrl = __baseScriptsUrl;
//        var evt = new ININ.Events.Event('inin_bootstrapper_complete');
        //ININ.ClickToDial.Plugin.dispatchEvent(evt);
    }

    this.i3InitClickToDial = function () {
        ININ.ClickToDial.Core.Initialize(document);
    }
}

ininPluginBootstrapper.prototype.ininForeachAsync = function (collection, func, onFinished) {
    var index = 0;

    var nextItem = function () {
        if (index < collection.length) {
            var currItem = collection[index];
            index++;
            if (currItem) {
                func(currItem, nextItem);
            }
        }
        else {
            onFinished();
        }
    }

    nextItem(nextItem);
}

ininPluginBootstrapper.prototype.start = function () {

    var chain = new ininLink(this);
    var link = chain.thenAsync(this.ininLoadScripts);
    link = link.then(this.i3InitClickToDial);
    link = link.then(this.fireonBootStrapperComplete);

    chain.resolve();
}

ininPluginBootstrapper.init_bootstrap = function (baseScriptsUrl, baseStylesUrl, baseImagesUrl) {
    var bootstrapper = new ininPluginBootstrapper(baseScriptsUrl, baseStylesUrl, baseImagesUrl);
    bootstrapper.start();
}

function ininLink(context, func) {
    var nextLink;

    return {
        then: function (nextFunc, ctx) {
            if ((typeof nextFunc) !== 'function') {
                throw 'Parameter func is not a function';
            }

            nextLink = new ininLink(ctx || context, nextFunc);
            return nextLink;
        },
        thenAsync: function (nextFunc, ctx) {
            if ((typeof nextFunc) !== 'function') {
                throw 'Parameter func is not a function';
            }

            nextLink = new ininAsyncLink(ctx || context, nextFunc);
            return nextLink;
        },
        resolve: function () {
            if (func) {
                func.call(context);
            }

            if (nextLink) {
                nextLink.resolve();
            }
        },
        __nextLink: function () { return nextLink; }
    };
}

function ininAsyncLink(context, func) {
    // inherit from Link
    var that = new ininLink(context, func);

    var callbackFunc = function () {
        // call next item in chain
        if (that.__nextLink()) {
            that.__nextLink().resolve();
        }
    };

    that.resolve = function () {
        func.call(context, callbackFunc);
    };
    return that;
}

(function autorun() {
    // The bootstrapper params can be added to a page before adding the bootstrapper script in order
    // to trigger the bootstrapper on load of the script
    try {
    if (inin_bootstrapper_params !== undefined) {
        ininPluginBootstrapper.init_bootstrap(inin_bootstrapper_params.baseScriptsUrl, inin_bootstrapper_params.baseStyleUrl, inin_bootstrapper_params.baseImagesUrl, inin_bootstrapper_params.pluginScripts , null);
    }
    }catch(e){}
} ());
