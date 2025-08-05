import { makeAutoObservable } from "mobx";
import { Memo } from "@/types/proto/api/v1/memo_service";

class MemoDetailStore {
  selectedMemo: Memo | null = null;
  isDetailVisible: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setSelectedMemo(memo: Memo | null) {
    this.selectedMemo = memo;
    this.isDetailVisible = memo !== null;
  }

  clearSelectedMemo() {
    this.selectedMemo = null;
    this.isDetailVisible = false;
  }

  toggleDetailVisibility() {
    this.isDetailVisible = !this.isDetailVisible;
  }
}

const memoDetailStore = new MemoDetailStore();

export default memoDetailStore;