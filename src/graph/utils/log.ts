
import $ from './dom'
const jsonLeftValuePadding = 30
const logConfig: any = {
    ___debug: true,
    __consoleDom: undefined
}
const __expandLogJson = function (s: any) {
    let el = $(s);

    let parent = el.parents('.json-pre')

    if (!parent[0].cMap) {
        parent[0].cMap = {};
        let d = parent.find('.json-icon')
        for (let i=0; i<d.length; ++i) {
            let k = d[i];
            let kl = $(k);
            kl.attr('data-slot', i);
        }
        for (let i=0; i<d.length; ++i) {
            let k = d[i];
            let kl = $(k);
            parent[0].cMap[i] = kl.next().children().clone();
        }
    }
    let next = el.next();
    if (el.hasClass('icon-add')) {
        el.removeClass('icon-add')
        el.addClass('icon-reduce')
        next.html(parent[0].cMap[el.attr('data-slot')]);
    } else {
        el.removeClass('icon-reduce')
        el.addClass('icon-add')
        if (el.hasClass('json-obj')) {
            next.html('<span class="json-e-obj">Object{...}</span>')
        } else {
            next.html(`<span class="json-e-obj">Array(${el.attr('data-count')})</span>`)
        }
    }
}

function log() {
    if (!logConfig.___debug) return;
    console.log(arguments);
    function arrayToHtml (array: any, left = 1, padding=false) {
        let span = document.createElement('span');
        span.classList.add('json-k1');
        span.style.paddingLeft = padding? (left-1)*jsonLeftValuePadding+'px':'';


        let p = `<span class="json-k1" style="padding-left: ${padding? (left-1)*jsonLeftValuePadding+'px':''}"></span>
             <i class="icon-reduce json-ary json-icon" data-count="${array.length}" onclick="window.__expandLogJson(this)"></i>
             <span class="json-block"><span class="json-k2">[</span><br/>`
        for (let i=0; i<array.length; ++i) {
            let value = array[i];
            p += `${jsonToHtml(value, left+1, true)}${i<array.length-1? ',':''}<br/>`
        }
        p += `<span class="json-k2" style="padding-left: ${(left-1) * jsonLeftValuePadding}px">]</span></span>`
        return p
    }
    function objectToHtml (json: any, left = 1, padding=false) {
        let p = `<span class="json-k1" style="padding-left: ${padding? (left-1)*jsonLeftValuePadding+'px':''}"></span><i class="icon-reduce json-obj json-icon"
           onclick="window.__expandLogJson(this)"></i><span class="json-block"><span class="json-k2">{</span><br/>`
        let keys = Object.keys(json);
        for (let i=0; i<keys.length; ++i) {
            let key = keys[i];
            p += `<span class="json-key" style="padding-left: ${left * jsonLeftValuePadding}px">"${key}"</span><span class="json-black">:</span>${jsonToHtml(json[key], left+1)}${i<keys.length-1? ',':''}<br/>`
        }
        p += `<span class="json-k2" style="padding-left: ${(left-1) * jsonLeftValuePadding}px">}</span></span>`
        return p
    }

    function jsonToHtml(json: any, left = 1, padding=false) {
        let result = ''
        if (json === null || json === undefined) {
            return `<span class="json-boolean" style="padding-left: ${padding? (left>1? left-1:1)*jsonLeftValuePadding+'px':''}">${json}</span>`
        }
        else if (Array.isArray(json)) {
            result += arrayToHtml(json, left, padding)
        } else if (typeof json === 'object') {
            result += objectToHtml(json, left, padding)
        } else if (typeof json === 'string') {
            return `<span class="json-string" style="padding-left: ${padding? (left>1? left-1:1)*jsonLeftValuePadding+'px':''}">"${json}"</span>`
        } else if (typeof json === 'number') {
            return `<span class="json-number" style="padding-left: ${padding? (left>1? left-1:1)*jsonLeftValuePadding+'px':''}">${json}</span>`
        } else {
            return `<span class="json-boolean" style="padding-left: ${padding? (left>1? left-1:1)*jsonLeftValuePadding+'px':''}">${json}</span>`
        }
        return result
    }

    function log(params: any) {
        const p = params;
        if (!logConfig.__consoleDom) {
            logConfig.__consoleDom = $('<div id="log-dom" class="log-dom"></div>');
            $(document.body).append(logConfig.__consoleDom);
            let buttonEl = $('<div id="log-button" class="log-button hide">' +
                '<div class="log-hide"><svg class="arrow-right" viewBox="0 0 1024 1024" width="200" height="200"><path fill="white" d="M300.303599 490.89725601c-0.486519 0.97303701-1.337926 1.824445-1.702815 2.79748199-8.514075 17.757928-5.716593 39.651265 9.365483 53.881934L651.69165 872.692719c18.730966 17.757928 48.28697 16.90652101 66.044898-1.824445 17.757928-18.730966 16.90652101-48.28697-1.824445-66.044898l-308.452785-291.789524L714.695807 216.987291c18.609336-17.87955801 19.095855-47.435562 1.216296-66.044898-9.122224-9.487112-21.406818-14.352298-33.569783-14.35229801-11.676446 0-23.352892 4.378667-32.353486 13.13600201l-340.563012 328.278418c-0.608148 0.608148-0.851408 1.58118501-1.581185 2.189334-0.486519 0.486519-0.973037 0.851408-1.581185 1.337926C303.46597 484.329255 302.128044 487.734885 300.303599 490.89725601L300.303599 490.89725601zM300.303599 490.89725601"></path></svg></div>' +
                '<div class="log-clear">Clear</div>' +
                '<div class="log-open">Console</div>' +
                '</div>');
            $(document.body).append(buttonEl)

            buttonEl.find('.log-open').click(function (e: any) {
                e.preventDefault();
                if (logConfig.__consoleDom?.hasClass('show')) {
                    logConfig.__consoleDom?.removeClass('show');
                } else {
                    logConfig.__consoleDom?.addClass('show');
                }
            });
            buttonEl.find('.log-clear').click(function (e: any) {
                e.preventDefault();
                logConfig.__consoleDom?.children().remove();
            });

            buttonEl.find('.log-hide').click(function (e: any) {
                e.preventDefault();
                if (!buttonEl.hasClass('hide')) {
                    buttonEl.addClass('hide');
                    logConfig.__consoleDom?.removeClass('show');
                }
                else {
                    buttonEl.removeClass('hide');
                }
            });
        }
        for (let i=0; i<p.length; ++i) {
            let data = p[i];
            const row = jsonToHtml(data);
            let child = $('<div class="log-children json-pre"></div>');
            child.append(row);
            logConfig.__consoleDom?.append(child)
        }
    }
    log(arguments)
}

export default log;