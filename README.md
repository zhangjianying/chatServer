# chatServer
基于Netty针对聊天场景优化的消息服务器.服务器协议采用自定义JSON格式,可实现PC与移动端互聊


# 总体架构示意
![架构示意图](https://github.com/zhangjianying/chatServer/raw/master/doc/main.png)

* 应用端集成JS SDK后与chatServer完成相关连接,开发过程侧重界面的编写和逻辑优化.
* webHooks指用户使用js sdk过程中用户登录鉴权由webHooks主动发Http请求到用户业务服务器进行鉴权,鉴权通过后,JS SDK才会与chatServer建立连接.webHooks还能将用户的聊天消息转发送给用户业务服务器保存(chatServer本身不保存任何消息)


# 特点说明
* 轻量级 ,JS SDK不足15K
* 支持 cordova 框架
* 框架自动处理重连问题(针对移动端优化)
* 支持发送文字,图片,文件,视频消息.服务器自带转码等处理


# 例子说明
* ==PC聊天室== 使用JS SDK之后整个聊天室js逻辑代码不超过500行 [进入聊天室](https://zhangjianying.github.io/chatServer/jsSdk/index.html)


# 目录大纲

* [JSSDK 使用说明](doc/jssdk.md)
* WebHooks使用说明
* RestApi使用说明
* 服务器端配置参数说明


#  QA
##  Q: chatServer能维持多少个连接?
A: 目前测试结果是 单实例 1w 连接没有问题.没有找到更好的压测方式.如果你有兴趣可以告知测试方式和结果