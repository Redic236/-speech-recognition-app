# 语音识别应用技术架构文档

## 技术栈选择

### 前端
- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **状态管理**: React useState + useReducer (轻量级状态管理)
- **本地存储**: localStorage (存储识别历史)

### 后端
- **无后端服务**: 直接调用智谱AI API
- **API**: 智谱AI 语音识别 API

### 数据库
- **无数据库**: 使用localStorage进行本地数据存储

## 项目结构

```
/src
  /components
    /Recorder
      Recorder.tsx         # 录音组件
      RecorderButton.tsx   # 录音按钮组件
    /Recognizer
      Recognizer.tsx       # 识别组件
      ResultDisplay.tsx    # 结果显示组件
    /History
      HistoryList.tsx      # 历史记录组件
  /hooks
    useRecorder.ts         # 录音相关的自定义Hook
    useRecognizer.ts       # 识别相关的自定义Hook
    useHistory.ts          # 历史记录相关的自定义Hook
  /services
    api.ts                 # API调用封装
    storage.ts             # 本地存储封装
  /types
    index.ts               # TypeScript类型定义
  /utils
    audioUtils.ts          # 音频处理工具函数
  App.tsx                  # 应用主组件
  main.tsx                 # 应用入口
  index.css                # 全局样式
```

## 数据模型

### 1. 录音数据
```typescript
interface RecordingData {
  blob: Blob;              // 录音的Blob对象
  duration: number;        // 录音时长（秒）
  timestamp: number;       // 录音时间戳
}
```

### 2. 识别结果
```typescript
interface RecognitionResult {
  text: string;            // 识别的文本
  confidence?: number;     // 识别置信度（如果API提供）
  timestamp: number;       // 识别时间戳
  duration: number;        // 录音时长（秒）
}
```

### 3. 历史记录
```typescript
interface HistoryItem extends RecognitionResult {
  id: string;              // 唯一标识符
  editedText?: string;     // 编辑后的文本
}
```

## 关键技术点

### 1. 录音功能
- 使用浏览器原生的 `MediaRecorder API` 进行录音
- 处理录音权限请求
- 录音状态管理（开始、停止、暂停）
- 录音数据的处理和存储

### 2. 语音识别
- 调用智谱AI语音识别API
- 处理API请求和响应
- 错误处理和重试机制
- 识别过程的加载状态管理

### 3. 历史记录
- 使用localStorage存储历史记录
- 历史记录的增删改查操作
- 历史记录的排序和分页显示

### 4. 用户界面
- 响应式设计，适配不同屏幕尺寸
- 录音按钮的动画效果
- 识别结果的编辑功能
- 加载状态的视觉反馈

### 5. 性能优化
- 录音数据的高效处理
- API请求的优化
- 本地存储的合理使用
- 组件的按需渲染

### 6. 安全性
- API Key的安全管理
- 录音数据的本地处理，不上传敏感信息
- 错误处理和用户提示

### 7. 兼容性
- 浏览器兼容性处理（MediaRecorder API的支持情况）
- 降级方案（如果浏览器不支持录音功能）

## 技术实现要点

### 录音功能实现
1. 使用 `navigator.mediaDevices.getUserMedia` 获取麦克风权限
2. 创建 `MediaRecorder` 实例进行录音
3. 监听 `dataavailable` 事件获取录音数据
4. 监听 `stop` 事件处理录音完成

### 语音识别实现
1. 将录音数据转换为智谱AI API要求的格式
2. 发送POST请求到智谱AI语音识别API
3. 处理API响应，提取识别结果
4. 显示识别结果并保存到历史记录

### 历史记录实现
1. 使用 `localStorage.setItem` 和 `localStorage.getItem` 存储和获取历史记录
2. 实现历史记录的添加、编辑和删除功能
3. 按时间戳排序显示历史记录

### 界面实现
1. 使用Tailwind CSS实现响应式设计
2. 实现录音按钮的动画效果
3. 实现识别过程的加载动画
4. 实现识别结果的编辑功能

## 开发计划

1. 初始化项目，配置React+TypeScript+Vite+Tailwind CSS
2. 实现录音功能和录音按钮组件
3. 实现语音识别功能和结果显示组件
4. 实现历史记录功能和历史记录组件
5. 整合所有组件，完成完整应用
6. 测试和优化
7. 部署和上线