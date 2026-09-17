import { useLayoutEffect, useRef, type FC, type PropsWithChildren, type SubmitEvent } from "react";
import { useProcessrStore } from "../../state/store.ts";

interface SidebarFormGroupProps extends PropsWithChildren {
  title: string;
  onSubmit: (e:SubmitEvent) => void;
}

const SidebarFormGroup: FC<SidebarFormGroupProps> = ({ title, onSubmit, children }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const setSidebarFormMinWidth = useProcessrStore.use.setSidebarFormMinWidth();

  useLayoutEffect(() => {
    const el = formRef.current;
    if (!el) return undefined;

    const measureAndReport = () => {
      const containerEl = el.closest<HTMLElement>(".sidebar-container");
      if (!containerEl) return;

      // Read the container's current width from the DOM itself (not the store) so this stays
      // consistent even if the store's width hasn't been committed to the DOM yet - otherwise
      // repeated calls (e.g. React StrictMode's double-invoked effects) compound on each other.
      const currentContainerWidth = containerEl.getBoundingClientRect().width;
      const availableWidth = el.getBoundingClientRect().width;
      const prevInlineWidth = el.style.width;
      // eslint-disable-next-line functional/immutable-data
      el.style.width = "min-content";
      const requiredWidth = el.getBoundingClientRect().width;
      // eslint-disable-next-line functional/immutable-data
      el.style.width = prevInlineWidth;

      const neededSidebarWidth = currentContainerWidth - availableWidth + requiredWidth;
      setSidebarFormMinWidth(neededSidebarWidth);
      if (currentContainerWidth < neededSidebarWidth) {
        useProcessrStore.getState().setSidebarWidth(neededSidebarWidth);
      }
    };

    measureAndReport();

    // Re-measure whenever collapsible subgroups expand/collapse or fields are added/removed,
    // since those change how much width the form needs without changing the ref itself.
    const observer = new MutationObserver(measureAndReport);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      setSidebarFormMinWidth(null);
    };
  }, [setSidebarFormMinWidth]);

  return (
    <div className="sidebar-group" onSubmit={onSubmit}>
      <div className="sidebar-group-header">{title}</div>
      <form className="sidebar-add-form" ref={formRef}>
        {children}
      </form>
    </div>
  );
};

export default SidebarFormGroup;
