# vscode-tmux-cleaner

统一维护的本地 VS Code / Trae 扩展源码。

作用：
- 关闭单个 IDE 终端时，清理对应 `tmux` window 和 client session
- 关闭整个 IDE 窗口但不退出 app 时，清理该窗口里仍然存活的 `tmux` client session

配套脚本：
- `~/.tmux/bin/vscode-tmux`

安装方式：
- 运行 `~/.tmux/bin/install-vscode-tmux-cleaner`

部署目标：
- `~/.trae-cn/extensions/bytedance.vscode-tmux-cleaner-0.0.1`
- `~/.vscode/extensions/bytedance.vscode-tmux-cleaner-0.0.1`
