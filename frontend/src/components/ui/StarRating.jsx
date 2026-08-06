import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const StarRating = ({ rating, max = 5, size = 16, className = "", readOnly = true, onChange }) => {
  const stars = [];
  
  const handleStarClick = (value) => {
    if (!readOnly && onChange) {
      onChange(value);
    }
  };

  for (let i = 1; i <= max; i++) {
    if (rating >= i) {
      // Full star
      stars.push(
        <Star 
          key={i} 
          size={size} 
          className={`text-warning fill-warning ${!readOnly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`} 
          onClick={() => handleStarClick(i)}
        />
      );
    } else if (rating >= i - 0.5) {
      // Half star
      stars.push(
        <div key={i} className="relative" onClick={() => handleStarClick(i)}>
          <Star size={size} className="text-slate-200" />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star size={size} className="text-warning fill-warning" />
          </div>
        </div>
      );
    } else {
      // Empty star
      stars.push(
        <Star 
          key={i} 
          size={size} 
          className={`text-slate-200 ${!readOnly ? 'cursor-pointer hover:scale-110 hover:text-warning/50 transition-all' : ''}`}
          onClick={() => handleStarClick(i)}
        />
      );
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {stars}
    </div>
  );
};

export default StarRating;
