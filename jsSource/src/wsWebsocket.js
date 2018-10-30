"use strict";

/**
 * resData =》 获取code，不同code处理不同 =》 status 不为0 失败
 * 建立连接 =》 登录/建权 =》 成功
 */
(function(global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    global.wsWebsocket = factory();
  }
})(window, function() {
  const RES_HEART = 1; //接收心跳回应
  const RES_CONNECTING = 300; //接收建立连接成功
  const RES_LOGIN = 301; //接收建权成功
  const RES_JOIN_ROOM = 302; //接收加入房间成功
  const RES_GET_ROOM_USERLIST = 303; //接收当前房间用户列表
  const RES_OUT_ROOM = 304; //接收离开房间
  const RES_ROOM_MESSAGE = 310; //接收房间信息
  const RES_P2P_MESSAGE = 311; //接收点对点信息
  const RES_ACTION_MESSAGE = 312; //接收动作信息
  const RES_SERVER_INFO = 315; //接收服务器基本信息

  const RES_SERVER_NOTIFICATION_OUTROOM = 350; //接收服务器统一通知起始值,离开房间
  const RES_SERVER_NOTIFICATION_JOINROOM = 351; //接收服务器统一通知，进入房间
  const RES_FILE_UPLOAD_SUCCESS = 355; //接受文件上传处理成功回执

  const REQ_HEART = 100; //请求心跳
  const REQ_LOGIN = 101; //请求建权
  const REQ_JOIN_ROOM = 102; //请求加入房间
  const REQ_GET_ROOM_USERLIST = 103; //请求当前房间用户列表
  const REQ_OUT_ROOM = 104; //请求离开房间
  const REQ_ROOM_MESSAGE = 110; //请求发送房间信息
  const REQ_P2P_MESSAGE = 111; //请求发送点对点信息
  const REQ_ACTION_MESSAGE = 112; //请求发送动作信息
  const REQ_SERVER_INFO = 115; //请求服务器基本信息

  const HEART_INTERVAL_TIME = 10000; //心跳循环间隔时间
  const WS_VERSION = 1; //组件版本

  class wsWebsocket {
    constructor(param) {
      this.initParam = {
        serverIP: "",
        websocketPort: "",
        httpPort: "",
        isHttps: false
      };

      this.socket = null;
      this.heartInterval = null;
      this.initParam = param;
      this.handles = null;

      this.userInfo = {
        serverToken: null,
        token: null,
        time: null,
        headerImg: null,
        userId: null,
        nick: null,
        proxy: null
      };

      this.currentChatStatus = {
        roomId: null,
        userId: null
      };

      //初始建权回调
      this.onReadySuccess = null;
      this.onReadyError = null;

      //服务器信息回调
      this.onGetServerInfoSuccess = new Function();
      this.onGetServerInfoError = new Function();

      //收到服务器广播通知
      this.onGetServerNotification = new Function();

      //收到上传文件处理成功回执
      this.uploadResList = {};

      //收到动作消息处理成功回执
      this.actionResList = {};

      //收到消息
      this.onRecieveMessage = new Function();

      //加入房间回调
      this.onJoinRoomSuccess = new Function();
      this.onJoinRoomError = new Function();

      //离开房间回调
      this.onOutRoomSuccess = new Function();
      this.onOutRoomError = new Function();

      //获取房间用户列表回调
      this.onGetRoomUserListSuccess = new Function();
      this.onGetRoomUserListError = new Function();

      //在线离线回调
      this.onOnline = new Function();
      this.onOffline = new Function();

      /**
       * reconnecting-websocket 监听方法回调
       */
      this._ondebug = new Function();
      this._onopen = new Function();
      this._onconnecting = new Function();
      this._onmessage = new Function();
      this._onclose = new Function();
      this._onerror = new Function();

      //事件策略
      this.events = this._initEvents();
    }

    // get _ondebug() {
    //   return "getter";
    // }

    //初始化
    init(userInfo, callback, errCallback) {
      //初始建权回调
      this.onReadySuccess = this._evaluateFunction(callback);
      this.onReadyError = this._evaluateFunction(errCallback);

      let initStatus = this._checkParam(this.initParam);
      if (!initStatus.status) {
        this.onReadyError(initStatus.desc);
        return;
      }

      let userinfoStatus = this._checkUserInfo(userInfo);
      if (!userinfoStatus.status) {
        this.onReadyError(userinfoStatus.desc);
        return;
      }

      //只允许一个链接，若要使用其他链接，需要执行destroy
      if (!this.socket) {
        let url = this._getWebsocketUrl();
        this.socket = new ReconnectingWebSocket(url, null, {
          debug: true,
          reconnectInterval: 3000,
          maxReconnectAttempts: 50
        });
      }

      this.userInfo = userInfo;
      this.userInfo.time = new Date().getTime();
      this.handles = this._initHandles();

      /**
       * 链接到服务器
       */
      this.socket.onopen = () => {
        // console.log("连接到服务器");
        this._onopen();
        this._ondebug("res", "onopen:连接到服务器", this._formatDate());
      };

      /**
       * 重新连接服务器
       */
      this.socket.onconnecting = () => {
        // console.log("重新连接服务器");
        this._onconnecting();
        this._ondebug("res", "onconnecting:重新连接服务器", this._formatDate());

        this._stopHeart(); //停止心跳
        this.onOffline(); //当前用户已离线
      };

      /**
       * 监听获取消息
       */
      this.socket.onmessage = event => {
        // console.log("Recieved: " + event.data);
        try {
          let resData = JSON.parse(event.data);
          if (resData.code !== RES_HEART) {
            this._ondebug("res", event.data, this._formatDate());
          }

          if (
            resData.code === RES_SERVER_NOTIFICATION_OUTROOM ||
            resData.code === RES_SERVER_NOTIFICATION_JOINROOM
          ) {
            this.handles.execute("notification", resData);
            return;
          }

          this.handles.execute(resData.code, resData);
        } catch (e) {}
      };

      /**
       * 链接关闭
       */
      this.socket.onclose = () => {
        //连接失败
        console.log("连接关闭");
        this._ondebug("res", "onclose:连接关闭", this._formatDate());
        this._stopHeart(); //停止心跳
        this._onclose();

        //当前用户已离线
        this.onOffline();
      };

      /**
       * 监听错误
       */
      this.socket.onerror = () => {
        //连接失败
        console.log("连接失败");
        this._ondebug("res", "onerror:连接失败", this._formatDate());
        this._stopHeart(); //停止心跳
        this._onerror();

        //当前用户已离线
        this.onOffline();
      };
    }

    /**
     * 统一事件监听
     * @param {string} event
     * @param {function} callback
     * @param {function} errCallback
     */
    on(event, callback, errCallback) {
      this.events.execute(event, {
        callback: this._evaluateFunction(callback),
        errCallback: this._evaluateFunction(errCallback)
      });
    }

    /************** PUBLIC METHOD **************/

    /**
     * 获取认证用户
     */
    getUserInfo() {
      return this.userInfo;
    }

    /**
     * 获取房间id
     */
    getRoomId() {
      return this.currentChatStatus.roomId;
    }

    /**
     * 销毁链接
     * @param {function} callback
     */
    destroy(callback) {
      this._destroy();
      this._evaluateFunction(callback)();
    }

    /**
     * 获取服务器基本信息
     * @param {function} success
     * @param {function} error
     */
    getServerInfo(success, error) {
      let msgBody = {};

      this._sendMessage(REQ_SERVER_INFO, msgBody);
      this.onGetServerInfoSuccess = this._evaluateFunction(success);
      this.onGetServerInfoError = this._evaluateFunction(error);
    }

    /**
     * 加入房间
     * @param {string} roomId
     * @param {function} success
     * @param {function} error
     */
    joinRoom(roomId, success, error) {
      let msgBody = {
        roomId: roomId
      };

      this._sendMessage(REQ_JOIN_ROOM, msgBody);
      this.onJoinRoomSuccess = this._evaluateFunction(success);
      this.onJoinRoomError = this._evaluateFunction(error);
    }

    /**
     * 离开房间
     * @param {function} success
     * @param {function} error
     */
    outRoom(success, error) {
      let msgBody = {};

      this._sendMessage(REQ_OUT_ROOM, msgBody);
      this.onOutRoomSuccess = this._evaluateFunction(success);
      this.onOutRoomError = this._evaluateFunction(error);
    }

    /**
     * 获取房间用户列表
     * @param {string} roomId
     * @param {function} success
     * @param {function} error
     */
    getRoomUserList(roomId, success, error) {
      let msgBody = {
        roomId: roomId
      };
      this._sendMessage(REQ_GET_ROOM_USERLIST, msgBody);
      this.onGetRoomUserListSuccess = this._evaluateFunction(success);
      this.onGetRoomUserListError = this._evaluateFunction(error);
    }

    /**
     * 发送房间消息
     * @param {object} message
     * @param {function} callback
     * @param {string} roomId - 可选
     * @param {object} extend
     */
    sendRoomMessage(message, callback, roomId, extend) {
      let msgBody = {
        body: message
      };

      if (roomId) {
        msgBody.roomId = roomId;
      }

      this._sendMessage(REQ_ROOM_MESSAGE, msgBody, extend);
      this._evaluateFunction(callback)();
    }

    /**
     * 发送点对点消息
     * @param {object} message
     * @param {number} userId
     * @param {function} callback
     * @param {object} extend
     */
    sendP2PMessage(message, userId, callback, extend) {
      if (!userId) {
        return;
      }

      let msgBody = {
        userId: userId,
        msg: message
      };

      this._sendMessage(REQ_P2P_MESSAGE, msgBody, extend);
      this._evaluateFunction(callback)();
    }

    /**
     * 发送动作消息
     * @param {object} param
     * @param {object} message - 消息对象
     * @param {function} before - 开始前
     * @param {function} success - 发送完毕，没有处理回执
     * @param {function} recieve - 返回websocket处理回执
     */
    sendActionMessage(param) {
      if (!param) {
        return;
      }

      if (!param.message) {
        console.log("没有消息内容");
        return;
      }

      let clientMsgId = this._uuid(); //唯一标识
      let message = param.message;
      let before = this._evaluateFunction(param.before);
      let success = this._evaluateFunction(param.success);
      let recieve = this._evaluateFunction(param.recieve);

      //发送动作消息准备
      before(clientMsgId);
      this._ondebug(
        "req",
        "发送动作消息：" + JSON.stringify(message),
        this._formatDate()
      );

      //将recieve加入队列
      this.actionResList[clientMsgId] = recieve;
      let msgBody = {
        msg: message,
        clientMsgId: clientMsgId
      };

      this._sendMessage(REQ_ACTION_MESSAGE, msgBody);
      this._evaluateFunction(success)(clientMsgId);
    }

    /**
     * 上传文件
     * 上传成功的文件，等待websocket回执后，执行回调（可发送聊天消息）
     * @param {object} param
     * @param {file} file - 文件对象
     * @param {function} before - 上传开始前
     * @param {function} success - 上传成功，没有处理回执
     * @param {function} error - 上传失败
     * @param {function} progress - 上传进度
     * @param {function} recieve - 返回websocket处理回执
     */
    upload(param) {
      if (!param) {
        return;
      }

      if (!param.file) {
        console.log("请上传文件");
        return;
      }

      let uploadParam = {
        // file: param.file,
        before: this._evaluateFunction(param.before),
        success: this._evaluateFunction(param.success),
        error: this._evaluateFunction(param.error),
        progress: this._evaluateFunction(param.progress),
        recieve: this._evaluateFunction(param.recieve),
        clientFileId: this._uuid(), //唯一标识
        userId: this.userInfo.userId,
        url: this._getUploadUrl()
      };

      let _this = this;
      if (window.cordova) {
        //适配cordova
        let fileURL = param.file.uri;
        uploadParam.file = {};
        uploadParam.file.uri = fileURL;
        uploadParam.file.name = fileURL.substr(fileURL.lastIndexOf("/") + 1);
        _this._uploadCordova(uploadParam);
      } else {
        uploadParam.file = param.file;
        this._uploadPC(uploadParam);
      }
    }

    /************** PRIVATE METHOD **************/

    /**
     * cordova 文件上传
     * @param {object} param
     */
    _uploadCordova(param) {
      if (!window.cordova) {
        return;
      }

      //上传开始准备
      param.before(param.clientFileId);
      this._ondebug(
        "req",
        "准备上传文件：" + param.file.name,
        this._formatDate()
      );

      //将recieve加入队列
      this.uploadResList[param.clientFileId] = param.recieve;

      let options = new FileUploadOptions();
      options.fileKey = "upfile";
      options.fileName = param.file.name;
      // options.mimeType = "image/jpeg";
      options.params = {
        clientFileId: param.clientFileId,
        userId: param.userId
      };
      options.clientFileId = param.clientFileId;
      options.userId = param.userId;

      let ft = new FileTransfer();

      ft.onprogress = result => {
        if (result.lengthComputable) {
          //上传进度
          let percent = Math.round((result.loaded / result.total) * 100);
          param.progress(percent, result.loaded, result.total);

          this._ondebug(
            "req",
            "上传文件进度" + percent + "%",
            this._formatDate()
          );
        } else {
          console.log("没有上传进度");
        }
      };

      ft.upload(
        param.file.uri,
        encodeURI(param.url),
        () => {
          param.success(param.clientFileId);
        },
        () => {
          param.error(param.clientFileId);
        },
        options
      );
    }

    /**
     * PC文件上传
     * @param {object} param
     */
    _uploadPC(param) {
      //上传开始准备
      param.before(param.clientFileId);
      this._ondebug(
        "req",
        "准备上传文件：" + param.file.name,
        this._formatDate()
      );

      //将recieve加入队列
      this.uploadResList[param.clientFileId] = param.recieve;

      let form = new FormData();
      form.append("clientFileId", param.clientFileId);
      form.append("userId", param.userId);
      form.append("upfile", param.file);

      let xhr = new XMLHttpRequest();

      xhr.upload.addEventListener(
        "progress",
        result => {
          if (result.lengthComputable) {
            //上传进度
            let percent = Math.round((result.loaded / result.total) * 100);
            param.progress(percent, result.loaded, result.total);

            this._ondebug(
              "req",
              "上传文件进度" + percent + "%",
              this._formatDate()
            );
          } else {
            console.log("没有上传进度");
          }
        },
        false
      );

      // xhr.addEventListener("readystatechange", function() {});
      xhr.addEventListener(
        "load",
        () => {
          param.success(param.clientFileId);
        },
        false
      );
      xhr.addEventListener(
        "error",
        () => {
          param.error(param.clientFileId);
        },
        false
      );
      xhr.addEventListener(
        "abort",
        () => {
          param.error(param.clientFileId);
        },
        false
      );

      xhr.open("POST", param.url, true);
      xhr.send(form);
    }

    /**
     * 验证构造参数
     * @param {object} initParam
     */
    _checkParam(initParam) {
      if (!initParam) {
        return {
          status: false,
          desc: "缺少基本配置信息"
        };
      }

      if (
        !initParam.serverIP ||
        !initParam.websocketPort ||
        !initParam.httpPort
      ) {
        return {
          status: false,
          desc: "基本配置信息错误"
        };
      }

      return {
        status: true,
        desc: ""
      };
    }

    /**
     * 验证用户建权参数
     * @param {object} userInfo
     */
    _checkUserInfo(userInfo) {
      if (!userInfo) {
        return {
          status: false,
          desc: "缺少建权用户信息"
        };
      }

      if (
        !userInfo.token ||
        !userInfo.headerImg ||
        !userInfo.userId ||
        !userInfo.nick
      ) {
        return {
          status: false,
          desc: "建权用户信息错误"
        };
      }

      if (!userInfo.proxy) {
        return {
          status: false,
          desc: "缺少网关配置信息"
        };
      }

      if (
        !userInfo.proxy.authProxy ||
        !userInfo.proxy.msgResProxy ||
        !userInfo.proxy.actionResProxy
      ) {
        return {
          status: false,
          desc: "网关配置信息错误"
        };
      }

      return {
        status: true,
        desc: ""
      };
    }

    /**
     * 赋值函数
     * @param {function} fn
     */
    _evaluateFunction(fn) {
      let _fn = new Function();
      if (fn && typeof fn === "function") {
        _fn = fn;
      }
      return _fn;
    }

    /**
     * 生成唯一16位uuid
     */
    _uuid() {
      return "xxxxxxxxxxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        let r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    /**
     * 绑定事件策略
     */
    _initEvents() {
      let events = new Strategies();

      //通知
      events.add("notification", res => {
        this.onGetServerNotification = res.callback;
      });
      //收到聊天信息
      events.add("recievemessage", res => {
        this.onRecieveMessage = res.callback;
      });
      //在线状态
      events.add("online", res => {
        this.onOnline = res.callback;
      });
      //离线状态
      events.add("offline", res => {
        this.onOffline = res.callback;
      });
      events.add("debug", res => {
        this._ondebug = res.callback;
      });

      /**
       * reconnecting-websocket 监听方法回调
       */
      events.add("open", res => {
        this._onopen = res.callback;
      });
      events.add("connecting", res => {
        this._onconnecting = res.callback;
      });
      events.add("message", res => {
        this._onmessage = res.callback;
      });
      events.add("close", res => {
        this._onclose = res.callback;
      });
      events.add("error", res => {
        this._onerror = res.callback;
      });

      return events;
    }

    /**
     * 接受message策略
     */
    _initHandles() {
      let handles = new Strategies();

      //收到心跳回应
      handles.add(RES_HEART, resData => {
        this.userInfo.time = resData.time;
      });

      //建立连接成功
      handles.add(RES_CONNECTING, resData => {
        console.log("收到:socket已连接到服务器");
        //发送建权信息
        this._sendMessage(REQ_LOGIN, this.userInfo);
      });

      //返回建权信息
      handles.add(RES_LOGIN, resData => {
        console.log("收到:socket连接(用户认证)成功");
        this._onMessage(
          resData,
          resData => {
            //建权成功,开始发送心跳
            this._startHeart();

            //更新token
            this.userInfo.serverToken = resData.serverToken;

            //若存在房间
            if (this.currentChatStatus.roomId) {
              this.joinRoom(this.currentChatStatus.roomId);
            }

            //只执行一次
            if (this.onReadySuccess) {
              this.onReadySuccess();
              this.onReadySuccess = null;
            }

            //当前用户已在线
            this.onOnline();
          },
          () => {
            //只执行一次
            if (this.onReadyError) {
              this.onReadyError("建权失败");
              this.onReadyError = null;
            }

            //当前用户已离线
            this.onOffline();
          }
        );
      });

      /**
       * 返回加入房间信息
       * 当用户加入房间成功时
       * 对象需要保留加入房间状态，重连则重新加入房间
       */
      handles.add(RES_JOIN_ROOM, resData => {
        console.log("收到:加入房间成功");
        this._onMessage(
          resData,
          resData => {
            this.currentChatStatus.roomId = resData.roomId;
            this.onJoinRoomSuccess(resData);
          },
          this.onJoinRoomError
        );
      });

      /**
       * 返回离开房间信息
       * 当用户离开房间成功时清空状态
       */
      handles.add(RES_OUT_ROOM, resData => {
        console.log("收到:离开房间成功");
        this._onMessage(
          resData,
          resData => {
            this.currentChatStatus.roomId = null;
            this.onOutRoomSuccess(resData);
          },
          this.onOutRoomError
        );
      });

      //返回房间用户列表
      handles.add(RES_GET_ROOM_USERLIST, resData => {
        console.log("收到:房间用户列表");
        this._onMessage(
          resData,
          this.onGetRoomUserListSuccess,
          this.onGetRoomUserListError
        );
      });

      //返回房间对话信息
      handles.add(RES_ROOM_MESSAGE, resData => {
        console.log("收到:房间对话");
        this._onMessage(resData, this.onRecieveMessage, function() {}, 1);
        return;
      });

      //返回点对点对话信息
      handles.add(RES_P2P_MESSAGE, resData => {
        console.log("收到:点对点对话");
        this._onMessage(resData, this.onRecieveMessage, function() {}, 2);
      });

      //返回动作信息
      handles.add(RES_ACTION_MESSAGE, resData => {
        console.log("收到:动作信息");
        this._onMessage(resData, resData => {
          if (this.actionResList[resData.clientMsgId]) {
            this.actionResList[resData.clientMsgId](resData);
          }
        });
      });

      //返回服务器基本信息
      handles.add(RES_SERVER_INFO, resData => {
        console.log("收到:服务器基本信息");
        this._onMessage(
          resData,
          this.onGetServerInfoSuccess,
          this.onGetServerInfoError
        );
      });

      //返回通知信息
      //resData.code >= RES_SERVER_NOTIFICATION_INIT
      handles.add("notification", resData => {
        console.log("收到:服务器广播通知");
        this._onMessage(resData, this.onGetServerNotification);
      });

      //返回上传文件处理成功信息
      handles.add(RES_FILE_UPLOAD_SUCCESS, resData => {
        console.log("收到:上传文件处理成功");
        //ext后缀名 url文件地址 clientFileId文件唯一id
        this._onMessage(resData, resData => {
          if (this.uploadResList[resData.clientFileId]) {
            this.uploadResList[resData.clientFileId](resData);
          }
        });
      });

      return handles;
    }

    _onMessage(resData, success, error, param) {
      if (resData.status === 0) {
        if (success) {
          success(resData, param);
        }
      } else {
        if (error) {
          error();
        }
      }
    }

    _getUploadUrl() {
      let url = "http://";
      url +=
        this.initParam.serverIP +
        ":" +
        this.initParam.httpPort +
        "/chatApplication/ContentUpload/chat/upload.do";

      return url;
    }

    _getWebsocketUrl() {
      let url = "ws://";
      if (this.initParam.isHttps) {
        url = "wss://";
      }

      url +=
        this.initParam.serverIP +
        ":" +
        this.initParam.websocketPort +
        "/chatApplication/websocket";

      return url;
    }

    //debug时间
    _formatDate() {
      let date = new Date();

      // let year = date.getFullYear(),
      //   month =
      //     date.getMonth() + 1 >= 10
      //       ? date.getMonth() + 1
      //       : "0" + (date.getMonth() + 1), //月份是从0开始的
      //   day = date.getDate() >= 10 ? date.getDate() : "0" + date.getDate(),
      let hour =
          date.getHours() >= 10 ? date.getHours() : "0" + date.getHours(),
        min =
          date.getMinutes() >= 10 ? date.getMinutes() : "0" + date.getMinutes(),
        sec =
          date.getSeconds() >= 10 ? date.getSeconds() : "0" + date.getSeconds();
      // let newTime =
      //   year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
      let newTime = hour + ":" + min + ":" + sec;
      return newTime;
    }

    /**
     * 发送信息
     * @param {number} code
     * @param {object} message
     * @param {object} extend
     */
    _sendMessage(code, message, extend) {
      if (!this.socket) {
        console.error("没有建立socket链接，无法通讯");
        return;
      }

      let msgBody = {
        code: code,
        body: message,
        version: WS_VERSION
      };

      if (extend) {
        msgBody.extend = extend;
      }

      this.socket.send(JSON.stringify(msgBody));

      if (code === REQ_HEART) {
        return;
      }
      this._ondebug("req", JSON.stringify(msgBody), this._formatDate());
    }

    //开始保持心跳循环
    _startHeart() {
      let msgBody = {};
      this._sendMessage(REQ_HEART, msgBody);

      //开始循环
      this.heartInterval = setInterval(() => {
        // console.log("发送:心跳协议");
        this._sendMessage(REQ_HEART, msgBody);
      }, HEART_INTERVAL_TIME);
    }

    //销毁心跳循环
    _stopHeart() {
      clearInterval(this.heartInterval);
      this.heartInterval = null;
    }

    //销毁socket链接
    _destroy() {
      if (!this.socket) {
        console.error("没有建立socket链接");
        return;
      }

      this._stopHeart();
      this.socket.close();
      this.socket = null;
      this.userInfo = null;
      this.currentChatStatus = {
        roomId: null,
        userId: null
      };
    }
  }

  return wsWebsocket;
});
