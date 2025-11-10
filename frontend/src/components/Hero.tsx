// src/components/Hero.tsx
import { SearchItem } from '../types'

interface HeroProps {
  prefillItem?: SearchItem | null
}

const Hero: React.FC<HeroProps> = ({ prefillItem }) => (
  <div className="text-center mb-12">
    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
      Search Quality Evaluation
    </h1>
    <p className="text-lg text-gray-600 dark:text-gray-400">
      Evaluate search relevance using AI-powered analysis
    </p>

    {prefillItem && (
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Prefilled item: <strong>{prefillItem.item_title}</strong>
      </div>
    )}
  </div>
)

export default Hero
