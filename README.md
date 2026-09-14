# A Pocket Atlas · 私人旅行手记

以 LEGO 积木风格搭建的 Three.js 交互地球，计划用于展示旅行地点和精选风景照。

## 本地运行

需要 Node.js 18+、npm 和 Python 3。当前没有需要安装的 npm 依赖。

```sh
npm start
```

打开 http://127.0.0.1:4173/ 。服务直接读取 `src/`，修改源码后刷新网页即可，无热更新。
端口已被占用时先停止旧的本地预览，不要重复启动。

```sh
npm run build
npm run preview
```

构建生成 `dist/`，预览命令只读取构建结果；运行预览前需停止同端口的开发服务。
所有命令仅在本地运行，没有 `deploy` 命令，也不会 push 或发布。

## 文件结构

- `src/index.html`：页面 HTML、CSS、Three.js 程序化模型及交互。
- `src/antarctica-coastline.js`：南极洲海岸线数据。
- `src/travel-ui.js`、`src/travel-ui.css`：地点菜单、相册侧栏及照片大图浏览。
- `src/albums.json`：各地点 / 城市的照片清单。
- `scripts/build.mjs`：将 `src/` 的公开文件递归复制到 `dist/` 并生成 `.nojekyll`。
- `dist/`：可供 GitHub Pages 使用的静态构建产物，不提交 Git。

## 当前实现

原生 JavaScript + Three.js 0.164.1，通过 import map 从 jsDelivr 加载；字体使用 Google Fonts，
因此首次加载仍需访问这些外部资源。无 React、后端、数据库或相册上传服务。
地表和普通建筑使用实例化渲染；地标支持地点标签、随机悬浮倾斜及积木散开复位。
点击去过的地点，会将地球旋转、缩放至地标，再展开相册。桌面使用右侧栏，手机使用底部面板。
也可以通过「足迹」菜单选择地点；英国入口内可切换伦敦 / 爱丁堡。
照片支持缩略图、大图及左右方向键切换，Escape 先关闭大图，再关闭相册并恢复原视角。
拖动地球不会误触相册；纽约和开罗仅作装饰，不开放相册。
选中地点会保持悬浮散开，其他可见的旅行地标仍可悬停和点击切换。
手机竖屏概览按屏幕高度取景，球面约占 60% 高度，左右允许裁切。

## 添加照片

所有相册目前为空，不使用示例风景照片冒充旅行记录。
「选择本机照片预览」只在当前页面中读取文件，不会上传、写入仓库或持久保存，刷新后清除。
支持 JPEG、PNG、WebP、AVIF，每张不超过 25MB，每个城市最多 10 张。

要正式保存照片，将处理后的图片放在 `src/photos/<地点>/`，并修改 `src/albums.json`。例如：

```json
"paris": {
  "cities": {
    "巴黎": [
      {
        "src": "./photos/paris/seine.webp",
        "thumbnail": "./photos/paris/seine-thumb.webp",
        "caption": "塞纳河畔的傍晚"
      }
    ]
  }
}
```

`thumbnail` 可省略，此时使用原图；建议单独生成小尺寸缩略图减少流量。
路径相对于 `src/`，构建后保持相同目录结构。预览按钮选择的照片不参与构建。
发布前自行压缩图片并移除不想公开的 EXIF 信息；放进 `src/` 的文件都会成为公开站点资源，
不要在其中存放原片备份、密钥或其他私密文件。

此次是原有本地项目的原样迁移，不包含 React 重构。原来的 CRA、Bootstrap、联系人路由和
September 试验页面已移出当前工作目录，并在迁移前备份（包含未提交和未跟踪源码）。
旧依赖不再需要，`npm install` 也不是启动前提。

## GitHub Pages

目标远端为 `https://github.com/bbeas/bbeas.github.io.git`。
后续发布应上传 `dist/` 的内容，而不是把仓库根目录直接作为网站；当前没有配置新的自动部署工作流。
旧分支和历史保留，远端 Pages 设置未修改。开发和检查点提交均在本地 `dev` 分支；没有 push 或部署。

南极洲轮廓来源：Natural Earth 的 `ne_110m_admin_0_countries.geojson`，来源见数据文件注释。
