# 回到 1966 年：互动问答网页数据包

这个文件夹包含工程化整理后的游戏文本数据。

## 文件说明

- `gameData.js`：前端可直接读取的数据文件，包含：
  - meta 项目信息
  - 7 个身份
  - 每个身份的 intro
  - 每个身份的 3 个结局
  - 每个身份的 5 道题
  - 每题 4 个选项
  - 每个选项的反馈文本
  - 每个选项的隐藏分数 effects

- `content_map.md`：身份、题目、结局的总览表，方便核对。

## 建议项目结构

```text
project/
  index.html
  style.css
  script.js
  gameData.js
```

## 前端计分逻辑

每次用户选择一个 option 时，把 option.effects 中对应结局的分数累加。

示例：

```js
{
  text: "署真名，公开传播",
  feedback: "...",
  effects: {
    commonSense: 3
  }
}
```

最终从当前身份的 endings 中选出最高分结局。

如果多个结局同分，可以使用 ending.priority 作为优先级，数字越小优先级越高。

## 推荐页面流程

1. 首页
2. 身份选择页
3. 身份介绍页
4. 问题页
5. 选项反馈页
6. 下一题
7. 结局页
8. 重新开始
