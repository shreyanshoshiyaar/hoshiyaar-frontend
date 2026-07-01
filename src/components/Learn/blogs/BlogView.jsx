import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';
import SimpleLoading from '../../ui/SimpleLoading';
import NetworkError from '../../ui/NetworkError.jsx';

const BlogView = () => {
  const { id, slug } = useParams();
  const fetchId = slug || id;
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/blogs', { replace: true });
    }
  };

  useEffect(() => {
    if (!blog) return;

    const contentDiv = document.getElementById('blog-content-container');
    if (!contentDiv) return;

    // 1. Fill In The Blanks
    const fitbs = contentDiv.querySelectorAll('.interactive-fitb');
    fitbs.forEach(container => {
      const input = container.querySelector('input');
      const btn = container.querySelector('button');
      const feedback = container.querySelector('.feedback');
      const answers = container.dataset.answer?.toLowerCase().split(',');
      
      btn?.addEventListener('click', () => {
        const val = input.value.trim().toLowerCase();
        if (answers?.includes(val) && val.length > 0) {
          feedback.innerHTML = '<span class="text-green-600 font-bold">✅ Correct!</span>';
          feedback.classList.remove('hidden');
        } else {
          const displayAnswer = container.dataset.display || answers[0];
          feedback.innerHTML = `
            <div class="text-red-600 font-bold mb-2">❌ Incorrect, try again.</div>
            <button type="button" class="text-sm text-blue-600 underline font-bold" onclick="this.nextElementSibling.classList.toggle('hidden')">Show correct answer</button>
            <div class="hidden mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">The correct answer is: <strong>${displayAnswer}</strong></div>
          `;
          feedback.classList.remove('hidden');
        }
      });
    });

    // 2. MCQs
    const mcqs = contentDiv.querySelectorAll('.interactive-mcq');
    mcqs.forEach(container => {
      const btns = container.querySelectorAll('.mcq-option');
      const feedback = container.querySelector('.feedback');
      const answer = container.dataset.answer;

      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          btns.forEach(b => {
            b.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
            b.classList.add('bg-white', 'text-gray-700', 'border-gray-200');
          });
          btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-200');
          btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
          
          if (btn.dataset.option === answer) {
            feedback.innerHTML = '<span class="text-green-600 font-bold">✅ Correct!</span>';
            feedback.classList.remove('hidden');
          } else {
            feedback.innerHTML = `
              <div class="text-red-600 font-bold mb-2">❌ Incorrect.</div>
              <button type="button" class="text-sm text-blue-600 underline font-bold" onclick="this.nextElementSibling.classList.toggle('hidden')">Show correct answer</button>
              <div class="hidden mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">The correct answer is Option <strong>${answer}</strong>.</div>
            `;
            feedback.classList.remove('hidden');
          }
        });
      });
    });

    // 3. Descriptive (Typing)
    const descriptives = contentDiv.querySelectorAll('.interactive-descriptive');
    descriptives.forEach(container => {
      const btn = container.querySelector('button');
      const feedback = container.querySelector('.feedback');
      
      btn?.addEventListener('click', () => {
        if (feedback.classList.contains('hidden')) {
          feedback.classList.remove('hidden');
          btn.textContent = 'Hide Answer';
        } else {
          feedback.classList.add('hidden');
          btn.textContent = 'Compare Answer';
        }
      });
    });

  }, [blog]);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await authService.getBlogById(fetchId);
        setBlog(res.data?.data);
      } catch (err) {
        console.error('Failed to fetch blog', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (fetchId) {
      fetchBlog();
    }
  }, [fetchId]);

  if (loading) return <SimpleLoading />;
  if (error) return (
    <div className="min-h-screen bg-white pb-24">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center">
        <button 
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="pt-24 px-4 h-full flex items-center justify-center">
        <NetworkError />
      </div>
    </div>
  );
  if (!blog) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-bold text-gray-500">Blog not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center">
        <button 
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="pt-20">
        {blog.image && (
          <img src={blog.image} alt={blog.title} className="w-full h-auto object-contain mb-8 max-h-[60vh] bg-gray-50" />
        )}
        
        <div className="px-6">
          <div className="flex gap-2 mb-4">
            {blog.tags?.map(tag => (
              <span key={tag} className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl font-black text-blue-900 leading-tight mb-4">{blog.title}</h1>
          
          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black">
              {blog.author?.[0] || 'A'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-blue-900">{blog.author}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          
          <div 
            id="blog-content-container"
            className="prose prose-blue max-w-none text-gray-700 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
      </div>
    </div>
  );
};

export default BlogView;
