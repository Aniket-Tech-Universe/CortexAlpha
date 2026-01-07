import { Code, PenTool, BarChart3, Lightbulb, LucideIcon } from "lucide-react"

export interface Suggestion {
    icon: LucideIcon;
    text: string;
    prompt: string;
}

export const SUGGESTIONS: Suggestion[] = [
    { 
        icon: Code, 
        text: "Debug a React component", 
        prompt: "Help me debug this React component that's not rendering correctly" 
    },
    { 
        icon: PenTool, 
        text: "Write a blog post", 
        prompt: "Write a blog post about the future of AI" 
    },
    { 
        icon: BarChart3, 
        text: "Analyze data", 
        prompt: "Analyze this sales data and provide insights" 
    },
    { 
        icon: Lightbulb, 
        text: "Brainstorm ideas", 
        prompt: "Brainstorm innovative startup ideas in the AI space" 
    },
]
