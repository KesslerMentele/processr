import { ComponentPreview, Previews } from "@react-buddy/ide-toolbox";
import { ExampleLoaderComponent, PaletteTree } from "./palette";
import SidebarContainer from "../components/sidebar/SidebarContainer.tsx";

const ComponentPreviews = () => {
  return (
      <Previews palette={<PaletteTree/>}>
          <ComponentPreview path="/Sidebar">
              <SidebarContainer/>
          </ComponentPreview>
        <ComponentPreview
          path="/ExampleLoaderComponent">
          <ExampleLoaderComponent/>
        </ComponentPreview>
      </Previews>
  );
};

export default ComponentPreviews;