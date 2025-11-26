import React from 'react';

const GameTitle = ({ description }) => {
  return (
    <div className="title-container">
      <h1 className="futuristic-title">
        Turing's Game of Life
      </h1>
      {description && (
        <div className="challenge-description">
          {description}
        </div>
      )}
    </div>
  );
};

export default GameTitle;
