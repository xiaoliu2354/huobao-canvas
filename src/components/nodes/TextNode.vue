<template>
  <div class="text-node-wrapper" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <div
      class="text-node bg-[var(--bg-secondary)] rounded-xl border min-w-[280px] max-w-[350px] relative transition-all duration-200"
      :class="data.selected ? 'border-1 border-blue-500 shadow-lg shadow-blue-500/20' : 'border border-[var(--border-color)]'">
      <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
        <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-[var(--text-secondary)]">{{ data.label }}</span>
        </div>
        
        <div class="flex items-center gap-1">
          <n-dropdown :options="chatModelOptions" @select="handleChatModelSelect" trigger="click">
            <button class="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)] text-xs flex items-center gap-1" title="选择润色模型">
                <span class="max-w-[80px] truncate">{{ displayChatModel }}</span>
                <n-icon size="10"><ChevronDownOutline /></n-icon>
            </button>
          </n-dropdown>

          <button @click="handleDelete" class="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors">
            <n-icon :size="14">
              <TrashOutline />
            </n-icon>
          </button>
        </div>
      </div>

      <div class="p-3">
        <textarea v-model="content" @blur="updateContent" @wheel.stop @mousedown.stop
          class="w-full bg-transparent resize-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] min-h-[80px]"
          placeholder="请输入文本内容..." />
        <button 
          @click="handlePolish"
          :disabled="isPolishing || !content.trim()"
          class="mt-2 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--accent-color)] hover:text-white border border-[var(--border-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <n-spin v-if="isPolishing" :size="12" />
          <span v-else>✨</span>
          AI 润色 ({{ displayChatModel }})
        </button>
      </div>

      <Handle type="source" :position="Position.Right" id="right" class="!bg-[var(--accent-color)]" />
      <Handle type="target" :position="Position.Left" id="left" class="!bg-[var(--accent-color)]" />

    </div>

    <div v-show="showActions" class="absolute -top-5 right-12 z-[1000]">
      <button @click="handleDuplicate"
        class="action-btn group p-2 bg-white rounded-lg transition-all border border-gray-200 flex items-center gap-0 hover:gap-1.5 w-max">
        <n-icon :size="16" class="text-gray-600">
          <CopyOutline />
        </n-icon>
        <span
          class="text-xs text-gray-600 max-w-0 overflow-hidden group-hover:max-w-[60px] transition-all duration-200 whitespace-nowrap">复制</span>
      </button>
    </div>

    <div v-show="showActions"
      class="absolute right-10 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-2 z-[1000]">
      <button @click="handleImageGen"
        class="action-btn group p-2 bg-white rounded-lg transition-all border border-gray-200 flex items-center gap-0 hover:gap-1.5 w-max">
        <n-icon :size="16" class="text-gray-600">
          <ImageOutline />
        </n-icon>
        <span
          class="text-xs text-gray-600 max-w-0 overflow-hidden group-hover:max-w-[80px] transition-all duration-200 whitespace-nowrap">图片生成</span>
      </button>
      <button @click="handleVideoGen"
        class="action-btn group p-2 bg-white rounded-lg transition-all border border-gray-200 flex items-center gap-0 hover:gap-1.5 w-max">
        <n-icon :size="16" class="text-gray-600">
          <VideocamOutline />
        </n-icon>
        <span
          class="text-xs text-gray-600 max-w-0 overflow-hidden group-hover:max-w-[80px] transition-all duration-200 whitespace-nowrap">视频生成</span>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Text node component | 文本节点组件
 * Allows user to input and edit text content
 */
import { ref, watch, computed, nextTick } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NIcon, NSpin, NDropdown } from 'naive-ui'
import { TrashOutline, ExpandOutline, CopyOutline, ImageOutline, VideocamOutline, ChevronDownOutline } from '@vicons/ionicons5'
import { updateNode, removeNode, duplicateNode, addNode, addEdge, nodes } from '../../stores/canvas'
import { useChat, useApiConfig } from '../../hooks'
import { chatModelOptions, DEFAULT_CHAT_MODEL } from '../../stores/models'

const props = defineProps({
  id: String,
  data: Object
})

// Vue Flow instance | Vue Flow 实例
const { updateNodeInternals } = useVueFlow()

// API config hook | API 配置 hook
const { isConfigured: isApiConfigured } = useApiConfig()

// Chat hook for polish | 润色用的 Chat hook
// 注意：移除了 model 选项，因为我们将在 send 时动态传入
const { send: sendChat } = useChat({
  systemPrompt: '你是一个专业的AI绘画提示词专家。将用户输入的内容美化成高质量的生图提示词，包含风格、光线、構图、细节等要素。直接返回提示词，不要其他解释。'
})

// Local content state | 本地内容状态
const content = ref(props.data?.content || '')
// Local model state | 本地模型状态
const localModel = ref(props.data?.chatModel || DEFAULT_CHAT_MODEL)

// Hover state | 悬浮状态
const showActions = ref(false)

// Polish loading state | 润色加载状态
const isPolishing = ref(false)

// Watch for external data changes | 监听外部数据变化
watch(() => props.data?.content, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal
  }
})

// Display model name (shortened) | 显示简短模型名
const displayChatModel = computed(() => {
  const model = chatModelOptions.value.find(m => m.key === localModel.value)
  if (!model) return 'AI'
  // 移除 'GPT-' 前缀以节省空间，或者只取前几个字符
  return model.label.replace('GPT-', '').replace('Claude-', '').substring(0, 8)
})

// Update content in store | 更新存储中的内容
const updateContent = () => {
  updateNode(props.id, { content: content.value })
}

// Handle chat model selection | 处理模型选择
const handleChatModelSelect = (key) => {
    localModel.value = key
    updateNode(props.id, { chatModel: key })
}

// Handle AI polish | 处理 AI 润色
const handlePolish = async () => {
  const input = content.value.trim()
  if (!input) return
  
  // Check API configuration | 检查 API 配置
  if (!isApiConfigured.value) {
    window.$message?.warning('请先配置 API Key')
    return
  }

  isPolishing.value = true
  const originalContent = content.value

  try {
    // Call chat API to polish the prompt | 调用 AI 润色提示词
    // 关键修改：传入 localModel.value
    const result = await sendChat(input, localModel.value, true)
    
    if (result) {
      content.value = result
      updateNode(props.id, { content: result })
      window.$message?.success('提示词已润色')
    }
  } catch (err) {
    content.value = originalContent
    window.$message?.error(err.message || '润色失败')
  } finally {
    isPolishing.value = false
  }
}

// Handle delete | 处理删除
const handleDelete = () => {
  removeNode(props.id)
}

// Handle duplicate | 处理复制
const handleDuplicate = () => {
  const newNodeId = duplicateNode(props.id)
  window.$message?.success('节点已复制')
  if (newNodeId) {
    setTimeout(() => {
      updateNodeInternals(newNodeId)
    }, 50)
  }
}

// Handle image generation | 处理图片生成
const handleImageGen = () => {
  const currentNode = nodes.value.find(n => n.id === props.id)
  const nodeX = currentNode?.position?.x || 0
  const nodeY = currentNode?.position?.y || 0

  // Create imageConfig node | 创建text生图配置节点
  const configNodeId = addNode('imageConfig', { x: nodeX + 400, y: nodeY }, {
    model: 'doubao-seedream-4-5-251128',
    size: '2048x2048',
    label: '文生图'
  })

  // Auto connect | 自动连接
  addEdge({
    source: props.id,
    target: configNodeId,
    sourceHandle: 'right',
    targetHandle: 'left'
  })

  // Force Vue Flow to recalculate node dimensions | 强制 Vue Flow 重新计算节点尺寸
  setTimeout(() => {
    updateNodeInternals(configNodeId)
  }, 50)
}

// Handle video generation | 处理视频生成
const handleVideoGen = () => {
  const currentNode = nodes.value.find(n => n.id === props.id)
  const nodeX = currentNode?.position?.x || 0
  const nodeY = currentNode?.position?.y || 0

  // Create videoConfig node | 创建视频配置节点
  const configNodeId = addNode('videoConfig', { x: nodeX + 400, y: nodeY }, {
    label: '视频生成'
  })

  // Auto connect | 自动连接
  addEdge({
    source: props.id,
    target: configNodeId,
    sourceHandle: 'right',
    targetHandle: 'left'
  })

  // Force Vue Flow to recalculate node dimensions | 强制 Vue Flow 重新计算节点尺寸
  setTimeout(() => {
    updateNodeInternals(configNodeId)
  }, 50)
}
</script>

<style scoped>
.text-node-wrapper {
  padding-right: 50px;
  padding-top: 20px;
  position: relative;
}

.text-node {
  cursor: default;
  position: relative;
}

.text-node textarea {
  cursor: text;
}
</style>
