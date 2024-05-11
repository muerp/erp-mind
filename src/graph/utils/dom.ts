var Dom7:any = function Dom7(arr:any = []) {
    let self = this;
    // Create array-like object
    for (let i = 0; i < arr.length; i += 1) {
        self[i] = arr[i];
    }
    self.length = arr.length;
    // Return collection with methods
    return this;
}
function $(selector:any, context:any=null) {
    var arr = [];
    var i = 0;
    if (selector && !context) {
        if (selector instanceof Dom7) {
            return selector;
        }
    }
    if (selector) {
        // String
        if (typeof selector === 'string') {
            var els;
            var tempParent;
            var html = selector.trim();
            if (html.indexOf('<') >= 0 && html.indexOf('>') >= 0) {
                var toCreate = 'div';
                if (html.indexOf('<li') === 0) { toCreate = 'ul'; }
                if (html.indexOf('<tr') === 0) { toCreate = 'tbody'; }
                if (html.indexOf('<td') === 0 || html.indexOf('<th') === 0) { toCreate = 'tr'; }
                if (html.indexOf('<tbody') === 0) { toCreate = 'table'; }
                if (html.indexOf('<option') === 0) { toCreate = 'select'; }
                tempParent = doc.createElement(toCreate);
                tempParent.innerHTML = html;
                for (i = 0; i < tempParent.childNodes.length; i += 1) {
                    arr.push(tempParent.childNodes[i]);
                }
            } else {
                if (!context && selector[0] === '#' && !selector.match(/[ .<>:~]/)) {
                    // Pure ID selector
                    els = [doc.getElementById(selector.trim().split('#')[1])];
                } else {
                    // Other selectors
                    els = (context || doc).querySelectorAll(selector.trim());
                }
                for (i = 0; i < els.length; i += 1) {
                    if (els[i]) { arr.push(els[i]); }
                }
            }
        } else if (selector.nodeType || selector === win || selector === doc) {
            // Node/element
            arr.push(selector);
        } else if (selector.length > 0 && selector[0].nodeType) {
            // Array of elements or instance of Dom
            for (i = 0; i < selector.length; i += 1) {
                arr.push(selector[i]);
            }
        }
    }
    return new Dom7(arr);
}

$.fn = Dom7.prototype;
$.Class = Dom7;
$.Dom7 = Dom7;
let p: any = {}
var doc = typeof document !== 'undefined' ? document : p
var win = typeof window !== 'undefined' ? window : p
$.fn.is = function (selector: any) {
    var el = this[0];
    var compareWith;
    var i;
    if (!el || typeof selector === 'undefined') { return false; }
    if (typeof selector === 'string') {
        if (el.matches) { return el.matches(selector); }
        else if (el.webkitMatchesSelector) { return el.webkitMatchesSelector(selector); }
        else if (el.msMatchesSelector) { return el.msMatchesSelector(selector); }

        compareWith = $(selector);
        for (i = 0; i < compareWith.length; i += 1) {
            if (compareWith[i] === el) { return true; }
        }
        return false;
    } else if (selector === doc) { return el === doc; }
    else if (selector === win) { return el === win; }

    if (selector.nodeType || selector instanceof Dom7) {
        compareWith = selector.nodeType ? [selector] : selector;
        for (i = 0; i < compareWith.length; i += 1) {
            if (compareWith[i] === el) { return true; }
        }
        return false;
    }
    return false;
}
$.fn.find = function(selector:any) {
    var foundElements: any = [];
    for (var i = 0; i < this.length; i += 1) {
        var found = this[i].querySelectorAll(selector);
        for (var j = 0; j < found.length; j += 1) {
            foundElements.push(found[j]);
        }
    }
    return new Dom7(foundElements);
}
function unique(arr) {
    var uniqueArray = [];
    for (var i = 0; i < arr.length; i += 1) {
        if (uniqueArray.indexOf(arr[i]) === -1) { uniqueArray.push(arr[i]); }
    }
    return uniqueArray;
}
$.fn.parents = function (selector) {
    var parents = []; // eslint-disable-line
    for (var i = 0; i < this.length; i += 1) {
        var parent = this[i].parentNode; // eslint-disable-line
        while (parent) {
            if (selector) {
                if ($(parent).is(selector)) { parents.push(parent); }
            } else {
                parents.push(parent);
            }
            parent = parent.parentNode;
        }
    }
    return $(unique(parents));
}
$.fn.attr = function(attrs, value) {
    var arguments$1 = arguments;

    if (arguments.length === 1 && typeof attrs === 'string') {
        // Get attr
        if (this[0]) { return this[0].getAttribute(attrs); }
        return undefined;
    }

    // Set attrs
    for (var i = 0; i < this.length; i += 1) {
        if (arguments$1.length === 2) {
            // String
            this[i].setAttribute(attrs, value);
        } else {
            // Object
            // eslint-disable-next-line
            for (var attrName in attrs) {
                this[i][attrName] = attrs[attrName];
                this[i].setAttribute(attrName, attrs[attrName]);
            }
        }
    }
    return this;
}
$.fn.next = function(selector) {
    if (this.length > 0) {
        if (selector) {
            if (this[0].nextElementSibling && $(this[0].nextElementSibling).is(selector)) {
                return new Dom7([this[0].nextElementSibling]);
            }
            return new Dom7([]);
        }

        if (this[0].nextElementSibling) { return new Dom7([this[0].nextElementSibling]); }
        return new Dom7([]);
    }
    return new Dom7([]);
}
$.fn.children = function(selector) {
    var children = []; // eslint-disable-line
    for (var i = 0; i < this.length; i += 1) {
        var childNodes = this[i].childNodes;

        for (var j = 0; j < childNodes.length; j += 1) {
            if (!selector) {
                if (childNodes[j].nodeType === 1) { children.push(childNodes[j]); }
            } else if (childNodes[j].nodeType === 1 && $(childNodes[j]).is(selector)) {
                children.push(childNodes[j]);
            }
        }
    }
    return new Dom7(unique(children));
}
$.fn.addClass = function(className) {
    if (typeof className === 'undefined') {
        return this;
    }
    var classes = className.split(' ');
    for (var i = 0; i < classes.length; i += 1) {
        for (var j = 0; j < this.length; j += 1) {
            if (typeof this[j] !== 'undefined' && typeof this[j].classList !== 'undefined') { this[j].classList.add(classes[i]); }
        }
    }
    return this;
}
$.fn.removeClass = function(className) {
    var classes = className.split(' ');
    for (var i = 0; i < classes.length; i += 1) {
        for (var j = 0; j < this.length; j += 1) {
            if (typeof this[j] !== 'undefined' && typeof this[j].classList !== 'undefined') { this[j].classList.remove(classes[i]); }
        }
    }
    return this;
}
$.fn.hasClass = function(className) {
    if (!this[0]) { return false; }
    return this[0].classList.contains(className);
}
$.fn.each = function(callback) {
    // Don't bother continuing without a callback
    if (!callback) { return this; }
    // Iterate over the current collection
    for (var i = 0; i < this.length; i += 1) {
        // If the callback returns false
        if (callback.call(this[i], i, this[i]) === false) {
            // End the loop early
            return this;
        }
    }
    // Return `this` to allow chained DOM operations
    return this;
}
$.fn.forEach = function(callback) {
    // Don't bother continuing without a callback
    if (!callback) { return this; }
    // Iterate over the current collection
    for (var i = 0; i < this.length; i += 1) {
        // If the callback returns false
        if (callback.call(this[i], this[i], i) === false) {
            // End the loop early
            return this;
        }
    }
    // Return `this` to allow chained DOM operations
    return this;
}
$.fn.remove = function() {
    for (var i = 0; i < this.length; i += 1) {
        if (this[i].parentNode) { this[i].parentNode.removeChild(this[i]); }
    }
    return this;
}
$.fn.empty = function () {
    for (var i = 0; i < this.length; i += 1) {
        var el = this[i];
        if (el.nodeType === 1) {
            for (var j = 0; j < el.childNodes.length; j += 1) {
                if (el.childNodes[j].parentNode) {
                    el.childNodes[j].parentNode.removeChild(el.childNodes[j]);
                }
            }
            el.textContent = '';
        }
    }
    return this;
}
$.fn.append = function() {
    var args: any = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var newChild: any = [];

    for (var k = 0; k < args.length; k += 1) {
        newChild = args[k];
        for (var i = 0; i < this.length; i += 1) {
            if (typeof newChild === 'string') {
                var tempDiv = doc.createElement('div');
                tempDiv.innerHTML = newChild;
                while (tempDiv.firstChild) {
                    this[i].appendChild(tempDiv.firstChild);
                }
            } else if (newChild instanceof Dom7) {
                for (var j = 0; j < newChild.length; j += 1) {
                    this[i].appendChild(newChild[j]);
                }
            } else {
                this[i].appendChild(newChild);
            }
        }
    }

    return this;
}

$.fn.prepend = function(newChild) {
    var i;
    var j;
    for (i = 0; i < this.length; i += 1) {
        if (typeof newChild === 'string') {
            var tempDiv = doc.createElement('div');
            tempDiv.innerHTML = newChild;
            for (j = tempDiv.childNodes.length - 1; j >= 0; j -= 1) {
                this[i].insertBefore(tempDiv.childNodes[j], this[i].childNodes[0]);
            }
        } else if (newChild instanceof Dom7) {
            for (j = 0; j < newChild.length; j += 1) {
                this[i].insertBefore(newChild[j], this[i].childNodes[0]);
            }
        } else {
            this[i].insertBefore(newChild, this[i].childNodes[0]);
        }
    }
    return this;
}

$.fn.insertBefore = function (selector) {
    var before = $(selector);
    for (var i = 0; i < this.length; i += 1) {
        if (before.length === 1) {
            before[0].parentNode.insertBefore(this[i], before[0]);
        } else if (before.length > 1) {
            for (var j = 0; j < before.length; j += 1) {
                before[j].parentNode.insertBefore(this[i].cloneNode(true), before[j]);
            }
        }
    }
}

$.fn.html = function(html) {
    if (typeof html === 'undefined') {
        return this[0] ? this[0].innerHTML : undefined;
    }
    if ( typeof html === "string") {
        for (var i = 0; i < this.length; ++i) {
            this[i].innerHTML = html;
        }
    } else {
        this.empty().append( html );
    }

    return this;
}
$.fn.map = function(callback) {
    var modifiedItems = [];
    var dom = this;
    for (var i = 0; i < dom.length; i += 1) {
        modifiedItems.push(callback.call(dom[i], i, dom[i]));
    }
    return new Dom7(modifiedItems);
}
$.fn.clone = function( dataAndEvents, deepDataAndEvents ) {
    return this.map(function () {
        return this.cloneNode( true );
    })
}
$.fn.on = function() {
    var assign;
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var eventType = args[0];
    var targetSelector = args[1];
    var listener = args[2];
    var capture = args[3];
    if (typeof args[1] === 'function') {
        assign = args;
        eventType = assign[0];
        listener = assign[1];
        capture = assign[2];
        targetSelector = undefined;
    }
    if (!capture) { capture = false; }

    function handleLiveEvent(e) {
        var target = e.target;
        if (!target) { return; }
        var eventData = e.target.dom7EventData || [];
        if (eventData.indexOf(e) < 0) {
            eventData.unshift(e);
        }
        if ($(target).is(targetSelector)) { listener.apply(target, eventData); }
        else {
            var parents = $(target).parents(); // eslint-disable-line
            for (var k = 0; k < parents.length; k += 1) {
                if ($(parents[k]).is(targetSelector)) { listener.apply(parents[k], eventData); }
            }
        }
    }
    function handleEvent(e) {
        var eventData = e && e.target ? e.target.dom7EventData || [] : [];
        if (eventData.indexOf(e) < 0) {
            eventData.unshift(e);
        }
        listener.apply(this, eventData);
    }
    var events = eventType.split(' ');
    var j;
    for (var i = 0; i < this.length; i += 1) {
        var el = this[i];
        if (!targetSelector) {
            for (j = 0; j < events.length; j += 1) {
                var event = events[j];
                if (!el.dom7Listeners) { el.dom7Listeners = {}; }
                if (!el.dom7Listeners[event]) { el.dom7Listeners[event] = []; }
                el.dom7Listeners[event].push({
                    listener: listener,
                    proxyListener: handleEvent,
                });
                el.addEventListener(event, handleEvent, capture);
            }
        } else {
            // Live events
            for (j = 0; j < events.length; j += 1) {
                var event$1 = events[j];
                if (!el.dom7LiveListeners) { el.dom7LiveListeners = {}; }
                if (!el.dom7LiveListeners[event$1]) { el.dom7LiveListeners[event$1] = []; }
                el.dom7LiveListeners[event$1].push({
                    listener: listener,
                    proxyListener: handleLiveEvent,
                });
                el.addEventListener(event$1, handleLiveEvent, capture);
            }
        }
    }
    return this;
}
$.fn.off = function() {
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var eventType = args[0];
    var targetSelector = args[1];
    var listener = args[2];
    var capture = args[3];
    if (typeof args[1] === 'function') {
        assign = args;
        eventType = assign[0];
        listener = assign[1];
        capture = assign[2];
        targetSelector = undefined;
    }
    if (!capture) { capture = false; }

    var events = eventType.split(' ');
    for (var i = 0; i < events.length; i += 1) {
        var event = events[i];
        for (var j = 0; j < this.length; j += 1) {
            var el = this[j];
            var handlers = (void 0);
            if (!targetSelector && el.dom7Listeners) {
                handlers = el.dom7Listeners[event];
            } else if (targetSelector && el.dom7LiveListeners) {
                handlers = el.dom7LiveListeners[event];
            }
            if (handlers && handlers.length) {
                for (var k = handlers.length - 1; k >= 0; k -= 1) {
                    var handler = handlers[k];
                    if (listener && handler.listener === listener) {
                        el.removeEventListener(event, handler.proxyListener, capture);
                        handlers.splice(k, 1);
                    } else if (listener && handler.listener && handler.listener.dom7proxy && handler.listener.dom7proxy === listener) {
                        el.removeEventListener(event, handler.proxyListener, capture);
                        handlers.splice(k, 1);
                    } else if (!listener) {
                        el.removeEventListener(event, handler.proxyListener, capture);
                        handlers.splice(k, 1);
                    }
                }
            }
        }
    }
    return this;
}
$.fn.once = function() {
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var dom = this;
    var eventName = args[0];
    var targetSelector = args[1];
    var listener = args[2];
    var capture = args[3];
    if (typeof args[1] === 'function') {
        assign = args;
        eventName = assign[0];
        listener = assign[1];
        capture = assign[2];
        targetSelector = undefined;
    }
    function onceHandler() {
        var eventArgs = [], len = arguments.length;
        while ( len-- ) eventArgs[ len ] = arguments[ len ];

        listener.apply(this, eventArgs);
        dom.off(eventName, targetSelector, onceHandler, capture);
        if (onceHandler.dom7proxy) {
            delete onceHandler.dom7proxy;
        }
    }
    onceHandler.dom7proxy = listener;
    return dom.on(eventName, targetSelector, onceHandler, capture);
}
$.fn.trigger = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var events = args[0].split(' ');
    var eventData = args[1];
    for (var i = 0; i < events.length; i += 1) {
        var event = events[i];
        for (var j = 0; j < this.length; j += 1) {
            var el = this[j];
            var evt = (void 0);
            try {
                evt = new win.CustomEvent(event, {
                    detail: eventData,
                    bubbles: true,
                    cancelable: true,
                });
            } catch (e) {
                evt = doc.createEvent('Event');
                evt.initEvent(event, true, true);
                evt.detail = eventData;
            }
            // eslint-disable-next-line
            el.dom7EventData = args.filter(function (data, dataIndex) { return dataIndex > 0; });
            el.dispatchEvent(evt);
            el.dom7EventData = [];
            delete el.dom7EventData;
        }
    }
    return this;
}
const noTrigger = ('resize scroll').split(' ');
$.fn.eventShortcut = function (name) {
    var ref;
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
    if (typeof args[0] === 'undefined') {
        for (var i = 0; i < this.length; i += 1) {
            if (noTrigger.indexOf(name) < 0) {
                if (name in this[i]) { this[i][name](); }
                else {
                    $(this[i]).trigger(name);
                }
            }
        }
        return this;
    }
    return (ref = this).on.apply(ref, [ name ].concat( args ));
}
$.fn.click = function() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return this.eventShortcut.bind(this).apply(void 0, [ 'click' ].concat( args ));
}

$.fn.css = function(props, value) {
    var i;
    if (arguments.length === 1) {
        if (typeof props === 'string') {
            if (this[0]) { return win.getComputedStyle(this[0], null).getPropertyValue(props); }
        } else {
            for (i = 0; i < this.length; i += 1) {
                // eslint-disable-next-line
                for (var prop in props) {
                    this[i].style[prop] = props[prop];
                }
            }
            return this;
        }
    }
    if (arguments.length === 2 && typeof props === 'string') {
        for (i = 0; i < this.length; i += 1) {
            this[i].style[props] = value;
        }
        return this;
    }
    return this;
}
$.fn.width = function () {
    if (this[0] === win) {
        return win.innerWidth;
    }

    if (this.length > 0) {
        return parseFloat(this.css('width'));
    }

    return null;
}
$.fn.outerWidth = function outerWidth(includeMargins) {
    if (this.length > 0) {
        if (includeMargins) {
            // eslint-disable-next-line
            var styles = this.styles();
            return this[0].offsetWidth + parseFloat(styles.getPropertyValue('margin-right')) + parseFloat(styles.getPropertyValue('margin-left'));
        }
        return this[0].offsetWidth;
    }
    return null;
}
$.fn.height = function height() {
    if (this[0] === win) {
        return win.innerHeight;
    }

    if (this.length > 0) {
        return parseFloat(this.css('height'));
    }

    return null;
}
$.fn.styles = function() {
    if (this[0]) { return win.getComputedStyle(this[0], null); }
    return {};
}
$.fn.outerHeight = function outerHeight(includeMargins) {
    if (this.length > 0) {
        if (includeMargins) {
            // eslint-disable-next-line
            var styles = this.styles();
            return this[0].offsetHeight + parseFloat(styles.getPropertyValue('margin-top')) + parseFloat(styles.getPropertyValue('margin-bottom'));
        }
        return this[0].offsetHeight;
    }
    return null;
}
$.fn.offset = function offset() {
    if (this.length > 0) {
        var el = this[0];
        var box = el.getBoundingClientRect();
        var body = doc.body;
        var clientTop = el.clientTop || body.clientTop || 0;
        var clientLeft = el.clientLeft || body.clientLeft || 0;
        var scrollTop = el === win ? win.scrollY : el.scrollTop;
        var scrollLeft = el === win ? win.scrollX : el.scrollLeft;
        let left = (box.left + scrollLeft) - clientLeft;
        let right = body.offsetWidth - el.offsetWidth - left
        let top = (box.top + scrollTop) - clientTop;
        let bottom = body.offsetHeight - el.offsetHeight - top;
        return {
            top: top,
            left: left,
            right: right,
            width: el.offsetWidth,
            height: el.offsetHeight,
            bottom: bottom,
        };
    }

    return null;
}



export default $;
