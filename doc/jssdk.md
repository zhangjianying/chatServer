# JS SDK使用说明

## 编译源码
程序使用gulp进行打包编译,首先需要 安装编译依赖
```node
  npm install
  npm -g install gulp
```
编译min版本
```node
  gulp --env=build
```

## js sdk 使用方法说明
先在html中引入js sdk

```html
 <script src="wsWebsocket.min.js"></script>
```

### 初始化--设置服务器连接基本信息
页面初始化前需要设置连接的服务器信息

```javascript
  var ws = new wsWebsocket({
    serverIP: "193.112.107.139",
    websocketPort: "8099",  // 连接端口
    httpPort: "8011", //文件上传http服务端口
    isHttps: false
  });
```

### 鉴权登录 init()
完成初始化后,jssdk已尝试连接服务器端.如果没有调用init方法,则不会维护心跳等协议,只有正确调用登录鉴权后才能持续与chatServer保持连接

```javascript
  ws.init(
      {
        token: "aaaaaaaaaaa",  // 可自定义 用于鉴权判断
        headerImg: "http://XXXX.jpg", // 头像信息
        userId: '123123123', // 用户识别ID, 必须唯一
        nick: '张三', //昵称
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
