# Trilium Notes

This project is a hard fork of [zadam/trilium](https://github.com/zadam/trilium) at version 0.63.7. Its primary goals are to upgrade security-related dependencies and introduce practical improvements to enhance the note-taking experience.

[English](https://github.com/nriver/trilium-plus/blob/master/README.md) | [中文](https://github.com/nriver/trilium-plus/blob/master/README-ZH_CN.md)

Trilium Notes is a hierarchical note taking application with focus on building large personal knowledge bases. 

See [screenshots](https://github.com/nriver/trilium-plus/wiki/Screenshot-tour) for quick overview:

<a href="https://github.com/nriver/trilium-plus/wiki/Screenshot-tour"><img src="https://raw.githubusercontent.com/wiki/nriver/trilium-plus/images/screenshot.png" alt="Trilium Screenshot" width="1000"></a>


## 🎁 Features

* Notes can be arranged into arbitrarily deep tree. Single note can be placed into multiple places in the tree (see [cloning](https://github.com/nriver/trilium-plus/wiki/Cloning-notes))
* Rich WYSIWYG note editing including e.g. tables, images and [math](https://github.com/nriver/trilium-plus/wiki/Text-notes#math-support) with markdown [autoformat](https://github.com/nriver/trilium-plus/wiki/Text-notes#autoformat)
* Support for editing [notes with source code](https://github.com/nriver/trilium-plus/wiki/Code-notes), including syntax highlighting
* Fast and easy [navigation between notes](https://github.com/nriver/trilium-plus/wiki/Note-navigation), full text search and [note hoisting](https://github.com/nriver/trilium-plus/wiki/Note-hoisting)
* Seamless [note versioning](https://github.com/nriver/trilium-plus/wiki/Note-revisions)
* Note [attributes](https://github.com/nriver/trilium-plus/wiki/Attributes) can be used for note organization, querying and advanced [scripting](https://github.com/nriver/trilium-plus/wiki/Scripts)
* [Synchronization](https://github.com/nriver/trilium-plus/wiki/Synchronization) with self-hosted sync server
  * there's a [3rd party service for hosting synchronisation server](https://trilium.cc/paid-hosting)
* [Sharing](https://github.com/nriver/trilium-plus/wiki/Sharing) (publishing) notes to public internet
* Strong [note encryption](https://github.com/nriver/trilium-plus/wiki/Protected-notes) with per-note granularity
* Sketching diagrams with built-in Excalidraw (note type "canvas")
* [Relation maps](https://github.com/nriver/trilium-plus/wiki/Relation-map) and [link maps](https://github.com/nriver/trilium-plus/wiki/Link-map) for visualizing notes and their relations
* [Scripting](https://github.com/nriver/trilium-plus/wiki/Scripts) - see [Advanced showcases](https://github.com/nriver/trilium-plus/wiki/Advanced-showcases)
* [REST API](https://github.com/nriver/trilium-plus/wiki/ETAPI) for automation
* Scales well in both usability and performance upwards of 100 000 notes
* Touch optimized [mobile frontend](https://github.com/nriver/trilium-plus/wiki/Mobile-frontend) for smartphones and tablets
* [Night theme](https://github.com/nriver/trilium-plus/wiki/Themes)
* [Evernote](https://github.com/nriver/trilium-plus/wiki/Evernote-import) and [Markdown import & export](https://github.com/nriver/trilium-plus/wiki/Markdown)
* [Web Clipper](https://github.com/nriver/trilium-plus/wiki/Web-clipper) for easy saving of web content

Check out [awesome-trilium](https://github.com/Nriver/awesome-trilium) for 3rd party themes, scripts, plugins and more.

## 🏗 Builds

Trilium is provided as either desktop application (Linux and Windows) or web application hosted on your server (Linux). Mac OS desktop build is available, but it is [unsupported](https://github.com/nriver/trilium-plus/wiki/FAQ#mac-os-support).

* If you want to use Trilium on the desktop, download binary release for your platform from [latest release](https://github.com/nriver/trilium-plus/releases/latest), unzip the package and run ```trilium``` executable.
* If you want to install Trilium on server, follow [this page](https://github.com/nriver/trilium-plus/wiki/Server-installation).
  * Currently only recent Chrome and Firefox are supported (tested) browsers.

## 📝 Documentation

[See wiki for complete list of documentation pages.](https://github.com/nriver/trilium-plus/wiki/)

You can also read [Patterns of personal knowledge base](https://github.com/nriver/trilium-plus/wiki/Patterns-of-personal-knowledge-base) to get some inspiration on how you might use Trilium.

## 💻 Contribute

Clone locally and run
```
pnpm install
pnpm run start-server
```

## 📢 Shoutouts

* [CKEditor 5](https://github.com/ckeditor/ckeditor5) - best WYSIWYG editor on the market, very interactive and listening team
* [FancyTree](https://github.com/mar10/fancytree) - very feature rich tree library without real competition. Trilium Notes would not be the same without it.
* [CodeMirror](https://github.com/codemirror/CodeMirror) - code editor with support for huge amount of languages
* [jsPlumb](https://github.com/jsplumb/jsplumb) - visual connectivity library without competition. Used in [relation maps](https://github.com/nriver/trilium-plus/wiki/Relation-map) and [link maps](https://github.com/nriver/trilium-plus/wiki/Link-map)

## 💰 Donation

Hello! If you appreciate my work, kindly consider backing me. Your support is greatly appreciated. Thank you!

Alipay:  
<img width="195" height="193" alt="alipay" src="https://github.com/user-attachments/assets/6e496149-f229-4394-bfc3-1d3785f0cb4f" />


Wechat Pay:  
<img width="192" height="193" alt="wechat_pay" src="https://github.com/user-attachments/assets/57e40834-9f2e-4f3a-846f-bd55f7c31723" />

Ko-fi:  
[![Support Me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/nriver)

## 🔑 License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
