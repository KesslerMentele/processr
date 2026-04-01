import type { GamePack } from "../models";
import {
  categoryId,
  gamePackId,
  ItemForm,
  itemId,
  nodeTemplateId,
  PortDirection,
  portId,
  recipeId,
} from "../models";

export const factorioPack: GamePack = {
  id: gamePackId('faketorio'),
  name: "faketorio",
  gameName: "factorio",
  version: '0.0.2',
  categories: [
    {
      id: categoryId('raw'),
      name: "Raw Resources",
      display: { label: "Raw Resources", color: "#e11717" },
      sortOrder: 0
    },
    {
      id: categoryId('intermediates'),
      name: "Intermediate Products",
      display: { label: "Intermediate Products", color: "#d6a21f" },
      sortOrder: 1
    },
    {
      id: categoryId('machines'),
      name: 'Machines',
      display: { label: "Machines", color: "#740ed3" }
    }
  ],
  items: [
    {
      id: itemId('iron-ore'),
      name: "Iron Ore",
      display: { label:"Iron Ore", icon:"/icons/iron-ore.png", color: "#0d78e6" },
      form: ItemForm.Solid,
      metadata: { stack_size: 50 }
    },
    {
      id: itemId("iron-plate"),
      name: "Iron Plate",
      display: { label: "Iron Plate", icon: "/icons/iron-plate.png", color: "#408fdd" },
      categoryId: categoryId("intermediates"),
      form: ItemForm.Solid,
      metadata: { stack_size: 100 },
    },
    {
      id: itemId("copper-ore"),
      name: "Copper Ore",
      display: { label: "Copper Ore", icon: "/icons/copper-ore.png", color: "#B06040" },
      categoryId: categoryId("raw"),
      form: ItemForm.Solid,
      metadata: { stack_size: 50 },
    },
    {
      id: itemId("copper-plate"),
      name: "Copper Plate",
      display: { label: "Copper Plate", icon: "/icons/copper-plate.png", color: "#DA8A67" },
      categoryId: categoryId("intermediates"),
      form: ItemForm.Solid,
      metadata: { stack_size: 100 },
    },
    {
      id: itemId("copper-cable"),
      name: "Copper Cable",
      display: { label: "Copper Cable", icon: "/icons/copper-cable.png", color: "#7e3718" },
      categoryId: categoryId("intermediates"),
      form: ItemForm.Solid,
      metadata: { stack_size: 200 },
    },
    {
      id: itemId("water"),
      name: "Water",
      display: { label: "Water", icon: "/icons/water.png", color: "#4488FF" },
      form: ItemForm.Fluid,
      metadata: {},
    },
    {
      id: itemId("steam"),
      name: "Steam",
      display: { label: "Steam", icon: "/icons/steam.png", color: "#AAAAAA" },
      form: ItemForm.Fluid,
      metadata: {},
    },
    {
      id: itemId("coal"),
      name: "Coal",
      display: { label: "Coal", icon: "/icons/coal.png", color: "#190d06" },
      form: ItemForm.Solid,
      metadata: {},
    },
  ],
  nodeTemplates: [
    {
      id: nodeTemplateId("stone-furnace"),
      name: "Stone Furnace",
      display: { label: "Stone Furnace", icon: "/icons/stone-furnace.png", color: "#888888" },
      categoryId: categoryId("machines"),
      ports: [
        {
          id: portId("stone-furnace/in"),
          name: "Input",
          direction: PortDirection.Input,
          position: 0.5,
          metadata: {},
        },
        {
          id: portId("stone-furnace/out"),
          name: "Output",
          direction: PortDirection.Output,
          position: 0.5,
          metadata: {},
        },
      ],
      stats: {
        speedMultiplier: 1.0,
        powerConsumption: 90, // kW
        metadata: { fuel_type: "solid" },
      },
      metadata: {},
      tags: []
    },
    {
      id: nodeTemplateId("water-pump"),
      name: "Water Pump",
      display: { label: "Water Pump", icon: "/icons/water-pump.png", color: "#8ca2ae" },
      categoryId: categoryId("machines"),
      ports: [
        {
          id: portId("water-pump/out"),
          name: "Output",
          direction: PortDirection.Output,
          position: 0.5,
          metadata: {},
        },
      ],
      stats: {
        speedMultiplier: 1.0,
        metadata: {},
      },
      metadata: {},
      tags: []
    },
    {
      id: nodeTemplateId("burner-mining-drill"),
      name: "Burner Mining Drill",
      display: { label: "Burner Mining Drill", icon: "/icons/burner-mining-drill.png", color: "#63564d" },
      categoryId: categoryId("machines"),
      ports: [
        {
          id: portId("burner-mining-drill/in"),
          name: "Input",
          direction: PortDirection.Input,
          position: 0.5,
          metadata: {},
        },
        {
          id: portId("burner-mining-drill/out"),
          name: "Output",
          direction: PortDirection.Output,
          position: 0.5,
          metadata: {},
        },
      ],
      stats: {
        speedMultiplier: 1.0,
        powerConsumption: 90, // kW
        metadata: { fuel_type: "solid" },
      },
      metadata: {},
      tags: []
    },
    {
      id: nodeTemplateId("assembling-machine-1"),
      name: "Assembling Machine 1",
      display: { label: "Assembler Mk.1", icon: "/icons/assembler-1.png", color: "#4A6080" },
      categoryId: categoryId("machines"),
      ports: [
        {
          id: portId("assembler-1/in-1"),
          name: "Input 1",
          direction: PortDirection.Input,
          position: 0.25,
          metadata: {},
        },
        {
          id: portId("assembler-1/in-2"),
          name: "Input 2",
          direction: PortDirection.Input,
          position: 0.75,
          metadata: {},
        },
        {
          id: portId("assembler-1/out"),
          name: "Output",
          direction: PortDirection.Output,
          position: 0.5,
          metadata: {},
        },
      ],
      stats: {
        speedMultiplier: 0.5,
        powerConsumption: 75,
        moduleSlots: 0,
        metadata: {},
      },
      metadata: {},
      tags: []
    },
    {
      id: nodeTemplateId("boiler"),
      name: "Boiler",
      display: { label: "Boiler", icon: "/icons/boiler.png", color: "#805030" },
      categoryId: categoryId("machines"),
      ports: [
        {
          id: portId("boiler/water-in"),
          name: "Water In",
          direction: PortDirection.Input,
          position: 0.3,
          metadata: { fluid: true },
        },
        {
          id: portId("boiler/coal-in"),
          name: "Coal In",
          direction: PortDirection.Input,
          position: 0.7,
          metadata: {},
        },
        {
          id: portId("boiler/steam-out"),
          name: "Steam Out",
          direction: PortDirection.Output,
          position: 0.7,
          metadata: { fluid: true },
        },
      ],
      stats: {
        speedMultiplier: 1.0,
        powerConsumption: 0, // produces power, doesn't consume it
        metadata: { fuel_type: "solid", heat_output_kw: 1800 },
      },
      metadata: {},
      tags: []
    },
  ],
  recipes: [
    {
      id: recipeId("smelt-iron-plate"),
      name: "Iron Plate",
      display: { label: "Smelt Iron Plate", icon: "/icons/iron-plate.png" },
      categoryId: categoryId("intermediates"),
      inputs: [{ itemId: itemId("iron-ore"), amount: 1 }],
      outputs: [{ itemId: itemId("iron-plate"), amount: 1 }],
      duration: 3.2,
      compatibleNodeTypes: [nodeTemplateId("stone-furnace")],
      metadata: {},
    },

    {
      id: recipeId("smelt-copper-plate"),
      name: "Copper Plate",
      display: { label: "Smelt Copper Plate", icon: "/icons/copper-plate.png" },
      categoryId: categoryId("intermediates"),
      inputs: [{ itemId: itemId("copper-ore"), amount: 1 }],
      outputs: [{ itemId: itemId("copper-plate"), amount: 1 }],
      duration: 3.2,
      compatibleNodeTypes: [nodeTemplateId("stone-furnace")],
      metadata: {},
    },
    {
      id: recipeId("copper-cable"),
      name: "Copper Cable",
      display: { label: "Copper Cable", icon: "/icons/copper-cable.png" },
      categoryId: categoryId("intermediates"),
      inputs: [{ itemId: itemId("copper-plate"), amount: 1 }],
      outputs: [{ itemId: itemId("copper-cable"), amount: 2 }],
      duration: 0.5,
      compatibleNodeTypes: [nodeTemplateId("assembling-machine-1")],
      metadata: {},
    },
    {
      id: recipeId("boil-water"),
      name: "Steam",
      display: { label: "Boil Water → Steam", icon: "/icons/steam.png" },
      inputs: [{ itemId: itemId("water"), amount: 60 }, { itemId: itemId("coal"), amount: 1 }],
      outputs: [{ itemId: itemId("steam"), amount: 60 }],
      duration: 1,
      compatibleNodeTypes: [nodeTemplateId("boiler")],
      metadata: {},
    },
    {
      id: recipeId("pump-water"),
      name: "Pump Water",
      display: { label: "Pump Water", icon: "/icons/water.png" },
      categoryId: categoryId("intermediates"),
      inputs: [],
      outputs: [{ itemId: itemId("water"), amount: 100 }],
      duration: 1,
      compatibleNodeTypes: [nodeTemplateId("water-pump")],
      metadata: {},
    },
    {
      id: recipeId("mine-copper"),
      name: "Mine Copper",
      display: { label: "Mine Copper", icon: "/icons/copper-ore.png" },
      categoryId: categoryId("intermediates"),
      inputs: [{ itemId: itemId("coal"), amount: 1 }],
      outputs: [{ itemId: itemId("copper-ore"), amount: 1 }],
      duration: 1,
      compatibleNodeTypes: [nodeTemplateId("burner-mining-drill")],
      metadata: {},
    },
    {
      id: recipeId("mine-iron"),
      name: "Mine Iron",
      display: { label: "Mine Iron", icon: "/icons/iron-ore.png" },
      categoryId: categoryId("intermediates"),
      inputs: [{ itemId: itemId("coal"), amount: 1 }],
      outputs: [{ itemId: itemId("iron-ore"), amount: 1 }],
      duration: 1,
      compatibleNodeTypes: [nodeTemplateId("burner-mining-drill")],
      metadata: {},
    },
    {
      id: recipeId("mine-coal"),
      name: "Mine Coal",
      display: { label: "Mine Coal", icon: "/icons/coal.png" },
      categoryId: categoryId("intermediates"),
      inputs: [{ itemId: itemId("coal"), amount: 1 }],
      outputs: [{ itemId: itemId("coal"), amount: 1 }],
      duration: 1,
      compatibleNodeTypes: [nodeTemplateId("burner-mining-drill")],
      metadata: {},
    },
  ],
  metadata: {},
};
