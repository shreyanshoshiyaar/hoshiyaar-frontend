import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchLessonItemsByModule } from '../../../services/lessons';

function ConceptView({ item }) {
  return (
    <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto p-3 sm:p-4">
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3 text-overflow-fix">{item.title}</h2>
      <p className="text-sm sm:text-base md:text-lg text-gray-800 leading-relaxed whitespace-pre-wrap text-overflow-fix">{item.content}</p>
    </div>
  );
}

function MultipleChoiceView({ item, onAnswer }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto p-3 sm:p-4">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-overflow-fix">{item.question}</h2>
      <div className={(() => {
        // Check if any options are image URLs
        const hasImageOptions = item.options?.some(opt => typeof opt === 'string' && (opt.startsWith('http') || opt.startsWith('https')));
        
        // Use horizontal layout for image options, vertical for text options
        return hasImageOptions 
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4" 
          : "space-y-2 sm:space-y-3 md:space-y-4";
      })()}>
        {item.options?.map((opt, idx) => {
          const isImageUrl = typeof opt === 'string' && (opt.startsWith('http') || opt.startsWith('https'));
          
          return (
            <label key={idx} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded border ${selectedIndex === idx ? 'border-blue-500' : 'border-gray-200'} cursor-pointer hover:bg-gray-50`}>
              <input
                type="radio"
                name="mcq"
                checked={selectedIndex === idx}
                onChange={() => setSelectedIndex(idx)}
                className="w-3 h-3 sm:w-4 sm:h-4"
              />
              {isImageUrl ? (
                <div className="flex flex-col items-center text-center">
                  <img 
                    src={opt} 
                    alt={`Option ${idx + 1}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded mb-1 sm:mb-2"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <span style={{display: 'none'}}>Option {idx + 1}</span>
                  <span className="text-xs sm:text-sm font-medium">Option {idx + 1}</span>
                </div>
              ) : (
                <span className="text-sm sm:text-base md:text-lg font-medium text-overflow-fix">{opt}</span>
              )}
            </label>
          );
        })}
      </div>
      <button
        className="mt-3 sm:mt-4 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm sm:text-base btn-responsive"
        disabled={selectedIndex === null}
        onClick={() => onAnswer(item.options[selectedIndex])}
      >
        Submit
      </button>
    </div>
  );
}

function FillInBlankView({ item, onAnswer }) {
  const [text, setText] = useState('');
  return (
    <div className="max-w-xs sm:max-w-md md:max-w-xl mx-auto p-3 sm:p-4">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-overflow-fix">{item.question}</h2>
      <input
        className="w-full border rounded px-3 py-2 text-sm sm:text-base"
        placeholder="Type your answer"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="mt-3 sm:mt-4 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm sm:text-base btn-responsive"
        disabled={!text}
        onClick={() => onAnswer(text)}
      >
        Submit
      </button>
    </div>
  );
}

function RearrangeView({ item, onAnswer }) {
  const [order, setOrder] = useState(item.words || []);

  function move(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= order.length) return;
    const copy = order.slice();
    const [moved] = copy.splice(index, 1);
    copy.splice(newIndex, 0, moved);
    setOrder(copy);
  }

  return (
    <div className="max-w-xs sm:max-w-md md:max-w-xl mx-auto p-3 sm:p-4">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-overflow-fix">Rearrange to form the correct sentence</h2>
      <ul className="space-y-1 sm:space-y-2">
        {order.map((w, idx) => (
          <li key={idx} className="flex items-center justify-between border rounded px-2 py-1 sm:px-3 sm:py-2">
            <span className="text-sm sm:text-base text-overflow-fix">{w}</span>
            <div className="flex gap-1 sm:gap-2">
              <button className="px-1 py-1 sm:px-2 sm:py-1 border rounded text-xs sm:text-sm" onClick={() => move(idx, -1)}>↑</button>
              <button className="px-1 py-1 sm:px-2 sm:py-1 border rounded text-xs sm:text-sm" onClick={() => move(idx, 1)}>↓</button>
            </div>
          </li>
        ))}
      </ul>
      <button
        className="mt-3 sm:mt-4 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded text-sm sm:text-base btn-responsive"
        onClick={() => onAnswer(order.join(' '))}
      >
        Submit Order
      </button>
    </div>
  );
}

export default function LessonPlayer() {
  const { moduleNumber } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const current = useMemo(() => items[index] || null, [items, index]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchLessonItemsByModule(moduleNumber)
      .then((data) => {
        if (!isMounted) return;
        setItems(data);
        setIndex(0);
      })
      .catch((e) => setError(e.message))
      .finally(() => isMounted && setLoading(false));
    return () => { isMounted = false; };
  }, [moduleNumber]);

  function goNext() {
    if (index + 1 < items.length) setIndex((i) => i + 1);
    else navigate('/learn');
  }

  function checkAnswerAndProceed(given) {
    // Simple client-side check when answer is provided in item.answer
    const expected = current?.answer;
    if (typeof expected === 'string' && expected.length > 0) {
      const isCorrect = expected.trim().toLowerCase() === String(given).trim().toLowerCase();
      // For now we just proceed; could store progress here
      // Optionally display feedback
    }
    goNext();
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!current) return <div className="p-6">No content.</div>;

  let body = null;
  switch (current.type) {
    case 'concept':
      body = <ConceptView item={current} />;
      break;
    case 'multiple-choice':
      body = <MultipleChoiceView item={current} onAnswer={checkAnswerAndProceed} />;
      break;
    case 'fill-in-the-blank':
      body = <FillInBlankView item={current} onAnswer={checkAnswerAndProceed} />;
      break;
    case 'rearrange':
      body = <RearrangeView item={current} onAnswer={checkAnswerAndProceed} />;
      break;
    default:
      body = <div className="p-6">Unsupported type: {current.type}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b p-3 sm:p-4 flex items-center justify-between">
        <div>
          <div className="text-xs sm:text-sm text-gray-600">Module {moduleNumber}</div>
          <div className="text-sm sm:text-base md:text-lg font-semibold">Item {index + 1} of {items.length}</div>
        </div>
        <button
          className="px-2 py-1 sm:px-3 sm:py-2 border rounded text-xs sm:text-sm btn-responsive"
          onClick={() => navigate('/learn')}
        >Exit</button>
      </div>
      <div className="p-3 sm:p-4">
        {body}
        {current.type === 'concept' && (
          <div className="mt-4 sm:mt-6">
            <button className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded text-sm sm:text-base btn-responsive" onClick={goNext}>Continue</button>
          </div>
        )}
      </div>
    </div>
  );
}


