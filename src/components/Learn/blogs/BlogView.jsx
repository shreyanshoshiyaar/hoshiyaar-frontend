import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';
import SimpleLoading from '../../ui/SimpleLoading';

const BlogView = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await authService.getBlogById(id);
        setBlog(res.data?.data);
      } catch (err) {
        console.error('Failed to fetch blog', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  if (loading) return <SimpleLoading />;
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
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="pt-20">
        {blog.image && (
          <img src={blog.image} alt={blog.title} className="w-full h-64 object-cover mb-8" />
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
            className="prose prose-blue max-w-none text-gray-700 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
      </div>
    </div>
  );
};

export default BlogView;
