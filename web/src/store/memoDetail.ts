import { makeAutoObservable } from "mobx";
import { Memo } from "@/types/proto/api/v1/memo_service";

class MemoDetailStore {
  selectedMemo: Memo | null = null;
  isDetailVisible: boolean = false;
  initialEditMode: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setSelectedMemo(memo: Memo | null, editMode: boolean = false) {
    this.selectedMemo = memo;
    this.isDetailVisible = memo !== null;
    this.initialEditMode = editMode;
  }

  clearSelectedMemo() {
    this.selectedMemo = null;
    this.isDetailVisible = false;
    this.initialEditMode = false;
  }

  toggleDetailVisibility() {
    this.isDetailVisible = !this.isDetailVisible;
  }

  // 更新当前选中的笔记数据
  updateSelectedMemo(updatedMemo: Memo) {
    if (this.selectedMemo && this.selectedMemo.name === updatedMemo.name) {
      this.selectedMemo = updatedMemo;
    }
  }
}

const memoDetailStore = new MemoDetailStore();

export default memoDetailStore;