import Sidebar from "../components/Sidebar";
import Canvas from "../components/Canvas";

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar />
      <main className="flex-1 h-full relative">
        <Canvas />
      </main>
    </div>
  );
}
