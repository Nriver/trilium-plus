# Trilium Notes

本项目是 [zadam/trilium](https://github.com/zadam/trilium) 0.63.7 版本的硬分叉。主要目标是升级安全相关依赖，并引入实用改进以提升笔记体验。

Trilium Notes 是一个层次化的笔记应用程序，专注于建立大型个人知识库。请参阅[屏幕截图](https://github.com/nriver/trilium-plus/wiki/Screenshot-tour)以快速了解：

<a href="https://github.com/nriver/trilium-plus/wiki/Screenshot-tour"><img src="https://raw.githubusercontent.com/wiki/nriver/trilium-plus/images/screenshot.png" alt="Trilium Screenshot" width="1000"></a>

## 特性

* 笔记可以排列成任意深的树。单个笔记可以放在树中的多个位置（请参阅[克隆](https://github.com/nriver/trilium-plus/wiki/Cloning-notes)）
* 丰富的所见即所得笔记编辑功能，包括带有 Markdown [自动格式化功能的](https://github.com/nriver/trilium-plus/wiki/Text-notes#autoformat)表格，图像和[数学](https://github.com/nriver/trilium-plus/wiki/Text-notes#math-support)
* 支持编辑[使用源代码的笔记](https://github.com/nriver/trilium-plus/wiki/Code-notes)，包括语法高亮显示
* 笔记之间快速[导航](https://github.com/nriver/trilium-plus/wiki/Note-navigation)，全文搜索和[笔记聚焦](https://github.com/nriver/trilium-plus/wiki/Note-hoisting)
* 无缝[笔记版本控制](https://github.com/nriver/trilium-plus/wiki/Note-revisions)
* 笔记[属性](https://github.com/nriver/trilium-plus/wiki/Attributes)可用于笔记组织，查询和高级[脚本编写](https://github.com/nriver/trilium-plus/wiki/Scripts)
* [同步](https://github.com/nriver/trilium-plus/wiki/Synchronization)与自托管同步服务器
  * 有一个[第三方提供的同步服务器托管服务](https://trilium.cc/paid-hosting)
* 公开地[分享](https://github.com/nriver/trilium-plus/wiki/Sharing)（发布）笔记到互联网
* 具有按笔记粒度的强大的[笔记加密](https://github.com/nriver/trilium-plus/wiki/Protected-notes)
* 使用自带的 Excalidraw 来绘制图表（笔记类型“画布”）
* [关系图](https://github.com/nriver/trilium-plus/wiki/Relation-map)和[链接图](https://github.com/nriver/trilium-plus/wiki/Link-map)，用于可视化笔记及其关系
* [脚本](https://github.com/nriver/trilium-plus/wiki/Scripts) - 请参阅[高级功能展示](https://github.com/nriver/trilium-plus/wiki/Advanced-showcases)
* 在拥有超过 10 万条笔记时仍能保持良好的可用性和性能
* 针对智能手机和平板电脑进行优化的[用于移动设备的前端](https://github.com/nriver/trilium-plus/wiki/Mobile-frontend)
* [夜间主题](https://github.com/nriver/trilium-plus/wiki/Themes)
* [Evernote](https://github.com/nriver/trilium-plus/wiki/Evernote-import) 和 [Markdown 导入导出](https://github.com/nriver/trilium-plus/wiki/Markdown)功能
* 使用[网页剪藏](https://github.com/nriver/trilium-plus/wiki/Web-clipper)轻松保存互联网上的内容

## 构建

Trilium 可以用作桌面应用程序（Linux 和 Windows）或服务器（Linux）上托管的 Web 应用程序。虽然有 macOS 版本的桌面应用程序，但它[不受支持](https://github.com/nriver/trilium-plus/wiki/FAQ#mac-os-support)。

* 如果要在桌面上使用 Trilium，请从[最新版本](https://github.com/nriver/trilium-plus/releases/latest)下载适用于您平台的二进制版本，解压缩该软件包并运行`trilium`可执行文件。
* 如果要在服务器上安装 Trilium，请参考[此页面](https://github.com/nriver/trilium-plus/wiki/Server-installation)。
  * 当前仅支持（测试过）最近发布的 Chrome 和 Firefox 浏览器。

## 文档

[有关文档页面的完整列表，请参见 Wiki。](https://github.com/nriver/trilium-plus/wiki/)

* [Wiki 的中文翻译版本](https://github.com/baddate/trilium/wiki/)

您还可以阅读[个人知识库模式](https://github.com/nriver/trilium-plus/wiki/Patterns-of-personal-knowledge-base)，以获取有关如何使用 Trilium 的灵感。

## 贡献

克隆本仓库到本地，并运行

```
pnpm install
pnpm run start-server
```

## 致谢

* [CKEditor 5](https://github.com/ckeditor/ckeditor5) - 市面上最好的所见即所得编辑器，拥有互动性强且聆听能力强的团队
* [FancyTree](https://github.com/mar10/fancytree) - 一个非常丰富的关于树的库，强大到没有对手。没有它，Trilium Notes 将不会如此。
* [CodeMirror](https://github.com/codemirror/CodeMirror) - 支持大量语言的代码编辑器
* [jsPlumb](https://github.com/jsplumb/jsplumb) - 强大的可视化连接库。用于[关系图](https://github.com/nriver/trilium-plus/wiki/Relation-map)和[链接图](https://github.com/nriver/trilium-plus/wiki/Link-map)

# 💰 捐赠

如果你觉得我做的对你有帮助, 欢迎捐赠, 这对我来说是莫大的鼓励!

支付宝:  
<img width="195" height="193" alt="alipay" src="https://github.com/user-attachments/assets/6e496149-f229-4394-bfc3-1d3785f0cb4f" />

微信:  
<img width="192" height="193" alt="wechat_pay" src="https://github.com/user-attachments/assets/57e40834-9f2e-4f3a-846f-bd55f7c31723" />

Ko-fi:  
[![Support Me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/nriver)

## 许可证

本程序是自由软件：你可以再发布本软件和/或修改本软件，只要你遵循 Free Software Foundation 发布的 GNU Affero General Public License 的第三版或者任何（由你选择）更晚的版本。
