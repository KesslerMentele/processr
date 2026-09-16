

interface NewNodeModalData {
  type: "NewNode";

}

interface NewItemModalData {
  type: "NewItem";

}

interface NewCategoryModalData {
  type: "NewCategory";

}

interface NewRecipeModalData {
  type: "NewRecipe";

}

export type ModalData = NewNodeModalData | NewCategoryModalData | NewRecipeModalData | NewItemModalData;