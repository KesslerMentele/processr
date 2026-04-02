import { type NodeTemplate, type PortDefinition, PortDirection } from "../models";

const byPosition = (a: PortDefinition, b: PortDefinition) => (a.position ?? 0.5) - (b.position ?? 0.5);

export const getInputPorts = (template: NodeTemplate | undefined): PortDefinition[] =>
  template ? [...template.ports.filter(p => p.direction === PortDirection.Input)].sort(byPosition) : [];

export const getOutputPorts = (template: NodeTemplate | undefined): PortDefinition[] =>
  template ? [...template.ports.filter(p => p.direction === PortDirection.Output)].sort(byPosition) : [];