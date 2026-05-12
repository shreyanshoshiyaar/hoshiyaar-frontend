import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../ui/BackButton.jsx';
import FinalCTA from '../features/FinalCTA';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-b from-blue-50 to-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <BackButton onClick={() => navigate(-1)} />
            <h1 className="text-4xl md:text-5xl font-black text-blue-700 tracking-tight">About Hoshiyaar</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
              <p className="font-bold text-blue-600 text-xl">
                We believe learning should be an adventure, not a chore.
              </p>
              <p>
                Hoshiyaar was founded with a single mission: to transform the way Grade 3 to Grade 7 students experience Science. We move away from traditional rote memorization and toward immersive, story-based exploration.
              </p>
              <p>
                By turning CBSE chapters into interactive adventures, we help students build curiosity, critical thinking, and a deep understanding of concepts that lasts a lifetime.
              </p>
            </div>
            <div className="relative">
              <img 
                src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778245600/img-to-link/rqhpzqnjvb7lwofkj3v7.webp" 
                alt="Children learning" 
                className="rounded-[40px] shadow-2xl border-8 border-white"
              />
              <div className="absolute -bottom-6 -left-6 bg-yellow-400 p-6 rounded-[24px] shadow-lg hidden md:block">
                <span className="text-4xl">🚀</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 rounded-[40px] p-8 md:p-16 text-white mb-20 shadow-xl shadow-blue-100">
            <h2 className="text-3xl font-black mb-8 text-center uppercase tracking-widest">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-4">
                <div className="text-5xl mb-4">📖</div>
                <h3 className="text-xl font-bold mb-2">Storytelling First</h3>
                <p className="text-blue-100">We use narratives to make complex scientific concepts relatable and easy to grasp.</p>
              </div>
              <div className="text-center p-4">
                <div className="text-5xl mb-4">🎮</div>
                <h3 className="text-xl font-bold mb-2">Playful Practice</h3>
                <p className="text-blue-100">Learning happens through doing. Our interactive activities make practice feel like a game.</p>
              </div>
              <div className="text-center p-4">
                <div className="text-5xl mb-4">✨</div>
                <h3 className="text-xl font-bold mb-2">Student Centric</h3>
                <p className="text-blue-100">Every lesson is designed with the student's perspective in mind, fostering genuine curiosity.</p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-8 py-10">
            <h2 className="text-3xl font-black text-gray-900">Join the Hoshiyaar Family</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Thousands of students are already discovering the joy of science with Hoshiyaar. Start your journey today!
            </p>
          </div>
        </div>
      </div>
      <FinalCTA />
    </div>
  );
};

export default About;
