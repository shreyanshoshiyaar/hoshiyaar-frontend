import React from 'react';
import exitImg from '../../assets/images/exit.png';

const ExitConfirmCard = ({ onQuit, onContinue }) => (
  <div className="w-full max-w-md bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-[0_8px_0_0_rgba(0,0,0,0.10)]">
    <div className="flex items-center gap-4">
      <img src={exitImg} alt="Bye" className="w-16 h-16 sm:w-20 sm:h-20 object-contain select-none" />
      <div className="flex-1 text-gray-900 font-extrabold text-sm sm:text-base leading-snug">
        Uh-oh, leaving now means losing your progress points. Still want to exit?
      </div>
    </div>
    <div className="mt-4 flex justify-center gap-3">
      <button onClick={onQuit} className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm">Yes, quit</button>
      <button onClick={onContinue} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm">No, continue</button>
    </div>
  </div>
);

export default function ConceptExitConfirm({ onQuit, onContinue }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <ExitConfirmCard onQuit={onQuit} onContinue={onContinue} />
    </div>
  );
}


