import LayoutPublico from "../components/LayoutPublico";
import Sesion from "./sesion";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutPublico><Sesion>{children}</Sesion></LayoutPublico>;
}
