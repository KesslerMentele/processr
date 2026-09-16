import { useEffect, useState } from "react";
import type { InitialHookStatus } from "@react-buddy/ide-toolbox";
import { useProcessrStore } from "../state/store.ts";

export const useInitial: () => InitialHookStatus = () => {
  const [status, setStatus] = useState<InitialHookStatus>({
    loading: true,
    error: false,
  });
  const graph = useProcessrStore.use.graph();

  useEffect(() => {
    setStatus({ loading: false, error: !graph });
  }, [graph]);

  return status;
};
