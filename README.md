# chatServer
基于Netty针对聊天场景优化的消息服务器.服务器协议采用自定义JSON格式,可实现PC与移动端互聊


# 总体架构示意
![架构示意图](https://github.com/zhangjianying/chatServer/raw/master/doc/main.png)

* 应用端集成JS SDK后与chatServer完成相关连接,开发过程侧重界面的编写和逻辑优化.
* webHooks指用户使用js sdk过程中用户登录鉴权由webHooks主动发Http请求到用户业务服务器进行鉴权,鉴权通过后,JS SDK才会与chatServer建立连接.webHooks还能将用户的聊天消息转发送给用户业务服务器保存(chatServer本身不保存任何消息)

