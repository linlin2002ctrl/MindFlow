import { Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";

const Index = () => {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
      <GlassCard className="text-center max-w-md w-full">
        <h1 className="text-5xl font-extrabold mb-4 text-white">MindFlow</h1>
        <p className="text-xl text-white/80 mb-6">
          Your AI-powered journaling companion for clarity and insights.
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-8 py-3 bg-mindflow-blue hover:bg-mindflow-purple text-white text-lg font-semibold rounded-lg transition-colors duration-300 shadow-lg"
        >
          Get Started
        </Link>
      </GlassCard>
    </div>
  );
};

export default Index;