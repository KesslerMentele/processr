import { PortDirection, type PortInstance, type ProcessrNode } from "../models";

const byPosition = (a: PortInstance, b: PortInstance) => (a.template.position ?? 0.5) - (b.template.position ?? 0.5);

export const getInputPorts = (instance: ProcessrNode): PortInstance[] =>
   [...instance.ports.filter(p => p.template.direction === PortDirection.Input)].sort(byPosition);

export const getOutputPorts = (instance: ProcessrNode): PortInstance[] =>
  [...instance.ports.filter(p => p.template.direction === PortDirection.Output)].sort(byPosition);