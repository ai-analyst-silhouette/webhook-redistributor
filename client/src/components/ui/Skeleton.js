import React from 'react';
import './Skeleton.css';

const Skeleton = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  lines = 1,
  ...props
}) => {
  if (lines > 1) {
    return (
      <div className={`skeleton-container ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="skeleton-line"
            style={{
              width: index === lines - 1 ? '60%' : '100%',
              height,
              borderRadius,
              marginBottom: index < lines - 1 ? '8px' : '0'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
      {...props}
    />
  );
};

export default Skeleton;
