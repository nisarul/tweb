(this.webpackJsonp=this.webpackJsonp||[]).push([[2],{102:function(e,t,s){e.exports=function(){return new Worker(s.p+"08dbea6d69b46bc45e6e.worker.js")}},103:function(e,t,s){e.exports=function(){return new Worker(s.p+"ff7d5ff35b6de9888629.worker.js")}},12:function(e,t,s){"use strict";var r=s(102),n=s.n(r),i=s(17),a=s(64);var o=s(22),l=s(9),h=s(88),c=s(10),d=s(41),g=s(37);class u extends g.a{constructor(e,t,s){super(),this.dcId=e,this.url=t,this.debug=d.a.debug&&!1,this.handleOpen=()=>{this.log("opened"),this.debug&&this.log.debug("sending init packet"),this.dispatchEvent("open")},this.handleError=e=>{this.log.error("handleError",e),this.close()},this.handleClose=()=>{this.log("closed"),this.removeListeners(),this.dispatchEvent("close")},this.handleMessage=e=>{this.debug&&this.log.debug("<-","handleMessage",e.data.byteLength),this.dispatchEvent("message",e.data)},this.send=e=>{this.debug&&this.log.debug("-> body length to send:",e.length),this.ws.send(e)};let r=o.a.Error|o.a.Log;return this.debug&&(r|=o.a.Debug),this.log=Object(o.b)("WS-"+e+s,r),this.log("constructor"),this.connect(),this}removeListeners(){this.ws&&(this.ws.removeEventListener("open",this.handleOpen),this.ws.removeEventListener("close",this.handleClose),this.ws.removeEventListener("error",this.handleError),this.ws.removeEventListener("message",this.handleMessage),this.ws=void 0)}connect(){this.ws=new WebSocket(this.url,"binary"),this.ws.binaryType="arraybuffer",this.ws.addEventListener("open",this.handleOpen),this.ws.addEventListener("close",this.handleClose),this.ws.addEventListener("error",this.handleError),this.ws.addEventListener("message",this.handleMessage)}close(){if(this.ws){this.log.error("close execution");try{this.ws.close()}catch(e){}this.handleClose()}}}var p=s(101);const f=new class extends class{sha1Hash(e){return this.performTaskWorker("sha1-hash",e)}sha256Hash(e){return this.performTaskWorker("sha256-hash",e)}pbkdf2(e,t,s){return this.performTaskWorker("pbkdf2",e,t,s)}aesEncrypt(e,t,s){return this.performTaskWorker("aes-encrypt",Object(a.f)(e),Object(a.f)(t),Object(a.f)(s))}aesDecrypt(e,t,s){return this.performTaskWorker("aes-decrypt",e,t,s).then(e=>Object(a.f)(e))}rsaEncrypt(e,t){return this.performTaskWorker("rsa-encrypt",e,t)}factorize(e){return this.performTaskWorker("factorize",[...e])}modPow(e,t,s){return this.performTaskWorker("mod-pow",e,t,s)}gzipUncompress(e,t){return this.performTaskWorker("gzipUncompress",e,t)}computeSRP(e,t,s=!1){return this.performTaskWorker("computeSRP",e,t,s)}}{constructor(){super(),this.afterMessageIdTemp=0,this.taskId=0,this.awaiting={},this.pending=[],this.updatesProcessor=null,this.log=Object(o.b)("API-PROXY"),this.hashes={},this.apiPromisesSingle={},this.apiPromisesCacheable={},this.isSWRegistered=!0,this.debug=c.b,this.sockets=new Map,this.taskListeners={},this.onWorkerMessage=e=>{const t=e.data;if(!Object(i.f)(t))return;const s=this.taskListeners[t.type];s?s(t):t.update?this.updatesProcessor&&this.updatesProcessor(t.update):t.progress?l.default.broadcast("download_progress",t.progress):(t.hasOwnProperty("result")||t.hasOwnProperty("error"))&&this.finalizeTask(t.taskId,t.result,t.error)},this.log("constructor"),this.registerServiceWorker(),this.addTaskListener("clear",()=>{p.a.deleteDatabase().finally(()=>{location.reload()})}),this.addTaskListener("connectionStatusChange",e=>{l.default.broadcast("connection_status_change",e.payload)}),this.addTaskListener("convertWebp",e=>{h.a.postMessage(e)}),this.addTaskListener("socketProxy",e=>{const t=e.payload,s=t.id;if("send"===t.type){this.sockets.get(s).send(t.payload)}else if("close"===t.type){this.sockets.get(s).close()}else if("setup"===t.type){const e=new u(t.payload.dcId,t.payload.url,t.payload.logSuffix),r=()=>{this.postMessage({type:"socketProxy",payload:{type:"open",id:s}})},n=()=>{this.postMessage({type:"socketProxy",payload:{type:"close",id:s}}),e.removeEventListener("open",r),e.removeEventListener("close",n),e.removeEventListener("message",i),this.sockets.delete(s)},i=e=>{this.postMessage({type:"socketProxy",payload:{type:"message",id:s,payload:e}})};e.addEventListener("open",r),e.addEventListener("close",n),e.addEventListener("message",i),this.sockets.set(s,e)}}),this.registerWorker()}isServiceWorkerOnline(){return this.isSWRegistered}registerServiceWorker(){if(!("serviceWorker"in navigator))return;const e=navigator.serviceWorker;e.register("./sw.js",{scope:"./"}).then(e=>{this.log("SW registered",e),this.isSWRegistered=!0;(e.installing||e.waiting||e.active).addEventListener("statechange",e=>{this.log("SW statechange",e)})},e=>{this.isSWRegistered=!1,this.log.error("SW registration failed!",e),this.onServiceWorkerFail&&this.onServiceWorkerFail()}),e.addEventListener("controllerchange",()=>{this.log.warn("controllerchange"),this.releasePending(),e.controller.addEventListener("error",e=>{this.log.error("controller error:",e)})}),e.addEventListener("message",e=>{const t=e.data;Object(i.f)(t)&&this.postMessage(t)}),e.addEventListener("messageerror",e=>{this.log.error("SW messageerror:",e)})}onWorkerFirstMessage(e){if(!this.worker){this.worker=e,this.log("set webWorker"),this.postMessage=this.worker.postMessage.bind(this.worker);const t=h.a.isWebpSupported();this.log("WebP supported:",t),this.postMessage({type:"webpSupport",payload:t}),this.releasePending()}}addTaskListener(e,t){this.taskListeners[e]=t}registerWorker(){const e=new n.a;e.addEventListener("message",this.onWorkerFirstMessage.bind(this,e),{once:!0}),e.addEventListener("message",this.onWorkerMessage),e.addEventListener("error",e=>{this.log.error("WORKER ERROR",e)})}finalizeTask(e,t,s){const r=this.awaiting[e];void 0!==r&&(this.debug&&this.log.debug("done",r.taskName,t,s),s?r.reject(s):r.resolve(t),delete this.awaiting[e])}performTaskWorker(e,...t){return this.debug&&this.log.debug("start",e,t),new Promise((s,r)=>{this.awaiting[this.taskId]={resolve:s,reject:r,taskName:e};const n={task:e,taskId:this.taskId,args:t};this.pending.push(n),this.releasePending(),this.taskId++})}releasePending(){this.postMessage&&(this.debug&&this.log.debug("releasing tasks, length:",this.pending.length),this.pending.forEach(e=>{this.postMessage(e)}),this.debug&&this.log.debug("released tasks"),this.pending.length=0)}setUpdatesProcessor(e){this.updatesProcessor=e}invokeApi(e,t={},s={}){return this.performTaskWorker("invokeApi",e,t,s)}invokeApiAfter(e,t={},s={}){let r=s;return r.prepareTempMessageId=""+ ++this.afterMessageIdTemp,r=Object.assign({},s),s.messageId=r.prepareTempMessageId,this.invokeApi(e,t,r)}invokeApiHashable(e,t={},s={}){const r=JSON.stringify(t);let n;return this.hashes[e]&&(n=this.hashes[e][r],n&&(t.hash=n.hash)),this.invokeApi(e,t,s).then(t=>{if(t._.includes("NotModified"))return this.debug&&this.log.warn("NotModified saved!",e,r),n.result;if(t.hash){const s=t.hash;this.hashes[e]||(this.hashes[e]={}),this.hashes[e][r]={hash:s,result:t}}return t})}invokeApiSingle(e,t={},s={}){const r=e+"-"+JSON.stringify(t);return this.apiPromisesSingle[r]?this.apiPromisesSingle[r]:this.apiPromisesSingle[r]=this.invokeApi(e,t,s).finally(()=>{delete this.apiPromisesSingle[r]})}invokeApiCacheable(e,t={},s={}){var r;const n=null!==(r=this.apiPromisesCacheable[e])&&void 0!==r?r:this.apiPromisesCacheable[e]={},i=JSON.stringify(t),a=n[i];if(a&&(!s.override||!a.fulfilled))return a.promise;let o;s.override&&(a&&a.timeout&&(clearTimeout(a.timeout),delete a.timeout),delete s.override),s.cacheSeconds&&(o=window.setTimeout(()=>{delete n[i]},1e3*s.cacheSeconds),delete s.cacheSeconds);const l=this.invokeApi(e,t,s);return n[i]={timestamp:Date.now(),fulfilled:!1,timeout:o,promise:l,params:t},l}clearCache(e,t){const s=this.apiPromisesCacheable[e];if(s)for(const e in s){const r=s[e];t(r.params)&&(r.timeout&&clearTimeout(r.timeout),delete s[e])}}setBaseDcId(e){return this.performTaskWorker("setBaseDcId",e)}setQueueId(e){return this.performTaskWorker("setQueueId",e)}setUserAuth(e){return l.default.broadcast("user_auth",e),this.performTaskWorker("setUserAuth",e)}getNetworker(e,t){return this.performTaskWorker("getNetworker",e,t)}logOut(){return this.performTaskWorker("logOut")}cancelDownload(e){return this.performTaskWorker("cancelDownload",e)}downloadFile(e){return this.performTaskWorker("downloadFile",e)}uploadFile(e){return this.performTaskWorker("uploadFile",e)}toggleStorage(e){return this.performTaskWorker("toggleStorage",e)}};c.a.apiManagerProxy=f;t.a=f},64:function(e,t,s){"use strict";function r(e){e=e||[];let t=[];for(let s=0;s<e.length;++s)t.push((e[s]<16?"0":"")+(e[s]||0).toString(16));return t.join("")}function n(e){const t=e.length;let s=0,r=[];t%2&&(r.push(parseInt(e.charAt(0),16)),++s);for(let n=s;n<t;n+=2)r.push(parseInt(e.substr(n,2),16));return r}function i(e){let t,s="";for(let r=e.length,n=0,i=0;i<r;++i)t=i%3,n|=e[i]<<(16>>>t&24),2!==t&&r-i!=1||(s+=String.fromCharCode(a(n>>>18&63),a(n>>>12&63),a(n>>>6&63),a(63&n)),n=0);return s.replace(/A(?=A$|$)/g,"=")}function a(e){return e<26?e+65:e<52?e+71:e<62?e-4:62===e?43:63===e?47:65}function o(e,t){const s=e.length;if(s!==t.length)return!1;for(let r=0;r<s;++r)if(e[r]!==t[r])return!1;return!0}function l(e){return e instanceof ArrayBuffer?e:void 0!==e.buffer&&e.buffer.byteLength===e.length*e.BYTES_PER_ELEMENT?e.buffer:new Uint8Array(e).buffer}function h(...e){let t=0;e.forEach(e=>t+=e.byteLength||e.length);const s=new Uint8Array(t);let r=0;return e.forEach(e=>{s.set(e instanceof ArrayBuffer?new Uint8Array(e):e,r),r+=e.byteLength||e.length}),s}s.d(t,"e",(function(){return r})),s.d(t,"c",(function(){return n})),s.d(t,"d",(function(){return i})),s.d(t,"b",(function(){return o})),s.d(t,"f",(function(){return l})),s.d(t,"a",(function(){return h}))},8:function(e,t,s){"use strict";s.r(t),s.d(t,"langPack",(function(){return c})),s.d(t,"I18n",(function(){return d})),s.d(t,"i18n",(function(){return g})),s.d(t,"i18n_",(function(){return u})),s.d(t,"_i18n",(function(){return p})),s.d(t,"join",(function(){return f}));var r=s(10),n=s(17),i=s(55),a=s(12),o=s(42),l=s(2),h=s(9);const c={messageActionChatCreate:"ActionCreateGroup",messageActionChatEditTitle:"ActionChangedTitle",messageActionChatEditPhoto:"ActionChangedPhoto",messageActionChatEditVideo:"ActionChangedVideo",messageActionChatDeletePhoto:"ActionRemovedPhoto",messageActionChatReturn:"ActionAddUserSelf",messageActionChatReturnYou:"ActionAddUserSelfYou",messageActionChatJoined:"ActionAddUserSelfMega",messageActionChatJoinedYou:"ChannelMegaJoined",messageActionChatAddUser:"ActionAddUser",messageActionChatAddUsers:"ActionAddUser",messageActionChatLeave:"ActionLeftUser",messageActionChatDeleteUser:"ActionKickUser",messageActionChatJoinedByLink:"ActionInviteUser",messageActionPinMessage:"ActionPinnedNoText",messageActionContactSignUp:"Chat.Service.PeerJoinedTelegram",messageActionChannelCreate:"ActionCreateChannel",messageActionChannelEditTitle:"Chat.Service.Channel.UpdatedTitle",messageActionChannelEditPhoto:"Chat.Service.Channel.UpdatedPhoto",messageActionChannelEditVideo:"Chat.Service.Channel.UpdatedVideo",messageActionChannelDeletePhoto:"Chat.Service.Channel.RemovedPhoto",messageActionHistoryClear:"HistoryCleared",messageActionChannelMigrateFrom:"ActionMigrateFromGroup","messageActionPhoneCall.in_ok":"ChatList.Service.Call.incoming","messageActionPhoneCall.out_ok":"ChatList.Service.Call.outgoing","messageActionPhoneCall.in_missed":"ChatList.Service.Call.Missed","messageActionPhoneCall.out_missed":"ChatList.Service.Call.Cancelled",messageActionBotAllowed:"Chat.Service.BotPermissionAllowed"};var d;!function(e){let t,c;function d(){const t=l.a.langPackCode;return e.lastRequestedLangCode=t,Promise.all([s.e(7).then(s.bind(null,99)),s.e(8).then(s.bind(null,100))]).then(([e,s])=>{const r=[];u(e.default,r),u(s.default,r);return f({_:"langPackDifference",from_version:0,lang_code:t,strings:r,version:0,local:!0})})}function g(t){return e.requestedServerLanguage=!0,Promise.all([a.a.invokeApiCacheable("langpack.getLangPack",{lang_code:t,lang_pack:l.a.langPack}),a.a.invokeApiCacheable("langpack.getLangPack",{lang_code:t,lang_pack:"android"}),s.e(7).then(s.bind(null,99)),s.e(8).then(s.bind(null,100)),e.polyfillPromise])}function u(e,t=[]){for(const s in e){const r=e[s];"string"==typeof r?t.push({_:"langPackString",key:s,value:r}):t.push(Object.assign({_:"langPackStringPluralized",key:s},r))}return t}function p(t){return e.lastRequestedLangCode=t,g(t).then(([e,t,s,r,n])=>{let i=[];[s,r].forEach(e=>{u(e.default,i)}),i=i.concat(e.strings);for(const e of t.strings)i.push(e);return e.strings=i,f(e)})}function f(e){return e.appVersion=l.a.langPackVersion,o.a.set({langPack:e}).then(()=>(m(e),e))}function m(s){if(s.lang_code!==e.lastRequestedLangCode)return;t=new Intl.PluralRules(s.lang_code),e.strings.clear();for(const t of s.strings)e.strings.set(t.key,t);h.default.broadcast("language_change");Array.from(document.querySelectorAll(".i18n")).forEach(t=>{const s=e.weakMap.get(t);s&&s.update()})}function k(e,t,s={i:0}){let r=[];let n=0;return e.replace(/(\*\*)(.+?)\1|(\n)|un\d|%\d\$.|%./g,(e,i,a,o,l,h)=>{if(r.push(h.slice(n,l)),i)switch(i){case"**":{const e=document.createElement("b");e.append(...k(a,t,s)),r.push(e);break}}else o?r.push(document.createElement("br")):t&&r.push(t[s.i++]);return n=l+e.length,""}),n!==e.length&&r.push(e.slice(n)),r}function v(s,r=!1,n){const i=e.strings.get(s);let a;if(i)if("langPackStringPluralized"===i._&&(null==n?void 0:n.length)){let e=n[0];"string"==typeof e&&(e=+e.replace(/\D/g,""));a=i[t.select(e)+"_value"]||i.other_value}else a="langPackString"===i._?i.value:s;else a=s;if(r){if(null==n?void 0:n.length){const e=/un\d|%\d\$.|%./g;let t=0;a=a.replace(e,(e,s,r)=>""+n[t++])}return a}return k(a,n)}e.strings=new Map,e.requestedServerLanguage=!1,e.getCacheLangPack=function(){return c||(c=Promise.all([o.a.get("langPack"),e.polyfillPromise]).then(([t])=>t?(r.b,e.lastRequestedLangCode||(e.lastRequestedLangCode=t.lang_code),m(t),t):d()).finally(()=>{c=void 0}))},e.loadLocalLangPack=d,e.loadLangPack=g,e.getStrings=function(e,t){return a.a.invokeApi("langpack.getStrings",{lang_pack:l.a.langPack,lang_code:e,keys:t})},e.formatLocalStrings=u,e.getLangPack=p,e.saveLangPack=f,e.polyfillPromise="undefined"!=typeof Intl&&void 0!==Intl.PluralRules?Promise.resolve():s.e(25).then(s.bind(null,104)).then(e=>{window.Intl=Object.assign("undefined"!=typeof Intl?Intl:{},e.default)}),e.applyLangPack=m,e.superFormatter=k,e.format=v,e.weakMap=new WeakMap;class b{constructor(t){this.property="innerHTML",this.element=t.element||document.createElement("span"),this.element.classList.add("i18n"),this.update(t),e.weakMap.set(this.element,this)}}class y extends b{update(e){if(Object(n.g)(this,e),"innerHTML"===this.property)this.element.textContent="",this.element.append(...v(this.key,!1,this.args));else{const e=this.element[this.property],t=v(this.key,!0,this.args);void 0===e?this.element.dataset[this.property]=t:this.element[this.property]=t}}}e.IntlElement=y;e.IntlDateElement=class extends b{update(t){Object(n.g)(this,t);const s=new Intl.DateTimeFormat(e.lastRequestedLangCode+"-u-hc-h23",this.options);this.element[this.property]=Object(i.a)(s.format(this.date))}},e.i18n=function(e,t){return new y({key:e,args:t}).element},e.i18n_=function(e){return new y(e).element},e._i18n=function(e,t,s,r){return new y({element:e,key:t,args:s,property:r}).element}}(d||(d={})),t.default=d;const g=d.i18n,u=d.i18n_,p=d._i18n;function f(e,t=!0){const s=e.slice(0,1);for(let r=1;r<e.length;++r){const n=e.length-1===r&&t?"WordDelimiterLast":"WordDelimiter";s.push(g(n)),s.push(e[r])}return s}r.a.I18n=d},88:function(e,t,s){"use strict";var r=s(103),n=s.n(r),i=s(10),a=s(21),o=s(12);const l=new class{constructor(){this.convertPromises={}}init(){this.worker=new n.a,this.worker.addEventListener("message",e=>{const t=e.data.payload;if(0===t.fileName.indexOf("main-")){const e=this.convertPromises[t.fileName];e&&(t.bytes?e.resolve(t.bytes):e.reject(),delete this.convertPromises[t.fileName])}else o.a.postMessage(e.data)})}postMessage(e){this.init&&(this.init(),this.init=null),this.worker.postMessage(e)}isWebpSupported(){return void 0===this.isWebpSupportedCache&&(this.isWebpSupportedCache=document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp")),this.isWebpSupportedCache}convert(e,t){if(e="main-"+e,this.convertPromises.hasOwnProperty(e))return this.convertPromises[e];const s=Object(a.a)();return this.postMessage({type:"convertWebp",payload:{fileName:e,bytes:t}}),this.convertPromises[e]=s}};i.a.webpWorkerController=l,t.a=l}}]);
//# sourceMappingURL=2.f7f1fe3c2ce5b1113525.chunk.js.map