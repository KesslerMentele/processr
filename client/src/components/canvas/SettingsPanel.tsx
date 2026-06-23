import SettingsToggle from "./SettingsToggle.tsx";
import { LuMoon, LuSun } from "react-icons/lu";
import EdgeSettings from "./EdgeSettings.tsx";
import { useToolbarState } from "../../hooks/useToolbarState.ts";


const SettingsPanel = () => {

  const {
    snapToGrid,
    detailedMode,
    lightTheme,
    toggleSnap,
    toggleDetailed,
    toggleLightTheme,
  } = useToolbarState();

  return (
    <div className="canvas-panel">
      <SettingsToggle value={snapToGrid} onChange={toggleSnap} title={'Snap to Grid'}/>
      <SettingsToggle value={detailedMode} onChange={toggleDetailed} title={'Detailed mode'}/>
      <SettingsToggle value={lightTheme} onChange={toggleLightTheme} title={<>{(lightTheme ? <LuSun size={13}/> :
        <LuMoon size={13}/>)} Toggle Theme</> }/>
      <EdgeSettings/>
    </div>
  );
};
export default SettingsPanel;