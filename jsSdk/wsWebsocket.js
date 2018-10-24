"use strict";var _createClass=function(){function o(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(e,t,n){return t&&o(e.prototype,t),n&&o(e,n),e}}();function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}!function(e,t){"function"==typeof define&&define.amd?define([],t):"undefined"!=typeof module&&module.exports?module.exports=t():e.ReconnectingWebSocket=t()}(window,function(){if("WebSocket"in window)return e.prototype.onopen=function(e){},e.prototype.onclose=function(e){},e.prototype.onconnecting=function(e){},e.prototype.onmessage=function(e){},e.prototype.onerror=function(e){},e.debugAll=!1,e.CONNECTING=WebSocket.CONNECTING,e.OPEN=WebSocket.OPEN,e.CLOSING=WebSocket.CLOSING,e.CLOSED=WebSocket.CLOSED,e;function e(e,t,n){var o={debug:!1,automaticOpen:!0,reconnectInterval:1e3,maxReconnectInterval:3e4,reconnectDecay:1.5,timeoutInterval:2e3,maxReconnectAttempts:null,binaryType:"blob"};for(var s in n||(n={}),o)void 0!==n[s]?this[s]=n[s]:this[s]=o[s];this.url=e,this.reconnectAttempts=0,this.readyState=WebSocket.CONNECTING,this.protocol=null;var i,r=this,a=!1,c=!1,u=document.createElement("div");function l(e,t){var n=document.createEvent("CustomEvent");return n.initCustomEvent(e,!1,!1,t),n}u.addEventListener("open",function(e){r.onopen(e)}),u.addEventListener("close",function(e){r.onclose(e)}),u.addEventListener("connecting",function(e){r.onconnecting(e)}),u.addEventListener("message",function(e){r.onmessage(e)}),u.addEventListener("error",function(e){r.onerror(e)}),this.addEventListener=u.addEventListener.bind(u),this.removeEventListener=u.removeEventListener.bind(u),this.dispatchEvent=u.dispatchEvent.bind(u),this.open=function(o){if((i=new WebSocket(r.url,t||[])).binaryType=this.binaryType,o){if(this.maxReconnectAttempts&&this.reconnectAttempts>this.maxReconnectAttempts)return}else u.dispatchEvent(l("connecting")),this.reconnectAttempts=0;r.debug;var e=i,n=setTimeout(function(){r.debug,c=!0,e.close(),c=!1},r.timeoutInterval);i.onopen=function(e){clearTimeout(n),r.debug,r.protocol=i.protocol,r.readyState=WebSocket.OPEN,r.reconnectAttempts=0;var t=l("open");t.isReconnect=o,o=!1,u.dispatchEvent(t)},i.onclose=function(e){if(clearTimeout(n),i=null,a)r.readyState=WebSocket.CLOSED,u.dispatchEvent(l("close"));else{r.readyState=WebSocket.CONNECTING;var t=l("connecting");t.code=e.code,t.reason=e.reason,t.wasClean=e.wasClean,u.dispatchEvent(t),o||c||(r.debug,u.dispatchEvent(l("close")));var n=r.reconnectInterval*Math.pow(r.reconnectDecay,r.reconnectAttempts);setTimeout(function(){r.reconnectAttempts++,r.open(!0)},n>r.maxReconnectInterval?r.maxReconnectInterval:n)}},i.onmessage=function(e){r.debug;var t=l("message");t.data=e.data,u.dispatchEvent(t)},i.onerror=function(e){r.debug,u.dispatchEvent(l("error"))}},1==this.automaticOpen&&this.open(!1),this.send=function(e){if(i)return r.debug,i.send(e);throw"INVALID_STATE_ERR : Pausing to reconnect websocket"},this.close=function(e,t){void 0===e&&(e=1e3),a=!0,i&&i.close(e,t)},this.refresh=function(){i&&i.close()}}}),function(e,t){"function"==typeof define&&define.amd?define([],t):"undefined"!=typeof module&&module.exports?module.exports=t():e.Strategies=t()}(window,function(){return function(){function e(){_classCallCheck(this,e),this.collection={}}return _createClass(e,[{key:"get",value:function(){return this.collection}},{key:"add",value:function(e,t){this.collection[e]=t}},{key:"execute",value:function(e,t){this.collection[e]&&this.collection[e](t)}}]),e}()}),function(e,t){"function"==typeof define&&define.amd?define([],t):"undefined"!=typeof module&&module.exports?module.exports=t():e.wsWebsocket=t()}(window,function(){return function(){function t(e){_classCallCheck(this,t),this.initParam={serverIP:"",websocketPort:"",httpPort:"",isHttps:!1},this.socket=null,this.heartInterval=null,this.initParam=e,this.handles=null,this.userInfo={serverToken:null,token:null,time:null,headerImg:null,userId:null,nick:null,proxy:null},this.currentChatStatus={roomId:null,userId:null},this.onReadySuccess=null,this.onReadyError=null,this.onGetServerInfoSuccess=new Function,this.onGetServerInfoError=new Function,this.onGetServerNotification=new Function,this.uploadResList={},this.onRecieveMessage=new Function,this.onJoinRoomSuccess=new Function,this.onJoinRoomError=new Function,this.onOutRoomSuccess=new Function,this.onOutRoomError=new Function,this.onGetRoomUserListSuccess=new Function,this.onGetRoomUserListError=new Function,this.onOnline=new Function,this.onOffline=new Function,this._ondebug=new Function,this._onopen=new Function,this._onconnecting=new Function,this._onmessage=new Function,this._onclose=new Function,this._onerror=new Function,this.events=this._initEvents()}return _createClass(t,[{key:"init",value:function(e,t,n){var o=this;this.onReadySuccess=this._evaluateFunction(t),this.onReadyError=this._evaluateFunction(n);var s=this._checkParam(this.initParam);if(s.status){var i=this._checkUserInfo(e);if(i.status){if(!this.socket){var r=this._getWebsocketUrl();this.socket=new ReconnectingWebSocket(r,null,{debug:!0,reconnectInterval:3e3,maxReconnectAttempts:50})}this.userInfo=e,this.userInfo.time=(new Date).getTime(),this.handles=this._initHandles(),this.socket.onopen=function(){o._onopen(),o._ondebug("res","onopen:连接到服务器",o._formatDate())},this.socket.onconnecting=function(){o._onconnecting(),o._ondebug("res","onconnecting:重新连接服务器",o._formatDate()),o._stopHeart(),o.onOffline()},this.socket.onmessage=function(e){try{var t=JSON.parse(e.data);if(1!==t.code&&o._ondebug("res",e.data,o._formatDate()),350===t.code||351===t.code)return void o.handles.execute("notification",t);o.handles.execute(t.code,t)}catch(e){}},this.socket.onclose=function(){o._ondebug("res","onclose:连接关闭",o._formatDate()),o._stopHeart(),o._onclose(),o.onOffline()},this.socket.onerror=function(){o._ondebug("res","onerror:连接失败",o._formatDate()),o._stopHeart(),o._onerror(),o.onOffline()}}else this.onReadyError(i.desc)}else this.onReadyError(s.desc)}},{key:"on",value:function(e,t,n){this.events.execute(e,{callback:this._evaluateFunction(t),errCallback:this._evaluateFunction(n)})}},{key:"getUserInfo",value:function(){return this.userInfo}},{key:"getRoomId",value:function(){return this.currentChatStatus.roomId}},{key:"destroy",value:function(e){this._destroy(),this._evaluateFunction(e)()}},{key:"getServerInfo",value:function(e,t){this._sendMessage(115,{}),this.onGetServerInfoSuccess=this._evaluateFunction(e),this.onGetServerInfoError=this._evaluateFunction(t)}},{key:"joinRoom",value:function(e,t,n){var o={roomId:e};this._sendMessage(102,o),this.onJoinRoomSuccess=this._evaluateFunction(t),this.onJoinRoomError=this._evaluateFunction(n)}},{key:"outRoom",value:function(e,t){this._sendMessage(104,{}),this.onOutRoomSuccess=this._evaluateFunction(e),this.onOutRoomError=this._evaluateFunction(t)}},{key:"getRoomUserList",value:function(e,t,n){var o={roomId:e};this._sendMessage(103,o),this.onGetRoomUserListSuccess=this._evaluateFunction(t),this.onGetRoomUserListError=this._evaluateFunction(n)}},{key:"sendRoomMessage",value:function(e,t,n,o){var s={body:e};n&&(s.roomId=n),this._sendMessage(110,s,o),this._evaluateFunction(t)()}},{key:"sendP2PMessage",value:function(e,t,n,o){if(t){var s={userId:t,msg:e};this._sendMessage(111,s,o),this._evaluateFunction(n)()}}},{key:"upload",value:function(e){window.cordova||this._uploadPC(e)}},{key:"_uploadPC",value:function(e){var n=this;if(e&&e.file){var t=e.file,o=this._evaluateFunction(e.before),s=this._evaluateFunction(e.success),i=this._evaluateFunction(e.error),r=this._evaluateFunction(e.progress),a=this._evaluateFunction(e.recieve),c=this._uuid(),u=this.userInfo.userId,l=this._getUploadUrl();o(c),this._ondebug("req","准备上传文件："+t.name,this._formatDate()),this.uploadResList[c]=a;var d=new FormData;d.append("clientFileId",c),d.append("userId",u),d.append("upfile",t);var f=new XMLHttpRequest;f.upload.addEventListener("progress",function(e){if(e.lengthComputable){var t=Math.round(e.loaded/e.total*100);r(t,e.loaded,e.total),n._ondebug("req","上传文件进度"+t+"%",n._formatDate())}},!1),f.addEventListener("load",s,!1),f.addEventListener("error",i,!1),f.addEventListener("abort",i,!1),f.open("POST",l,!0),f.send(d)}}},{key:"_checkParam",value:function(e){return e?e.serverIP&&e.websocketPort&&e.httpPort?{status:!0,desc:""}:{status:!1,desc:"基本配置信息错误"}:{status:!1,desc:"缺少基本配置信息"}}},{key:"_checkUserInfo",value:function(e){return e?e.token&&e.headerImg&&e.userId&&e.nick?e.proxy?e.proxy.authProxy&&e.proxy.msgResProxy?{status:!0,desc:""}:{status:!1,desc:"网关配置信息错误"}:{status:!1,desc:"缺少网关配置信息"}:{status:!1,desc:"建权用户信息错误"}:{status:!1,desc:"缺少建权用户信息"}}},{key:"_evaluateFunction",value:function(e){var t=new Function;return e&&"function"==typeof e&&(t=e),t}},{key:"_uuid",value:function(){return"xxxxxxxxxxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=16*Math.random()|0;return("x"==e?t:3&t|8).toString(16)})}},{key:"_initEvents",value:function(){var t=this,e=new Strategies;return e.add("notification",function(e){t.onGetServerNotification=e.callback}),e.add("recievemessage",function(e){t.onRecieveMessage=e.callback}),e.add("online",function(e){t.onOnline=e.callback}),e.add("offline",function(e){t.onOffline=e.callback}),e.add("debug",function(e){t._ondebug=e.callback}),e.add("open",function(e){t._onopen=e.callback}),e.add("connecting",function(e){t._onconnecting=e.callback}),e.add("message",function(e){t._onmessage=e.callback}),e.add("close",function(e){t._onclose=e.callback}),e.add("error",function(e){t._onerror=e.callback}),e}},{key:"_initHandles",value:function(){var t=this,e=new Strategies;return e.add(1,function(e){t.userInfo.time=e.time}),e.add(300,function(e){t._sendMessage(101,t.userInfo)}),e.add(301,function(e){t._onMessage(e,function(e){t._startHeart(),t.userInfo.serverToken=e.serverToken,t.currentChatStatus.roomId&&t.joinRoom(t.currentChatStatus.roomId),t.onReadySuccess&&(t.onReadySuccess(),t.onReadySuccess=null),t.onOnline()},function(){t.onReadyError&&(t.onReadyError("建权失败"),t.onReadyError=null),t.onOffline()})}),e.add(302,function(e){t._onMessage(e,function(e){t.currentChatStatus.roomId=e.roomId,t.onJoinRoomSuccess(e)},t.onJoinRoomError)}),e.add(304,function(e){t._onMessage(e,function(e){t.currentChatStatus.roomId=null,t.onOutRoomSuccess(e)},t.onOutRoomError)}),e.add(303,function(e){t._onMessage(e,t.onGetRoomUserListSuccess,t.onGetRoomUserListError)}),e.add(310,function(e){t._onMessage(e,t.onRecieveMessage,function(){},1)}),e.add(311,function(e){t._onMessage(e,t.onRecieveMessage,function(){},2)}),e.add(315,function(e){t._onMessage(e,t.onGetServerInfoSuccess,t.onGetServerInfoError)}),e.add("notification",function(e){t._onMessage(e,t.onGetServerNotification)}),e.add(355,function(e){t._onMessage(e,function(e){t.uploadResList[e.clientFileId]&&t.uploadResList[e.clientFileId](e)})}),e}},{key:"_onMessage",value:function(e,t,n,o){0===e.status?t&&t(e,o):n&&n()}},{key:"_getUploadUrl",value:function(){var e="http://";return e+=this.initParam.serverIP+":"+this.initParam.httpPort+"/chatApplication/ContentUpload/chat/upload.do"}},{key:"_getWebsocketUrl",value:function(){var e="ws://";return this.initParam.isHttps&&(e="wss://"),e+=this.initParam.serverIP+":"+this.initParam.websocketPort+"/chatApplication/websocket"}},{key:"_formatDate",value:function(){var e=new Date;return(10<=e.getHours()?e.getHours():"0"+e.getHours())+":"+(10<=e.getMinutes()?e.getMinutes():"0"+e.getMinutes())+":"+(10<=e.getSeconds()?e.getSeconds():"0"+e.getSeconds())}},{key:"_sendMessage",value:function(e,t,n){if(this.socket){var o={code:e,body:t,version:1};n&&(o.extend=n),this.socket.send(JSON.stringify(o)),100!==e&&this._ondebug("req",JSON.stringify(o),this._formatDate())}}},{key:"_startHeart",value:function(){var e=this,t={};this._sendMessage(100,t),this.heartInterval=setInterval(function(){e._sendMessage(100,t)},1e4)}},{key:"_stopHeart",value:function(){clearInterval(this.heartInterval),this.heartInterval=null}},{key:"_destroy",value:function(){this.socket&&(this._stopHeart(),this.socket.close(),this.socket=null,this.userInfo=null,this.currentChatStatus={roomId:null,userId:null})}}]),t}()});