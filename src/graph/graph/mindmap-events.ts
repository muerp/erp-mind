
export enum EventName {
    change= 'change',
}

export enum MindmapEvent {
    loaded = 'loaded',
    canvasClick = 'canvas-click',
    canvasMove = 'canvas-move',
    nodeMove = 'node-move',
    nodeTitleChange = 'node-title-change',
    nodeTitleBlur = 'node-title-blur',
    nodeAdd = 'add-child',
    nodeCollapsed = 'node-collapsed',
    nodeDelete = 'node-delete',
    nodeSelect = 'node-select',
    nodeCorrelation = 'node-correlation',
    nodeChangeRoot = 'node-change-root',
    nodeShowEdges = 'node-show-edges',
    
    mobileClickNode = 'mobile-click-node',

    edgeClickShowLabel = 'edge-click-show-label',

    edgeExist = 'edge-exist',
    edgeAdd = 'edge-add',
    edgeChange = 'edge-change',
    edgeDelete = 'edge-delete',
    edgeTitleChange = 'edge-edit-change',
    edgeClick = 'edge-click',
    labelClick = 'lable-click',
    labelDoubleClick = 'lable-double-click',

    edgeCreate = 'edge-create',
    openQuadtree = 'open-quadtree',
    focus = 'editor-focus',
    blur = 'editor-blur',

    dragExternal = 'drag-external',
    dragNode = 'drag-node'

}
