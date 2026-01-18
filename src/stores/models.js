/**
 * Model Store | 模型状态管理
 * Dynamic model loading support | 支持动态加载模型
 */

import { ref, computed } from 'vue'
import { getModelsByType } from '@/api/model' // 导入API
import {
  IMAGE_MODELS as STATIC_IMAGE_MODELS, // 重命名静态常量
  VIDEO_MODELS as STATIC_VIDEO_MODELS,
  CHAT_MODELS as STATIC_CHAT_MODELS,
  SEEDREAM_SIZE_OPTIONS,
  SEEDREAM_4K_SIZE_OPTIONS,
  SEEDREAM_QUALITY_OPTIONS,
  VIDEO_RATIO_LIST,
  VIDEO_RATIO_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_CHAT_MODEL,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_VIDEO_RATIO,
  DEFAULT_VIDEO_DURATION
} from '@/config/models'

// Export defaults
export {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_CHAT_MODEL,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_VIDEO_RATIO,
  DEFAULT_VIDEO_DURATION,
  SEEDREAM_SIZE_OPTIONS, 
  SEEDREAM_4K_SIZE_OPTIONS, 
  SEEDREAM_QUALITY_OPTIONS, 
  VIDEO_RATIO_OPTIONS, 
  VIDEO_DURATION_OPTIONS
}

// State
const loading = ref(false)
const error = ref(null)

// Reactive model lists (initialized with static config)
export const imageModels = ref([...STATIC_IMAGE_MODELS])
export const videoModels = ref([...STATIC_VIDEO_MODELS])
export const chatModels = ref([...STATIC_CHAT_MODELS])

/**
 * Map API record to frontend model structure
 * 将后端模型数据映射为前端格式
 */
const mapRemoteModel = (record) => {
  return {
    label: record.fullName || record.name, // 显示名称
    key: record.modelKey || record.id,     // 模型ID
    tips: record.description || record.remark, // 提示信息
    // 继承默认配置，防止后端未返回导致报错
    sizes: STATIC_IMAGE_MODELS[0].sizes, 
    qualities: ['standard'],
    defaultParams: {
      size: '1024x1024',
      quality: 'standard'
    },
    ...record // 覆盖后端返回的特定字段
  }
}

/**
 * Load models from API
 * 加载所有模型
 */
export const loadAllModels = async () => {
  loading.value = true
  try {
    // 并发请求不同类型的模型
    // 假设后端 type 参数: 1=chat, 2=image, 3=video (请根据实际后端定义调整)
    // 这里使用字符串假设: 'image', 'video', 'chat'
    const [fetchedImages, fetchedVideos, fetchedChats] = await Promise.all([
      getModelsByType('image').catch(() => []),
      getModelsByType('video').catch(() => []),
      getModelsByType('chat').catch(() => [])
    ])

    // 更新状态：保留内置模型，追加远程模型 (或者完全覆盖，取决于需求)
    // 这里采用：内置 + 远程去重
    if (fetchedImages?.length) {
      const newModels = fetchedImages.map(mapRemoteModel)
      // 简单去重：如果 key 已存在则不添加
      const existingKeys = new Set(imageModels.value.map(m => m.key))
      imageModels.value.push(...newModels.filter(m => !existingKeys.has(m.key)))
    }

    if (fetchedVideos?.length) {
      const newModels = fetchedVideos.map(mapRemoteModel)
      const existingKeys = new Set(videoModels.value.map(m => m.key))
      videoModels.value.push(...newModels.filter(m => !existingKeys.has(m.key)))
    }

    if (fetchedChats?.length) {
      const newModels = fetchedChats.map(mapRemoteModel)
      const existingKeys = new Set(chatModels.value.map(m => m.key))
      chatModels.value.push(...newModels.filter(m => !existingKeys.has(m.key)))
    }

  } catch (err) {
    console.error('Failed to load models:', err)
    error.value = err
  } finally {
    loading.value = false
  }
}

/**
 * Get model config by name (Dynamic)
 * 根据名称获取模型配置（支持动态）
 */
export const getModelConfig = (modelKey) => {
  const allModels = [...imageModels.value, ...videoModels.value, ...chatModels.value]
  return allModels.find(m => m.key === modelKey)
}

/**
 * Get size options for image model
 */
export const getModelSizeOptions = (modelKey, quality = 'standard') => {
  const model = imageModels.value.find(m => m.key === modelKey) // 使用 .value
  
  if (model?.getSizesByQuality) {
    return model.getSizesByQuality(quality)
  }
  
  if (!model?.sizes) return SEEDREAM_SIZE_OPTIONS
  
  const sizeOptions = quality === '4k' ? SEEDREAM_4K_SIZE_OPTIONS : SEEDREAM_SIZE_OPTIONS
  return model.sizes.map(size => {
    // 支持后端直接返回完整对象的情况
    if (typeof size === 'object') return size
    
    const option = sizeOptions.find(o => o.key === size)
    return option || { label: size, key: size }
  })
}

/**
 * Get quality options
 */
export const getModelQualityOptions = (modelKey) => {
  const model = imageModels.value.find(m => m.key === modelKey)
  return model?.qualities || []
}

/**
 * Get ratio options
 */
export const getModelRatioOptions = (modelKey) => {
  const model = videoModels.value.find(m => m.key === modelKey)
  if (!model?.ratios) return VIDEO_RATIO_OPTIONS
  return model.ratios.map(ratio => {
    const option = VIDEO_RATIO_LIST.find(o => o.key === ratio)
    return option || { label: ratio, key: ratio }
  })
}

/**
 * Get duration options
 */
export const getModelDurationOptions = (modelKey) => {
  const model = videoModels.value.find(m => m.key === modelKey)
  if (!model?.durs) return VIDEO_DURATION_OPTIONS
  return model.durs
}

// Reactive Computed Options (关键修改：依赖 value)
export const imageModelOptions = computed(() => imageModels.value)
export const videoModelOptions = computed(() => videoModels.value)
export const chatModelOptions = computed(() => chatModels.value)

// Select Options
export const imageModelSelectOptions = computed(() => 
  imageModels.value.map(m => ({ label: m.label, value: m.key }))
)
export const videoModelSelectOptions = computed(() => 
  videoModels.value.map(m => ({ label: m.label, value: m.key }))
)
export const chatModelSelectOptions = computed(() => 
  chatModels.value.map(m => ({ label: m.label, value: m.key }))
)

export { loading, error }
