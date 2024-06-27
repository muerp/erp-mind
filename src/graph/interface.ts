export enum ItemType {
  image = 'image',
  video = 'video',
  audio = 'audio'
}
export interface NodeData {
  title: string, // 节点名称
  id: string, // 节点Id 根节点id '0'
  sortId: string,
  type: string, // 节点类型
  label?: string
  children: NodeData[] // 子节点
  _children: NodeData[] // 折叠的子节点
  collapsed?: boolean // 是否折叠
  isSubView: boolean // 是否为当前主要显示内容，用于切换到子节点视图
  labelStyle?: any,
  link2?: boolean
  hideNum?: number,
  style?: {
    width: number // 节点宽度
    height: number // 节点高度
    visible?: boolean,
    beforeWidth?: number
  }
  desc?: string // 可配置的描述字段
  content?: string //可配置的内容字段
  destroyed?: boolean // 是否被废弃
  [key: string]: any
}

export interface InputData {
  name?: string,
  desc?: string // 可配置的描述字段
  content?: string //可配置的内容字段
  children?: InputData[]
  _children?: any[]
  isSubView?: boolean // 是否为主视图
  [key: string]: any
}

export interface EdgeOptions {
  id?: string
  source: string
  target: string
  startIndex: number
  endIndex: number
  title?: string
  desc?: string
  curve?: number
  offset?: number
  labelType?: number
  label1?: string
  label2?: string
  editType?: number
  labelStyle1?: any
  labelStyle2?: any
  textSize?: {
    width: number
    height: number
  }
}
