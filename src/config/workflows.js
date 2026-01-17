/**
 * Workflow Templates Configuration | 工作流模板配置
 * 预设工作流模板，支持一键添加到画布
 */
import product01 from '@/assets/product01.jpg'
import workflowCover1 from '@/assets/workflow01.jpeg'
import workflowCover2 from '@/assets/workflow02.jpeg'
// Multi-angle prompts | 多角度提示词模板
export const MULTI_ANGLE_PROMPTS = {
  front: {
    label: '正视',
    english: 'Front View',
    prompt: (character) => `使用提供的图片，生成四宫格分镜，每张四宫格包括人物正面对着镜头的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性，宫格里的每一张照片保持和提供图片相同的比例。并在图片下方用英文标注这个景别

角色参考: ${character}`
  },
  side: {
    label: '侧视',
    english: 'Side View', 
    prompt: (character) => `使用提供的图片，分别生成四宫格分镜，每张四宫格包括人物侧面角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性，宫格里的每一张照片保持和提供图片相同的比例。并在图片下方用英文标注这个景别

角色参考: ${character}`
  },
  back: {
    label: '后视',
    english: 'Back View',
    prompt: (character) => `使用提供的图片，分别生成四宫格分镜，每张四宫格包括人物背影角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性，宫格里的每一张照片保持和提供图片相同的比例。并在图片下方用英文标注这个景别

角色参考: ${character}`
  },
  top: {
    label: '俯视',
    english: 'Top/Bird\'s Eye View',
    prompt: (character) => `使用提供的图片，分别生成四宫格分镜，每张四宫格包括俯视角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性，宫格里的每一张照片保持和提供图片相同的比例。并在图片下方用英文标注这个景别

角色参考: ${character}`
  }
}

/**
 * Workflow Templates | 工作流模板
 */
export const WORKFLOW_TEMPLATES = [
  {
    id: 'multi-angle-storyboard',
    name: '多角度分镜',
    description: '生成角色的正视、侧视、后视、俯视四宫格分镜图',
    icon: 'GridOutline',
    category: 'storyboard',
    cover: workflowCover1,
    // 节点配置
    createNodes: (startPosition) => {
      const nodeSpacing = 400
      const rowSpacing = 280
      const angles = ['front', 'side', 'back', 'top']
      
      const nodes = []
      const edges = []
      let nodeIdCounter = 0
      const getNodeId = () => `workflow_node_${Date.now()}_${nodeIdCounter++}`
      
      // 主角色图：提示词 + 文生图配置
      const characterTextId = getNodeId()
      nodes.push({
        id: characterTextId,
        type: 'text',
        position: { x: startPosition.x, y: startPosition.y + rowSpacing * 1.5 },
        data: {
          content: '',
          label: '角色提示词'
        }
      })
      
      const characterConfigId = getNodeId()
      nodes.push({
        id: characterConfigId,
        type: 'imageConfig',
        position: { x: startPosition.x + nodeSpacing, y: startPosition.y + rowSpacing * 1.5 },
        data: {
          label: '主角色图',
          model: 'doubao-seedream-4-5-251128',
          size: '2048x2048'
        }
      })
      
      // 主角色图结果节点（空白图片节点）
      const characterImageId = getNodeId()
      nodes.push({
        id: characterImageId,
        type: 'image',
        position: { x: startPosition.x + nodeSpacing * 2, y: startPosition.y + rowSpacing * 1.5 },
        data: {
          url: '',
          label: '角色图结果'
        }
      })
      
      // 连线：角色提示词 → 角色图配置
      edges.push({
        id: `edge_${characterTextId}_${characterConfigId}`,
        source: characterTextId,
        target: characterConfigId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      
      // 连线：角色图配置 → 角色图结果
      edges.push({
        id: `edge_${characterConfigId}_${characterImageId}`,
        source: characterConfigId,
        target: characterImageId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      
      // 创建4个角度的节点
      const angleX = startPosition.x + nodeSpacing * 3 + 100
      
      angles.forEach((angleKey, index) => {
        const angleConfig = MULTI_ANGLE_PROMPTS[angleKey]
        const angleY = startPosition.y + index * rowSpacing
        let currentX = angleX
        
        // 提示词节点（预填充默认提示词）
        const textNodeId = getNodeId()
        nodes.push({
          id: textNodeId,
          type: 'text',
          position: { x: currentX, y: angleY },
          data: {
            content: angleConfig.prompt(''),
            label: `${angleConfig.label}提示词`
          }
        })
        currentX += nodeSpacing
        
        // 图片配置节点
        const configNodeId = getNodeId()
        nodes.push({
          id: configNodeId,
          type: 'imageConfig',
          position: { x: currentX, y: angleY },
          data: {
            label: `${angleConfig.label} (${angleConfig.english})`,
            model: 'doubao-seedream-4-5-251128',
            size: '2048x2048'
          }
        })
        
        // 连线：提示词 → 配置
        edges.push({
          id: `edge_${textNodeId}_${configNodeId}`,
          source: textNodeId,
          target: configNodeId,
          sourceHandle: 'right',
          targetHandle: 'left'
        })
        
        // 连线：角色图结果 → 角度配置（参考图）
        edges.push({
          id: `edge_${characterImageId}_${configNodeId}`,
          source: characterImageId,
          target: configNodeId,
          sourceHandle: 'right',
          targetHandle: 'left'
        })
      })
      
      return { nodes, edges }
    }
  },
  {
    id: 'product-ecommerce-full-set',
    name: '通用产品全套电商图',
    description: '根据产品信息和图片，生成模特图、侧面展示图、俯瞰展示图',
    icon: 'ShoppingOutline',
    category: 'ecommerce',
    cover: workflowCover2,
    // 节点配置
    createNodes: (startPosition) => {
      const colSpacing = 500  // 列间距
      const rowSpacing = 350  // 行间距
      
      const nodes = []
      const edges = []
      let nodeIdCounter = 0
      const getNodeId = () => `workflow_node_${Date.now()}_${nodeIdCounter++}`
      
      // ========== 布局说明 ==========
      // 第一列: A(产品信息), B(产品图片) - 输入节点
      // 第二列: C, D, E - 提示词节点
      // 第三列: 生成模特图, 侧面展示图, 俯瞰展示图 - 输出节点
      
      // ========== 第一列：输入节点 ==========
      // A: 产品信息文本节点
      const nodeA_productInfoId = getNodeId()
      nodes.push({
        id: nodeA_productInfoId,
        type: 'text',
        position: { x: startPosition.x, y: startPosition.y },
        data: {
          content: 'Soundcore by Anker P20i真无线耳机，10mm驱动单元带来强劲低音，蓝牙5.3，30小时超长续航，防水，2个麦克风实现AI清晰通话，22种预设均衡器，可通过App定制 强劲低音：Soundcore P20i真无线耳机搭载超大10mm驱动单元，带来强劲音效和增强的低音，让您沉浸在喜爱的歌曲中。 个性化聆听体验：使用Soundcore App自定义控制选项，并从22种预设均衡器中进行选择。借助“Find My Earbuds”（查找我的耳机）功能，丢失的耳机可以发出声音，帮助您定位。 长续航，快速充电：单次充电可提供10小时电池续航，搭配充电盒则可延长至30小时。如果P20i真无线耳机电量不足，仅需10分钟快速充电即可提供2小时播放时间。 便携式设计：Soundcore P20i真无线耳机和充电盒小巧轻便，配有挂绳。其体积足够小，可轻松放入口袋，或挂在包或钥匙上，让您无需担心空间问题。 AI增强清晰通话：2个内置麦克风和AI算法协同工作，捕捉您的声音，让您无需在电话中大喊大叫。',
          label: '产品信息'
        }
      })
      
      // B: 产品图片节点
      const nodeB_productImageId = getNodeId()
      nodes.push({
        id: nodeB_productImageId,
        type: 'image',
        position: { x: startPosition.x, y: startPosition.y + rowSpacing },
        data: {
          url: 'https://ffile.chatfire.site/image/covers/product01.jpg',
          label: '产品图片'
        }
      })
      
      // ========== 第二列：提示词节点 ==========
      // C: 模特图提示词 (与生成模特图对齐)
      const nodeC_modelPromptId = getNodeId()
      nodes.push({
        id: nodeC_modelPromptId,
        type: 'text',
        position: { x: startPosition.x + colSpacing, y: startPosition.y },
        data: {
          content: '根据产品特性，生成一个适合展示该产品且时尚富有高级感的模特图，彩色人像，背景是白底，人物居中，欧美人优先',
          label: '模特图提示词'
        }
      })
      
      // D: 侧面展示图提示词 (与侧面展示图对齐)
      const nodeD_sidePromptId = getNodeId()
      nodes.push({
        id: nodeD_sidePromptId,
        type: 'text',
        position: { x: startPosition.x + colSpacing, y: startPosition.y + rowSpacing },
        data: {
          content: '根据产品图和产品信息，生成左侧侧面45度的展示图，高清展示侧面的产品形状和细节，保持产品不变形',
          label: '侧面展示图提示词'
        }
      })
      
      // E: 俯瞰展示图提示词 (与俯瞰展示图对齐)
      const nodeE_topPromptId = getNodeId()
      nodes.push({
        id: nodeE_topPromptId,
        type: 'text',
        position: { x: startPosition.x + colSpacing, y: startPosition.y + rowSpacing * 2 },
        data: {
          content: '根据产品图和产品信息，生成从上往下俯瞰的产品展示图，高清展示俯瞰角度的产品形状和细节，保持产品不变形',
          label: '俯瞰展示图提示词'
        }
      })
      
      // F: 拆解图提示词 (与拆解图对齐)
      const nodeF_explodedPromptId = getNodeId()
      nodes.push({
        id: nodeF_explodedPromptId,
        type: 'text',
        position: { x: startPosition.x + colSpacing, y: startPosition.y + rowSpacing * 3 },
        data: {
          content: '根据产品材质功能，生成一张产品核心部件的结构示意图，要展现出产品核心部件的内部构造，画面清晰呈现产品关键部件，背景为简洁的浅色调，同时包含核心卖点文案',
          label: '拆解图提示词'
        }
      })
      
      // ========== 第三列：生成节点 ==========
      // B+C = 生成模特图
      const modelConfigId = getNodeId()
      nodes.push({
        id: modelConfigId,
        type: 'imageConfig',
        position: { x: startPosition.x + colSpacing * 2, y: startPosition.y },
        data: {
          label: '生成模特图',
          model: 'doubao-seedream-4-5-251128',
          size: '2048x2048'
        }
      })
      
      // B+D = 生成侧面展示图
      const sideConfigId = getNodeId()
      nodes.push({
        id: sideConfigId,
        type: 'imageConfig',
        position: { x: startPosition.x + colSpacing * 2, y: startPosition.y + rowSpacing },
        data: {
          label: '侧面展示图',
          model: 'doubao-seedream-4-5-251128',
          size: '2048x2048'
        }
      })
      
      // B+E = 生成俯瞰展示图
      const topConfigId = getNodeId()
      nodes.push({
        id: topConfigId,
        type: 'imageConfig',
        position: { x: startPosition.x + colSpacing * 2, y: startPosition.y + rowSpacing * 2 },
        data: {
          label: '俯瞰展示图',
          model: 'doubao-seedream-4-5-251128',
          size: '2048x2048'
        }
      })
      
      // AB+F = 生成拆解图
      const explodedConfigId = getNodeId()
      nodes.push({
        id: explodedConfigId,
        type: 'imageConfig',
        position: { x: startPosition.x + colSpacing * 2, y: startPosition.y + rowSpacing * 3 },
        data: {
          label: '拆解图',
          model: 'doubao-seedream-4-5-251128',
          size: '2048x2048'
        }
      })
      
      // ========== 连线 ==========
      // AB+C → 生成模特图
      edges.push({
        id: `edge_${nodeA_productInfoId}_${modelConfigId}`,
        source: nodeA_productInfoId,
        target: modelConfigId,
        type: 'promptOrder',
        data: { promptOrder: 1 },
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      edges.push({
        id: `edge_${nodeB_productImageId}_${modelConfigId}`,
        source: nodeB_productImageId,
        target: modelConfigId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      edges.push({
        id: `edge_${nodeC_modelPromptId}_${modelConfigId}`,
        source: nodeC_modelPromptId,
        target: modelConfigId,
        type: 'promptOrder',
        data: { promptOrder: 2 },
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      
      // AB+D → 生成侧面展示图
      edges.push({
        id: `edge_${nodeA_productInfoId}_${sideConfigId}`,
        source: nodeA_productInfoId,
        target: sideConfigId,
        type: 'promptOrder',
        data: { promptOrder: 1 },
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      edges.push({
        id: `edge_${nodeB_productImageId}_${sideConfigId}`,
        source: nodeB_productImageId,
        target: sideConfigId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      edges.push({
        id: `edge_${nodeD_sidePromptId}_${sideConfigId}`,
        source: nodeD_sidePromptId,
        target: sideConfigId,
        type: 'promptOrder',
        data: { promptOrder: 2 },
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      
      // AB+E → 生成俯瞰展示图
      edges.push({
        id: `edge_${nodeA_productInfoId}_${topConfigId}`,
        source: nodeA_productInfoId,
        target: topConfigId,
        type: 'promptOrder',
        data: { promptOrder: 1 },
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      edges.push({
        id: `edge_${nodeB_productImageId}_${topConfigId}`,
        source: nodeB_productImageId,
        target: topConfigId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      edges.push({
        id: `edge_${nodeE_topPromptId}_${topConfigId}`,
        source: nodeE_topPromptId,
        target: topConfigId,
        type: 'promptOrder',
        data: { promptOrder: 2 },
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      
      // AB+F → 生成拆解图
      edges.push({
        id: `edge_${nodeA_productInfoId}_${explodedConfigId}`,
        source: nodeA_productInfoId,
        target: explodedConfigId,
        type: 'promptOrder',
        data: { promptOrder: 1 },
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      edges.push({
        id: `edge_${nodeB_productImageId}_${explodedConfigId}`,
        source: nodeB_productImageId,
        target: explodedConfigId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      edges.push({
        id: `edge_${nodeF_explodedPromptId}_${explodedConfigId}`,
        source: nodeF_explodedPromptId,
        target: explodedConfigId,
        type: 'promptOrder',
        data: { promptOrder: 2 },
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      
      return { nodes, edges }
    }
  }
]

/**
 * Get workflow template by ID | 根据ID获取工作流模板
 */
export const getWorkflowById = (id) => {
  return WORKFLOW_TEMPLATES.find(w => w.id === id)
}

/**
 * Get workflows by category | 根据分类获取工作流
 */
export const getWorkflowsByCategory = (category) => {
  return WORKFLOW_TEMPLATES.filter(w => w.category === category)
}

export default WORKFLOW_TEMPLATES
