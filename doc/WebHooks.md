# webHooks 说明
chatServer 主动将关键事件通过HTTP/JSON请求发送给业务服务器进行处理

注意

* webHooks的回调地址要求 10 秒内必须回应,否则做失败结果处理

## 1 登录鉴权webHooks
当用户使用JS SDK 的init方法传入用户信息的时候,会携带proxy参数, 其中authProxy参数地址,即登录鉴权的回调地址
```javascript
 ws.init({
      token: "aaaaaaaaaaa", // 鉴权token
      headerImg: "aaaaaaaa", // 头像地址 http之类可访问地址
      userId: '323123',  //只能是数字
      nick: '张三', //昵称
      proxy: {
        authProxy: "http://193.112.107.139:8011/chatApplication/auth.do",
        msgResProxy:
          "http://193.112.107.139:8011/chatApplication/messageReveiced.do"
      },
			 actionResProxy:
          "http://193.112.107.139:8011/chatApplication/actionMessage.do"
    });
```

chatServer会将整个 init参数体中的信息回传给authProxy接口,由authProxy接口判断userid与token是否通过鉴权,再返回
```json
{
  retVal:true   // true表示通过 false表示未通过
}
```
只有返回true的情况下 ,jssdk 才会与chatServer 建立有效连接

SpringMVC接口示例:
```java
/**
	 * 登录连接验证
	 */
	@RequestMapping(value = "auth.do", method = RequestMethod.POST)
	@ResponseBody
	public JSONObject auth(@RequestBody String params, HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		logger.info("收到的验证请求 [{}]", params);

		// 验证成功就返回true. 否则返回false表示失败
		JSONObject jsonObject = new JSONObject();
		jsonObject.put("retVal", true);
		return jsonObject;
	}
```

## 2 消息通知webHooks
所有聊天消息都会由chatServer主动推送给业务服务器,chatServer自己不做任何消息保存.

init 中 proxy.msgResProxy 参数地址既是消息通知回调地址

回调信息结构
```json
{
desc:'房间消息' ,
type: 1,  //1点对点消息   2房间消息
sendUserId:xxx , //发送者userid
content:''XXX //消息
}
```


SpringMVC接口示例:
```java
@RequestMapping(value = "messageReveiced.do", method = RequestMethod.POST)
	@ResponseBody
	public JSONObject messageReveiced(@RequestBody String params, HttpServletRequest request,
			HttpServletResponse response) throws Exception {
		logger.info("收到的对话消息 [{}]", params);


		JSONObject jsonObject = new JSONObject();
		jsonObject.put("retVal", true);
		return jsonObject;
	}
```


## 3 动作消息 webHooks
使用 js sdk 发起动作消息的时候, chatServer会将原始消息结构直接转发给业务处理服务器,待业务处理服务器处理完成后,并发送处理结果给jssdk

```javascript
 ws.sendActionMessage({
      message: {
        text: "我就是测试下"
      },
      before: function(clientMsgId) {
        //发送前准备
        console.log("发送动作准备中：" + clientMsgId);
      },
      success: function(clientMsgId) {
        //发送完毕
        console.log("发送动作完毕：" + clientMsgId);
      },
      recieve: function(res) {
        //发送回执   ,回执消息根据业务处理器处理结果返回消息体
        console.log("发送动作回执：" + JSON.stringify(res));
        console.log(res.clientMsgId);
        alert(res.msg);
      }
    });
```

服务器端:

```java
	/**
	 * 动作消息 -- 回复
	 */
	@RequestMapping(value = "actionMessage.do", method = RequestMethod.POST)
	@ResponseBody
	public JSONObject actionMessage(@RequestBody String params, HttpServletRequest request,
			HttpServletResponse response) throws Exception {
		logger.info("收到的动作消息 [{}]", params);

		// 验证成功就返回true. 否则返回false表示失败
		JSONObject jsonObject = new JSONObject();
		jsonObject.put("retVal", true);
		jsonObject.put("msg", "这是动作消息:" + System.currentTimeMillis());
		return jsonObject;
	}
```