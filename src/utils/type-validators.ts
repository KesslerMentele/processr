import type {  EdgeNodeLevel, EdgePortLevel } from "../models";


export const isNodeLevelEdge= (edge: EdgeNodeLevel | EdgePortLevel):edge is EdgeNodeLevel => {
  return !Object.prototype.hasOwnProperty.call(edge, 'sourcePortId');
};