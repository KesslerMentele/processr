import { useBoundStore } from "../state/store.ts";
import { useShallow } from "zustand/react/shallow";



export const useModal = () => useBoundStore(useShallow(state => ({
  isModalOpen: state.modalOpen,
  toggleModal: state.toggleModal,
  modalData: state.modalData,
})));