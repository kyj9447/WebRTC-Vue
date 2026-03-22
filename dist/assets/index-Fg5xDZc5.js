(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();/*! Capacitor: https://capacitorjs.com/ - MIT License */var P;(function(t){t.Unimplemented="UNIMPLEMENTED",t.Unavailable="UNAVAILABLE"})(P||(P={}));class F extends Error{constructor(e,n,r){super(e),this.message=e,this.code=n,this.data=r}}const Se=t=>{var e,n;return t!=null&&t.androidBridge?"android":!((n=(e=t==null?void 0:t.webkit)===null||e===void 0?void 0:e.messageHandlers)===null||n===void 0)&&n.bridge?"ios":"web"},Ce=t=>{const e=t.CapacitorCustomPlatform||null,n=t.Capacitor||{},r=n.Plugins=n.Plugins||{},o=()=>e!==null?e.name:Se(t),s=()=>o()!=="web",i=u=>{const f=b.get(u);return!!(f!=null&&f.platforms.has(o())||a(u))},a=u=>{var f;return(f=n.PluginHeaders)===null||f===void 0?void 0:f.find(q=>q.name===u)},d=u=>t.console.error(u),b=new Map,T=(u,f={})=>{const q=b.get(u);if(q)return console.warn(`Capacitor plugin "${u}" already registered. Cannot register plugins twice.`),q.proxy;const R=o(),L=a(u);let w;const be=async()=>(!w&&R in f?w=typeof f[R]=="function"?w=await f[R]():w=f[R]:e!==null&&!w&&"web"in f&&(w=typeof f.web=="function"?w=await f.web():w=f.web),w),we=(m,h)=>{var p,S;if(L){const C=L==null?void 0:L.methods.find(y=>h===y.name);if(C)return C.rtype==="promise"?y=>n.nativePromise(u,h.toString(),y):(y,O)=>n.nativeCallback(u,h.toString(),y,O);if(m)return(p=m[h])===null||p===void 0?void 0:p.bind(m)}else{if(m)return(S=m[h])===null||S===void 0?void 0:S.bind(m);throw new F(`"${u}" plugin is not implemented on ${R}`,P.Unimplemented)}},H=m=>{let h;const p=(...S)=>{const C=be().then(y=>{const O=we(y,m);if(O){const $=O(...S);return h=$==null?void 0:$.remove,$}else throw new F(`"${u}.${m}()" is not implemented on ${R}`,P.Unimplemented)});return m==="addListener"&&(C.remove=async()=>h()),C};return p.toString=()=>`${m.toString()}() { [capacitor code] }`,Object.defineProperty(p,"name",{value:m,writable:!1,configurable:!1}),p},G=H("addListener"),Q=H("removeListener"),ve=(m,h)=>{const p=G({eventName:m},h),S=async()=>{const y=await p;Q({eventName:m,callbackId:y},h)},C=new Promise(y=>p.then(()=>y({remove:S})));return C.remove=async()=>{console.warn("Using addListener() without 'await' is deprecated."),await S()},C},V=new Proxy({},{get(m,h){switch(h){case"$$typeof":return;case"toJSON":return()=>({});case"addListener":return L?ve:G;case"removeListener":return Q;default:return H(h)}}});return r[u]=V,b.set(u,{name:u,proxy:V,platforms:new Set([...Object.keys(f),...L?[R]:[]])}),V};return n.convertFileSrc||(n.convertFileSrc=u=>u),n.getPlatform=o,n.handleError=d,n.isNativePlatform=s,n.isPluginAvailable=i,n.registerPlugin=T,n.Exception=F,n.DEBUG=!!n.DEBUG,n.isLoggingEnabled=!!n.isLoggingEnabled,n},xe=t=>t.Capacitor=Ce(t),A=xe(typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{}),z=A.registerPlugin;class _{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(e,n){let r=!1;this.listeners[e]||(this.listeners[e]=[],r=!0),this.listeners[e].push(n);const s=this.windowListeners[e];s&&!s.registered&&this.addWindowListener(s),r&&this.sendRetainedArgumentsForEvent(e);const i=async()=>this.removeListener(e,n);return Promise.resolve({remove:i})}async removeAllListeners(){this.listeners={};for(const e in this.windowListeners)this.removeWindowListener(this.windowListeners[e]);this.windowListeners={}}notifyListeners(e,n,r){const o=this.listeners[e];if(!o){if(r){let s=this.retainedEventArguments[e];s||(s=[]),s.push(n),this.retainedEventArguments[e]=s}return}o.forEach(s=>s(n))}hasListeners(e){var n;return!!(!((n=this.listeners[e])===null||n===void 0)&&n.length)}registerWindowListener(e,n){this.windowListeners[n]={registered:!1,windowEventName:e,pluginEventName:n,handler:r=>{this.notifyListeners(n,r)}}}unimplemented(e="not implemented"){return new A.Exception(e,P.Unimplemented)}unavailable(e="not available"){return new A.Exception(e,P.Unavailable)}async removeListener(e,n){const r=this.listeners[e];if(!r)return;const o=r.indexOf(n);this.listeners[e].splice(o,1),this.listeners[e].length||this.removeWindowListener(this.windowListeners[e])}addWindowListener(e){window.addEventListener(e.windowEventName,e.handler),e.registered=!0}removeWindowListener(e){e&&(window.removeEventListener(e.windowEventName,e.handler),e.registered=!1)}sendRetainedArgumentsForEvent(e){const n=this.retainedEventArguments[e];n&&(delete this.retainedEventArguments[e],n.forEach(r=>{this.notifyListeners(e,r)}))}}const X=t=>encodeURIComponent(t).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),Y=t=>t.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent);class Re extends _{async getCookies(){const e=document.cookie,n={};return e.split(";").forEach(r=>{if(r.length<=0)return;let[o,s]=r.replace(/=/,"CAP_COOKIE").split("CAP_COOKIE");o=Y(o).trim(),s=Y(s).trim(),n[o]=s}),n}async setCookie(e){try{const n=X(e.key),r=X(e.value),o=e.expires?`; expires=${e.expires.replace("expires=","")}`:"",s=(e.path||"/").replace("path=",""),i=e.url!=null&&e.url.length>0?`domain=${e.url}`:"";document.cookie=`${n}=${r||""}${o}; path=${s}; ${i};`}catch(n){return Promise.reject(n)}}async deleteCookie(e){try{document.cookie=`${e.key}=; Max-Age=0`}catch(n){return Promise.reject(n)}}async clearCookies(){try{const e=document.cookie.split(";")||[];for(const n of e)document.cookie=n.replace(/^ +/,"").replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(e){return Promise.reject(e)}}async clearAllCookies(){try{await this.clearCookies()}catch(e){return Promise.reject(e)}}}z("CapacitorCookies",{web:()=>new Re});const Le=async t=>new Promise((e,n)=>{const r=new FileReader;r.onload=()=>{const o=r.result;e(o.indexOf(",")>=0?o.split(",")[1]:o)},r.onerror=o=>n(o),r.readAsDataURL(t)}),ke=(t={})=>{const e=Object.keys(t);return Object.keys(t).map(o=>o.toLocaleLowerCase()).reduce((o,s,i)=>(o[s]=t[e[i]],o),{})},Pe=(t,e=!0)=>t?Object.entries(t).reduce((r,o)=>{const[s,i]=o;let a,d;return Array.isArray(i)?(d="",i.forEach(b=>{a=e?encodeURIComponent(b):b,d+=`${s}=${a}&`}),d.slice(0,-1)):(a=e?encodeURIComponent(i):i,d=`${s}=${a}`),`${r}&${d}`},"").substr(1):null,Ee=(t,e={})=>{const n=Object.assign({method:t.method||"GET",headers:t.headers},e),o=ke(t.headers)["content-type"]||"";if(typeof t.data=="string")n.body=t.data;else if(o.includes("application/x-www-form-urlencoded")){const s=new URLSearchParams;for(const[i,a]of Object.entries(t.data||{}))s.set(i,a);n.body=s.toString()}else if(o.includes("multipart/form-data")||t.data instanceof FormData){const s=new FormData;if(t.data instanceof FormData)t.data.forEach((a,d)=>{s.append(d,a)});else for(const a of Object.keys(t.data))s.append(a,t.data[a]);n.body=s;const i=new Headers(n.headers);i.delete("content-type"),n.headers=i}else(o.includes("application/json")||typeof t.data=="object")&&(n.body=JSON.stringify(t.data));return n};class Ie extends _{async request(e){const n=Ee(e,e.webFetchExtra),r=Pe(e.params,e.shouldEncodeUrlParams),o=r?`${e.url}?${r}`:e.url,s=await fetch(o,n),i=s.headers.get("content-type")||"";let{responseType:a="text"}=s.ok?e:{};i.includes("application/json")&&(a="json");let d,b;switch(a){case"arraybuffer":case"blob":b=await s.blob(),d=await Le(b);break;case"json":d=await s.json();break;case"document":case"text":default:d=await s.text()}const T={};return s.headers.forEach((u,f)=>{T[f]=u}),{data:d,headers:T,status:s.status,url:s.url}}async get(e){return this.request(Object.assign(Object.assign({},e),{method:"GET"}))}async post(e){return this.request(Object.assign(Object.assign({},e),{method:"POST"}))}async put(e){return this.request(Object.assign(Object.assign({},e),{method:"PUT"}))}async patch(e){return this.request(Object.assign(Object.assign({},e),{method:"PATCH"}))}async delete(e){return this.request(Object.assign(Object.assign({},e),{method:"DELETE"}))}}z("CapacitorHttp",{web:()=>new Ie});var Z;(function(t){t.Dark="DARK",t.Light="LIGHT",t.Default="DEFAULT"})(Z||(Z={}));var ee;(function(t){t.StatusBar="StatusBar",t.NavigationBar="NavigationBar"})(ee||(ee={}));class Te extends _{async setStyle(){this.unavailable("not available for web")}async setAnimation(){this.unavailable("not available for web")}async show(){this.unavailable("not available for web")}async hide(){this.unavailable("not available for web")}}z("SystemBars",{web:()=>new Te});const c={currentView:"ChatLogin",myStream:null,myTracks:[],remoteStreams:[],mySessionId:"",myRoomrequest:"",myUsername:"",isDesktop:window.innerWidth/window.innerHeight>1,chatList:[],notifications:[],lockedRoomrequest:!1,mediaAccessError:!1},N=new Set;function g(){N.forEach(t=>t(c))}function v(){return c}function qe(t){return N.add(t),()=>{N.delete(t)}}function J(t){c.currentView=t,g()}function Oe(t){c.isDesktop=t,g()}function $e(t){c.myStream=t,c.myTracks=t?t.getTracks():[],g()}function te(t){c.mediaAccessError=t,g()}function Ue(t){c.mySessionId=t,g()}function B(t,e=!1){c.myRoomrequest=t,c.lockedRoomrequest=e,g()}function De(t){c.myUsername=t,g()}function je(t){const e=c.remoteStreams.findIndex(n=>n.id===t.id);e===-1?c.remoteStreams=[...c.remoteStreams,t]:c.remoteStreams=c.remoteStreams.map((n,r)=>r===e?t:n),g()}function ue(t){c.remoteStreams=c.remoteStreams.filter(e=>e.id!==t),g()}function E(t){c.chatList=[...c.chatList,t],g()}function M(t){c.notifications=[...c.notifications,t],g(),setTimeout(()=>{c.notifications=c.notifications.slice(1),g()},3e3)}function Ae(){const t=window.location.pathname.replace(/^\/+|\/+$/g,"");return{roomNumber:t===""?null:decodeURIComponent(t)}}function Be(){const e=new URLSearchParams(window.location.search).get("roomrequest");return e!==null&&e!==""?e:Ae().roomNumber}function Me(t){window.addEventListener("popstate",()=>{t()})}function We(t){return`${window.location.origin}?roomrequest=${encodeURIComponent(t)}`}const He={iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"turn:undefined:3478",username:"kyj9447",credential:"kyj0407"}]};let k=null,ne=!1;const x=[],fe=[];class re{constructor(e,n){this.sessionId=e,this.username=n,this.RTCPeer=new RTCPeerConnection(He),this.dataChannel=this.RTCPeer.createDataChannel("chat"),this.dataChannel.onopen=()=>console.log("Data channel is open!"),this.dataChannel.onclose=()=>console.log("Data channel is closed!"),this.dataChannel.onmessage=r=>Xe(r),this.inboundStream=null,this.RTCPeer.onnegotiationneeded=()=>Ne(this),this.RTCPeer.oniceconnectionstatechange=()=>Je(this),this.RTCPeer.ontrack=r=>ze(r,this),this.RTCPeer.onicecandidate=r=>_e(r,this),this.RTCPeer.ondatachannel=r=>{console.log("Data channel is created!"),fe.push(r.channel)}}}function K(){return k&&k.readyState!==WebSocket.CLOSED||(k=new WebSocket("wss://undefined:9443"),k.onmessage=Ge),k}function Ve(){navigator.mediaDevices.getUserMedia({video:{width:320,height:240,frameRate:30},audio:!0}).then(t=>{$e(t),te(!1)}).catch(t=>{console.log("An error occurred: "+t),alert(`카메라, 혹은 마이크 연결에 실패했습니다! 
 확인 후 재접속 해주세요`),te(!0)})}function Fe(){K(),!ne&&(ne=!0,Ve())}function oe(){const t=Be();if(t!==null){B(t,!0);return}B("",!1)}const Ne=t=>{t.RTCPeer&&t.RTCPeer.createOffer().then(e=>(t.RTCPeer.setLocalDescription(new RTCSessionDescription(e)),e)).then(e=>{const n=v(),r=n.mySessionId,o=n.myUsername;I("offer",r,t.sessionId,e,o)})},Je=t=>{if(console.log("!!!oniceconnectionstatechange!!!"),t.RTCPeer&&console.log(t.RTCPeer.iceConnectionState),t.RTCPeer.iceConnectionState==="disconnected"){const e="false,"+t.username+"님이 로그아웃하였습니다 (disconnected)";E(e),M(e),ue(t.sessionId);const n=x.findIndex(r=>r.sessionId===t.sessionId);if(n!==-1){const r=x.splice(n,1)[0];me(r)}}},ze=(t,e)=>{t.streams&&t.streams[0]?se(e.sessionId,t.streams[0],e.username):(e.inboundStream===null&&(e.inboundStream=new MediaStream),e.inboundStream.addTrack(t.track),se(e.sessionId,e.inboundStream,e.username))},_e=(t,e)=>{if(t.candidate!==null){const n=v().mySessionId;I("candidate",n,e.sessionId,t.candidate)}};function Ke(t){t.preventDefault(),K();const e=document.getElementById("roomrequest"),n=document.getElementById("username"),r=e?e.value:"",o=n?n.value:"";B(r,v().lockedRoomrequest),De(o),I("login","","",{roomrequest:r,username:o})}function Ge(t){const e=JSON.parse(t.data);if(e.type==="offer"){const n=new re(e.from,e.username);x.push(n),console.log("offer 받음 : "+JSON.stringify(e.data));const r=v(),o=r.myTracks,s=r.myStream,i=r.mySessionId;for(const a of o)s&&n.RTCPeer&&n.RTCPeer.addTrack(a,s);n.RTCPeer.setRemoteDescription(new RTCSessionDescription(e.data)).then(()=>n.RTCPeer.createAnswer()).then(a=>(n.RTCPeer.setLocalDescription(new RTCSessionDescription(a)),a)).then(a=>{I("answer",i,e.from,a)})}else if(e.type==="answer"){const n=x.find(r=>r.sessionId===e.from);n&&n.RTCPeer.setRemoteDescription(new RTCSessionDescription(e.data))}else if(e.type==="candidate"){const n=x.find(r=>r.sessionId===e.from);n&&n.RTCPeer.addIceCandidate(new RTCIceCandidate(e.data))}else if(e.type==="login"){const n="false,"+e.data.username+"님이 로그인하였습니다";E(n),M(n);const r=new re(e.from,e.data.username),o=v(),s=o.myTracks,i=o.myStream;for(const a of s)i&&r.RTCPeer.addTrack(a,i);x.push(r)}else if(e.type==="logout"){const n="false,"+e.data.username+"님이 로그아웃하였습니다 (logout)";E(n),M(n),ue(e.data.sessionId);const r=x.findIndex(o=>o.sessionId===e.data.sessionId);if(r!==-1){const o=x.splice(r,1)[0];me(o)}}else e.type==="joined"?(Ue(e.data),J("ChatRoom")):e.type==="randomCheckResult"?e.data.result==="ok"?B(e.data.roomrequest,!0):he():e.type}function I(t,e,n,r,o){const s={type:t,from:e,to:n,data:r,username:o},i=K();if(i.readyState===WebSocket.OPEN){i.send(JSON.stringify(s));return}i.addEventListener("open",()=>{i.send(JSON.stringify(s))},{once:!0})}function se(t,e,n){je({id:t,stream:e,username:n})}function me(t){t&&(t.RTCPeer&&(t.RTCPeer.onnegotiationneeded=null,t.RTCPeer.oniceconnectionstatechange=null,t.RTCPeer.ontrack=null,t.RTCPeer.onicecandidate=null,t.RTCPeer.close()),t.inboundStream=null,t=null)}function he(){const t=crypto.randomUUID();I("randomCheck","","",t)}function Qe(){const t=v().myRoomrequest;t!==""&&navigator.share({title:"WebRTC 방 번호 공유하기",url:We(t)})}function ie(t){t.preventDefault();const e=v().myUsername,n=document.getElementById("chatInput"),r=n.value;if(r!==""){const o=e,s={sender:o,chatInput:r},i="true,"+o+" : "+r;n.value="",E(i),fe.forEach(a=>{a.readyState,a.send(JSON.stringify(s))})}}function Xe(t){const e=JSON.parse(t.data);console.log(e);const n=e.sender,r=e.chatInput,o="false,"+n+" : "+r;E(o),M(o)}const W={roomrequest:"",username:""};let l=null,ae="",U="",D="",j="";function ge(t){const[,e=t]=t.split(",",2);return e.split(":").join(":<br/>")}function ye(t){return`
    <div class="${t} flex items-center justify-center mr-auto p-5 rounded-l-2xl shadow-2xl">
      <video
        id="myVideo"
        autoplay
        muted
        autopictureinpicture
        class="rounded-2xl shadow-2xl"
      ></video>
    </div>
  `}function pe(){return`
    <div class="flex flex-col justify-between h-full p-5">
      <div class="mt-12">
        <p class="text-center text-4xl mb-5">Chat Info</p>
        <div>
          <p id="roomNumber" class="overflow-auto max-h-16 text-sm p-1 mb-1 border border-gray-500"></p>
        </div>
        <button
          id="shareButton"
          class="text-sm bg-teal-600 text-white rounded-full h-12 w-full"
        >
          공유 <i class="fas fa-share"></i>
        </button>
      </div>
      <div class="flex-grow mt-5 mb-5 h-full overflow-auto">
        <div class="w-full border border-gray-500">
          <ul id="chatList" class="chat-list max-w-full overflow-auto"></ul>
        </div>
      </div>
      <div class="flex flex-col mb-12">
        <input
          type="text"
          id="chatInput"
          name="chatInput"
          placeholder="채팅 입력"
          class="overflow-auto h-12 max-h-96 border border-black mb-1 p-2"
        />
        <button
          id="sendButton"
          class="text-sm bg-teal-600 text-white rounded-full h-12"
        >
          보내기 <i class="fa-regular fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `}function Ye(){return`
    <div class="flex items-center justify-center h-full">
      <div class="max-w-xs m-auto">
        <h1 style="font-size: 40px; text-align: center" class="mb-10">WebRTC Chat</h1>
        <div class="flex items-center justify-center">
          <video
            id="myVideo"
            autoplay
            autopictureinpicture
            muted
            class="mb-10 rounded-2xl shadow-2xl bg-gray-500"
          ></video>
        </div>
        <form id="loginForm">
          <div class="flex-col">
            <input
              class="w-3/4 h-10 p-2 bg-transparent border-2 border-gray-500 mb-5 border-r-0"
              type="text"
              id="roomrequest"
              name="roomrequest"
              placeholder="방 번호"
            />
            <button
              class="w-1/4 h-10 bg-teal-600 text-white rounded disabled:bg-gray-400"
              type="button"
              id="randomButton"
              aria-label="RandomRoom"
            >
              <i class="fas fa-random"></i>
            </button>
            <input
              class="w-3/4 h-10 p-2 bg-transparent border-2 border-gray-500 border-r-0"
              type="text"
              id="username"
              name="username"
              placeholder="사용자 이름"
            />
            <button
              class="w-1/4 h-10 bg-teal-600 text-white rounded"
              type="submit"
              id="loginButton"
              value="LogIn"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  `}function Ze(){return`
    <div class="h-full">
      <div class="flex h-full">
        ${ye("w-[400px] bg-gray-200")}
        <div class="bg-slate-300 flex-1 rounded-r-2xl shadow-2xl">
          <div
            id="remoteChats"
            class="grid grid-cols-2 gap-0 items-center h-full justify-between overflow-auto w-full"
          ></div>
        </div>
        <div class="w-[400px]">
          ${pe()}
        </div>
      </div>
    </div>
  `}function et(){return`
    <div>
      <div class="fade-panel">
        <h1 class="bg-blue-100 w-full h-10 text-2xl text-center mb-5 rounded-2xl shadow-2xl">
          WebRTC
        </h1>
        ${ye("w-full rounded-2xl bg-gray-200 mb-5")}
        <div class="w-full rounded-2xl bg-slate-200 shadow-2xl">
          <div
            id="remoteChats"
            class="grid grid-cols-2 gap-0 items-center h-full justify-between overflow-auto w-full"
          ></div>
        </div>
      </div>
      <button
        id="toggleChatInfoButton"
        class="fixed right-0 top-0 m-5 bg-slate-300 w-10 h-10 rounded-full shadow-2xl"
      >
        <i class="fa-solid fa-bars text-gray-500"></i>
      </button>
      <div id="chatNotifications" class="w-1/2 fixed right-0 bottom-0"></div>
    </div>
  `}function tt(){return`
    <div>
      <div
        class="mobile-chat-info slide-panel h-full fixed right-0 bottom-0 w-full border border-gray-200 shadow-2xl bg-slate-100"
      >
        ${pe()}
      </div>
      <button
        id="toggleChatInfoButton"
        class="fixed right-0 top-0 m-5 bg-slate-300 w-10 h-10 rounded-full shadow-2xl"
      >
        <i class="fa-solid fa-bars text-gray-500"></i>
      </button>
    </div>
  `}function nt(t){return t.currentView==="ChatLogin"?Ye():t.isDesktop?Ze():t.currentView==="ChatInfo"?tt():et()}function rt(){const t=l.querySelector("#loginForm");t&&t.addEventListener("submit",Ke);const e=l.querySelector("#randomButton");e&&e.addEventListener("click",he);const n=l.querySelector("#roomrequest");n&&n.addEventListener("input",d=>{W.roomrequest=d.target.value});const r=l.querySelector("#username");r&&r.addEventListener("input",d=>{W.username=d.target.value});const o=l.querySelector("#shareButton");o&&o.addEventListener("click",Qe);const s=l.querySelector("#sendButton");s&&s.addEventListener("click",ie);const i=l.querySelector("#chatInput");i&&i.addEventListener("keyup",d=>{d.key==="Enter"&&ie(d)});const a=l.querySelector("#toggleChatInfoButton");a&&a.addEventListener("click",dt)}function ot(t){const e=l.querySelector("#roomrequest");if(e){const s=t.myRoomrequest||W.roomrequest;document.activeElement!==e&&e.value!==s&&(e.value=s),e.disabled=t.lockedRoomrequest}const n=l.querySelector("#username");if(n){const s=t.myUsername||W.username;document.activeElement!==n&&n.value!==s&&(n.value=s)}const r=l.querySelector("#loginButton");r&&(r.disabled=t.mediaAccessError);const o=l.querySelector("#randomButton");o&&(o.disabled=t.mediaAccessError||t.lockedRoomrequest)}function st(t){const e=l.querySelector("#remoteChats");if(!e){U="";return}const n=JSON.stringify(t.remoteStreams.map(r=>[r.id,r.username]));U!==n&&(U=n,e.innerHTML=t.remoteStreams.map(r=>`
          <div
            id="${r.id}"
            class="video m-5 relative w-4/5 bg-gray-500 rounded-2xl shadow-2xl overflow-hidden"
          >
            <video
              data-remote-video="${r.id}"
              autoplay
              class="m-auto shadow-2xl max-h-64 w-full"
            ></video>
            <div class="absolute top-0 left-0 bg-black text-white w-full opacity-50 pl-2">
              ${r.username??""}
            </div>
          </div>
        `).join("")),t.remoteStreams.forEach(r=>{const o=l.querySelector(`[data-remote-video="${r.id}"]`);o&&o.srcObject!==r.stream&&(o.srcObject=r.stream)})}function it(t){const e=l.querySelector("#chatList");if(!e){D="";return}const n=JSON.stringify(t.chatList);D!==n&&(D=n,e.innerHTML=t.chatList.map(r=>`
        <li class="chat-list-item ${r.split(",",2)[0]==="true"?"chat-list-item-own":""} bg-gray-200 border border-gray-300">
          ${ge(r)}
        </li>
      `).join(""))}function at(t){const e=l.querySelector("#chatNotifications");if(!e){j="";return}const n=JSON.stringify(t.notifications);j!==n&&(j=n,e.innerHTML=`
    <ul class="notification-list">
      ${t.notifications.map(r=>`
            <li class="noti bg-yellow-200 rounded-2xl p-2 pl-3 m-2 border border-yellow-300">
              ${ge(r)}
            </li>
          `).join("")}
    </ul>
  `)}function ct(t){const e=l.querySelector("#roomNumber");e&&(e.textContent=t.myRoomrequest)}function lt(t){const e=l.querySelector("#myVideo");e&&e.srcObject!==t.myStream&&(e.srcObject=t.myStream)}function dt(){const t=v(),e=l.querySelector("#myVideo");if(t.currentView==="ChatRoom"){e&&typeof e.requestPictureInPicture=="function"&&document.pictureInPictureElement===null&&e.requestPictureInPicture().then(()=>{e.play()}),J("ChatInfo");return}document.pictureInPictureElement&&document.exitPictureInPicture(),J("ChatRoom")}function ce(){if(!l)return;const t=v(),e=`${t.currentView}:${t.isDesktop}`;ae!==e&&(ae=e,U="",D="",j="",l.innerHTML=`
      <div class="border-black bg-zinc-100 h-full p-5 min-w-48 app-shell">
        ${nt(t)}
      </div>
    `,rt()),ot(t),ct(t),st(t),it(t),at(t),lt(t)}function ut(t){l=t,qe(ce),ce()}const le=()=>{Oe(window.innerWidth/window.innerHeight>1)},de=document.getElementById("app");de&&(ut(de),le(),window.addEventListener("resize",le),Me(()=>{oe()}),Fe(),oe());!A.isNativePlatform()&&"serviceWorker"in navigator&&window.addEventListener("load",function(){navigator.serviceWorker.register("serviceWorker.js").then(function(t){console.log("ServiceWorker registration successful with scope: ",t.scope)},function(t){console.log("ServiceWorker registration failed: ",t)})});
