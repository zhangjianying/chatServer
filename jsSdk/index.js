$(function() {
  var ws = new wsWebsocket({
    serverIP: "193.112.107.139",
    // serverIP: "192.168.13.173",
    websocketPort: "8099",
    httpPort: "8011",
    isHttps: false
  });
  console.log(ws);

  /**
   * 监听事件
   */
  //用户已在线
  ws.on("online", function() {
    $("#userStatus").html("在线");
  });

  //用户已离线
  ws.on("offline", function() {
    $("#userStatus").html("离线");
  });

  //ws监听调试方法
  ws.on("debug", function(type, msg, time) {
    if (type === "req") {
      //发送
      $("#reqFisrt").after("<p>[" + time + "]" + msg + "</p>");
      $("#reqWindow").scrollTop(0);
    } else if (type === "res") {
      //接收
      $("#resFisrt").after("<p>[" + time + "]" + msg + "</p>");
      $("#resWindow").scrollTop(0);
    }
  });

  //收到通知
  ws.on("notification", function(res) {
    //当有用户退出或进入房间时
    if (res.code === 351 || res.code === 350) {
      //重新获取用户列表
      demoGetRoomUserList();
    }
  });

  /**************************
   *
   *  接受对话信息
   *
   **************************/
  ws.on("recievemessage", function(res, msgType) {
    console.log(res, msgType);
    if (msgType == 1) {
      //房间信息
      renderRoomMessageBox(res);
    } else if (msgType == 2) {
      //点对点信息
      renderP2PMessageBox(res);
    }
  });

  //渲染点对点聊天记录
  var p2pUserId = null; //点对点对象
  function renderP2PMessageBox(res) {
    try {
      console.log(res.sendUserInfo.userId + "发起对话");

      if ($("#myModal:hidden").length) $("#myModal").modal("show");

      if (res.sendUserInfo.userId != ws.getUserInfo().userId) {
        if (p2pUserId !== res.sendUserInfo.userId) {
          $(".modal-content > .content").empty();
          p2pUserId = res.sendUserInfo.userId;
          $(".btn-p2p-test-msg").html(
            "对" + res.sendUserInfo.nick + "发送测试消息"
          );
        }
      }

      let msgObj = JSON.parse(res.body);
      console.log(msgObj);
      var msgBox = "";

      if (res.sendUserInfo.userId == ws.getUserInfo().userId) {
        //右消息渲染
        msgBox =
          '<div class="text-right">' +
          res.sendUserInfo.nick +
          "说：" +
          msgObj.content +
          "</div>";
      } else {
        //左消息渲染
        msgBox =
          '<div class="text-left">' +
          res.sendUserInfo.nick +
          "说：" +
          msgObj.content +
          "</div>";
      }

      $("#myModal .content").append(msgBox);
    } catch (e) {}
  }

  //渲染房间聊天记录
  function renderRoomMessageBox(res) {
    console.log("*********************************");
    console.log(res.body, res.sendUserInfo);
    try {
      let msgObj = JSON.parse(res.body);
      console.log(msgObj);

      var msgBox = "";
      var direction = "";

      if (res.sendUserInfo.userId == ws.getUserInfo().userId) {
        direction = "right";
      } else {
        direction = "left";
      }

      if (msgObj.type === "file") {
        msgBox = renderFileMessageBox(direction, msgObj, res.sendUserInfo);
      } else if (msgObj.type === "image") {
        msgBox = renderImageMessageBox(direction, msgObj, res.sendUserInfo);
      } else if (msgObj.type === "text") {
        msgBox = renderTextMessageBox(direction, msgObj, res.sendUserInfo);
      } else if (msgObj.type === "video") {
        msgBox = renderVideoMessageBox(direction, msgObj, res.sendUserInfo);
      }

      // console.log(msgBox);
      $("#roomChatContent").append(msgBox);
    } catch (e) {}
  }

  function renderTextMessageBox(direction, msgObj, sendUserInfo) {
    var msgBox =
      '<div class="chat-box ' +
      direction +
      '-chat-box clearfix"><div>' +
      sendUserInfo.nick +
      "说：" +
      msgObj.content +
      "</div></div>";
    return msgBox;
  }

  function renderImageMessageBox(direction, msgObj, sendUserInfo) {
    var msgBox =
      '<div class="chat-box ' +
      direction +
      '-chat-box clearfix"><div><p>' +
      sendUserInfo.nick +
      "说：" +
      "</p>" +
      "<p><img src='" +
      msgObj.content.url +
      "/80'></p>" +
      "</div></div>";
    return msgBox;
  }

  function renderFileMessageBox(direction, msgObj, sendUserInfo) {
    var msgBox =
      '<div class="chat-box ' +
      direction +
      '-chat-box clearfix"><div><p>' +
      sendUserInfo.nick +
      "说：" +
      "</p>" +
      "<p><a style='color: #fff;text-decoration:underline;' href='" +
      msgObj.content.url +
      "'>" +
      msgObj.content.orgFileName +
      "下载</a></p>" +
      "</div></div>";
    return msgBox;
  }

  function renderVideoMessageBox(direction, msgObj, sendUserInfo) {
    var msgBox =
      '<div class="chat-box ' +
      direction +
      '-chat-box clearfix"><div><p>' +
      sendUserInfo.nick +
      "说：" +
      "</p>" +
      "<p><video  width='320' height='240' controls" +
      " ><source src='" +
      msgObj.content.url +
      "' type='video/mp4'>  </video></p>" +
      "</div></div>";
    return msgBox;
  }

  /**
   * 开始渲染页面
   */
  renderLogin();

  function clearEvent() {
    $("body").off("click");
    $("body").off("change");
  }

  //渲染登录页
  function renderLogin() {
    $("#chatPanel").hide();
    $("#loginPanel").show();
    clearEvent();

    //销毁链接
    demoDestroy();
    //渲染页面
    $("#userId").val(RandomNum(100000, 999999));
    $("body").on("click", ".btn-login", demoLogin);
  }

  function RandomNum(Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    if (Math.round(Rand * Range) == 0) {
      return Min + 1;
    } else if (Math.round(Rand * Max) == Max) {
      index++;
      return Max - 1;
    } else {
      var num = Min + Math.round(Rand * Range) - 1;
      return num;
    }
  }

  /**************************
   *
   *  登录
   *
   **************************/
  function demoLogin() {
    if (ws.socket) {
      console.log("=======当前已存在链接========");
      return;
    }

    let nickName = $.trim($("#nickName").val());
    let userId = $.trim($("#userId").val());

    if (!nickName) {
      return;
    }
    if (!userId) {
      return;
    }

    /**
     * 调用init方法建立连接
     */
    ws.init(
      {
        token: "aaaaaaaaaaa",
        headerImg: "aaaaaaaa",
        userId: userId,
        nick: nickName,
        proxy: {
          // authProxy: "http://192.168.13.173:8011/chatApplication/auth.do",
          // msgResProxy:
          //   "http://192.168.13.173:8011/chatApplication/messageReveiced.do",
          // actionResProxy:
          //   "http://192.168.13.173:8011/chatApplication/actionMessage.do"
          authProxy: "http://193.112.107.139:8011/chatApplication/auth.do",
          msgResProxy:
            "http://193.112.107.139:8011/chatApplication/messageReveiced.do",
          actionResProxy:
            "http://193.112.107.139:8011/chatApplication/actionMessage.do"
        }
      },
      function() {
        //调用建权成功,选择进入房间
        renderRoomForm();
      },
      function(error) {
        console.error(error);
      }
    );
  }

  //渲染加入房间表单
  function renderRoomForm() {
    $("#loginPanel").hide();
    $("#chatPanel").show();
    $("#chatRoomForm").show();
    $("#chatRoomPanel").hide();
    clearEvent();
    addChatPublicEvents();

    var userInfo = ws.getUserInfo();
    if (userInfo) {
      $("#userInfo").html(userInfo.nick + " / " + userInfo.userId);
    }
    $("body").on("click", ".btn-join-room", demoJoinRoom); //加入房间
  }

  /**************************
   *
   *  加入房间
   *
   **************************/
  function demoJoinRoom() {
    var roomId = $.trim($("#roomId").val());
    if (!roomId) {
      return;
    }

    /**
     * 调用joinRoom方法加入指定房间
     */
    ws.joinRoom(
      roomId,
      function() {
        console.log("已进入房间");
        renderRoomChat();
      },
      function() {
        console.log("无法进入房间");
        alert("进入房间失败");
      }
    );
  }

  /**************************
   *
   *  断开连接
   *
   **************************/
  function demoDestroy() {
    ws.destroy();
  }

  /**************************
   *
   *  退出房间
   *
   **************************/
  function demoOutRoom() {
    /**
     * 调用outRoom方法离开当前房间
     */
    ws.outRoom(
      function() {
        $("#roomChatContent").empty();
        renderRoomForm();
      },
      function() {}
    );
  }

  //清空调试信息
  function clearDebug() {
    $("#reqFisrt")
      .nextAll()
      .remove();
    $("#resFisrt")
      .nextAll()
      .remove();
  }

  /**************************
   *
   *  服务器基本信息
   *
   **************************/
  function demoGetServerInfo() {
    ws.getServerInfo(
      function(res) {
        console.log(res);
        alert("在线人数：" + res.userCount + "\n" + "版本号：" + res.version);
      },
      function() {}
    );
  }

  //注册公共事件
  function addChatPublicEvents() {
    $("body").on("click", ".btn-unlink", demoDestroy); //断开连接
    $("body").on("click", ".btn-relink", renderLogin); //重新登录
    $("body").on("click", ".btn-out-room", demoOutRoom); //退出房间
    $("body").on("click", ".btn-clear", clearDebug); //清空调试信息
    $("body").on("click", ".btn-server", demoGetServerInfo); //服务器基本信息
  }

  function renderRoomChat() {
    $("#loginPanel").hide();
    $("#chatPanel").show();
    $("#chatRoomForm").hide();
    $("#chatRoomPanel").show();
    clearEvent();
    addChatPublicEvents();

    renderChatListStatus();
    $("body").on("click", ".userlist > li", startP2PChat); //打开点对点面板
    $("body").on("click", ".btn-p2p-test-msg", demoP2PChat); //发送点对点聊天
    $("body").on("click", ".btn-send-text-msg", sendTextMessage); //发送房间信息
    $("body").on("click", ".btn-send-action", sendActionMessage); //发送动作信息
    $("body").on("click", ".btn-send-file", function() {
      $("input[name=upfile]").trigger("click");
    });
    $("body").on("change", "input[name=upfile]", demoUploadFile); //发送文件
  }

  //当前房间状态
  function renderChatListStatus() {
    $(".chatlist-status > span").html("房间" + ws.getRoomId());
    $("#roomChatContent").empty();
  }

  function startP2PChat(e) {
    let $this = $(e.currentTarget);
    if (ws.getUserInfo().userId == $this.data().id) {
      alert("不能对自己发起聊天");
      return;
    }
    p2pUserId = $this.data().id;

    $(".btn-p2p-test-msg").html("对" + $this.data().nick + "发送测试消息");
    if ($("#myModal:hidden").length) $("#myModal").modal("show");
  }

  $("#myModal").on("hide.bs.modal", function(event) {
    $(".modal-content > .content").empty();
    p2pUserId = null;
  });

  /**************************
   *
   *  点对点聊天
   *
   **************************/
  function demoP2PChat() {
    if (!p2pUserId) {
      alert("没有消息对象");
      return;
    }
    console.log("对" + p2pUserId + "发起对话");
    ws.sendP2PMessage({ content: "测试消息", type: "text" }, p2pUserId);
  }

  /**************************
   *
   *  获取房间用户列表
   *
   **************************/
  function demoGetRoomUserList() {
    var roomId = ws.getRoomId();
    ws.getRoomUserList(
      roomId,
      function(res) {
        try {
          var list = JSON.parse(res.body);
          renderRoomUserList(list);
        } catch (e) {}
      },
      function() {}
    );
  }

  function renderRoomUserList(arr) {
    var html_str = "";
    $.each(arr, function(i, v) {
      html_str +=
        '<li data-id="' +
        v.userId +
        '" data-nick="' +
        v.nick +
        '">' +
        v.userId +
        "-" +
        v.nick +
        "</li>";
    });
    $(".userlist").html(html_str);

    $(".userlist-count > span").html(arr.length);
  }

  /**************************
   *
   *  发送房间信息
   *
   **************************/
  function sendTextMessage() {
    var msg = $.trim($(".text-msg-input").val());
    if (!msg) {
      return;
    }

    /**
     * 消息内容类型任意
     */
    var msgObj = {
      content: msg,
      type: "text"
    };

    //发送房间消息
    ws.sendRoomMessage(msgObj, function() {
      console.log("房间消息已发送");
      $(".text-msg-input").val("");
    });
  }

  /**************************
   *
   *  发送动作消息
   *
   **************************/
  function sendActionMessage() {
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
        //发送回执
        console.log("发送动作回执：" + JSON.stringify(res));
        console.log(res.clientMsgId);
        alert(res.msg);
      }
    });
  }

  /**************************
   *
   *  上传文件 / PC
   *
   **************************/
  function demoUploadFile(e) {
    var $file = $(e.currentTarget);
    var files = $file[0].files;

    if (!files) {
      console.log("没有选择文件");
      return;
    }

    console.log(files);
    var type = checkFileType(files[0].name);

    if (!type) {
      return;
    }

    ws.upload({
      file: files[0],
      before: function(clientFileId) {
        $file.val("");
        console.log("准备上传");
        console.log(clientFileId);
      },
      success: function() {
        console.log("上传完了，等待回执");
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

        /**
         * 消息内容类型任意
         */
        var msgObj = {
          content: res,
          type: type
        };

        ws.sendRoomMessage(msgObj, function() {
          console.log("房间消息已发送");
        });
      }
    });
  }

  //判断文件类型
  function checkFileType(name) {
    if (!name) {
      return false;
    }

    if (/\.(gif|jpg|jpeg|png|GIF|JPG|PNG)$/.test(name)) {
      // alert("图片类型必须是.gif,jpeg,jpg,png中的一种");
      return "image";
    }

    if (/\.(mp4|avi)$/.test(name)) {
      // alert("图片类型必须是.gif,jpeg,jpg,png中的一种");
      return "video";
    }

    return "file";
  }
});
