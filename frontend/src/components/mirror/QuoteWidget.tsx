import { Quote } from "lucide-react";

const QuoteWidget = () => {
  return (
    <div className="glass-panel p-6 animate-fade-in delay-300">
      <Quote className="w-5 h-5 text-primary/50 mb-3" strokeWidth={1.5} />
      <p className="text-base text-thin text-foreground/90 leading-relaxed italic">
        "Simplicity is the ultimate sophistication."
      </p>
      <p className="text-xs text-thin text-muted-foreground/50 mt-3">
        — Leonardo da Vinci
      </p>
    </div>
  );
};

export default QuoteWidget;
