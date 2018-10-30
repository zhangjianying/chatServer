# JS SDK 使用说明

## 编译源码

程序使用 gulp 进行打包编译,首先需要 安装编译依赖

```node
  npm install
  npm -g install gulp
```

编译 min 版本

```node
  gulp --env=build
```

## js sdk 使用方法说明

先在 html 中引入 js sdk

```html
 <script src="wsWebsocket.min.js"></script>
```

### 初始化--设置服务器连接基本信息

页面初始化前需要设置连接的服务器信息

```javascript
var ws = new wsWebsocket({
  serverIP: "193.112.107.139",
  websocketPort: "8099", // 连接端口
  httpPort: "8011", //文件上传http服务端口
  isHttps: false
});
```

### 鉴权登录 init()

完成初始化后,jssdk 已尝试连接服务器端.如果没有调用 init 方法,则不会维护心跳等协议,只有正确调用登录鉴权后才能持续与 chatServer 保持连接

```javascript
ws.init(
  {
    token: "aaaaaaaaaaa", // 可自定义 用于鉴权判断
    headerImg: "http://XXXX.jpg", // 头像信息
    userId: "123123123", // 用户识别ID, 必须唯一
    nick: "张三", //昵称
    proxy: {
      authProxy: "http://193.112.107.139:8011/chatApplication/auth.do", // 登录鉴权回调地址
      msgResProxy:
        "http://193.112.107.139:8011/chatApplication/messageReveiced.do", //消息通知回调地址
      actionResProxy:
        "http://193.112.107.139:8011/chatApplication/actionMessage.do"
      //动作消息 回调地址
    }
  },
  function() {
    //调用建权成功
    //建议UI逻辑放到该函数下处理
  },
  function(error) {
    console.error(error);
    alert(error);
  }
);
```

### 接收服务器返回对象 recieveData

#### props

| 属性         | 说明                                                 | 类型          |
| ------------ | ---------------------------------------------------- | ------------- |
| code         | 动作唯一标志                                         | Number        |
| status       | 处理状态(0 成功/其他 失败)                           | Number        |
| version      | 当前插件版本                                         | Number        |
| body         | 服务器返回数据对象                                   | Object/String |
| extend       | 发送对象中包含 extend 对象时，接收将返回 extend 对象 | Object        |
| sendUserInfo | 接收会话信息时，返回一个发送人对象                   | Object        |

#### recieveData code 说明

| 值  | 说明                          |
| --- | ----------------------------- |
| 1   | 接收到心跳                    |
| 300 | 接收到连接建立成功            |
| 301 | 接收到建权成功                |
| 302 | 接收到加入房间成功            |
| 303 | 接收到前房间用户列表          |
| 304 | 接收到离开房间                |
| 310 | 接收到房间会话                |
| 311 | 接收到点对点会话              |
| 312 | 接收到动作会话                |
| 315 | 接收到服务器基本信息          |
| 350 | 接收到统一通知,有用户离开房间 |
| 351 | 接收到统一通知,有用户离开房间 |
| 355 | 接受到文件上传处理成功回执    |

## Public Methods

### 监听 on(eventName,callback)

| 事件名 eventName | 说明                       | callback 回调参数       | 回调参数说明                                   |
| ---------------- | -------------------------- | ----------------------- | ---------------------------------------------- |
| online           | 接收用户在线状态消息时触发 | 无                      | 无                                             |
| offline          | 接收用户离线状态消息时触发 | 无                      | 无                                             |
| notification     | 接收通知消息时触发         | recieveData             | 接收返回对象                                   |
| debug            | 插件动作调试信息           | type, desc, time        | 动作类型(req/res), 动作描述, 动作时间          |  |
| recievemessage   | 接收对话消息时触发         | recieveData,messageType | 接收返回对象,数据类型(1 房间会话/2 点对点会话) |

```javascript
//ws监听调试方法
ws.on("debug", function(type, desc, time) {
  if (type === "req") {
    //监听到发送动作调试信息
  } else if (type === "res") {
    //监听到接收动作调试信息
  }
});
```

```javascript
//ws监听通知
ws.on("notification", function(res) {
  if (res.code === 351) {
    //监听到有用户进入房间通知
  }
  if (res.code === 350) {
    //监听到有用户离开房间通知
  }
});
```

```javascript
//ws监听当前用户在线状态
ws.on("online", function() {
  //监听到当前用户已在线状态
});

//ws监听用户离线状态
ws.on("offline", function() {
  //监听到当前用户已离线状态
});
```

```javascript
//ws监听会话
ws.on("recievemessage", function(res, msgType) {
  if (msgType == 1) {
    //监听到房间会话
  } else if (msgType == 2) {
    //监听到点对点会话
  }
});
```

> ---

### 方法 getUserInfo()

获取当前建权通过用户信息

#### 参数

无

#### 返回值

用户信息对象

| 名称     | 类型     | 说明     |
| ---- | ---- | ---- |
| headerImg  | string    | 头像地址    |
| userId   | string    | 用户唯一标识    |
| nick     | string    | 用户昵称     |

```javascript
var userInfo = ws.getUserInfo();
```

> ---

### 方法 getRoomId()

获取当前加入房间 id

#### 参数

无

#### 返回值

房间 id(string)

```javascript
var roomId = ws.getRoomId();
```

> ---

### 方法 destroy()

销毁当前连接

#### 参数

callback 销毁后回调

#### 返回值

无

```javascript
ws.destroy(function() {
  //链接已销毁
});
```

> ---

### 方法 getServerInfo()

获取服务器基本信息

#### 参数

| 名称    | 类型     | 说明     | 回调参数    |
| ------- | -------- | -------- | ----------- |
| success | function | 成功回调 | recieveData |
| error   | function | 失败回调 | 无          |

#### 返回值

无

```javascript
ws.getServerInfo(recieveData) {
  //成功回调
},function(){
  //失败回调
});
```

> ---

### 方法 joinRoom(roomId,success,error)

加入指定房间

#### 参数

| 名称    | 类型     | 说明     | 回调参数    |
| ------- | -------- | -------- | ----------- |
| roomId  | string   | 房间 id  |             |
| success | function | 成功回调 | recieveData |
| error   | function | 失败回调 | 无          |

#### 返回值

无

```javascript
ws.joinRoom(
  roomId,
  function() {
    //进入房间成功
  },
  function() {
    //进入房间失败
  }
);
```

> ---

### 方法 outRoom(success,error)

离开房间

#### 参数

| 名称    | 类型     | 说明     | 回调参数    |
| ------- | -------- | -------- | ----------- |
| success | function | 成功回调 | recieveData |
| error   | function | 失败回调 | 无          |

#### 返回值

无

```javascript
ws.outRoom(
  function() {
    //离开房间成功
  },
  function() {
    //离开房间失败
  }
);
```

> ---

### 方法 getRoomUserList(roomId, success,error)

获取指定房间用户列表

#### 参数

| 名称    | 类型     | 说明     | 回调参数    |
| ------- | -------- | -------- | ----------- |
| roomId  | string   | 房间 id  |             |
| success | function | 成功回调 | recieveData |
| error   | function | 失败回调 | 无          |

#### 返回值

无

```javascript
ws.getRoomUserList(
  roomId,
  function(res) {
    try {
      //获取用户列表成功
      var list = JSON.parse(res.body);
      //打印用户列表数组
      console.log(list);
    } catch (e) {}
  },
  function() {
    //获取用户列表失败
  }
);
```

> ---

### 方法 sendRoomMessage(message, callback, roomId, extend)

发送房间会话消息
参数 message 可自定义

#### 参数

| 名称     | 类型          | 说明           | 回调参数 |
| -------- | ------------- | -------------- | -------- |
| message  | object/string | 会话对象       |          |
| callback | function      | 发送完成回调   | 无       |
| roomId   | string        | 房间 id(可选)  |          |
| extend   | object        | 附加对象(可选) |          |

#### 返回值

无

```javascript
var msgObj = {
  content: msg,
  type: "text" //文字消息
};
ws.sendRoomMessage(msgObj, function() {
  //房间会话消息已发送
});
```

> ---

### 方法 sendP2PMessage(message, userId, callback, extend)

发送点对点会话消息
参数 message 可自定义

#### 参数

| 名称     | 类型          | 说明           | 回调参数 |
| -------- | ------------- | -------------- | -------- |
| message  | object/string | 会话对象       |          |
| userId   | string        | 会话用户 id    |          |
| callback | function      | 发送完成回调   | 无       |
| extend   | object        | 附加对象(可选) |          |

#### 返回值

无

```javascript
var msgObj = {
  content: msg,
  type: "text" //文字消息
};
ws.sendP2PMessage(msgObj, userId, function() {
  //P2P会话消息已发送
});
```

> ---

### 方法 sendActionMessage(param)

发送动作消息

参数 param 必须按指定属性构造

每个动作消息发送会产生一个唯一标识 clientMsgId(string uuid)

#### 参数 param 属性

| 名称    | 类型          | 说明               | 回调参数    |
| ------- | ------------- | ------------------ | ----------- |
| message | object/string | 动作会话对象       |             |
| before  | function      | 开始前执行         | clientMsgId |
| success | function      | 发送完毕执行回调   | clientMsgId |
| recieve | function      | 返回处理回执时调用 | recieveData |

#### 返回值

无

```javascript
ws.sendActionMessage({
  message: {
    text: "发送动作消息"
  },
  before: function(clientMsgId) {
    //发送前准备
    console.log("发送动作准备：" + clientMsgId);
  },
  success: function(clientMsgId) {
    //发送完毕
    console.log("发送动作完毕：" + clientMsgId);
  },
  recieve: function(res) {
    //发送回执
    console.log("发送动作回执：" + JSON.stringify(res));
    console.log(res.clientMsgId);
  }
});
```

> ---

### 方法 upload(param)

上传文件，支持 pc 端上传、cordova 移动端 file-transfer 上传

参数 param 必须按指定属性构造

每个上传动作发送会产生一个唯一标识 clientFileId(string uuid)

#### 参数 param 属性

| 名称    | 类型        | 说明               | 回调参数     |
| ------- | ----------- | ------------------ | ------------ |
| file    | object/file | 上传文件对象       |              |
| before  | function    | 开始前执行         | clientFileId |
| success | function    | 发送完毕执行回调   | clientFileId |
| error   | function    | 发送失败执行回调   | clientFileId |
| recieve | function    | 返回处理回执时调用 | recieveData  |

#### 返回值

无

```javascript
//pc
var $file = $("input[type=file]");
var files = $file[0].files;
var file = files[0];

//cordova
if (window.cordova) {
  var file = {
    uri: mobileFilePath
  };
}

ws.upload({
  file: file,
  before: function(clientFileId) {
    console.log("准备上传");
    console.log(clientFileId);
  },
  success: function() {
    console.log("上传完毕，等待回执");
  },
  error: function() {
    console.log("上传失败");
  },
  progress: function(per) {
    console.log("上传进度：" + per);
  },
  recieve: function(res) {
    console.log("回执：" + JSON.stringify(res));
    console.log(res.clientFileId);

    //将回执以会话形式发出
    var msgObj = {
      content: res,
      type: type
    };

    ws.sendRoomMessage(msgObj, function() {
      console.log("房间消息已发送");
    });
  }
});
```
