import type { MouseEvent } from "react";
import { useModal } from "../../hooks/useModal.ts";
import "./modal-container.css";

const ModalContainer = () => {
  const { toggleModal, modalData } = useModal();

  if (!modalData) {
    return null;
  }
  
  switch (modalData.type) {
    case "NewNode": {
      throw new Error('Not implemented yet: "NewNode" case');
    }

    case "NewCategory": {
      throw new Error('Not implemented yet: "NewCategory" case');
    }

    case "NewRecipe": {
      throw new Error('Not implemented yet: "NewRecipe" case');
    }

    case "NewItem": {
      throw new Error('Not implemented yet: "NewItem" case');
    }

  }
  
  return (
    <div
      className="modal-backdrop"
      onClick={() => { toggleModal(null); }}
    >
      <div
        className="modal-container"
        onClick={(e: MouseEvent) => { e.stopPropagation(); }}
      >
      
      </div>
    </div>
  );
};

export default ModalContainer;