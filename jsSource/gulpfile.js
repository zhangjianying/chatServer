"use strict";

/**
 * dist目录需要打包 源文件 / 合并压缩文件
 * 同时打包两种文件
 * 未完成
 */

let gulp = require("gulp"),
  path = require("path"),
  del = require("del"), //删除文件
  minimist = require("minimist"), //获取命令行参数
  concat = require("gulp-concat"), //合并css
  uglify = require("gulp-uglify"), //压缩js插件
  changed = require("gulp-changed"),
  rename = require("gulp-rename"),
  plumber = require("gulp-plumber"), // 错误处理
  gulpSequence = require("gulp-sequence"), //顺序执行插件
  babel = require("gulp-babel"); //es6语法处理

let src_path = "./src",
  dist_path = "./dist",
  cordova_dist_path = "./cordova-example/www/dist";

//命令行获取参数
let envOption = {
  string: "env",
  default: {
    env: process.env.NODE_ENV || "production"
  }
};
let options = minimist(process.argv.slice(2), envOption);

gulp.task("default", function(cb) {
  console.log("start gulp!");
  //gulp --env build
  if (options.env == "build") {
    gulpSequence("babel-js", "babel-minjs", "copy2cordova", cb);
  } else {
    gulpSequence("babel-js", "copy2cordova", "watch", cb);
  }
});

gulp.task("watch", function() {
  console.log("(watch change 1/1) 监视文件变化");

  gulp.watch([src_path + "/**/*.js"], function(event) {
    gulpSequence("babel-js", "copy2cordova")(function(err) {
      if (err) console.log(err);
    });
  });
});

// 清除文件/文件夹
gulp.task("clean-js", function() {
  return del.sync(dist_path + "/**");
});
gulp.task("clean-cordova-js", function() {
  return del.sync(cordova_dist_path + "/**");
});

gulp.task("copy2cordova", ["clean-cordova-js"], function() {
  return gulp.src(dist_path + "/**/*.js").pipe(gulp.dest(cordova_dist_path));
});

gulp.task("babel-minjs", function() {
  return gulp
    .src(dist_path + "/wsWebsocket.js")
    .pipe(
      uglify({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    )
    .pipe(rename("wsWebsocket.min.js"))
    .pipe(changed(dist_path))
    .pipe(gulp.dest(dist_path));
});

gulp.task("babel-js", ["clean-js"], function() {
  return (
    gulp
      .src(src_path + "/**/*.js")
      .pipe(concat("wsWebsocket.js"))
      .pipe(
        plumber({
          errorHandler: function(error) {
            console.log("错误信息:" + error);
            this.emit("end");
          }
        })
      )
      .pipe(
        babel({
          presets: [
            [
              "env",
              {
                targets: {
                  // The % refers to the global coverage of users from browserslist
                  // browsers: [">0.25%", "not ie 11", "not op_mini all"]
                  browsers: ["> 1%", "last 7 versions", "not ie <= 8"]
                }
              }
            ]
          ]
        })
      )
      // .pipe(
      //   uglify({
      //     compress: {
      //       drop_console: true,
      //       drop_debugger: true
      //     }
      //   })
      // )
      .pipe(changed(dist_path))
      .pipe(gulp.dest(dist_path))
  );
});
