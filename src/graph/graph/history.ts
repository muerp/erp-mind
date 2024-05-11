



//历史记录
export interface StackItem {

}
export class HistoryProtocol {
    undoStack: StackItem[] = []
    redoStack: StackItem[] = []
  
}