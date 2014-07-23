/*
Root "namespace" object for all ININ JavaScript. It's main purpose is to be a container for other
objects so as not to pollute the global namespace with our objects.
*/

(function () {
    if (typeof ININ === "undefined") {
        ININ = {};
    }

    // Follows the same namespace requirements as the C# specification
    var __validNamespaceRegExp = /^(@?[a-z_A-Z]\w+(?:\.@?[a-z_A-Z]\w+)*)$/;

    function isExistingNamespace(ns) {
        return (typeof (ns) === 'object') && ns.__isNamespace;
    }

    function isNonNamespaceObject(ns) {
        return (typeof (ns) !== 'undefined') && !ns.__isNamespace;
    }

    ININ.__isNamespace = true;
    ININ.__typeName = 'ININ';

    /*
    Registers a namespace to use as a container for JavaScript. Typically the root namespace
    will be the this object (ININ) but that is not a requirement.

    This function is adapted from the "registerNamespace" function in the "Type" class in the
    ASP.NET AJAX core JavaScript library.
    */
    ININ.registerNamespace = function (namespacePath) {

        if (!namespacePath || namespacePath.search(__validNamespaceRegExp) === -1) {
            throw 'Invalid namespace!';
        }

        var namespaceParts = namespacePath.split('.');
        var rootObject = window;

        for (var i = 0; i < namespaceParts.length; i++) {

            var currentNsString = namespaceParts[i];
            var fullyQualifiedNsString = namespaceParts.slice(0, i + 1).join('.');
            var currentNsObj = rootObject[currentNsString];

            if (!isExistingNamespace(currentNsObj)) {
                if (isNonNamespaceObject(currentNsObj)) {
                    throw 'Invalid operation! Namespace already contains non-namespace object: ' + fullyQualifiedNsString;
                }

                // We've verified there is no existing namespace or current object with the
                // desired name, so we'll go ahead and create a new one, assigning it to the
                // current root object.
                currentNsObj = {
                    __isNamespace: true,
                    __typeName: fullyQualifiedNsString
                }
                rootObject[currentNsString] = currentNsObj;
            }

            rootObject = currentNsObj;
        }
    };
} ());

ININ.registerNamespace('ININ.Utils');

ININ.Utils.generateRandomId = function () {
    var id = '';
    while (id.length < 16) id += String.fromCharCode(((!id.length || Math.random() > 0.5) ?
    0x61 + Math.floor(Math.random() * 0x19) : 0x30 + Math.floor(Math.random() * 0x9)));
    return id;
}


ININ.InjectUtils = function () {

    var getType = function (obj) {
        var typeString = Object.prototype.toString.call(obj);

        switch (typeString) {
        case "[object Function]":
            return "function";
        case "[object Date]":
            return "date";
        case "[object RegExp]":
            return "regex";
        }

        return typeof (obj);
    }

    var jsEscape = function (str) {
        // Replaces quotes with numerical escape sequences to
        // avoid single-quote-double-quote-hell, also helps by escaping HTML special chars.
        if (!str || !str.length) return str;
        // use \W in the square brackets if you have trouble with any values.
        var r = /['"<>\/]/g, result = "", l = 0, c;
        do {
            c = r.exec(str);
            result += (c ? (str.substring(l, r.lastIndex - 1) + "\\x" +
            c[0].charCodeAt(0).toString(16)) : (str.substring(l)));
        } while (c && ((l = r.lastIndex) > 0))
        return (result.length ? result : str);
    };

    var createScriptNode = function (doc, opts) {
        if (!opts)
        opts = {};

        var scriptNode = doc.createElement('script');
        scriptNode.type = "text/javascript";
        if (typeof opts.innerHTML == 'string') {
            scriptNode.innerHTML = opts.innerHTML;
        }
        if (typeof opts.src == 'string') {
            scriptNode.src = opts.src;
        }
        if (typeof opts.id == 'string') {
            scriptNode.id = opts.id;
        }

        return scriptNode;
    };

    var createArgString = function (funcArgs) {
        // We're dealing with a function, prepare the arguments.
        var args = [];

        for (var i = 0; i < funcArgs.length; i++) {
            var raw = funcArgs[i];
            var arg;

            if (raw === undefined) {
                arg = 'undefined';
            }
            else {
                var rawType = getType(raw);

                switch (rawType) {
                case "function":
                    arg = "eval(\"" + jsEscape("(" + raw.toString() + ")") + "\")";
                    break;
                case "date":
                    arg = "(new Date(" + raw.getTime().toString() + "))";
                    break;
                case "regexp":
                    arg = "(new RegExp(" + raw.toString() + "))";
                    break;
                case "string":
                case "object":
                    arg = "JSON.parse(\"" + jsEscape(JSON.stringify(raw)) + "\")";
                    break;
                default:
                    arg = raw.toString(); // Anything else number/boolean
                }
            }

            args.push(arg);    // push the new argument on the list
        }

        return args.join();
    };

    var execScript = function (doc, scriptSource) {
        var script, ret, id = "";

        // generate a random id string for the script block
        id = ININ.Utils.generateRandomId();

        // build the final script string, wrapping the original in a boot-strapper/proxy:
        script = "(function(){var value={callResult: null, throwValue: false};try{value.callResult=" +
        scriptSource + "}catch(e){value.throwValue=true;value.callResult=e;};" +
        "document.getElementById('" + id + "').innerHTML=JSON.stringify(value);})();";

        var scriptNode = createScriptNode(doc, { id: id, innerHTML: script });

        // insert the element into the DOM (it starts to execute instantly)
        doc.head.appendChild(scriptNode);

        // Now get the response
        ret = JSON.parse(scriptNode.innerHTML);

        // remove the now-useless clutter.
        scriptNode.parentNode.removeChild(scriptNode);

        // make sure the garbage collector picks it instantly. (and hope it does)
        delete (scriptNode);

        // see if our returned value was thrown or not
        if (ret.throwValue)
        throw (ret.callResult);
        else
        return (ret.callResult);
    };

    return {
        CreateScriptNode: function (doc, opts) {
            return createScriptNode(doc, opts);
        },

        ExecuteFunctionByName: function (doc, functionName) {
            var args = Array.prototype.slice.call(arguments, 2);
            var argsString = createArgString(args);

            var source = functionName + "(" + argsString + ");";

            return execScript(doc, source);
        },

        ExecuteFunction: function (doc, func) {

            if (getType(func) !== 'function')
            throw "Argument 'func' is not a function."

            var args = Array.prototype.slice.call(arguments, 2);
            var argsString = createArgString(args);
            var source = "((" + func.toString() + ")(" + argsString + "));";
            return execScript(doc, source);
        },

        InjectScript: function (doc, source) {

            var scriptNode = createScriptNode(doc, { innerHTML: source });

            // insert the element into the DOM (it starts to execute instantly)
            doc.head.appendChild(scriptNode);

            return (scriptNode);
        },

        InjectFunction: function (doc, func, id, funcName) {
            if (getType(func) !== 'function')
            throw "Argument 'func' is not a function.";

            // Ensure the function hasn't already been added
            var scriptNode = doc.getElementById(id);
            if (!scriptNode) {
                var source = func;
                if (funcName) {
                    source = funcName + " = " + func.toString();
                }

                scriptNode = createScriptNode(doc, { innerHTML: source, id: id });

                doc.head.appendChild(scriptNode);
            }

            return scriptNode;
        },

        InjectScriptRef: function (doc, scriptSrc, onloadFunc) {
            var scriptNode = createScriptNode(doc, { src: scriptSrc });
            scriptNode.onload = onloadFunc;
            doc.head.appendChild(scriptNode);

            return scriptNode;
        }
    }
} ();
