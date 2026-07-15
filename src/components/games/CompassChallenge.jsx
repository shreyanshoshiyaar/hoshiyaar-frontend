import React, { useState, useEffect, useCallback, useRef } from 'react';

// Constants
const GRID_SIZE = 5;
const GAME_DURATION = 60;
const SHUFFLE_INTERVAL = 10;

const DIRECTIONS = {
  N: { label: 'North', dx: 0, dy: -1 },
  S: { label: 'South', dx: 0, dy: 1 },
  E: { label: 'East', dx: 1, dy: 0 },
  W: { label: 'West', dx: -1, dy: 0 }
};

const ARROWS = {
  UP: '↑',
  DOWN: '↓',
  LEFT: '←',
  RIGHT: '→'
};

const getRandomInt = (max) => Math.floor(Math.random() * max);

const generateMapping = () => {
  const dirs = ['N', 'S', 'E', 'W'];
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
  }
  return { UP: dirs[0], DOWN: dirs[1], LEFT: dirs[2], RIGHT: dirs[3] };
};

const generateLevel = (levelIndex) => {
  const startPos = { x: getRandomInt(3) + 1, y: getRandomInt(3) + 1 };
  const numSteps = Math.min(3 + Math.floor(levelIndex / 2), 6);
  
  let currentPos = { ...startPos };
  let route = [];
  
  for (let i = 0; i < numSteps; i++) {
    const possibleDirs = [];
    if (currentPos.y > 0) possibleDirs.push('N');
    if (currentPos.y < GRID_SIZE - 1) possibleDirs.push('S');
    if (currentPos.x < GRID_SIZE - 1) possibleDirs.push('E');
    if (currentPos.x > 0) possibleDirs.push('W');
    
    const nextDir = possibleDirs[getRandomInt(possibleDirs.length)];
    route.push(nextDir);
    
    currentPos.x += DIRECTIONS[nextDir].dx;
    currentPos.y += DIRECTIONS[nextDir].dy;
  }
  
  return { startPos, destPos: currentPos, route };
};

const Confetti = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 100, borderRadius: '12px' }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: '8px',
          height: '16px',
          backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#fbbf24', '#a855f7', '#ec4899'][Math.floor(Math.random() * 6)],
          top: '-20px',
          left: `${Math.random() * 100}%`,
          opacity: 0.8,
          animation: `confetti-fall ${0.6 + Math.random() * 0.8}s linear forwards`,
          animationDelay: `${Math.random() * 0.2}s`,
          transform: `rotate(${Math.random() * 360}deg)`
        }} />
      ))}
      <style>
        {`
          @keyframes confetti-fall {
            to { transform: translateY(300px) rotate(720deg); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

const CompassChallenge = () => {
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [mappingTimer, setMappingTimer] = useState(SHUFFLE_INTERVAL);
  const [level, setLevel] = useState(0);
  
  const [bablooPos, setBablooPos] = useState({ x: 2, y: 2 });
  const [destPos, setDestPos] = useState({ x: 2, y: 2 });
  const [route, setRoute] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mapping, setMapping] = useState({ UP: 'N', DOWN: 'S', LEFT: 'W', RIGHT: 'E' });
  const [wrongShake, setWrongShake] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [roundWon, setRoundWon] = useState(false);
  
  const currentStepRef = useRef(0);

  // Use a ref to guarantee fresh state in event listeners and functional updates
  const stateRef = useRef({ gameState, roundWon, mapping, route, currentStepIndex, level });
  useEffect(() => {
    stateRef.current = { gameState, roundWon, mapping, route, currentStepIndex, level };
  });

  const initLevel = useCallback((levelIdx) => {
    const { startPos, destPos: newDest, route: newRoute } = generateLevel(levelIdx);
    setBablooPos(startPos);
    setDestPos(newDest);
    setRoute(newRoute);
    setCurrentStepIndex(0);
    currentStepRef.current = 0;
    setLevel(levelIdx);
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setMappingTimer(SHUFFLE_INTERVAL);
    setMapping(generateMapping());
    initLevel(0);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('GAME_OVER');
          return 0;
        }
        return prev - 1;
      });

      setMappingTimer(prev => {
        if (prev <= 1) {
          setMapping(generateMapping());
          return SHUFFLE_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const { gameState, roundWon } = stateRef.current;
      if (gameState !== 'PLAYING' || roundWon || e.repeat) return;
      
      if (e.key === 'ArrowUp') { setActiveKey('UP'); handleAction('UP'); }
      if (e.key === 'ArrowDown') { setActiveKey('DOWN'); handleAction('DOWN'); }
      if (e.key === 'ArrowLeft') { setActiveKey('LEFT'); handleAction('LEFT'); }
      if (e.key === 'ArrowRight') { setActiveKey('RIGHT'); handleAction('RIGHT'); }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp') setActiveKey(prev => prev === 'UP' ? null : prev);
      if (e.key === 'ArrowDown') setActiveKey(prev => prev === 'DOWN' ? null : prev);
      if (e.key === 'ArrowLeft') setActiveKey(prev => prev === 'LEFT' ? null : prev);
      if (e.key === 'ArrowRight') setActiveKey(prev => prev === 'RIGHT' ? null : prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); 

  const handleAction = (actionKey) => {
    const { gameState, roundWon, mapping, route, level } = stateRef.current;
    if (gameState !== 'PLAYING' || roundWon) return;
    
    const latestStepIndex = currentStepRef.current;
    const mappedDirection = mapping[actionKey];
    const targetDirection = route[latestStepIndex];

    if (mappedDirection === targetDirection) {
      currentStepRef.current = latestStepIndex + 1; // Update synchronously
      
      const dirConfig = DIRECTIONS[mappedDirection];
      setBablooPos(currentPos => ({
        x: currentPos.x + dirConfig.dx,
        y: currentPos.y + dirConfig.dy
      }));
      
      setCurrentStepIndex(latestStepIndex + 1);

      if (latestStepIndex + 1 === route.length) {
        setRoundWon(true);
        setTimeout(() => {
          setScore(s => s + 1);
          initLevel(level + 1);
          setMapping(generateMapping());
          setMappingTimer(SHUFFLE_INTERVAL);
          setRoundWon(false);
        }, 800);
      }
    } else {
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 300);
    }
  };

  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isBabloo = bablooPos.x === x && bablooPos.y === y;
        const isDest = destPos.x === x && destPos.y === y;
        
        let content = null;
        if (isBabloo) {
          content = '🐢';
        }
        
        grid.push(
          <div key={`${x}-${y}`} className="game-tile" style={{
            backgroundColor: isBabloo ? '#eff6ff' : 'white',
            transform: isBabloo && wrongShake ? 'translateX(4px)' : 'none'
          }}>
            {content}
          </div>
        );
      }
    }
    return grid;
  };

  return (
    <div className="game-wrapper">
      <style>
        {`
          .game-wrapper {
            min-height: 100vh;
            background-color: #f8fafc;
            font-family: 'Inter', sans-serif;
            padding: 24px 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-sizing: border-box;
            color: #0f172a;
          }

          .game-layout-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
            width: 100%;
          }
          .map-legend-group {
            display: flex;
            gap: 16px;
            width: 100%;
            max-width: 450px;
          }

          .game-tile {
            width: 100%;
            height: 100%;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            border: 2px solid #e2e8f0;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            transition: all 0.2s ease;
          }

          .dpad-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #4f46e5;
            color: white;
            border: none;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
            transition: transform 0.1s;
            user-select: none;
          }
          .dpad-btn:active, .dpad-btn.active {
            transform: scale(0.95);
          }

          @media (min-width: 768px) {
            .game-layout-container {
              flex-direction: row;
              align-items: flex-start;
              justify-content: center;
              gap: 40px;
            }
            .map-legend-group {
              flex: 1;
            }
          }
        `}
      </style>

      {/* Header ONLY visible during or after game */}
      {gameState !== 'START' && (
        <div style={{ width: '100%', maxWidth: '450px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Compass Challenge</h1>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '6px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '15px' }}>
              Score: {score}
            </div>
            <div style={{ backgroundColor: timeLeft <= 10 ? '#fee2e2' : '#f1f5f9', color: timeLeft <= 10 ? '#ef4444' : '#475569', padding: '6px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '15px' }}>
              {timeLeft}s
            </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === 'START' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', maxWidth: '350px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧭</div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', marginBottom: '16px', lineHeight: 1.1 }}>
            Compass Challenge
          </h1>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.6, marginBottom: '48px', fontWeight: 500 }}>
            Guide Babloo to the destination by following the correct route. <br/><br/>
            Watch out: every 10 seconds, the arrow controls will completely change directions. Stay sharp!
          </p>
          <button 
            onClick={startGame}
            style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '16px 40px', borderRadius: '24px', fontSize: '18px', fontWeight: 800, width: '100%', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)', cursor: 'pointer' }}
          >
            Start Game
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', maxWidth: '350px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', marginBottom: '8px' }}>Time's Up!</h2>
          <p style={{ color: '#475569', fontSize: '16px', marginBottom: '32px' }}>
            You completed {score} routes!
          </p>
          <button 
            onClick={startGame}
            style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '24px', fontSize: '18px', fontWeight: 800, width: '100%', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)', cursor: 'pointer' }}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Playing Screen */}
      {gameState === 'PLAYING' && (
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Mapping Timer Bar */}
          <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '8px', height: '12px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              backgroundColor: '#8b5cf6', 
              width: `${(mappingTimer / SHUFFLE_INTERVAL) * 100}%`,
              transition: 'width 1s linear'
            }} />
          </div>

          {/* Route Display */}
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Target Route</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {route.map((dir, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: idx < currentStepIndex ? 0.3 : 1,
                  color: idx === currentStepIndex ? '#4f46e5' : '#1e293b',
                  fontWeight: idx === currentStepIndex ? 800 : 600,
                  fontSize: '14px'
                }}>
                  {DIRECTIONS[dir].label}
                  {idx < route.length - 1 && <span style={{ color: '#cbd5e1', marginLeft: '4px' }}>→</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="game-layout-container">
            {/* Map & Legend Group */}
            <div className="map-legend-group">
              {/* Map Area */}
              <div style={{ flex: 1, position: 'relative' }}>
                {/* Compass overlay */}
                <div style={{ position: 'absolute', top: '-12px', right: '-12px', backgroundColor: '#1e293b', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                  <div>N</div>
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', margin: '2px 0' }}><span>W</span><span>E</span></div>
                  <div>S</div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                  gap: '4px',
                  backgroundColor: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '12px',
                  aspectRatio: '1/1'
                }}>
                  {renderGrid()}
                </div>
                
                {/* Round Won Overlay & Confetti */}
                {roundWon && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)', zIndex: 20, fontSize: '80px', borderRadius: '12px', transform: 'scale(1)', transition: 'transform 0.2s', boxShadow: 'inset 0 0 20px rgba(79, 70, 229, 0.2)' }}>
                    🎉
                    <Confetti />
                  </div>
                )}
              </div>

              {/* Legend */}
              <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>Legend</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(mapping).map(([key, dir]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        <div style={{ backgroundColor: '#f1f5f9', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontSize: '12px' }}>
                          {ARROWS[key]}
                        </div>
                        <div style={{ flex: 1, textAlign: 'right' }}>{DIRECTIONS[dir].label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* D-PAD Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '12px', flexShrink: 0 }}>
              <button 
                onPointerDown={() => handleAction('UP')} 
                className={`dpad-btn ${activeKey === 'UP' ? 'active' : ''}`}
              >
                {ARROWS.UP}
              </button>
              <div style={{ display: 'flex', gap: '40px' }}>
                <button 
                  onPointerDown={() => handleAction('LEFT')} 
                  className={`dpad-btn ${activeKey === 'LEFT' ? 'active' : ''}`}
                >
                  {ARROWS.LEFT}
                </button>
                <button 
                  onPointerDown={() => handleAction('RIGHT')} 
                  className={`dpad-btn ${activeKey === 'RIGHT' ? 'active' : ''}`}
                >
                  {ARROWS.RIGHT}
                </button>
              </div>
              <button 
                onPointerDown={() => handleAction('DOWN')} 
                className={`dpad-btn ${activeKey === 'DOWN' ? 'active' : ''}`}
              >
                {ARROWS.DOWN}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompassChallenge;
