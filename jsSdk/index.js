$(function() {
  //渲染页面
  $("#userId").val(RandomNum(100000, 999999));

  //wsWebsocket实例
  var ws = new wsWebsocket({
    serverIP: "193.112.107.139",
    // serverIP: "192.168.13.173",
    websocketPort: "8099",
    httpPort: "8011",
    isHttps: false
  });

  // var ws = new wsWebsocket(
  // "ws://192.168.13.173:8099/chatApplication/websocket"
  //   "ws://193.112.107.139:8099/chatApplication/websocket"
  // );
  console.log(ws);

  //ws必须等待建权成功
  ws.on(
    "ready",
    function() {
      //只执行一次
    },
    function(error) {
      console.error("error", error);
    }
  );

  //用户已在线
  ws.on("online", function() {
    $("#userStatus").html("在线");
    $("#loginPanel").hide();
    $("#chatPanel").show();

    var userInfo = ws.getUserInfo();
    if (userInfo) {
      $("#userInfo").html(userInfo.nick + " / " + userInfo.userId);
    }
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

  /**************************
   *
   *
   *  断开连接
   *
   *
   **************************/
  $(".btn-unlink").on("click", demoDestroy);
  function demoDestroy() {
    /**
     * 调用destroy方法断开连接
     */
    ws.destroy();
  }

  /**************************
   *
   *
   *  登录
   *
   *
   **************************/
  $(".btn-login").on("click", demoLogin);
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
    ws.init({
      token: "aaaaaaaaaaa",
      headerImg: "aaaaaaaa",
      userId: userId,
      nick: nickName,
      proxy: {
        // authProxy: "http://192.168.13.173:8011/chatApplication/auth.do",
        // msgResProxy:
        //   "http://192.168.13.173:8011/chatApplication/messageReveiced.do"
        authProxy: "http://193.112.107.139:8011/chatApplication/auth.do",
        msgResProxy:
          "http://193.112.107.139:8011/chatApplication/messageReveiced.do"
      }
    });
  }

  /**************************
   *
   *
   *  收到通知
   *
   *
   **************************/
  ws.on("notification", function(res) {
    console.log("============================");
    console.log(res);
    //当有用户退出或进入房间时
    if (res.code === 351 || res.code === 350) {
      //重新获取用户列表
      demoGetRoomUserList();
    }
  });

  /**************************
   *
   *
   *  服务器基本信息
   *
   *
   **************************/
  $(".btn-server").on("click", demoGetServerInfo);
  function demoGetServerInfo() {
    ws.getServerInfo(
      function(res) {
        console.log(res);
      },
      function() {}
    );
  }

  /**************************
   *
   *
   *  退出房间
   *
   *
   **************************/
  $(".btn-out-room").on("click", demoOutRoom);
  function demoOutRoom() {
    /**
     * 调用outRoom方法离开当前房间
     */
    ws.outRoom(
      function() {
        $("#chatRoomForm").show();
        $("#chatRoomPanel").hide();
        $("#roomChatContent").empty();
      },
      function() {}
    );
  }

  /**************************
   *
   *
   *  加入房间
   *
   *
   **************************/
  $(".btn-join-room").on("click", demoJoinRoom);
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
        $("#chatRoomForm").hide();
        $("#chatRoomPanel").show();
        renderChatListStatus({ roomId: roomId });
      },
      function() {
        console.log("无法进入房间");
        alert("进入房间失败");
      }
    );
  }

  function renderChatListStatus(obj) {
    $(".chatlist-status > span").html("房间" + obj.roomId);
    $("#roomChatContent").empty();
  }

  /**************************
   *
   *
   *  获取房间用户列表
   *
   *
   **************************/
  function demoGetRoomUserList() {
    var roomId = ws.getRoomId();
    ws.getRoomUserList(
      roomId,
      function(res) {
        console.log("======================================");
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
   *
   *  接受对话信息
   *
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
          msgObj.text +
          "</div>";
      } else {
        //左消息渲染
        msgBox =
          '<div class="text-left">' +
          res.sendUserInfo.nick +
          "说：" +
          msgObj.text +
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

      if (res.sendUserInfo.userId == ws.getUserInfo().userId) {
        //右消息渲染
        msgBox =
          '<div class="chat-box right-chat-box clearfix"><div>' +
          res.sendUserInfo.nick +
          "说：" +
          msgObj.text +
          "</div></div>";
      } else {
        //左消息渲染
        msgBox =
          '<div class="chat-box left-chat-box clearfix"><div>' +
          res.sendUserInfo.nick +
          "说：" +
          msgObj.text +
          "</div></div>";
      }

      // console.log(msgBox);
      $("#roomChatContent").append(msgBox);
    } catch (e) {}
  }

  /**************************
   *
   *
   *  点对点聊天
   *
   *
   **************************/
  $(".btn-p2p-test-msg").on("click", function() {
    if (!p2pUserId) {
      alert("没有消息对象");
      return;
    }
    console.log("对" + p2pUserId + "发起对话");
    ws.sendP2PMessage({ text: "测试消息", type: "text" }, p2pUserId);
  });

  //开始点对点聊天面板
  $("body").on("click", ".userlist > li", function() {
    if (ws.getUserInfo().userId == $(this).data().id) {
      alert("不能对自己发起聊天");
      return;
    }
    p2pUserId = $(this).data().id;

    $(".btn-p2p-test-msg").html("对" + $(this).data().nick + "发送测试消息");
    if ($("#myModal:hidden").length) $("#myModal").modal("show");
  });

  $("#myModal").on("show.bs.modal", function(event) {});

  $("#myModal").on("hide.bs.modal", function(event) {
    $(".modal-content > .content").empty();
    p2pUserId = null;
  });

  /**************************
   *
   *
   *  发送房间信息
   *
   *
   **************************/
  function demoSendRoomMessage(msg) {
    //发送房间消息
    ws.sendRoomMessage(msg, function() {
      console.log("房间消息已发送");
      $(".text-msg-input").val("");
    });
  }

  //发送文字聊天记录
  $(".btn-send-text-msg").on("click", sendTextMessage);
  function sendTextMessage() {
    var msg = $.trim($(".text-msg-input").val());
    if (!msg) {
      return;
    }

    console.log(msg);
    /**
     * 消息内容类型任意
     */
    var msgObj = {
      text: msg,
      type: "text"
    };

    demoSendRoomMessage(msgObj);
  }

  /**
   * 注册事件
   */
  $(".btn-relink").on("click", relink);
  function relink() {
    demoDestroy();
    $("#loginPanel").show();
    $("#chatPanel").hide();
    $("#chatRoomForm").show();
    $("#chatRoomPanel").hide();
  }

  $(".btn-clear").on("click", clearDebug);
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
   *
   *  上传文件 / PC
   *
   *
   **************************/
  // ws.upload({
  //   file: null,
  //   before: function() {},
  //   success: function() {},
  //   error: function() {},
  //   progress: function() {},
  //   recieve: function() {}
  // });

  $(".btn-send-file").on("click", function() {
    $("input[name=upfile]").trigger("click");
  });

  $("input[name=upfile]").on("change", function() {
    var $file = $(this);
    var files = $file[0].files;

    if (!files) {
      console.log("没有选择文件");
      return;
    }

    console.log(files);

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
      }
    });
  });

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
});
