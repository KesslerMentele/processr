import { useMemo } from "react";
import { useProcessrStore } from "../../state/store.ts";
import { getAllFloatingRates } from "../../utils/node-utils.ts";
import type { ItemId } from "../../models";

export interface ResolvedItemRate {
  itemId: ItemId;
  name: string;
  rate: number;
}

export interface ResolvedStats {
  input: ResolvedItemRate[];
  output: ResolvedItemRate[];
}

const useStats = (): ResolvedStats => {
  const graph = useProcessrStore.use.graph();
  const atlas = useProcessrStore.use.atlasIndex();
  return useMemo(() => {
    const rates = getAllFloatingRates(atlas, graph);

    const resolve = (itemStats: Record<ItemId, number>): ResolvedItemRate[] =>
      Object.entries(itemStats).map(([itemId, rate]) => ({
        itemId: itemId as ItemId,
        name: atlas.itemsById.get(itemId as ItemId)?.name ?? itemId,
        rate,
      }));

    return {
      input: resolve(rates.input),
      output: resolve(rates.output),
    };
  }, [atlas, graph]);
};

export default useStats;
