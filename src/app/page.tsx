import NeuralNetwork from "@/components/canvas/NeuralNetwork";
import ChatInterface from "@/components/ui/ChatInterface";

export default function Home() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden selection:bg-primary/30">
      <NeuralNetwork />
      <ChatInterface />
    </div>
  );
}
